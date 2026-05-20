import { supabaseAdmin } from './supabase';

// Generate random draw numbers (5 numbers, 1-45 Stableford range)
export const generateRandomDraw = () => {
  const numbers = [];
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) numbers.push(num);
  }
  return numbers.sort((a, b) => a - b);
};

// Generate algorithmic draw based on frequency analysis
export const generateAlgorithmicDraw = async (bias = 'least_frequent') => {
  const { data: scores } = await supabaseAdmin
    .from('golf_scores')
    .select('score');

  if (!scores || scores.length === 0) return generateRandomDraw();

  // Count frequency of each score
  const freqMap = {};
  scores.forEach(({ score }) => {
    freqMap[score] = (freqMap[score] || 0) + 1;
  });

  // Sort by frequency
  const sorted = Object.entries(freqMap).sort((a, b) =>
    bias === 'least_frequent' ? a[1] - b[1] : b[1] - a[1]
  );

  // Pick top 5 by frequency bias
  const numbers = sorted.slice(0, 5).map(([num]) => parseInt(num));

  // If less than 5 unique scores, fill with random
  while (numbers.length < 5) {
    const rand = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(rand)) numbers.push(rand);
  }

  return numbers.sort((a, b) => a - b);
};

// Calculate matches for a user's scores against draw numbers
export const calculateMatches = (userScores, drawNumbers) => {
  const scoreSet = new Set(userScores.map(s => s.score));
  const matches = drawNumbers.filter(n => scoreSet.has(n));
  return matches.length;
};

// Determine prize tier
export const getPrizeTier = (matchCount) => {
  if (matchCount >= 5) return '5-match';
  if (matchCount === 4) return '4-match';
  if (matchCount === 3) return '3-match';
  return null;
};

// Run draw for all subscribers
export const processDraw = async (drawId) => {
  const { data: draw } = await supabaseAdmin
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single();

  if (!draw) throw new Error('Draw not found');

  // BUG FIX: winning_numbers may be stored as array already.
  // Ensure it's usable as an array of integers.
  const winningNumbers = Array.isArray(draw.winning_numbers)
    ? draw.winning_numbers.map(Number)
    : [];

  if (winningNumbers.length === 0) throw new Error('Draw has no winning numbers');

  // Get all active subscribers with their scores
  const { data: subscribers } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active');

  if (!subscribers || subscribers.length === 0) return { entries: 0, winners: [] };

  const winners = [];
  const entries = [];

  for (const { user_id } of subscribers) {
    // Get user's latest 5 scores
    const { data: scores } = await supabaseAdmin
      .from('golf_scores')
      .select('score, played_at')
      .eq('user_id', user_id)
      .order('played_at', { ascending: false })
      .limit(5);

    // BUG FIX: skip users with no scores — they can't participate
    if (!scores || scores.length === 0) continue;

    const entryNumbers = scores.map(s => s.score);

    // BUG FIX: use winningNumbers (the draw's numbers) not draw.winning_numbers
    const matchCount = calculateMatches(scores, winningNumbers);
    const prizeTier = getPrizeTier(matchCount);

    const entry = {
      draw_id: drawId,
      user_id,
      entry_numbers: entryNumbers,
      match_count: matchCount,
      prize_tier: prizeTier,
      prize_amount: 0,
    };

    entries.push(entry);

    if (prizeTier) {
      winners.push({ user_id, match_type: prizeTier, matchCount, entryNumbers });
    }
  }

  // Calculate prize amounts
  const jackpotWinners = winners.filter(w => w.match_type === '5-match');
  const fourMatchWinners = winners.filter(w => w.match_type === '4-match');
  const threeMatchWinners = winners.filter(w => w.match_type === '3-match');

  const jackpotPool = draw.jackpot_amount || 0;
  const fourMatchPool = draw.four_match_amount || 0;
  const threeMatchPool = draw.three_match_amount || 0;

  const jackpotPerWinner = jackpotWinners.length > 0 ? jackpotPool / jackpotWinners.length : 0;
  const fourMatchPerWinner = fourMatchWinners.length > 0 ? fourMatchPool / fourMatchWinners.length : 0;
  const threeMatchPerWinner = threeMatchWinners.length > 0 ? threeMatchPool / threeMatchWinners.length : 0;

  // Update entries with prize amounts
  const finalEntries = entries.map(entry => {
    if (entry.prize_tier === '5-match') entry.prize_amount = jackpotPerWinner;
    if (entry.prize_tier === '4-match') entry.prize_amount = fourMatchPerWinner;
    if (entry.prize_tier === '3-match') entry.prize_amount = threeMatchPerWinner;
    return entry;
  });

  // BUG FIX: Delete existing entries for this draw before upserting
  // so stale data from previous simulations doesn't linger
  await supabaseAdmin.from('draw_entries').delete().eq('draw_id', drawId);

  // Insert fresh entries
  if (finalEntries.length > 0) {
    const { error: entryError } = await supabaseAdmin
      .from('draw_entries')
      .insert(finalEntries);

    if (entryError) {
      console.error('draw_entries insert error:', entryError);
      throw new Error('Failed to insert draw entries');
    }
  }

  // BUG FIX: Delete old winners for this draw before inserting fresh ones
  await supabaseAdmin.from('winners').delete().eq('draw_id', drawId);

  // Insert winners
  const winnerRecords = finalEntries
    .filter(e => e.prize_tier)
    .map(e => ({
      draw_id: drawId,
      user_id: e.user_id,
      match_type: e.prize_tier,
      prize_amount: e.prize_amount,
    }));

  if (winnerRecords.length > 0) {
    const { error: winnerError } = await supabaseAdmin
      .from('winners')
      .insert(winnerRecords);

    if (winnerError) {
      console.error('winners insert error:', winnerError);
    }
  }

  // Handle jackpot rollover
  const hasJackpotWinner = jackpotWinners.length > 0;
  await supabaseAdmin
    .from('draws')
    .update({
      jackpot_rolled_over: !hasJackpotWinner,
      participant_count: entries.length,
      status: 'simulated',
    })
    .eq('id', drawId);

  return {
    entries: entries.length,
    winners: winnerRecords,
    jackpotRolledOver: !hasJackpotWinner,
    prizePerTier: {
      jackpot: jackpotPerWinner,
      fourMatch: fourMatchPerWinner,
      threeMatch: threeMatchPerWinner,
    },
  };
};

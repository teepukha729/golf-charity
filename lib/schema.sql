-- =============================================
-- Golf Charity Platform - Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(20) CHECK (plan IN ('monthly', 'yearly')),
  status VARCHAR(30) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'lapsed', 'past_due')),
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'gbp',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CHARITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website VARCHAR(255),
  category VARCHAR(100),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  upcoming_events JSONB DEFAULT '[]',
  total_raised DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER CHARITY SELECTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS user_charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  contribution_percentage DECIMAL(5,2) DEFAULT 10.00 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- GOLF SCORES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DRAWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  draw_date DATE NOT NULL,
  draw_type VARCHAR(20) DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  prize_pool_total DECIMAL(12,2) DEFAULT 0,
  jackpot_amount DECIMAL(12,2) DEFAULT 0,
  four_match_amount DECIMAL(12,2) DEFAULT 0,
  three_match_amount DECIMAL(12,2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT false,
  rollover_amount DECIMAL(12,2) DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  simulation_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DRAW ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_numbers INTEGER[] NOT NULL,
  match_count INTEGER DEFAULT 0,
  prize_tier VARCHAR(20) CHECK (prize_tier IN ('5-match', '4-match', '3-match', NULL)),
  prize_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- =============================================
-- WINNERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_type VARCHAR(20) CHECK (match_type IN ('5-match', '4-match', '3-match')),
  prize_amount DECIMAL(10,2) NOT NULL,
  proof_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  admin_notes TEXT,
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CHARITY DONATIONS TABLE (independent)
-- =============================================
CREATE TABLE IF NOT EXISTS charity_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  donation_type VARCHAR(20) DEFAULT 'subscription' CHECK (donation_type IN ('subscription', 'independent')),
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRIZE POOL TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS prize_pool_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES draws(id),
  month_year VARCHAR(7), -- YYYY-MM
  total_subscribers INTEGER DEFAULT 0,
  total_collected DECIMAL(12,2) DEFAULT 0,
  jackpot_pool DECIMAL(12,2) DEFAULT 0,
  four_match_pool DECIMAL(12,2) DEFAULT 0,
  three_match_pool DECIMAL(12,2) DEFAULT 0,
  rollover_added DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_golf_scores_user ON golf_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_played_at ON golf_scores(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user ON draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_user ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charities_updated_at BEFORE UPDATE ON charities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_golf_scores_updated_at BEFORE UPDATE ON golf_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_winners_updated_at BEFORE UPDATE ON winners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Keep only latest 5 scores per user
CREATE OR REPLACE FUNCTION enforce_max_5_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM golf_scores
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM golf_scores
      WHERE user_id = NEW.user_id
      ORDER BY played_at DESC, created_at DESC
      LIMIT 5
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_5_scores_trigger
AFTER INSERT ON golf_scores
FOR EACH ROW EXECUTE FUNCTION enforce_max_5_scores();


-- =============================================
-- SEED: Sample Charities
-- =============================================
INSERT INTO charities (name, description, category, is_featured, is_active) VALUES
('British Heart Foundation', 'Fighting heart and circulatory disease, the UK''s biggest killers. Every pound you donate helps fund life-saving research.', 'Health', true, true),
('Cancer Research UK', 'Together we will beat cancer. Pioneering research to prevent, diagnose and treat cancers.', 'Health', true, true),
('Macmillan Cancer Support', 'Providing medical, emotional, practical and financial support to people living with cancer.', 'Health', false, true),
('Children in Need', 'BBC Children in Need''s vision is that every child in the UK has a happy, safe childhood.', 'Children', true, true),
('RNLI', 'The Royal National Lifeboat Institution saves lives at sea around the coasts of the UK and Ireland.', 'Emergency Services', false, true),
('Age UK', 'Providing information, friendship and support for older people in the UK.', 'Elderly', false, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRATION: Add RPC for incrementing charity total_raised
-- Run this in Supabase SQL Editor after initial schema
-- =============================================
CREATE OR REPLACE FUNCTION increment_charity_total(p_charity_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE charities
  SET total_raised = total_raised + p_amount
  WHERE id = p_charity_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MIGRATION: Add unique constraint on subscriptions.user_id
-- Required for upsert onConflict: 'user_id' to work
-- =============================================
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

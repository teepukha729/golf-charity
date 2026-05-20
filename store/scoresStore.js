import { create } from 'zustand';

const useScoresStore = create((set, get) => ({
  scores: [],
  isLoading: false,
  error: null,

  setScores: (scores) => set({ scores }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchScores: async (userId = null) => {
    set({ isLoading: true, error: null });
    try {
      const url = userId ? `/api/scores?userId=${userId}` : '/api/scores';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        set({ scores: data.scores || [], isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (err) {
      set({ error: 'Failed to fetch scores', isLoading: false });
    }
  },

  addScore: async (score, playedAt) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, playedAt }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ scores: data.scores || [], isLoading: false });
        return { success: true };
      } else {
        set({ error: data.error, isLoading: false });
        return { success: false, error: data.error };
      }
    } catch (err) {
      set({ error: 'Failed to add score', isLoading: false });
      return { success: false, error: 'Failed to add score' };
    }
  },

  updateScore: async (id, score, playedAt) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/scores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, score, playedAt }),
      });
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          scores: state.scores.map(s => s.id === id ? data.score : s),
          isLoading: false,
        }));
        return { success: true };
      } else {
        set({ error: data.error, isLoading: false });
        return { success: false, error: data.error };
      }
    } catch (err) {
      set({ error: 'Failed to update score', isLoading: false });
      return { success: false, error: 'Failed to update score' };
    }
  },

  deleteScore: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/scores?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          scores: state.scores.filter(s => s.id !== id),
          isLoading: false,
        }));
        return { success: true };
      } else {
        set({ error: data.error, isLoading: false });
        return { success: false, error: data.error };
      }
    } catch (err) {
      set({ error: 'Failed to delete score', isLoading: false });
      return { success: false, error: 'Failed to delete score' };
    }
  },
}));

export default useScoresStore;

import { create } from 'zustand';

const useDrawsStore = create((set) => ({
  draws: [],
  currentDraw: null,
  entries: [],
  isLoading: false,
  error: null,

  setDraws: (draws) => set({ draws }),
  setCurrentDraw: (draw) => set({ currentDraw: draw }),
  setEntries: (entries) => set({ entries }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchDraws: async (isAdmin = false) => {
    set({ isLoading: true });
    try {
      const url = isAdmin ? '/api/draws?admin=true' : '/api/draws';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        set({ draws: data.draws || [], isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (err) {
      set({ error: 'Failed to fetch draws', isLoading: false });
    }
  },

  fetchEntries: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/draws/entries');
      const data = await res.json();
      if (res.ok) {
        set({ entries: data.entries || [], isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (err) {
      set({ error: 'Failed to fetch entries', isLoading: false });
    }
  },

  createDraw: async (drawData) => {
    try {
      const res = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(drawData),
      });
      const data = await res.json();
      if (res.ok) {
        set((state) => ({ draws: [data.draw, ...state.draws] }));
        return { success: true, draw: data.draw };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Failed to create draw' };
    }
  },

  simulateDraw: async (id, drawType) => {
    try {
      const res = await fetch('/api/draws', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'simulate', drawType }),
      });
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          draws: state.draws.map(d => d.id === id ? { ...d, status: 'simulated', winning_numbers: data.winningNumbers } : d),
        }));
        return { success: true, ...data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Failed to simulate draw' };
    }
  },

  publishDraw: async (id) => {
    try {
      const res = await fetch('/api/draws', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'publish' }),
      });
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          draws: state.draws.map(d => d.id === id ? { ...d, status: 'published' } : d),
        }));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Failed to publish draw' };
    }
  },
}));

export default useDrawsStore;

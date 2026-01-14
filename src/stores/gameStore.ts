import { create } from 'zustand';

interface GameState {
  score: number;
  time: number;
  isGameOver: boolean;
  
  // Input State
  joystick: { x: number; y: number };
  isDashPressed: boolean;
  
  // Customization
  dressColor: string | null;
  setDressColor: (color: string | null) => void;
  
  // Actions
  setJoystick: (x: number, y: number) => void;
  setDashPressed: (pressed: boolean) => void;
  addScore: (points: number) => void;
  setTime: (time: number) => void;
  setGameOver: (isOver: boolean) => void;
  resetGame: () => void;
  // Navigation
  currentView: 'menu' | 'game' | 'leaderboard' | 'instructions';
  setView: (view: 'menu' | 'game' | 'leaderboard' | 'instructions') => void;

  // Audio
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  time: 60,
  isGameOver: false,
  
  joystick: { x: 0, y: 0 },
  isDashPressed: false,
  dressColor: null,

  // Navigation
  currentView: 'menu',

  // Audio
  isMuted: false,
  setMuted: (muted) => set({ isMuted: muted }),

  setDressColor: (color) => set({ dressColor: color }),
  setJoystick: (x, y) => set({ joystick: { x, y } }),
  setDashPressed: (pressed) => set({ isDashPressed: pressed }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setTime: (time) => set({ time }),
  setGameOver: (isOver) => set({ isGameOver: isOver }),
  setView: (view) => set({ currentView: view }),
  
  resetGame: () => set({ 
    score: 0, 
    time: 60, 
    isGameOver: false, 
    joystick: { x: 0, y: 0 }, 
    isDashPressed: false 
  }),
}));

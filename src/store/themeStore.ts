import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: (e?: Pick<MouseEvent, 'clientX' | 'clientY'>) => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggleTheme: (e) =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window === 'undefined') return { theme: next };

      const applyTheme = () => {
        localStorage.setItem('sai-theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
      };

      // View Transition API: circular reveal from click position
      if (document.startViewTransition && e) {
        const x = e.clientX;
        const y = e.clientY;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y),
        );
        document.documentElement.style.setProperty('--reveal-x', `${x}px`);
        document.documentElement.style.setProperty('--reveal-y', `${y}px`);
        document.documentElement.style.setProperty('--reveal-r', `${endRadius}px`);
        document.documentElement.classList.add('theme-transitioning');
        const transition = document.startViewTransition(() => applyTheme());
        transition.finished.then(() => {
          document.documentElement.classList.remove('theme-transitioning');
        });
      } else {
        applyTheme();
      }

      return { theme: next };
    }),
  setTheme: (theme: Theme) =>
    set(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sai-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      return { theme };
    }),
}));

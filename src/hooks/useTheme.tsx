
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for theme in localStorage or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme as Theme;
    }
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Update the DOM when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Add smooth transition for theme switching
    root.style.setProperty('transition', 'background-color 0.3s ease, color 0.3s ease');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);

    // Remove transition after animation completes to avoid interfering with other animations
    const timer = setTimeout(() => {
      root.style.removeProperty('transition');
    }, 300);

    return () => clearTimeout(timer);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Only sync with system if no manual theme is set
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { theme, setTheme };
};

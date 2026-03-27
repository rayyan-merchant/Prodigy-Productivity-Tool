import { useEffect } from 'react';

export const useForceLightMode = () => {
  useEffect(() => {

    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    document.documentElement.classList.remove('dark');

    document.documentElement.setAttribute('data-original-theme', currentTheme);

    return () => {
      const originalTheme = document.documentElement.getAttribute('data-original-theme');
      if (originalTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      document.documentElement.removeAttribute('data-original-theme');
    };
  }, []);
};

export default useForceLightMode;

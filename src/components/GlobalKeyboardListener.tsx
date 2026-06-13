
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

const GlobalKeyboardListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleShowHelp = () => {
      // The KeyboardShortcutsOverlay listens for this event and opens its dialog
    };

    const handleToggleTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    };

    window.addEventListener('showHelp', handleShowHelp);
    window.addEventListener('toggleTheme', handleToggleTheme);

    return () => {
      window.removeEventListener('showHelp', handleShowHelp);
      window.removeEventListener('toggleTheme', handleToggleTheme);
    };
  }, [navigate, location, theme, setTheme]);

  return null;
};

export default GlobalKeyboardListener;

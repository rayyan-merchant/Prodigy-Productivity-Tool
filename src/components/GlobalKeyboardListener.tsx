import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

const GlobalKeyboardListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleCreateNote = () => {
      if (location.pathname === '/notes') {

        const event = new CustomEvent('createNoteFromShortcut');
        window.dispatchEvent(event);
      } else {

        navigate('/notes');
        setTimeout(() => {
          const event = new CustomEvent('createNoteFromShortcut');
          window.dispatchEvent(event);
        }, 100);
      }
    };

    const handleShowHelp = () => {

      navigate('/settings');
      setTimeout(() => {
        const event = new CustomEvent('showShortcutsTab');
        window.dispatchEvent(event);
      }, 100);
    };

    const handleToggleTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light');
    };

    window.addEventListener('createNote', handleCreateNote);
    window.addEventListener('showHelp', handleShowHelp);
    window.addEventListener('toggleTheme', handleToggleTheme);

    return () => {
      window.removeEventListener('createNote', handleCreateNote);
      window.removeEventListener('showHelp', handleShowHelp);
      window.removeEventListener('toggleTheme', handleToggleTheme);
    };
  }, [navigate, location, theme, setTheme]);

  return null;
};

export default GlobalKeyboardListener;

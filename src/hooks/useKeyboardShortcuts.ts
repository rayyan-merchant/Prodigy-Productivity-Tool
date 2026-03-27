import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface KeyboardShortcut {
  key: string;
  action: () => void;
  description: string;
  category: string;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [

    {
      key: 'Alt+1',
      action: () => navigate('/dashboard'),
      description: 'Go to Dashboard',
      category: 'Navigation'
    },
    {
      key: 'Alt+2',
      action: () => navigate('/tasks'),
      description: 'Go to Tasks',
      category: 'Navigation'
    },
    {
      key: 'Alt+3',
      action: () => navigate('/pomodoro'),
      description: 'Go to Pomodoro Timer',
      category: 'Navigation'
    },
    {
      key: 'Alt+4',
      action: () => navigate('/notes'),
      description: 'Go to Notes',
      category: 'Navigation'
    },
    {
      key: 'Alt+5',
      action: () => navigate('/goals'),
      description: 'Go to Goals',
      category: 'Navigation'
    },
    {
      key: 'Alt+6',
      action: () => navigate('/habits'),
      description: 'Go to Habits',
      category: 'Navigation'
    },
    {
      key: 'Alt+7',
      action: () => navigate('/analytics'),
      description: 'Go to Analytics',
      category: 'Navigation'
    },
    {
      key: 'Alt+8',
      action: () => navigate('/settings'),
      description: 'Go to Settings',
      category: 'Navigation'
    },

    {
      key: 'Alt+t',
      action: () => {

        const event = new CustomEvent('createTask');
        window.dispatchEvent(event);
      },
      description: 'Create new task',
      category: 'Tasks'
    },

    {
      key: 'Alt+n',
      action: () => {

        const event = new CustomEvent('createNote');
        window.dispatchEvent(event);
      },
      description: 'Create new note',
      category: 'Notes'
    },

    {
      key: 'Alt+p',
      action: () => {

        const event = new CustomEvent('togglePomodoro');
        window.dispatchEvent(event);
      },
      description: 'Start/Pause Pomodoro timer',
      category: 'Pomodoro'
    },
    {
      key: 'Alt+r',
      action: () => {

        const event = new CustomEvent('resetPomodoro');
        window.dispatchEvent(event);
      },
      description: 'Reset Pomodoro timer',
      category: 'Pomodoro'
    },

    {
      key: 'Alt+/',
      action: () => {

        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        } else {
          toast.info('Search not available on this page');
        }
      },
      description: 'Focus search bar',
      category: 'General'
    },

    {
      key: 'Alt+d',
      action: () => {
        const event = new CustomEvent('toggleTheme');
        window.dispatchEvent(event);
      },
      description: 'Toggle dark/light theme',
      category: 'General'
    },

    {
      key: 'Alt+h',
      action: () => {
        const event = new CustomEvent('showHelp');
        window.dispatchEvent(event);
      },
      description: 'Show keyboard shortcuts',
      category: 'General'
    }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, altKey, shiftKey, ctrlKey, metaKey } = event;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      shortcuts.forEach(shortcut => {
        const shortcutParts = shortcut.key.split('+');
        const mainKey = shortcutParts[shortcutParts.length - 1].toLowerCase();
        const needsAlt = shortcutParts.includes('Alt');
        const needsShift = shortcutParts.includes('Shift');
        const needsCtrl = shortcutParts.includes('Ctrl');
        const needsMeta = shortcutParts.includes('Meta');

        const keyMatches = key.toLowerCase() === mainKey ||
                          (mainKey === '/' && key === '/') ||
                          (mainKey >= '1' && mainKey <= '8' && key === mainKey);

        if (keyMatches &&
            altKey === needsAlt &&
            shiftKey === needsShift &&
            ctrlKey === needsCtrl &&
            metaKey === needsMeta) {

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return { shortcuts };
};

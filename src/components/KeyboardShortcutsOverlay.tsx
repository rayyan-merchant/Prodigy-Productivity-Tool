import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['Alt', '1'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['Alt', '2'], description: 'Go to Tasks', category: 'Navigation' },
  { keys: ['Alt', '3'], description: 'Go to Pomodoro', category: 'Navigation' },
  { keys: ['Alt', '4'], description: 'Go to Notes', category: 'Navigation' },
  { keys: ['Alt', '5'], description: 'Go to Goals', category: 'Navigation' },
  { keys: ['Alt', '6'], description: 'Go to Habits', category: 'Navigation' },
  { keys: ['Alt', '7'], description: 'Go to Analytics', category: 'Navigation' },
  { keys: ['Alt', '8'], description: 'Go to Settings', category: 'Navigation' },
  { keys: ['Alt', 'T'], description: 'Create new task', category: 'Actions' },
  { keys: ['Alt', 'N'], description: 'Create new note', category: 'Actions' },
  { keys: ['Alt', 'P'], description: 'Start/Pause Pomodoro', category: 'Pomodoro' },
  { keys: ['Alt', 'R'], description: 'Reset Pomodoro', category: 'Pomodoro' },
  { keys: ['Alt', 'D'], description: 'Toggle dark/light mode', category: 'General' },
  { keys: ['Alt', '/'], description: 'Focus search bar', category: 'General' },
  { keys: ['?'], description: 'Show this overlay', category: 'General' },
];

const KeyboardShortcutsOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') return;

      if (e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Also listen for the showHelp event from existing shortcuts
  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true);
    window.addEventListener('showHelp', handleShowHelp);
    return () => window.removeEventListener('showHelp', handleShowHelp);
  }, []);

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">?</kbd> anytime to toggle this overlay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {categories.map(category => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {category}
              </h4>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, ki) => (
                          <React.Fragment key={ki}>
                            {ki > 0 && <span className="text-xs text-muted-foreground">+</span>}
                            <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-muted border border-border text-xs font-mono font-medium text-foreground shadow-sm">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsOverlay;

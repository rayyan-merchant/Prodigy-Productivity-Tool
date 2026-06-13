
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'prodigy:pwa-dismissed-until';
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1_000;

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedUntil > Date.now()) return;
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    } else {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_FOR_MS));
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_FOR_MS));
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 z-50"
      >
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <Download size={20} className="text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Install Prodigy</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add to your home screen for quicker access.</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleInstall} className="text-xs h-7">Install</Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-7">Not now</Button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss install prompt">
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;

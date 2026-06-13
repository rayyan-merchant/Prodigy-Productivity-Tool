import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useForceLightMode from '@/hooks/useForceLightMode';

const PrivacyPolicy: React.FC = () => {
  useForceLightMode();
  return (
    <main className="min-h-screen bg-white text-slate-700">
      <header className="border-b px-6 py-4">
        <Button asChild variant="ghost"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Prodigy</Link></Button>
      </header>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-12">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-slate-500">Last updated: June 12, 2026</p>
        <p>Prodigy is a public beta for managing tasks, Pomodoro sessions, habits, and hydration.</p>
        <h2>Data we store</h2>
        <p>Supabase stores your account, profile, tasks, session history, habit completion history, hydration logs, and preferences. Avatar files are kept in a private Supabase Storage bucket. Browser storage holds account-scoped timer state, cached AI results, theme, and interface preferences.</p>
        <h2>AI processing</h2>
        <p>When you request an AI feature, relevant product data is sent through a Supabase Edge Function to Groq or the Lovable AI gateway, which may use Gemini models. AI is optional and quota-limited.</p>
        <h2>Security and isolation</h2>
        <p>Supabase authentication and row-level security restrict records to their owner. Authenticated API responses are not stored by the service worker. Prodigy does not claim offline editing or background synchronization.</p>
        <h2>Retention and deletion</h2>
        <p>Account data remains until you delete records or your account. Account deletion removes application records and private avatar files. Operational backups may persist for a limited retention period.</p>
        <h2>Your choices</h2>
        <p>You can export supported data, update preferences, disable browser notifications, or delete your account from Settings. The beta does not sell personal information or use advertising trackers.</p>
      </article>
    </main>
  );
};

export default PrivacyPolicy;

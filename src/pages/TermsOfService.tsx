import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useForceLightMode from '@/hooks/useForceLightMode';

const TermsOfService: React.FC = () => {
  useForceLightMode();
  return (
    <main className="min-h-screen bg-white text-slate-700">
      <header className="border-b px-6 py-4">
        <Button asChild variant="ghost"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Prodigy</Link></Button>
      </header>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-12">
        <h1>Terms of Service</h1>
        <p className="text-sm text-slate-500">Last updated: June 12, 2026</p>
        <p>Prodigy is provided as a public beta. You must be at least 13 and provide accurate account information.</p>
        <h2>Your account and content</h2>
        <p>You are responsible for account security and the content you enter. Your tasks and personal records remain yours. Do not use the service unlawfully, disrupt it, probe other accounts, or automate abusive access.</p>
        <h2>AI assistance</h2>
        <p>AI features use Groq and the Lovable AI gateway, which may use Gemini models. Outputs may be incomplete or wrong and must be reviewed before use.</p>
        <h2>Beta availability</h2>
        <p>Features may change and the service may be interrupted for maintenance or provider outages. Export important data regularly. Prodigy does not guarantee uninterrupted availability.</p>
        <h2>Termination and liability</h2>
        <p>You may delete your account from Settings. We may suspend abusive accounts. To the extent permitted by law, Prodigy is provided without warranties and is not liable for indirect loss or third-party provider failures.</p>
      </article>
    </main>
  );
};

export default TermsOfService;

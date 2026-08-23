import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { updatePassword } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const passwordSchema = z.string().min(8, 'Use at least 8 characters').max(72, 'Password is too long');

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let active = true;

    const applyRecoverySession = async () => {
      let session = (await supabase.auth.getSession()).data.session;

      // PKCE links carry a one-time code in the query string.
      const code = new URLSearchParams(window.location.search).get('code');
      if (!session && code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        session = data.session;
      }

      // Implicit links carry tokens in the hash. Usually Supabase consumes these
      // automatically, but explicitly handling them prevents mobile email clients
      // from leaving the reset page without a session.
      if (!session) {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          session = data.session;
        }
      }

      if (!active) return;
      setHasRecoverySession(Boolean(session));
      if (!session) {
        setError('This reset link is invalid or expired. Request a new password reset email.');
      }
      setIsCheckingRecovery(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session || (event !== 'PASSWORD_RECOVERY' && event !== 'SIGNED_IN')) return;
      setHasRecoverySession(true);
      setError('');
      setIsCheckingRecovery(false);
    });

    void applyRecoverySession().catch(() => {
      if (!active) return;
      setError('This reset link is invalid or expired. Request a new password reset email.');
      setIsCheckingRecovery(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isCheckingRecovery || !hasRecoverySession) {
      setError('This reset link is invalid or expired. Request a new password reset email.');
      return;
    }
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid password');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      toast.success('Password updated. You can continue to Prodigy.');
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The reset link may be invalid or expired.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Use the secure link from your password reset email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirmation">Confirm password</Label>
              <Input
                id="password-confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                aria-describedby={error ? 'password-error' : undefined}
                aria-invalid={Boolean(error)}
              />
              {error && <p id="password-error" className="text-sm text-destructive">{error}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting || isCheckingRecovery || !hasRecoverySession}>
              {isCheckingRecovery ? 'Verifying reset link...' : isSubmitting ? 'Updating password...' : 'Update password'}
            </Button>
            {!isCheckingRecovery && !hasRecoverySession && (
              <Button asChild className="w-full" variant="outline">
                <Link to="/auth">Request a new reset link</Link>
              </Button>
            )}
            <Button asChild className="w-full" variant="ghost">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default ResetPassword;

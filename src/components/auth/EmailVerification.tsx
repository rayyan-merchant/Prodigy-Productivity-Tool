import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { getCurrentUser, resendVerificationEmail, isEmailVerified } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BrandLogo from '@/components/BrandLogo';

const EmailVerification: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserEmail(user.email || '');
    }

    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && isEmailVerified()) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      await resendVerificationEmail();
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = () => {
    // Check if email is verified in Supabase
    if (isEmailVerified()) {
      navigate('/dashboard');
    }
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-start mb-4">
          <Button
            variant="ghost"
            onClick={handleBackToLanding}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="flex justify-center mb-6">
          <BrandLogo />
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Mail className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Verify Your Email
        </h2>
        
        <p className="text-muted-foreground mb-6">
          We've sent a verification email to <strong>{userEmail}</strong>. 
          Please click the link in the email to verify your account.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleCheckVerification}
            className="w-full bg-brand text-white hover:bg-brand/90"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            I've Verified My Email
          </Button>
          
          <Button
            variant="outline"
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-6">
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </Card>
    </div>
  );
};

export default EmailVerification;

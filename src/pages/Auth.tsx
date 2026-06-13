
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import BrandLogo from '@/components/BrandLogo';
import useForceLightMode from '@/hooks/useForceLightMode';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  
  // Force light mode for auth pages
  useForceLightMode();

  const handleToggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 md:p-6">
      {/* Back button - positioned absolutely */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 p-2 flex items-center text-muted-foreground hover:text-foreground hover:bg-brand/10"
        onClick={handleBackToLanding}
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Home
      </Button>
      
      {/* Main card */}
      <div className="w-full max-w-5xl overflow-hidden bg-card rounded-xl shadow-lg flex flex-col md:flex-row">
        {/* Form section (left side) */}
        <div className="w-full md:w-3/5 p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <BrandLogo />
          </div>
          
          {/* Form */}
          <div className="max-w-md mx-auto">
            {isLogin ? <SignInForm onToggleMode={handleToggleAuthMode} /> : <SignUpForm onToggleMode={handleToggleAuthMode} />}
          </div>
        </div>
        
        {/* Brand section (right side) */}
        <div className="w-full md:w-2/5 bg-brand text-brand-foreground p-8 md:p-12 flex flex-col justify-center items-center text-center">
          <h2 className="text-2xl font-display font-bold mb-4 text-brand-foreground">
            {isLogin ? "Hello again!" : "Join Prodigy!"}
          </h2>
          <p className="mb-6 text-brand-foreground/80">
            {isLogin 
              ? "Access your tasks, habits, focus sessions, and hydration history."
              : "One dashboard for all your focus needs."
            }
          </p>
          <Button 
          variant="outline" 
          className="border-2 border-brand-foreground bg-transparent text-white hover:bg-white hover:text-brand rounded-full px-8 py-2 font-semibold"
          onClick={handleToggleAuthMode}
        >
            {isLogin ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;


import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TimerProvider } from "./contexts/TimerContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineIndicator from "./components/OfflineIndicator";
import GlobalKeyboardListener from "./components/GlobalKeyboardListener";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { toast } from 'sonner';
import IntroAnimation from "./components/IntroAnimation";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const LayoutWrapper = lazy(() => import("./components/LayoutWrapper"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Landing = lazy(() => import("./pages/Landing"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Habits = lazy(() => import("./pages/Habits"));
const PomodoroTimer = lazy(() => import("./pages/PomodoroTimer"));
const WaterTracker = lazy(() => import("./pages/WaterTracker"));
const Calendar = lazy(() => import("./pages/Calendar"));

const applyTheme = () => {
  const theme = localStorage.getItem('theme') || 'light';
  const root = window.document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


const AppContent = () => {
  const { isLoading, user } = useAuth();
  const [showIntro, setShowIntro] = useState(() => {
    return sessionStorage.getItem('prodigy-intro-shown') !== 'true';
  });

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem('prodigy-intro-shown', 'true');
    setShowIntro(false);
  }, []);
  
  useKeyboardShortcuts();

  useEffect(() => {
    applyTheme();
    
    const handleThemeToggle = () => {
      const currentTheme = localStorage.getItem('theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      applyTheme();
      toast.success(`${newTheme === 'light' ? 'Light' : 'Dark'} mode activated`);
    };

    window.addEventListener('toggleTheme', handleThemeToggle);

    return () => {
      window.removeEventListener('toggleTheme', handleThemeToggle);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      <GlobalKeyboardListener />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          isLoggedIn ? <Navigate to="/dashboard" /> : <Suspense fallback={<RouteLoader />}><Landing /></Suspense>
        } />
        <Route path="/auth" element={
          isLoggedIn ? <Navigate to="/dashboard" /> : <Suspense fallback={<RouteLoader />}><Auth /></Suspense>
        } />
        <Route path="/reset-password" element={<Suspense fallback={<RouteLoader />}><ResetPassword /></Suspense>} />
        <Route path="/privacy-policy" element={<Suspense fallback={<RouteLoader />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms-of-service" element={<Suspense fallback={<RouteLoader />}><TermsOfService /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<RouteLoader />}><Contact /></Suspense>} />
        
        {/* Protected routes */}
        <Route element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoader />}><LayoutWrapper /></Suspense>
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Suspense fallback={<RouteLoader />}><Dashboard /></Suspense>} />
          <Route path="/tasks" element={<Suspense fallback={<RouteLoader />}><Tasks /></Suspense>} />
          <Route path="/habits" element={<Suspense fallback={<RouteLoader />}><Habits /></Suspense>} />
          <Route path="/calendar" element={<Suspense fallback={<RouteLoader />}><Calendar /></Suspense>} />
          <Route path="/water" element={<Suspense fallback={<RouteLoader />}><WaterTracker /></Suspense>} />
          <Route path="/analytics" element={<Suspense fallback={<RouteLoader />}><Analytics /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<RouteLoader />}><Settings /></Suspense>} />
        </Route>
        
        {/* Pomodoro route */}
        <Route path="/pomodoro" element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoader />}><PomodoroTimer /></Suspense>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Suspense fallback={<RouteLoader />}><NotFound /></Suspense>} />
      </Routes>
    </>
  );
};

const RouteLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading page">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <TimerProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <BrowserRouter>
                <AppContent />
                <PWAInstallPrompt />
              </BrowserRouter>
            </TimerProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

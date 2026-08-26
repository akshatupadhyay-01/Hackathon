import React, { useState } from 'react';
import { Leaf, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { SEO } from '../../../components/common/seo';

interface SignInPageProps {
  navigate: (path: string) => void;
  redirectPath?: string;
}

export function SignInPage({ navigate, redirectPath }: SignInPageProps) {
  const { signIn, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, show friendly message
  if (user && !authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            Welcome back!
          </h2>
          <p className="text-sm text-stone-500">
            You are currently signed in as <span className="font-semibold text-stone-800 dark:text-stone-200">{user.email}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={() => navigate('/profile')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              Go to My Profile & Passes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/explore')}
            >
              Explore Destinations
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn(trimmedEmail, password);
      if (res.success) {
        setSuccessMessage('Welcome back! Redirecting you...');
        setTimeout(() => {
          navigate(redirectPath || '/profile');
        }, 600);
      } else {
        setErrorMessage(res.error || 'Email or password is incorrect.');
      }
    } catch (err: any) {
      setErrorMessage('Something went wrong while signing you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <SEO title="Sign In" noIndex={true} canonicalPath="/signin" />
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
              <Leaf className="h-5 w-5 text-emerald-100" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900 dark:text-stone-50">
              Johar Jharkhand
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 pt-1">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Access your saved itineraries, eco-passes, permits, and community travel badges.
          </p>
        </div>

        {/* Card Form */}
        <Card className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in-50">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-stone-400" />
                <span>Email Address</span>
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-stone-400" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 pr-10 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Quick Demo Help Note */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800/60 text-[11px] text-stone-500 space-y-1">
            <div className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Eco-Traveler Community</span>
            </div>
            <p>
              Sign in to preserve your road itineraries, manage permit QR codes offline, and track your carbon offset score.
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-1 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500">
            <span>Don't have an account? </span>
            <button
              onClick={() => navigate('/signup')}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
            >
              Create Account
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Leaf, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Sparkles, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { SEO } from '../components/seo';

interface SignUpPageProps {
  navigate: (path: string) => void;
}

export function SignUpPage({ navigate }: SignUpPageProps) {
  const { signUp, user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; requiresVerification?: boolean } | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUp(trimmedEmail, password, trimmedName);
      if (res.success) {
        const msg = res.message || 'Your account has been created.';
        const needsVerif = msg.toLowerCase().includes('check your email');
        setSuccessInfo({
          message: msg,
          requiresVerification: needsVerif,
        });

        if (!needsVerif) {
          setTimeout(() => {
            navigate('/profile');
          }, 1000);
        }
      } else {
        setErrorMessage(res.error || 'Something went wrong creating your account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Something went wrong creating your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <SEO title="Create Your Account" noIndex={true} canonicalPath="/signup" />
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
            Create Your Account
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Join the responsible eco-tourism community of Jharkhand and earn digital permits, badges, and rewards.
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

          {successInfo ? (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 text-center animate-in fade-in-50">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-100">
                Your account has been created.
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                {successInfo.message}
              </p>
              {successInfo.requiresVerification && (
                <div className="pt-2">
                  <Button
                    onClick={() => navigate('/signin')}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                  >
                    Go to Sign In
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-stone-400" />
                  <span>Full Name</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Birsa Munda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  className="h-11 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                  required
                />
              </div>

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
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-stone-400" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />
                  <span>Confirm Password</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="h-11 pr-10 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Sign In Link */}
          <div className="text-center pt-1 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500">
            <span>Already have an account? </span>
            <button
              onClick={() => navigate('/signin')}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
            >
              Sign In
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

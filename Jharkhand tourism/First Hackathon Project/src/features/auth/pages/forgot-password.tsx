import React, { useState, useEffect } from 'react';
import { Leaf, Mail, Lock, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../contexts/auth-context';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SEO } from '../../../components/common/seo';

interface ForgotPasswordPageProps {
  navigate: (path: string) => void;
  isResetMode?: boolean;
}

export function ForgotPasswordPage({ navigate, isResetMode = false }: ForgotPasswordPageProps) {
  const { resetPassword, updatePassword } = useAuth();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if hash has access_token or type=recovery
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(isResetMode);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || window.location.pathname.includes('/reset-password')) {
      setIsRecoveryFlow(true);
    }
  }, []);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(trimmedEmail);
      if (res.success) {
        setSuccessMessage(res.message || 'Password reset link sent to your email. Please check your inbox.');
      } else {
        setErrorMessage(res.error || 'Something went wrong while requesting password reset. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Something went wrong while requesting password reset. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setSuccessMessage('Your password has been reset successfully! Redirecting you to Sign In...');
        setTimeout(() => {
          navigate('/signin');
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Something went wrong while resetting your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <SEO title={isRecoveryFlow ? 'Reset Your Password' : 'Forgot Password'} noIndex={true} canonicalPath="/forgot-password" />
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
            {isRecoveryFlow ? 'Reset Your Password' : 'Forgot Your Password?'}
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {isRecoveryFlow
              ? 'Enter and confirm your new secure password below.'
              : 'Enter your registered email address and we will send you a link to reset your password.'}
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
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {!isRecoveryFlow ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  <span>Your Email Address</span>
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

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-stone-400" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 pr-10 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-stone-400" />
                  <span>Confirm New Password</span>
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Back to Sign In Link */}
          <div className="text-center pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => navigate('/signin')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

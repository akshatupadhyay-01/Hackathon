import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';
import { Profile } from '../types/database';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isLiveDb: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_DEMO_USER_KEY = 'jharkhand_demo_auth_user';
const LOCAL_DEMO_PROFILE_KEY = 'jharkhand_demo_auth_profile';

/**
 * Standardize Supabase and network error messages into friendly, accurate user feedback
 */
function getFriendlyAuthErrorMessage(error: any, action: 'signin' | 'signup' | 'reset'): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = (error.code || error.status || '').toString().toLowerCase();
  const rawMsg = (error.message || error.error_description || '').toLowerCase();

  // Network / connection errors
  if (
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('network') ||
    rawMsg.includes('networkerror') ||
    rawMsg.includes('timeout') ||
    code === 'fetch_error'
  ) {
    return 'Unable to connect to authentication server. Please check your internet connection.';
  }

  // Rate limits
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    code === '429' ||
    rawMsg.includes('rate limit') ||
    rawMsg.includes('too many requests')
  ) {
    return 'Too many attempts. Email rate limit reached. Please wait a few minutes and try again.';
  }

  // Email not confirmed
  if (
    code === 'email_not_confirmed' ||
    rawMsg.includes('email not confirmed') ||
    rawMsg.includes('not verified')
  ) {
    return 'Please verify your email before signing in. Check your inbox for the confirmation link.';
  }

  // Invalid credentials during sign in
  if (
    action === 'signin' &&
    (code === 'invalid_credentials' ||
      code === 'invalid_grant' ||
      rawMsg.includes('invalid login credentials') ||
      rawMsg.includes('invalid credentials') ||
      rawMsg.includes('invalid_grant'))
  ) {
    return 'Email or password is incorrect. If you have not created an account on this platform yet, please Sign Up first.';
  }

  // User not found
  if (rawMsg.includes('user not found') || rawMsg.includes('no user')) {
    return 'An account with this email was not found. Please Sign Up to create an account.';
  }

  // User already exists during sign up
  if (
    action === 'signup' &&
    (code === 'user_already_exists' ||
      rawMsg.includes('already registered') ||
      rawMsg.includes('already exists') ||
      rawMsg.includes('unique constraint'))
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  // Invalid email format / domain
  if (
    code === 'email_address_invalid' ||
    code === 'validation_failed' ||
    rawMsg.includes('invalid email') ||
    rawMsg.includes('email address')
  ) {
    return 'Please provide a valid email address (e.g. name@gmail.com).';
  }

  // Password requirements
  if (
    code === 'weak_password' ||
    rawMsg.includes('password should be at least') ||
    rawMsg.includes('weak password')
  ) {
    return 'Password must be at least 6 characters long.';
  }

  // Fallbacks
  if (action === 'signin') {
    return 'Email or password is incorrect.';
  } else if (action === 'signup') {
    return 'Unable to create account. Please check your details and try again.';
  }

  return 'Operation failed. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isLive = isSupabaseConfigured();

  // Helper to fetch or create a user profile (Isolated from Auth success)
  const loadProfile = async (currentUser: User) => {
    // Generate base profile from user authentication metadata
    const userFullName =
      currentUser.user_metadata?.full_name ||
      currentUser.email?.split('@')[0] ||
      'Eco-Traveler';

    const fallbackProfile: Profile = {
      id: currentUser.id,
      role: 'tourist',
      full_name: userFullName,
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      phone: '+91 98765 43210',
      bio: 'Passionate nature explorer discovering the pristine forests of Jharkhand.',
      district: 'Ranchi',
      eco_points: 120,
      created_at: currentUser.created_at || new Date().toISOString(),
    };

    if (!isLive || !supabase) {
      // Fallback local storage profile for offline/demo mode
      const localStored = localStorage.getItem(LOCAL_DEMO_PROFILE_KEY);
      if (localStored) {
        try {
          const parsed = JSON.parse(localStored);
          setProfile(parsed);
          return;
        } catch (e) {
          // ignore
        }
      }
      setProfile(fallbackProfile);
      localStorage.setItem(LOCAL_DEMO_PROFILE_KEY, JSON.stringify(fallbackProfile));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else if (error && error.code === 'PGRST116') {
        // Row not found in profiles table -> attempt inserting default row
        const newProfile: Profile = {
          id: currentUser.id,
          role: 'tourist',
          full_name: userFullName,
          avatar_url: currentUser.user_metadata?.avatar_url || null,
          phone: null,
          bio: null,
          district: 'Ranchi',
          eco_points: 50,
          created_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (!insertErr && inserted) {
          setProfile(inserted as Profile);
        } else {
          setProfile(newProfile);
        }
      } else {
        // Table may not exist or query failed, fallback gracefully to in-memory profile
        setProfile(fallbackProfile);
      }
    } catch (err) {
      // Non-fatal: profile table issues must never crash auth state
      setProfile(fallbackProfile);
    }
  };

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isLive && supabase) {
        try {
          const {
            data: { session: initSession },
            error,
          } = await supabase.auth.getSession();

          if (!error && initSession) {
            if (mounted) {
              setSession(initSession);
              setUser(initSession.user);
              await loadProfile(initSession.user);
            }
          }
        } catch (err) {
          console.warn('Supabase auth getSession error:', err);
        }
      } else {
        // Check local demo storage
        const demoUser = localStorage.getItem(LOCAL_DEMO_USER_KEY);
        if (demoUser) {
          try {
            const parsedUser = JSON.parse(demoUser);
            setUser(parsedUser);
            await loadProfile(parsedUser);
          } catch (e) {
            localStorage.removeItem(LOCAL_DEMO_USER_KEY);
          }
        }
      }

      if (mounted) {
        setLoading(false);
      }
    }

    initAuth();

    // Supabase auth state change listener
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (isLive && supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event: AuthChangeEvent, newSession: Session | null) => {
          if (!mounted) return;
          setSession(newSession);
          setUser(newSession?.user || null);

          if (newSession?.user) {
            await loadProfile(newSession.user);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      );
      authListener = data;
    }

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [isLive]);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  // Sign In using Supabase Auth
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    if (isLive && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          const friendlyMessage = getFriendlyAuthErrorMessage(error, 'signin');
          return { success: false, error: friendlyMessage };
        }

        if (data && data.user) {
          setUser(data.user);
          setSession(data.session);
          // Load profile independently
          loadProfile(data.user).catch(() => {});
          return { success: true };
        }

        return { success: false, error: 'Email or password is incorrect.' };
      } catch (err: any) {
        const friendlyMessage = getFriendlyAuthErrorMessage(err, 'signin');
        return { success: false, error: friendlyMessage };
      }
    }

    // Local fallback for offline mode when Supabase credentials are not configured
    const demoUser: User = {
      id: 'usr_' + btoa(trimmedEmail).replace(/=/g, '').substring(0, 16),
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: trimmedEmail.split('@')[0].replace('.', ' ') },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: trimmedEmail,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(LOCAL_DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    await loadProfile(demoUser);
    return { success: true };
  };

  // Sign Up using Supabase Auth
  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!trimmedName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isLive && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
            },
          },
        });

        if (error) {
          const friendlyMessage = getFriendlyAuthErrorMessage(error, 'signup');
          return { success: false, error: friendlyMessage };
        }

        if (data && data.user) {
          // If Supabase requires email verification (session is null or not confirmed)
          if (!data.session) {
            return {
              success: true,
              message: 'Your account has been created. Please verify your email before signing in.',
            };
          }

          setUser(data.user);
          setSession(data.session);
          loadProfile(data.user).catch(() => {});
          return {
            success: true,
            message: 'Your account has been created. Welcome to Johar Jharkhand!',
          };
        }

        return { success: false, error: 'Unable to complete sign-up. Please try again.' };
      } catch (err: any) {
        const friendlyMessage = getFriendlyAuthErrorMessage(err, 'signup');
        return { success: false, error: friendlyMessage };
      }
    }

    // Local simulated signup for demo mode when Supabase is not configured
    const demoUser: User = {
      id: 'usr_' + btoa(trimmedEmail).replace(/=/g, '').substring(0, 16),
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: trimmedName },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: trimmedEmail,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const newProfile: Profile = {
      id: demoUser.id,
      role: 'tourist',
      full_name: trimmedName,
      avatar_url: null,
      phone: null,
      bio: 'New eco-traveler discovering Jharkhand.',
      district: 'Ranchi',
      eco_points: 50,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(LOCAL_DEMO_USER_KEY, JSON.stringify(demoUser));
    localStorage.setItem(LOCAL_DEMO_PROFILE_KEY, JSON.stringify(newProfile));
    setUser(demoUser);
    setProfile(newProfile);

    return {
      success: true,
      message: 'Your account has been created. Welcome to Johar Jharkhand!',
    };
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    if (isLive && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }
    localStorage.removeItem(LOCAL_DEMO_USER_KEY);
    localStorage.removeItem(LOCAL_DEMO_PROFILE_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Forgot Password / Reset Password
  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }

    if (isLive && supabase) {
      try {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo,
        });

        if (error) {
          const friendlyMessage = getFriendlyAuthErrorMessage(error, 'reset');
          return { success: false, error: friendlyMessage };
        }

        return {
          success: true,
          message: 'Password reset link has been sent to your email. Please check your inbox.',
        };
      } catch (err: any) {
        const friendlyMessage = getFriendlyAuthErrorMessage(err, 'reset');
        return { success: false, error: friendlyMessage };
      }
    }

    return {
      success: true,
      message: 'Password reset link has been sent to your email. Please check your inbox.',
    };
  };

  // Update Password (when clicking reset link)
  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isLive && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          return {
            success: false,
            error: error.message || 'Failed to update password. Please try again.',
          };
        }
        return { success: true, message: 'Your password has been successfully updated.' };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Something went wrong updating your password.',
        };
      }
    }

    return { success: true, message: 'Your password has been successfully updated.' };
  };

  // Update Profile
  const updateProfile = async (
    updates: Partial<Profile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be signed in to update your profile.' };
    }

    const updatedProfile: Profile = {
      ...(profile || {
        id: user.id,
        role: 'tourist',
        full_name: user.user_metadata?.full_name || 'Traveler',
        avatar_url: null,
        phone: null,
        bio: null,
        district: 'Ranchi',
        eco_points: 50,
        created_at: new Date().toISOString(),
      }),
      ...updates,
    };

    if (isLive && supabase) {
      try {
        const { error } = await supabase.from('profiles').upsert(updatedProfile);

        if (error) {
          console.warn('Profile table upsert note (in-memory preserved):', error.message);
        }

        // Also update Supabase user metadata if full_name changed
        if (updates.full_name) {
          await supabase.auth.updateUser({
            data: { full_name: updates.full_name },
          });
        }
      } catch (err) {
        console.warn('Profile update exception:', err);
      }
    }

    setProfile(updatedProfile);
    localStorage.setItem(LOCAL_DEMO_PROFILE_KEY, JSON.stringify(updatedProfile));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isLiveDb: isLive,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


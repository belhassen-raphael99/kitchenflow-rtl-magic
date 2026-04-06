// @refresh reset
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
export type AppRole = 'admin' | 'employee' | 'demo';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({ ...prev, role: null, loading: false }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Fail-closed: sign out if we can't verify the role
      console.error('Failed to fetch user role:', error);
      await supabase.auth.signOut();
      setAuthState(prev => ({ ...prev, role: null, loading: false, user: null, session: null }));
      return;
    }

    if (data) {
      setAuthState(prev => ({ 
        ...prev, 
        role: data.role as AppRole, 
        loading: false 
      }));
    } else {
      // No role assigned — deny access (fail-closed)
      console.warn('No role found for user:', userId);
      await supabase.auth.signOut();
      setAuthState(prev => ({ ...prev, role: null, loading: false, user: null, session: null }));
    }
  };

  // signUp removed — user creation is invite-only via admin edge function

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('demo_session_start');
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user: authState.user,
    session: authState.session,
    role: authState.role,
    loading: authState.loading,
    isAdmin: authState.role === 'admin',
    isEmployee: authState.role === 'employee',
    isDemo: authState.role === 'demo',
    canWrite: authState.role === 'admin' || authState.role === 'demo',
    canDelete: authState.role === 'admin',
    signIn,
    signOut,
  };
}

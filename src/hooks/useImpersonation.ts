import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const KEYS = {
  active: 'impersonation_active',
  targetEmail: 'impersonation_target_email',
  targetId: 'impersonation_target_id',
  adminRefreshToken: 'impersonation_admin_refresh_token',
  startedAt: 'impersonation_started_at',
} as const;

const MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function useImpersonation() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [targetEmail, setTargetEmail] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for stale impersonation on mount
  useEffect(() => {
    const active = localStorage.getItem(KEYS.active);
    if (active === 'true') {
      const startedAt = localStorage.getItem(KEYS.startedAt);
      if (startedAt) {
        const elapsed = Date.now() - parseInt(startedAt, 10);
        if (elapsed > MAX_DURATION_MS) {
          clearImpersonationState();
          return;
        }
      }
      setIsImpersonating(true);
      setTargetEmail(localStorage.getItem(KEYS.targetEmail));
      setTargetId(localStorage.getItem(KEYS.targetId));
    }
  }, []);

  // Auto-expire timer
  useEffect(() => {
    if (!isImpersonating) return;
    const startedAt = localStorage.getItem(KEYS.startedAt);
    if (!startedAt) return;

    const remaining = MAX_DURATION_MS - (Date.now() - parseInt(startedAt, 10));
    if (remaining <= 0) {
      exitImpersonation();
      return;
    }

    const timer = setTimeout(() => {
      toast({
        title: 'פג תוקף ההתחזות',
        description: 'חזרת אוטומטית לחשבון המנהל לאחר 30 דקות',
        variant: 'destructive',
      });
      exitImpersonation();
    }, remaining);

    return () => clearTimeout(timer);
  }, [isImpersonating]);

  const clearImpersonationState = useCallback(() => {
    // adminRefreshToken uses sessionStorage, others use localStorage
    localStorage.removeItem(KEYS.active);
    localStorage.removeItem(KEYS.targetEmail);
    localStorage.removeItem(KEYS.targetId);
    localStorage.removeItem(KEYS.startedAt);
    sessionStorage.removeItem(KEYS.adminRefreshToken);
    setIsImpersonating(false);
    setTargetEmail(null);
    setTargetId(null);
  }, []);

  const startImpersonation = useCallback(async (userId: string, userEmail: string) => {
    try {
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession?.refresh_token) {
        throw new Error('No active admin session');
      }

      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { target_user_id: userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Store impersonation state BEFORE switching session
      localStorage.setItem(KEYS.active, 'true');
      localStorage.setItem(KEYS.targetEmail, userEmail);
      localStorage.setItem(KEYS.targetId, userId);
      sessionStorage.setItem(KEYS.adminRefreshToken, adminSession.refresh_token);
      localStorage.setItem(KEYS.startedAt, Date.now().toString());

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (otpError) {
        clearImpersonationState();
        throw otpError;
      }

      setIsImpersonating(true);
      setTargetEmail(userEmail);
      setTargetId(userId);

      navigate('/');
      toast({
        title: 'מצב התחזות פעיל',
        description: `צופה כ-${userEmail}`,
      });
    } catch (error: unknown) {
      clearImpersonationState();
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'לא ניתן להתחזות למשתמש',
        variant: 'destructive',
      });
    }
  }, [navigate, clearImpersonationState]);

  const exitImpersonation = useCallback(async () => {
    try {
      const adminRefreshToken = sessionStorage.getItem(KEYS.adminRefreshToken);
      const storedTargetId = localStorage.getItem(KEYS.targetId);

      if (!adminRefreshToken) {
        clearImpersonationState();
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }

      try {
        const { error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: adminRefreshToken,
        });

        if (refreshError) throw refreshError;

        await supabase.functions.invoke('impersonate-user', {
          body: { action: 'exit', target_user_id: storedTargetId },
        });
      } catch (logError) {
        console.error('Failed to log impersonation exit:', logError);
      }

      const { error: restoreError } = await supabase.auth.refreshSession({
        refresh_token: adminRefreshToken,
      });

      clearImpersonationState();

      if (restoreError) {
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }

      navigate('/admin/users');
      toast({
        title: 'חזרת לחשבון המנהל',
        description: 'מצב ההתחזות הסתיים',
      });
    } catch (_error: unknown) {
      clearImpersonationState();
      await supabase.auth.signOut();
      navigate('/auth');
    }
  }, [navigate, clearImpersonationState]);

  return {
    isImpersonating,
    targetEmail,
    targetId,
    startImpersonation,
    exitImpersonation,
  };
}

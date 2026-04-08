import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

export function useUserProfile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile>({ full_name: null, avatar_url: null });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile({ full_name: data.full_name, avatar_url: data.avatar_url });
      }
    };

    fetchProfile();

    // Listen for realtime updates
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        const newData = payload.new as any;
        setProfile({ full_name: newData.full_name, avatar_url: newData.avatar_url });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return profile;
}

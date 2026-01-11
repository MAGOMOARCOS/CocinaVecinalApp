'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  children: React.ReactNode;
  redirectTo?: string;
};

export default function RequireAuth({ children, redirectTo = '/login' }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const hasSession = !!data.session;
        if (!active) return;

        setAuthed(hasSession);
        setChecking(false);

        if (!hasSession) router.replace(redirectTo);
      } catch {
        if (!active) return;
        setAuthed(false);
        setChecking(false);
        router.replace(redirectTo);
      }
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const hasSession = !!session;
      setAuthed(hasSession);
      setChecking(false);
      if (!hasSession) router.replace(redirectTo);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, redirectTo]);

  if (checking) return null;
  if (!authed) return null;

  return <>{children}</>;
}

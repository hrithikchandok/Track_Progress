import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signOut() {
    await sb.auth.signOut();
  }

  return { session, loading, signIn, signOut };
}

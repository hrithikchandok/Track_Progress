import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';

export function usePresence(userId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const channel = sb.channel('global-presence', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId });
        }
      });

    return () => { sb.removeChannel(channel); };
  }, [userId]);

  return count;
}

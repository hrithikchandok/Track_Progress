import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';

export function usePresence(userId, username, email) {
  const [liveUsers, setLiveUsers] = useState([]);

  useEffect(() => {
    if (!userId || !username) return;

    const channel = sb.channel('global-presence', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .map(u => ({ userId: u.userId, username: u.username, email: u.email }));
        setLiveUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, username, email });
        }
      });

    return () => { sb.removeChannel(channel); };
  }, [userId, username, email]);

  return liveUsers;
}

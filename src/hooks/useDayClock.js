import { useState, useEffect } from 'react';

// Live clock that re-renders every second. Returns the time left until midnight
// broken into h/m/s, plus `elapsed` (0 at midnight → 1 at end of day).
export function useDayClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const totalSec = Math.max(0, Math.floor((end - now) / 1000));

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const elapsed = (now - startOfDay) / 864e5;

  return {
    now,
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalSec,
    elapsed,
  };
}

// How aggressively the UI should degrade: 0 (calm) → 1 (alarming).
// Stays at 0 until ~a third of the day has passed, then ramps — but only while
// there are unfinished commitments. Clears the moment the Today list is empty/done.
export function dreadLevel(elapsed, hasPending) {
  if (!hasPending) return 0;
  return Math.min(1, Math.max(0, (elapsed - 0.33) / 0.6));
}

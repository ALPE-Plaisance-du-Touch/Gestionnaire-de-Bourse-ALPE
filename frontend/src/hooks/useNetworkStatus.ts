import { useEffect, useRef, useState } from 'react';

const HEALTHCHECK_INTERVAL = 10_000; // 10 seconds
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const HEALTHCHECK_URL = `${API_BASE}/v1`;

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Active healthcheck: verify actual API reachability
    const checkHealth = async () => {
      try {
        const res = await fetch(HEALTHCHECK_URL, {
          method: 'GET',
          cache: 'no-store',
        });
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkHealth();
    intervalRef.current = setInterval(checkHealth, HEALTHCHECK_INTERVAL);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isOnline };
}

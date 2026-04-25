import { useEffect, useRef, useCallback } from 'react';
import notify from '../../utils/notify';

const SessionTimeout = ({ logout, timeoutInMinutes = 15 }) => {
  const timeoutMs = timeoutInMinutes * 60 * 1000;
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const handleLogout = useCallback(() => {
    console.log('[SessionTimeout] Inactivity limit reached. Logging out...');
    logout();
    localStorage.removeItem('lastActivity');
    notify.warning('Session expired due to inactivity. Please log in again.', 5000);
  }, [logout]);

  const checkInactivity = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const now = Date.now();
      const diff = now - parseInt(lastActivity, 10);
      console.log(`[SessionTimeout] Time since last activity: ${Math.round(diff / 1000)}s`);
      if (diff >= timeoutMs) {
        handleLogout();
        return true;
      } else {
        // Reset local timer to the remaining time
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleLogout, timeoutMs - diff);
        return false;
      }
    }
    return false;
  }, [handleLogout, timeoutMs]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    localStorage.setItem('lastActivity', now.toString());
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [handleLogout, timeoutMs]);

  useEffect(() => {
    // Initial check
    if (checkInactivity()) return;

    const events = [
      'mousedown',
      'mousemove',
      'keydown', // Changed from keypress
      'scroll',
      'touchstart',
      'click'
    ];

    resetTimer();

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Sync activity across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'lastActivity') {
        checkInactivity();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Background interval check (every 30 seconds) as a safety net
    intervalRef.current = setInterval(checkInactivity, 30000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [resetTimer, checkInactivity]);

  return null;
};

export default SessionTimeout;

import { useEffect, useRef, useCallback } from 'react';
import notify from '../../utils/notify';

const SessionTimeout = ({ logout, timeoutInMinutes = 15 }) => {
  const timeoutMs = timeoutInMinutes * 60 * 1000;
  const timerRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    localStorage.removeItem('lastActivity');
    notify.warning('Session expired due to inactivity. Please log in again.', 5000);
  }, [logout]);

  const checkInactivity = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const now = Date.now();
      const diff = now - parseInt(lastActivity, 10);
      if (diff >= timeoutMs) {
        handleLogout();
      } else {
        // Reset local timer to the remaining time
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleLogout, timeoutMs - diff);
      }
    }
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
    // Initial check on mount (handles return after closing tab)
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const now = Date.now();
      if (now - parseInt(lastActivity, 10) >= timeoutMs) {
        handleLogout();
        return;
      }
    }

    // Set initial lastActivity if not present
    if (!localStorage.getItem('lastActivity')) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
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

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [resetTimer, checkInactivity, handleLogout, timeoutMs]);

  return null;
};

export default SessionTimeout;

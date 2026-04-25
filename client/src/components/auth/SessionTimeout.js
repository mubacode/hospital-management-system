import { useEffect, useRef, useCallback } from 'react';
import notify from '../../utils/notify';

const SessionTimeout = ({ logout, timeoutInMinutes = 15 }) => {
  const timeoutMs = timeoutInMinutes * 60 * 1000;
  const timerRef = useRef(null);

  const handleLogout = useCallback(() => {
    logout();
    notify.warning('Session expired due to inactivity. Please log in again.', 5000);
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [handleLogout, timeoutMs]);

  useEffect(() => {
    // Events that reset the inactivity timer
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Initial timer setup
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  return null; // This component doesn't render anything
};

export default SessionTimeout;

/**
 * Notification Service — Centralized toast notification system
 * 
 * Usage anywhere in the app:
 *   import notify from '../utils/notify';
 *   notify.success('Appointment booked!');
 *   notify.error('Conflict detected');
 *   notify.warning('Slot filling up');
 * 
 * No external dependency — lightweight DOM-based toast queue.
 */

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'notify-container';
    Object.assign(container.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }
  return container;
}

const COLORS = {
  success: { bg: '#12b76a', icon: '✓' },
  error:   { bg: '#f04438', icon: '✕' },
  warning: { bg: '#f79009', icon: '⚠' },
  info:    { bg: '#2e90fa', icon: 'ℹ' },
};

function show(type, message, duration = 4000) {
  const c = getContainer();
  const { bg, icon } = COLORS[type] || COLORS.info;

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    background: bg,
    color: '#fff',
    padding: '14px 20px',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '260px',
    maxWidth: '380px',
    opacity: '0',
    transform: 'translateX(30px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    pointerEvents: 'all',
  });

  toast.innerHTML = `
    <span style="font-size:16px;font-weight:bold">${icon}</span>
    <span style="flex:1">${message}</span>
  `;

  c.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
  });

  // Auto dismiss
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

const notify = {
  success: (msg, ms) => show('success', msg, ms),
  error:   (msg, ms) => show('error',   msg, ms),
  warning: (msg, ms) => show('warning', msg, ms),
  info:    (msg, ms) => show('info',    msg, ms),
};

export default notify;

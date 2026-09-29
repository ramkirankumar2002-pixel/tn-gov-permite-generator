// =====================================================
// ui.js — Shared UI utilities (toasts, modals)
// =====================================================

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|''} type
 * @param {number} duration ms
 */
export function showToast(message, type = '', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', '': 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Close any modal by ID
 */
export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/**
 * Open any modal by ID
 */
export function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

/**
 * Confirm dialog wrapper (uses native browser confirm for simplicity)
 */
export function confirm(msg) {
  return window.confirm(msg);
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Initialize close buttons on all modals
 */
export function initModals() {
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.remove('open');
    });
  });

  // Click outside to close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}

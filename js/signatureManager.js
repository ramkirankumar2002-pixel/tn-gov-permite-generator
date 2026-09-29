// =====================================================
// signatureManager.js — Upload & store signatures
// =====================================================

import Storage from './storage.js';
import { showToast } from './ui.js';

const KEY = 'signatures';

export function getSignatures() {
  return Storage.get(KEY, { addd: null, authorized: null, seal: null });
}

function saveSignatures(sigs) {
  Storage.set(KEY, sigs);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderSigCard(type, label, sigs) {
  const card = document.getElementById(`sig-card-${type}`);
  if (!card) return;
  const preview = card.querySelector('.sig-preview');
  const icon = card.querySelector('.sig-icon');
  const txt = card.querySelector('.sig-text');

  if (sigs[type]) {
    card.classList.add('has-sig');
    if (preview) { preview.src = sigs[type]; preview.style.display = 'block'; }
    if (icon) icon.textContent = '✅';
    if (txt) txt.textContent = 'Uploaded — click to replace';
  } else {
    card.classList.remove('has-sig');
    if (preview) preview.style.display = 'none';
    if (icon) icon.textContent = '📤';
    if (txt) txt.textContent = 'Click to upload';
  }
}

export function initSignatureManager() {
  const types = [
    { type: 'addd', label: 'AD / DD Signature' },
    { type: 'authorized', label: 'Authorized Person Signature' },
    { type: 'seal', label: 'Company Seal' }
  ];

  const sigs = getSignatures();
  types.forEach(({ type }) => renderSigCard(type, null, sigs));

  types.forEach(({ type }) => {
    const card = document.getElementById(`sig-card-${type}`);
    const input = document.getElementById(`sig-input-${type}`);
    if (!card || !input) return;

    card.addEventListener('click', () => input.click());

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
      }
      try {
        const dataUrl = await readFileAsDataURL(file);
        const sigs = getSignatures();
        sigs[type] = dataUrl;
        saveSignatures(sigs);
        renderSigCard(type, null, sigs);
        showToast('Signature uploaded!', 'success');
      } catch {
        showToast('Failed to read image', 'error');
      }
      input.value = '';
    });

    // Clear button
    const clearBtn = document.getElementById(`sig-clear-${type}`);
    clearBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const sigs = getSignatures();
      sigs[type] = null;
      saveSignatures(sigs);
      renderSigCard(type, null, sigs);
      showToast('Signature cleared', 'warning');
    });
  });
}

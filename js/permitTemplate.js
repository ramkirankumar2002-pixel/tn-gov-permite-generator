// =====================================================
// permitTemplate.js — Static fields editor
// =====================================================

import Storage from './storage.js';
import { showToast } from './ui.js';

const KEY = 'permitTemplate';

export const DEFAULT_TEMPLATE = {
  hsnCode: 'N/A',
  lesseeId: 'KK1230489',
  mineCode: 'TLRN0046',
  leaseAreaDetails: '',
  lesseeNameAddress: 'Oriental Structural Engineers Pvt. Ltd.',
  lesseeFullAddress: 'M/s Oriental Structural Engineers Private Limited, SF 479 & 482/5 Chennai Tirupathi Salai, Perungalathur Village, Arakkonam Taluk, Ranipet District',
  districtName: 'Tiruvallur',
  talukName: 'Tiruttani',
  village: 'Mamandur',
  sfNoExtent: '11.,/002.25.00',
  mineralName: 'Earth',
  bulkPermitNo: 'TLR260000018',
  classification: 'Porampoke Land',
  orderRef: '',
  leasePeriod: '15-01-2026 to 14-07-2026',
  withinTamilNadu: 'Yes',
  deliveredTo: 'Oriental',
  vehicleType: 'Lorry',
  totalDistance: '100',
  quantity: '24',
  destinationAddress: 'Tiruvallur',
  via: 'THIRUPACHUR',
  authorizedPersonName: 'K LAKSHMI NARAYANAN REDDY',
  adDdLabel: 'Signature of AD / DD:'
};

export function getTemplate() {
  return { ...DEFAULT_TEMPLATE, ...Storage.get(KEY, {}) };
}

export function saveTemplate(data) {
  Storage.set(KEY, data);
}

export function initPermitTemplate() {
  const tmpl = getTemplate();
  const form = document.getElementById('template-form');
  if (!form) return;

  // Populate all fields
  Object.keys(tmpl).forEach(k => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = tmpl[k] || '';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {};
    Object.keys(DEFAULT_TEMPLATE).forEach(k => {
      const el = form.querySelector(`[name="${k}"]`);
      if (el) data[k] = el.value;
    });
    saveTemplate(data);
    showToast('Permit template saved!', 'success');
  });

  document.getElementById('btn-reset-template')?.addEventListener('click', () => {
    Storage.remove(KEY);
    Object.keys(DEFAULT_TEMPLATE).forEach(k => {
      const el = form.querySelector(`[name="${k}"]`);
      if (el) el.value = DEFAULT_TEMPLATE[k];
    });
    showToast('Template reset to defaults', 'warning');
  });
}

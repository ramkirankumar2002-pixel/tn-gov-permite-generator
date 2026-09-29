// =====================================================
// app.js — Main SPA controller
// =====================================================

import { initPermitTemplate } from './js/permitTemplate.js';
import { initVehicleMaster, initDriverMaster } from './js/vehicleMaster.js';
import { initSignatureManager } from './js/signatureManager.js';
import { initGeneratePanel } from './js/generatePermits.js';
import { initExport } from './js/pdfExport.js';
import { initModals } from './js/ui.js';
import Storage from './js/storage.js';

// ---- Tab Navigation ----
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`panel-${target}`)?.classList.add('active');
    });
  });
}

// ---- Clock in topbar ----
function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const update = () => {
    const now = new Date();
    el.textContent = now.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true
    });
  };
  update();
  setInterval(update, 1000);
}

// ---- Stats ----
function updateStats() {
  try {
    const DEFAULT_V_COUNT = 4;
    const DEFAULT_D_COUNT = 4;
    const vehicles = Storage.get('vehicles', null);
    const drivers  = Storage.get('drivers', null);
    const el1 = document.getElementById('stat-vehicles');
    const el2 = document.getElementById('stat-drivers');
    if (el1) el1.textContent = vehicles ? vehicles.length : DEFAULT_V_COUNT;
    if (el2) el2.textContent = drivers  ? drivers.length  : DEFAULT_D_COUNT;
  } catch {}
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  startClock();
  initModals();
  initPermitTemplate();
  initVehicleMaster();
  initDriverMaster();
  initSignatureManager();
  initGeneratePanel();
  initExport();
  updateStats();

  // Refresh stats when switching tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', updateStats);
  });
});

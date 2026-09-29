// =====================================================
// vehicleMaster.js — Vehicle & Driver master CRUD
// =====================================================

import Storage from './storage.js';
import { showToast, confirm } from './ui.js';

const V_KEY = 'vehicles';
const D_KEY = 'drivers';

// ---- Default sample data ----
const DEFAULT_VEHICLES = [
  { id: 1, vehicleNo: 'TN16H4807' },
  { id: 2, vehicleNo: 'TN16H4808' },
  { id: 3, vehicleNo: 'TN16H4809' },
  { id: 4, vehicleNo: 'TN16H4810' }
];

const DEFAULT_DRIVERS = [
  { id: 1, vehicleNo: 'TN16H4807', driverName: 'Raj Kumar R',  phone: '9597453199', licenseNo: 'TN202007008088' },
  { id: 2, vehicleNo: 'TN16H4808', driverName: 'Ravi',         phone: '9876543210', licenseNo: 'TN202007008009' },
  { id: 3, vehicleNo: 'TN16H4809', driverName: 'Murugan',      phone: '9003456789', licenseNo: 'TN202007008010' },
  { id: 4, vehicleNo: 'TN16H4810', driverName: 'Senthil',      phone: '9944556677', licenseNo: 'TN202007008011' }
];

export function getVehicles() {
  return Storage.get(V_KEY, DEFAULT_VEHICLES);
}

export function getDrivers() {
  return Storage.get(D_KEY, DEFAULT_DRIVERS);
}

export function getDriverForVehicle(vehicleNo) {
  const drivers = getDrivers();
  return drivers.find(d => d.vehicleNo === vehicleNo) || null;
}

export function getVehicleForPermit(index) {
  const vehicles = getVehicles();
  if (!vehicles.length) return null;
  return vehicles[index % vehicles.length];
}

// ============================================================
// VEHICLE TABLE UI
// ============================================================
let vehicleEditId = null;

function renderVehicleTable() {
  const tbody = document.getElementById('vehicle-tbody');
  if (!tbody) return;
  const vehicles = getVehicles();
  const drivers = getDrivers();

  if (!vehicles.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center"><div class="empty-state"><div class="empty-icon">🚛</div><p>No vehicles added yet</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = vehicles.map(v => {
    const drv = drivers.find(d => d.vehicleNo === v.vehicleNo);
    return `
    <tr>
      <td><span class="badge badge-blue">${v.vehicleNo}</span></td>
      <td>${drv ? drv.driverName : '<span style="color:#aaa">No driver linked</span>'}</td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick="editVehicle(${v.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteVehicle(${v.id})">🗑️ Delete</button>
      </td>
    </tr>`;
  }).join('');

  // Stats
  const el = document.getElementById('vehicle-count');
  if (el) el.textContent = vehicles.length;
}

window.editVehicle = function(id) {
  const vehicles = getVehicles();
  const v = vehicles.find(x => x.id === id);
  if (!v) return;
  vehicleEditId = id;
  document.getElementById('v-modal-title').textContent = 'Edit Vehicle';
  document.getElementById('v-input-no').value = v.vehicleNo;
  document.getElementById('vehicle-modal').classList.add('open');
};

window.deleteVehicle = function(id) {
  if (!window.confirm('Delete this vehicle?')) return;
  let vehicles = getVehicles();
  vehicles = vehicles.filter(v => v.id !== id);
  Storage.set(V_KEY, vehicles);
  renderVehicleTable();
  showToast('Vehicle deleted', 'warning');
};

export function initVehicleMaster() {
  renderVehicleTable();

  // Add vehicle button
  document.getElementById('btn-add-vehicle')?.addEventListener('click', () => {
    vehicleEditId = null;
    document.getElementById('v-modal-title').textContent = 'Add Vehicle';
    document.getElementById('v-input-no').value = '';
    document.getElementById('vehicle-modal').classList.add('open');
  });

  // Vehicle modal save
  document.getElementById('btn-save-vehicle')?.addEventListener('click', () => {
    const no = document.getElementById('v-input-no').value.trim().toUpperCase();
    if (!no) { showToast('Enter vehicle number', 'error'); return; }

    let vehicles = getVehicles();
    if (vehicleEditId) {
      vehicles = vehicles.map(v => v.id === vehicleEditId ? { ...v, vehicleNo: no } : v);
      showToast('Vehicle updated!', 'success');
    } else {
      const id = Date.now();
      vehicles.push({ id, vehicleNo: no });
      showToast('Vehicle added!', 'success');
    }
    Storage.set(V_KEY, vehicles);
    document.getElementById('vehicle-modal').classList.remove('open');
    renderVehicleTable();
    renderDriverTable(); // refresh driver dropdowns
  });

  // Import Excel for vehicles
  document.getElementById('vehicle-excel-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await importVehicleExcel(file);
    e.target.value = '';
  });

  document.getElementById('btn-import-vehicle-excel')?.addEventListener('click', () => {
    document.getElementById('vehicle-excel-input').click();
  });
}

async function importVehicleExcel(file) {
  try {
    const XLSX = window.XLSX;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    const existing = getVehicles();

    let added = 0;
    rows.forEach(row => {
      const no = (row['Vehicle No'] || row['VehicleNo'] || row['vehicle_no'] || '').toString().trim().toUpperCase();
      if (no && !existing.find(v => v.vehicleNo === no)) {
        existing.push({ id: Date.now() + Math.random(), vehicleNo: no });
        added++;
      }
    });
    Storage.set(V_KEY, existing);
    renderVehicleTable();
    showToast(`Imported ${added} vehicles from Excel`, 'success');
  } catch (err) {
    showToast('Error reading Excel file', 'error');
  }
}

// ============================================================
// DRIVER TABLE UI
// ============================================================
let driverEditId = null;

function renderDriverTable() {
  const tbody = document.getElementById('driver-tbody');
  if (!tbody) return;
  const drivers = getDrivers();

  if (!drivers.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">👤</div><p>No drivers added yet</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = drivers.map(d => `
    <tr>
      <td><span class="badge badge-blue">${d.vehicleNo}</span></td>
      <td>${d.driverName}</td>
      <td>${d.phone}</td>
      <td><span class="badge badge-green">${d.licenseNo}</span></td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick="editDriver(${d.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDriver(${d.id})">🗑️ Delete</button>
      </td>
    </tr>`).join('');

  const el = document.getElementById('driver-count');
  if (el) el.textContent = drivers.length;
}

window.editDriver = function(id) {
  const drivers = getDrivers();
  const d = drivers.find(x => x.id === id);
  if (!d) return;
  driverEditId = id;
  const vehicles = getVehicles();
  populateVehicleDropdown('d-input-vehicle', vehicles, d.vehicleNo);
  document.getElementById('d-modal-title').textContent = 'Edit Driver';
  document.getElementById('d-input-name').value = d.driverName;
  document.getElementById('d-input-phone').value = d.phone;
  document.getElementById('d-input-license').value = d.licenseNo;
  document.getElementById('driver-modal').classList.add('open');
};

window.deleteDriver = function(id) {
  if (!window.confirm('Delete this driver?')) return;
  let drivers = getDrivers();
  drivers = drivers.filter(d => d.id !== id);
  Storage.set(D_KEY, drivers);
  renderDriverTable();
  showToast('Driver deleted', 'warning');
};

function populateVehicleDropdown(selectId, vehicles, selectedValue = '') {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select Vehicle --</option>' +
    vehicles.map(v => `<option value="${v.vehicleNo}" ${v.vehicleNo === selectedValue ? 'selected' : ''}>${v.vehicleNo}</option>`).join('');
}

export function initDriverMaster() {
  renderDriverTable();

  document.getElementById('btn-add-driver')?.addEventListener('click', () => {
    driverEditId = null;
    document.getElementById('d-modal-title').textContent = 'Add Driver';
    const vehicles = getVehicles();
    populateVehicleDropdown('d-input-vehicle', vehicles);
    document.getElementById('d-input-name').value = '';
    document.getElementById('d-input-phone').value = '';
    document.getElementById('d-input-license').value = '';
    document.getElementById('driver-modal').classList.add('open');
  });

  document.getElementById('btn-save-driver')?.addEventListener('click', () => {
    const vehicleNo = document.getElementById('d-input-vehicle').value.trim();
    const driverName = document.getElementById('d-input-name').value.trim();
    const phone = document.getElementById('d-input-phone').value.trim();
    const licenseNo = document.getElementById('d-input-license').value.trim().toUpperCase();

    if (!vehicleNo || !driverName || !licenseNo) {
      showToast('Fill all required fields', 'error');
      return;
    }

    let drivers = getDrivers();
    if (driverEditId) {
      drivers = drivers.map(d => d.id === driverEditId ? { ...d, vehicleNo, driverName, phone, licenseNo } : d);
      showToast('Driver updated!', 'success');
    } else {
      drivers.push({ id: Date.now(), vehicleNo, driverName, phone, licenseNo });
      showToast('Driver added!', 'success');
    }
    Storage.set(D_KEY, drivers);
    document.getElementById('driver-modal').classList.remove('open');
    renderDriverTable();
  });

  // Import Excel
  document.getElementById('driver-excel-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await importDriverExcel(file);
    e.target.value = '';
  });

  document.getElementById('btn-import-driver-excel')?.addEventListener('click', () => {
    document.getElementById('driver-excel-input').click();
  });
}

async function importDriverExcel(file) {
  try {
    const XLSX = window.XLSX;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    const existing = getDrivers();

    let added = 0;
    rows.forEach(row => {
      const vehicleNo = (row['Vehicle No'] || row['VehicleNo'] || '').toString().trim().toUpperCase();
      const driverName = (row['Driver Name'] || row['DriverName'] || '').toString().trim();
      const phone = (row['Phone'] || row['Phone No'] || '').toString().trim();
      const licenseNo = (row['License No'] || row['LicenseNo'] || '').toString().trim().toUpperCase();
      if (vehicleNo && driverName && licenseNo) {
        existing.push({ id: Date.now() + Math.random(), vehicleNo, driverName, phone, licenseNo });
        added++;
      }
    });
    Storage.set(D_KEY, existing);
    renderDriverTable();
    showToast(`Imported ${added} drivers from Excel`, 'success');
  } catch (err) {
    showToast('Error reading Excel file', 'error');
  }
}

// =====================================================
// generatePermits.js — Bulk generation engine
// =====================================================

import { getTemplate } from './permitTemplate.js';
import { getVehicleForPermit, getDriverForVehicle } from './vehicleMaster.js';
import {
  getDispatchTime, getTravellingDate, getRequiredTime,
  formatDateTime, formatDateTime24, parseDateTimeLocal, toDateTimeLocal
} from './dateTimeLogic.js';
import { getSerialNo, getDispatchSlipNo } from './serialLogic.js';
import { renderAllPermits } from './permitRenderer.js';
import { showToast } from './ui.js';

let generatedPermits = [];

/**
 * Build permit data object for a single permit
 */
function buildPermitData(index, params, template) {
  const dispatchDate = getDispatchTime(params.startDate, index, 25);
  const travelDate   = getTravellingDate(dispatchDate);
  const reqTime      = getRequiredTime(travelDate);

  const vehicle = getVehicleForPermit(index);
  const driver  = vehicle ? getDriverForVehicle(vehicle.vehicleNo) : null;

  return {
    // Static from template
    hsnCode:             template.hsnCode,
    lesseeId:            template.lesseeId,
    mineCode:            template.mineCode,
    leaseAreaDetails:    template.leaseAreaDetails,
    lesseeNameAddress:   template.lesseeNameAddress,
    lesseeFullAddress:   template.lesseeFullAddress,
    districtName:        template.districtName,
    talukName:           template.talukName,
    village:             template.village,
    sfNoExtent:          template.sfNoExtent,
    mineralName:         template.mineralName,
    bulkPermitNo:        template.bulkPermitNo,
    classification:      template.classification,
    orderRef:            template.orderRef,
    leasePeriod:         template.leasePeriod,
    withinTamilNadu:     template.withinTamilNadu,
    deliveredTo:         template.deliveredTo,
    vehicleType:         template.vehicleType,
    totalDistance:       template.totalDistance,
    quantity:            template.quantity,
    destinationAddress:  template.destinationAddress,
    via:                 template.via,
    authorizedPersonName: template.authorizedPersonName,

    // Dynamic fields
    serialNo:       getSerialNo(params.startSerial, index),
    dispatchSlipNo: getDispatchSlipNo(params.startDispatchSlip, index),

    dispatchDateTime: formatDateTime(dispatchDate),
    travellingDate:   formatDateTime24(travelDate),
    requiredTime:     reqTime,

    vehicleNo:       vehicle ? vehicle.vehicleNo : 'N/A',
    driverName:      driver  ? driver.driverName : 'N/A',
    driverLicenseNo: driver  ? driver.licenseNo  : 'N/A',
    driverPhone:     driver  ? driver.phone       : 'N/A',
  };
}

/**
 * Generate all permit data objects
 */
export function generatePermitData(params) {
  const template = getTemplate();
  const permits = [];
  for (let i = 0; i < params.count; i++) {
    permits.push(buildPermitData(i, params, template));
  }
  return permits;
}

/**
 * Main generate action — called by UI
 */
export async function initGeneratePanel() {
  // Set default start date/time to now
  const dtInput = document.getElementById('gen-start-datetime');
  if (dtInput) dtInput.value = toDateTimeLocal(new Date());

  const btnGenerate = document.getElementById('btn-generate');
  const btnClear = document.getElementById('btn-clear-preview');
  const preview = document.getElementById('permits-preview');
  const previewCard = document.getElementById('preview-card');
  const progressWrap = document.getElementById('progress-wrap');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const exportBar = document.getElementById('export-bar');
  const countDisplay = document.getElementById('generated-count');

  if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
      const count = parseInt(document.getElementById('gen-count').value) || 50;
      const startSerial = document.getElementById('gen-start-serial').value.trim();
      const startDispatchSlip = document.getElementById('gen-start-dispatch').value.trim();
      const startDateStr = document.getElementById('gen-start-datetime').value;

      if (!startSerial) { showToast('Enter starting serial number', 'error'); return; }
      if (!startDispatchSlip) { showToast('Enter starting dispatch slip number', 'error'); return; }
      if (!startDateStr) { showToast('Enter starting date & time', 'error'); return; }
      if (count < 1 || count > 200) { showToast('Count must be between 1 and 200', 'error'); return; }

      const startDate = parseDateTimeLocal(startDateStr);

      const params = { count, startSerial, startDispatchSlip, startDate };

      btnGenerate.disabled = true;
      btnGenerate.textContent = '⏳ Generating...';

      if (progressWrap) progressWrap.style.display = 'block';
      if (progressText) progressText.textContent = `Generating ${count} permits...`;
      if (progressBar) progressBar.style.width = '0%';

      // Generate data
      generatedPermits = generatePermitData(params);

      // Render with progress updates
      if (progressBar) progressBar.style.width = '40%';
      if (progressText) progressText.textContent = 'Rendering permit layouts...';

      if (preview) {
        await renderAllPermits(generatedPermits, preview);
      }

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = `✅ ${count} permits generated successfully!`;

      if (previewCard) previewCard.style.display = 'block';
      if (exportBar) exportBar.style.display = 'flex';
      if (countDisplay) countDisplay.textContent = count;

      btnGenerate.disabled = false;
      btnGenerate.textContent = '🔄 Regenerate';

      // Scroll to preview
      previewCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      showToast(`${count} permits generated!`, 'success');
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (preview) preview.innerHTML = '';
      if (previewCard) previewCard.style.display = 'none';
      if (exportBar) exportBar.style.display = 'none';
      if (progressWrap) progressWrap.style.display = 'none';
      generatedPermits = [];
      if (btnGenerate) btnGenerate.textContent = '🚀 Generate Permits';
      showToast('Preview cleared', 'warning');
    });
  }
}

export function getGeneratedPermits() {
  return generatedPermits;
}

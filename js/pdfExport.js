// =====================================================
// pdfExport.js — PDF export (single, separate, ZIP, print)
// Each permit = 2 pages: Royalty page + Instruction page
// =====================================================

import { showToast } from './ui.js';

/**
 * Get all royalty pages (one per permit), in document order.
 */
function getRoyaltyElements() {
  return Array.from(document.querySelectorAll('.permit-royalty-page'));
}

/**
 * Get all printable pages (royalty + instruction interleaved), in DOM order.
 * Used for single-PDF export.
 */
function getAllPageElements() {
  return Array.from(
    document.querySelectorAll('.permit-royalty-page, .permit-instruction-page')
  );
}

/**
 * Capture a single DOM element as a canvas then add it to a jsPDF document.
 * @param {HTMLElement} el       — the DOM element to capture
 * @param {object}      pdf      — jsPDF instance
 * @param {boolean}     addPage  — whether to add a new PDF page first
 */
async function capturePermit(el, pdf, addPage) {
  // eslint-disable-next-line no-undef
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 900,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdfW   = pdf.internal.pageSize.getWidth();
  const pdfH   = pdf.internal.pageSize.getHeight();

  const imgW    = canvas.width;
  const imgH    = canvas.height;
  const ratio   = pdfW / imgW;
  const scaledH = imgH * ratio;

  if (addPage) pdf.addPage();

  if (scaledH > pdfH) {
    const hRatio = pdfH / scaledH;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW * hRatio, pdfH, '', 'FAST');
  } else {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, scaledH, '', 'FAST');
  }
}

// ─────────────────────────────────────────────────────
// Export: Single PDF (all permits + instructions in one file)
// ─────────────────────────────────────────────────────

export async function exportSinglePDF(progressCb) {
  const pages = getAllPageElements();
  if (!pages.length) { showToast('Generate permits first!', 'error'); return; }

  showToast('Generating single PDF...', '');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  for (let i = 0; i < pages.length; i++) {
    if (progressCb) progressCb(i + 1, pages.length);
    await capturePermit(pages[i], pdf, i > 0);
  }

  pdf.save('TN_Mining_Permits_All.pdf');
  showToast('Single PDF downloaded!', 'success');
}

// ─────────────────────────────────────────────────────
// Export: Separate PDFs (2-page PDF per permit)
// ─────────────────────────────────────────────────────

export async function exportSeparatePDFs(progressCb) {
  const royaltyEls = getRoyaltyElements();
  if (!royaltyEls.length) { showToast('Generate permits first!', 'error'); return; }

  showToast('Generating separate PDFs...', '');
  const { jsPDF } = window.jspdf;

  for (let i = 0; i < royaltyEls.length; i++) {
    if (progressCb) progressCb(i + 1, royaltyEls.length);

    const royaltyEl = royaltyEls[i];
    const serialNo  = royaltyEl.getAttribute('data-permit-id') || `permit_${i + 1}`;

    // Find the matching instruction page by serial number
    const instrEl = document.querySelector(
      `.permit-instruction-page[data-permit-instruction-id="${serialNo}"]`
    );

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    await capturePermit(royaltyEl, pdf, false);          // Page 1: Royalty
    if (instrEl) await capturePermit(instrEl, pdf, true); // Page 2: Instructions

    pdf.save(`Permit_${serialNo}.pdf`);
    // Small delay to prevent browser download throttling
    await new Promise(r => setTimeout(r, 200));
  }

  showToast('All separate PDFs downloaded!', 'success');
}

// ─────────────────────────────────────────────────────
// Export: ZIP of individual 2-page PDFs
// ─────────────────────────────────────────────────────

export async function exportZIP(progressCb) {
  const royaltyEls = getRoyaltyElements();
  if (!royaltyEls.length) { showToast('Generate permits first!', 'error'); return; }

  showToast('Building ZIP file...', '');
  const { jsPDF } = window.jspdf;
  // eslint-disable-next-line no-undef
  const zip = new JSZip();

  for (let i = 0; i < royaltyEls.length; i++) {
    if (progressCb) progressCb(i + 1, royaltyEls.length);

    const royaltyEl = royaltyEls[i];
    const serialNo  = royaltyEl.getAttribute('data-permit-id') || `permit_${i + 1}`;

    const instrEl = document.querySelector(
      `.permit-instruction-page[data-permit-instruction-id="${serialNo}"]`
    );

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    await capturePermit(royaltyEl, pdf, false);
    if (instrEl) await capturePermit(instrEl, pdf, true);

    const pdfBytes = pdf.output('arraybuffer');
    zip.file(`Permit_${serialNo}.pdf`, pdfBytes);
  }

  // eslint-disable-next-line no-undef
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  // eslint-disable-next-line no-undef
  saveAs(zipBlob, 'TN_Mining_Permits.zip');
  showToast('ZIP file downloaded!', 'success');
}

// ─────────────────────────────────────────────────────
// Print
// ─────────────────────────────────────────────────────

export function printPermits() {
  const pages = getAllPageElements();
  if (!pages.length) { showToast('Generate permits first!', 'error'); return; }
  window.print();
}

// ─────────────────────────────────────────────────────
// Initialize Export Buttons
// ─────────────────────────────────────────────────────

export function initExport() {
  const setProgress = (current, total) => {
    const bar = document.getElementById('export-progress-bar');
    const txt = document.getElementById('export-progress-text');
    if (bar) bar.style.width = `${(current / total) * 100}%`;
    if (txt) txt.textContent = `Processing ${current} / ${total}...`;
  };

  const wrapExport = async (fn) => {
    const wrap = document.getElementById('export-progress-wrap');
    if (wrap) wrap.style.display = 'block';
    try {
      await fn(setProgress);
    } catch (e) {
      showToast('Export error: ' + e.message, 'error');
    }
    if (wrap) wrap.style.display = 'none';
  };

  document.getElementById('btn-export-single')
    ?.addEventListener('click', () => wrapExport(exportSinglePDF));
  document.getElementById('btn-export-separate')
    ?.addEventListener('click', () => wrapExport(exportSeparatePDFs));
  document.getElementById('btn-export-zip')
    ?.addEventListener('click', () => wrapExport(exportZIP));
  document.getElementById('btn-print')
    ?.addEventListener('click', printPermits);
}

// =====================================================
// permitRenderer.js — Renders one permit as HTML
// Each permit = 1 Royalty (security background) page
//             + 1 Instruction (Terms & Conditions) page
// =====================================================

import { getSignatures } from './signatureManager.js';

// ─────────────────────────────────────────────────────
// QR Code Helpers
// ─────────────────────────────────────────────────────

function compactUpper(v){
  return String(v || '').replace(/\s+/g, '').toUpperCase();
}

function buildQRData(p) {
  const dist = String(p.totalDistance || '').replace(/[^\d.]/g, '');
  const qty = String(p.quantity || '').replace(/[^\d.]/g, '');
  const mineral = String(p.mineralName || '').replace(/\s+/g, '');
  const hrsMatch = String(p.requiredTime || '').match(/(\d+)\s*hrs?/i);
  return [
    compactUpper(p.serialNo),
    compactUpper(p.dispatchSlipNo),
    compactUpper(p.mineCode),
    String(p.dispatchDateTime || '').trim().split(/\s+/)[0] || '',
    (String(p.dispatchDateTime || '').trim().split(/\s+/)[1] || '').replace(/:\d{2}$/, ''),
    dist ? `${dist}kms` : '',
    hrsMatch ? `${hrsMatch[1]}hrs` : '1hrs',
    mineral && qty ? `${mineral}(${qty}MT)` : mineral,
    compactUpper(p.vehicleNo),
    String(p.deliveredTo || '').trim()
  ].join(',');
}

function generateQRDataURL(text) {
  return new Promise((resolve) => {
    try {
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
      document.body.appendChild(container);
      // eslint-disable-next-line no-undef
      new QRCode(container, {
        text, width: 80, height: 80,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      setTimeout(() => {
        const canvas = container.querySelector('canvas');
        const img   = container.querySelector('img');
        if (canvas)     resolve(canvas.toDataURL('image/png'));
        else if (img)   resolve(img.src);
        else            resolve('');
        document.body.removeChild(container);
      }, 100);
    } catch { resolve(''); }
  });
}

// ─────────────────────────────────────────────────────
// Guilloche Security Rosette SVG
// ─────────────────────────────────────────────────────

/**
 * Returns a gear/scalloped circle SVG path string.
 * cx, cy = centre; r = mean radius; n = number of scallops; h = amplitude
 */
function scallopedPath(cx, cy, r, n, h) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const angle = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad   = i % 2 === 0 ? r + h : r - h;
    pts.push(`${(cx + rad * Math.cos(angle)).toFixed(1)},${(cy + rad * Math.sin(angle)).toFixed(1)}`);
  }
  return `M${pts[0]}L${pts.slice(1).join('L')}Z`;
}

/**
 * Builds the complete guilloche rosette SVG that mimics the TN
 * security paper background (pink, multi-ring, with central emblem).
 */
function guillocheRosetteSVG() {
  const cx = 250, cy = 250;
  const pk = '#e91e63';
  const op = 0.16; // opacity for the rings

  // Lotus-petal paths around centre
  let petals = '';
  for (let i = 0; i < 8; i++) {
    const a  = i * Math.PI / 4;
    const x1 = (cx + 20 * Math.cos(a)).toFixed(1);
    const y1 = (cy + 20 * Math.sin(a)).toFixed(1);
    const cx1 = (cx + 48 * Math.cos(a + 0.38)).toFixed(1);
    const cy1 = (cy + 48 * Math.sin(a + 0.38)).toFixed(1);
    const cx2 = (cx + 48 * Math.cos(a - 0.38)).toFixed(1);
    const cy2 = (cy + 48 * Math.sin(a - 0.38)).toFixed(1);
    petals += `<path d="M${cx},${cy} C${cx1},${cy1} ${cx2},${cy2} ${x1},${y1}Z"
      fill="${pk}" fill-opacity="0.10" stroke="none"/>`;
  }

  // Concentric scalloped + plain rings (outer → inner)
  const rings = [
    { type: 's', r: 228, n: 80, h: 5  },
    { type: 's', r: 220, n: 72, h: 4  },
    { type: 'c', r: 210                },
    { type: 's', r: 202, n: 68, h: 4  },
    { type: 'c', r: 192, w: 1.2       },
    { type: 's', r: 184, n: 64, h: 5  },
    { type: 'c', r: 174                },
    { type: 's', r: 166, n: 60, h: 4  },
    { type: 'c', r: 156, w: 1.2       },
    { type: 's', r: 148, n: 56, h: 4  },
    { type: 'c', r: 138                },
    { type: 's', r: 130, n: 52, h: 4  },
    { type: 'c', r: 120, w: 1.2       },
    { type: 's', r: 112, n: 48, h: 4  },
    { type: 'c', r: 102                },
    { type: 's', r:  94, n: 44, h: 3  },
    { type: 'c', r:  84, w: 1.2       },
    { type: 's', r:  76, n: 40, h: 3  },
    { type: 'c', r:  66                },
    { type: 's', r:  58, n: 36, h: 3  },
    { type: 'c', r:  48, w: 1.2       },
  ];

  const ringsSVG = rings.map(ring => {
    if (ring.type === 'c') {
      return `<circle cx="${cx}" cy="${cy}" r="${ring.r}"
        fill="none" stroke="${pk}" stroke-opacity="${op}" stroke-width="${ring.w || 0.7}"/>`;
    }
    return `<path d="${scallopedPath(cx, cy, ring.r, ring.n, ring.h)}"
      fill="none" stroke="${pk}" stroke-opacity="${op}" stroke-width="0.7"/>`;
  }).join('\n    ');

  // Temple arch silhouette (simplified geometric)
  const templeArch = `
    <g fill="${pk}" fill-opacity="0.16" stroke="none">
      <!-- Base platform -->
      <rect x="220" y="208" width="60" height="6" rx="1"/>
      <!-- Main tower body -->
      <rect x="232" y="180" width="36" height="30"/>
      <!-- Stepped tiers -->
      <rect x="228" y="170" width="44" height="12"/>
      <rect x="233" y="160" width="34" height="12"/>
      <rect x="237" y="150" width="26" height="12"/>
      <rect x="241" y="140" width="18" height="12"/>
      <rect x="244" y="132" width="12" height="10"/>
      <!-- Finial -->
      <ellipse cx="${cx}" cy="128" rx="5" ry="7"/>
      <!-- Arch opening -->
      <rect x="243" y="194" width="14" height="14" fill="white" fill-opacity="0.6"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"
  style="width:100%;height:100%;display:block;">
  <g>
    ${ringsSVG}
    ${petals}
    ${templeArch}
    <!-- Central circle -->
    <circle cx="${cx}" cy="${cy}" r="22"
      fill="${pk}" fill-opacity="0.07"
      stroke="${pk}" stroke-opacity="${op}" stroke-width="1.5"/>
    <!-- Outer decorative band -->
    <circle cx="${cx}" cy="${cy}" r="237"
      fill="none" stroke="${pk}" stroke-opacity="${op * 0.6}" stroke-width="2"/>
    <!-- Tamil motto below temple -->
    <text x="${cx}" y="235"
      text-anchor="middle" font-size="9.5" fill="${pk}" fill-opacity="0.30"
      font-family="'Noto Serif',Georgia,serif" font-weight="bold">வாய்மையே வெல்லும்</text>
  </g>
</svg>`;
}

// ─────────────────────────────────────────────────────
// TN Header Emblem Box
// ─────────────────────────────────────────────────────

function tnEmblemBox() {
  return `<div style="
      width:42px;height:42px;
      border:2.5px solid #c2185b;border-radius:3px;
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;background:rgba(194,24,91,0.06);
    ">
    <!-- Simplified TN emblem using CSS/text -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28">
      <g fill="#c2185b" fill-opacity="0.85">
        <rect x="6"  y="24" width="20" height="3" rx="1"/>
        <rect x="9"  y="18" width="14" height="7"/>
        <rect x="7"  y="13" width="18" height="6"/>
        <rect x="9"  y="9"  width="14" height="5"/>
        <rect x="11" y="5"  width="10" height="5"/>
        <rect x="13" y="2"  width="6"  height="4"/>
        <ellipse cx="16" cy="2" rx="3" ry="2"/>
        <rect x="13" y="19" width="6" height="5" fill="white"/>
      </g>
    </svg>
  </div>`;
}

// ─────────────────────────────────────────────────────
// Section Header (per half of the royalty page)
// ─────────────────────────────────────────────────────

function renderSectionHeader(serialNo, type) {
  return `
  <div style="display:flex;align-items:flex-start;gap:10px;padding:7px 12px 5px;background:rgba(255,255,255,0.7);">
    ${tnEmblemBox()}
    <div style="flex:1;text-align:center;line-height:1.35;">
      <div style="font-size:9.5pt;font-weight:bold;color:#c2185b;font-family:Arial,sans-serif;letter-spacing:0.3px;">
        GOVERNMENT OF TAMIL NADU
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:8.5pt;font-weight:bold;color:#c2185b;font-family:Arial,sans-serif;">
          DEPARTMENT OF GEOLOGY AND MINING
        </span>
        <span style="font-size:8pt;font-weight:bold;color:#111;font-family:Arial,sans-serif;">${serialNo}</span>
      </div>
      <div style="font-size:7pt;color:#444;font-family:Arial,sans-serif;margin-top:1px;">
        O/o. DEPUTY DIRECTOR / ASSISTANT DIRECTOR
      </div>
      <div style="font-size:7.5pt;color:#333;font-family:Arial,sans-serif;margin-top:1px;">
        TRANSPORT PERMIT (${type})
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────
// Compact Permit Form (Original half)
// ─────────────────────────────────────────────────────

function renderPermitFormCompact(p, qrDataUrl, sigs) {
  const adddSig = sigs.addd
    ? `<img src="${sigs.addd}" alt="AD/DD Sig" style="max-height:28px;max-width:75px;object-fit:contain;">`
    : '&nbsp;';
  const authorizedSig = sigs.authorized
    ? `<img src="${sigs.authorized}" alt="Auth Sig" style="max-height:28px;max-width:75px;object-fit:contain;">`
    : (p.authorizedPersonName || '&nbsp;');
  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" alt="QR" style="width:58px;height:58px;display:block;">`
    : '';

  // Reusable cell style helpers (via inline class-like strings)
  const lbl = `background:rgba(252,228,236,0.45);font-weight:bold;color:#555;`;
  const val = `background:rgba(255,255,255,0.75);`;
  const hi  = `background:#e8f5e9;padding:0 3px;border-radius:2px;font-weight:bold;`;

  return `
  <div style="padding:2px 10px 4px;font-size:6.6pt;font-family:Arial,sans-serif;position:relative;">
    <!-- Dispatch header row -->
    <div style="display:flex;justify-content:space-between;margin-bottom:2px;color:#555;">
      <span>HSN Code: <strong>${p.hsnCode}</strong></span>
      <span>Date &amp; Time of Dispatch : <strong>${p.dispatchDateTime}</strong></span>
      ${qrImg ? `<div style="position:absolute;top:2px;right:10px;">${qrImg}</div>` : ''}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:6.6pt;table-layout:fixed;">
      <colgroup>
        <col style="width:14%"><col style="width:16%">
        <col style="width:12%"><col style="width:14%">
        <col style="width:16%"><col style="width:28%">
      </colgroup>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Lessee Id</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.lesseeId}</td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Mine Code</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.mineCode}</td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Lease Area</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">Serial: <span style="${hi}">${p.serialNo}</span></td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Lessee Name &amp; Address</td>
        <td colspan="3" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.lesseeNameAddress}</td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">District</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.districtName}</td>
      </tr>
      <tr>
        <td colspan="4" rowspan="3" style="${val} border:0.5px solid #f8bbd0;padding:3px 4px;vertical-align:top;font-size:6.2pt;">${p.lesseeFullAddress}</td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Taluk</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.talukName}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Village</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.village}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">SF.No / Extent</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.sfNoExtent}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Mineral: ${p.mineralName}</td>
        <td colspan="3" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">Bulk Permit No: ${p.bulkPermitNo}</td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Classification</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.classification}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Order Ref</td>
        <td colspan="3" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.orderRef || ''}</td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Lease Period</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.leasePeriod}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Dispatch Slip No</td>
        <td colspan="3" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.dispatchSlipNo}</span></td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Within TN</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.withinTamilNadu}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Delivered To</td>
        <td colspan="5" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.deliveredTo}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Vehicle No</td>
        <td colspan="3" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.vehicleNo}</span></td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Destination</td>
        <td rowspan="2" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;vertical-align:top;font-size:6.2pt;">${p.destinationAddress}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Vehicle Type</td>
        <td colspan="3" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.vehicleType}</td>
        <td style="border:0.5px solid #f8bbd0;"></td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Total Distance (Km)</td>
        <td colspan="5" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.totalDistance}</td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Travelling Date</td>
        <td colspan="5" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.travellingDate}</span></td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Required Time</td>
        <td colspan="5" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.requiredTime}</span></td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Quantity (MT)</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.quantity}</span></td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Driver Name</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.driverName}</span></td>
        <td colspan="2" style="border:0.5px solid #f8bbd0;"></td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Driver License No</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.driverLicenseNo}</span></td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Via</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;">${p.via}</td>
        <td colspan="2" style="border:0.5px solid #f8bbd0;"></td>
      </tr>
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Driver Phone No</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.driverPhone}</span></td>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;">Auth. Person</td>
        <td colspan="3" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;"><span style="${hi}">${p.authorizedPersonName}</span></td>
      </tr>
      <!-- Signature row -->
      <tr>
        <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;height:36px;vertical-align:bottom;">Driver Signature:</td>
        <td style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;vertical-align:bottom;"></td>
        <td colspan="2" style="${lbl} border:0.5px solid #f8bbd0;padding:2px 4px;vertical-align:bottom;">
          Signature of AD / DD:<br>${adddSig}
        </td>
        <td colspan="2" style="${val} border:0.5px solid #f8bbd0;padding:2px 4px;vertical-align:bottom;">
          Lessee / Auth. Person:<br>${authorizedSig}
        </td>
      </tr>
    </table>
  </div>`;
}

// ─────────────────────────────────────────────────────
// Duplicate Half — compact summary
// ─────────────────────────────────────────────────────

function renderDuplicateSummary(p) {
  const lbl = `font-weight:bold;color:#555;background:rgba(252,228,236,0.4);`;
  const val = `background:rgba(255,255,255,0.75);`;
  const hi  = `background:#e8f5e9;padding:0 3px;border-radius:2px;font-weight:bold;`;

  const fields = [
    ['Dispatch Slip No',           `<span style="${hi}">${p.dispatchSlipNo}</span>`],
    ['Serial No',                  `<span style="${hi}">${p.serialNo}</span>`],
    ['Vehicle No',                 `<span style="${hi}">${p.vehicleNo}</span>`],
    ['Driver Name',                p.driverName],
    ['Driver License No',          `<span style="${hi}">${p.driverLicenseNo}</span>`],
    ['Driver Phone No',            `<span style="${hi}">${p.driverPhone}</span>`],
    ['Mineral',                    p.mineralName],
    ['Quantity (MT)',              `<span style="${hi}">${p.quantity}</span>`],
    ['Dispatch Date &amp; Time',   p.dispatchDateTime],
    ['Bulk Permit No',             p.bulkPermitNo],
    ['Destination',                p.destinationAddress],
    ['Lessee / Authorized Person', p.lesseeNameAddress],
  ];

  const rows = fields.map(([label, value]) => `
    <tr>
      <td style="${lbl} border:0.5px solid #f8bbd0;padding:2px 8px;width:36%;">${label}:</td>
      <td style="${val} border:0.5px solid #f8bbd0;padding:2px 8px;">${value}</td>
    </tr>`).join('');

  return `
  <div style="padding:4px 12px;font-size:7pt;font-family:Arial,sans-serif;">
    <table style="width:100%;border-collapse:collapse;font-size:7pt;">${rows}</table>
  </div>`;
}

// ─────────────────────────────────────────────────────
// Royalty (Security Background) Page
// ─────────────────────────────────────────────────────

/**
 * Render a full A4 royalty page with:
 *  – Pink security border frame (bars + side strips + outer line)
 *  – Guilloche rosette SVG watermark on each half
 *  – Original section (top) with full permit form
 *  – Duplicate section (bottom) with compact summary
 */
export function renderRoyaltyPage(p, qrDataUrl) {
  const sigs = getSignatures();
  const page = document.createElement('div');
  page.className = 'permit-royalty-page';
  page.setAttribute('data-permit-id', p.serialNo);

  page.innerHTML = `
    <!-- ── Pink frame components ── -->
    <div class="prp-bar-top"></div>
    <div class="prp-bar-bottom"></div>
    <div class="prp-strip-left"></div>
    <div class="prp-strip-right"></div>
    <div class="prp-border-line"></div>

    <!-- ── Content area (inside strips) ── -->
    <div class="prp-content">

      <!-- ===== ORIGINAL HALF (top) ===== -->
      <div class="prp-half">
        <div class="prp-watermark">${guillocheRosetteSVG()}</div>
        <div class="prp-half-content">
          ${renderSectionHeader(p.serialNo, 'Original')}
          ${renderPermitFormCompact(p, qrDataUrl, sigs)}
        </div>
      </div>

      <!-- ── Dashed divider ── -->
      <div class="prp-divider"></div>

      <!-- ===== DUPLICATE HALF (bottom) ===== -->
      <div class="prp-half">
        <div class="prp-watermark">${guillocheRosetteSVG()}</div>
        <div class="prp-half-content">
          ${renderSectionHeader(p.serialNo, 'Duplicate')}
          ${renderDuplicateSummary(p)}
        </div>
      </div>

    </div>
  `;

  return page;
}

// ─────────────────────────────────────────────────────
// Instruction (Terms & Conditions) Page
// ─────────────────────────────────────────────────────

/**
 * Render a full A4 Terms & Conditions page.
 * Mirrored in two halves (Original + Duplicate) matching the physical form.
 */
export function renderInstructionPage(p) {
  const termsHTML = `
    <p class="instr-title">Terms and Conditions:</p>
    <ul class="instr-list">
      <li>Copy of the bulk transport permit and dispatch slip should be kept in the mine.</li>
      <li>Xerox copies of the dispatch slip should not be used.</li>
      <li>Driver of the vehicle should have the copy of the bulk permit slip and dispatch slip
          for the mineral transported in the vehicle.</li>
      <li>The dispatch slip should be shown to all authorized officers when checking the
          vehicle transporting the mineral.</li>
    </ul>`;

  const page = document.createElement('div');
  page.className = 'permit-instruction-page';
  page.setAttribute('data-permit-instruction-id', p.serialNo);

  page.innerHTML = `
    <div class="instr-half">${termsHTML}</div>
    <div class="instr-divider"></div>
    <div class="instr-half">${termsHTML}</div>
  `;

  return page;
}

// ─────────────────────────────────────────────────────
// Render All Permits (called by generatePermits.js)
// ─────────────────────────────────────────────────────

/**
 * For each permit in the array, appends a Royalty Page followed by
 * an Instruction Page into the given container element.
 *
 * @param {object[]} permits — array of permit data objects
 * @param {HTMLElement} container — DOM element to render into
 */
export async function renderAllPermits(permits, container) {
  container.innerHTML = '';

  for (let i = 0; i < permits.length; i++) {
    const p      = permits[i];
    const qrText = buildQRData(p);
    const qrUrl  = await generateQRDataURL(qrText);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom:40px;';

    // ── Preview badge ──
    const badge = document.createElement('div');
    badge.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;';
    badge.innerHTML = `
      <span style="background:#1a237e;color:white;padding:4px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;">
        Permit #${i + 1} of ${permits.length}
      </span>
      <span style="font-size:0.78rem;color:#666;">
        Serial: ${p.serialNo} | Vehicle: ${p.vehicleNo} | ${p.dispatchDateTime}
      </span>`;

    // ── Royalty page ──
    const royaltyPage = renderRoyaltyPage(p, qrUrl);

    // ── Page label ──
    const instrLabel = document.createElement('div');
    instrLabel.style.cssText = 'font-size:0.72rem;color:#999;margin:10px 0 6px;padding-left:4px;';
    instrLabel.textContent = '📄 Terms & Conditions page:';

    // ── Instruction page ──
    const instrPage = renderInstructionPage(p);

    wrapper.appendChild(badge);
    wrapper.appendChild(royaltyPage);
    wrapper.appendChild(instrLabel);
    wrapper.appendChild(instrPage);
    container.appendChild(wrapper);
  }
}

// ─────────────────────────────────────────────────────
// Backward-compatible export (used by older call sites)
// ─────────────────────────────────────────────────────

/** @deprecated — use renderRoyaltyPage + renderInstructionPage instead */
export function renderPermit(p, qrDataUrl) {
  return renderRoyaltyPage(p, qrDataUrl);
}

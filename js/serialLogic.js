// =====================================================
// serialLogic.js — Serial number & dispatch slip increment
// =====================================================

/**
 * Increment a serial number like "TN06911024"
 * Splits into alpha-prefix and numeric suffix, increments numeric part,
 * zero-pads back to original length.
 *
 * Example: TN06911024 → TN06911025 → TN06911026
 */
export function incrementSerial(base, steps = 1) {
  // Find where the trailing numeric portion starts
  const match = base.match(/^(.*?)(\d+)$/);
  if (!match) return base.toUpperCase(); // no numeric part found, return uppercased

  const prefix = match[1].toUpperCase(); // e.g. "TN069"
  const numStr = match[2];              // e.g. "11024"
  const width = numStr.length;          // e.g. 5

  const newNum = parseInt(numStr, 10) + steps;
  const newNumStr = String(newNum).padStart(width, '0');

  return prefix + newNumStr;
}

/**
 * Get serial number for permit index i (0-based)
 */
export function getSerialNo(base, index) {
  return incrementSerial(base, index);
}

/**
 * Increment dispatch slip number like "DISP000006963032"
 * Prefix = "DISP", numeric portion zero-padded to 12 digits
 *
 * Example: DISP000006963032 → DISP000006963033
 */
export function incrementDispatchSlip(base, steps = 1) {
  // Find prefix (non-digit) and numeric suffix
  const match = base.match(/^([A-Za-z]*)(\d+)$/);
  if (!match) return base.toUpperCase();

  const prefix = match[1].toUpperCase(); // e.g. "DISP"
  const numStr = match[2];               // e.g. "000006963032"
  const width = numStr.length;           // e.g. 12

  const newNum = BigInt(numStr) + BigInt(steps);
  const newNumStr = String(newNum).padStart(width, '0');

  return prefix + newNumStr;
}

/**
 * Get dispatch slip number for permit index i (0-based)
 */
export function getDispatchSlipNo(base, index) {
  return incrementDispatchSlip(base, index);
}

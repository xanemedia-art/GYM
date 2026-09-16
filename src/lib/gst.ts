export interface GstCalculationResult {
  basePrice: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export const GYM_HSN_SAC_CODE = "999723"; // Gymnastic and physical fitness services

/**
 * Calculates GST breakdown for fitness memberships in India.
 * Default is intra-state (CGST 9% + SGST 9% = 18%).
 * If isInterState is true, calculates IGST 18%.
 */
export function calculateGst(
  basePrice: number,
  discountAmount: number = 0,
  gstRatePercentage: number = 18,
  isInterState: boolean = false
): GstCalculationResult {
  const taxableAmount = Math.max(0, Number((basePrice - discountAmount).toFixed(2)));

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstAmount = Number(((taxableAmount * gstRatePercentage) / 100).toFixed(2));
  } else {
    const halfRate = gstRatePercentage / 2;
    cgstAmount = Number(((taxableAmount * halfRate) / 100).toFixed(2));
    sgstAmount = Number(((taxableAmount * halfRate) / 100).toFixed(2));
  }

  const totalAmount = Number((taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));

  return {
    basePrice,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
  };
}

/**
 * Returns Indian Financial Year string for a given date.
 * E.g., Date in Sep 2026 -> "26-27" (Apr 2026 to Mar 2027)
 * E.g., Date in Feb 2026 -> "25-26" (Apr 2025 to Mar 2026)
 */
export function getIndianFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
  const year = date.getFullYear();

  if (month >= 3) {
    // April to December
    const startYear = String(year).slice(-2);
    const endYear = String(year + 1).slice(-2);
    return `${startYear}-${endYear}`;
  } else {
    // January to March
    const startYear = String(year - 1).slice(-2);
    const endYear = String(year).slice(-2);
    return `${startYear}-${endYear}`;
  }
}

/**
 * Formats a sequential invoice number per statutory GST requirements.
 * E.g. generateInvoiceNumber("INV", "24-25", 1) -> "INV/24-25/0001"
 */
export function formatInvoiceNumber(prefix: string, fy: string, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(4, "0");
  return `${prefix}/${fy}/${padded}`;
}

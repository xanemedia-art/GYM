import QRCode from "qrcode";

export interface UpiPaymentParams {
  pa: string; // Payee VPA (e.g. befreefitness@icici)
  pn: string; // Payee Name (e.g. Be Free Fitness)
  am?: number | string; // Amount in INR
  cu?: string; // Currency, defaults to INR
  tn?: string; // Note / Transaction description
}

/**
 * Builds standard NPCI-compliant UPI payment deep-link URI
 */
export function buildUpiUri(params: UpiPaymentParams): string {
  const vpa = params.pa.trim();
  const name = params.pn.trim();
  const currency = params.cu || "INR";
  
  let uri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&cu=${currency}`;
  
  if (params.am !== undefined && Number(params.am) > 0) {
    const formattedAmount = Number(params.am).toFixed(2);
    uri += `&am=${formattedAmount}`;
  }

  if (params.tn) {
    uri += `&tn=${encodeURIComponent(params.tn.slice(0, 50))}`;
  }

  return uri;
}

/**
 * Generates Base64 Data URL for QR code (PNG)
 */
export async function generateQrDataUrl(text: string, width = 300): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 1.5,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff",
    },
  });
}

import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

/**
 * Generate a QR code as Data URL (PNG)
 */
export async function generateQrDataUrl(text: string, options: { width?: number; margin?: number; darkColor?: string; lightColor?: string } = {}): Promise<string> {
  try {
    const url = await QRCode.toDataURL(text || 'EMP-ID', {
      width: options.width || 200,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return url;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Generate a Barcode (Code128) as Data URL (PNG)
 */
export function generateBarcodeDataUrl(text: string, options: { width?: number; height?: number; displayValue?: boolean; fontSize?: number; lineColor?: string } = {}): string {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text || 'SAT0000', {
      format: 'CODE128',
      width: options.width || 1.8,
      height: options.height || 36,
      displayValue: options.displayValue !== undefined ? options.displayValue : false,
      fontSize: options.fontSize || 10,
      margin: 0,
      lineColor: options.lineColor || '#000000',
      background: 'transparent',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error generating Barcode:', err);
    return '';
  }
}

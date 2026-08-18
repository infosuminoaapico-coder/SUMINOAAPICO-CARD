/**
 * Image Utilities for ID Card Studio
 * Handles URL normalization, Google Drive direct link conversion, and caching
 */

export const DEFAULT_LOGO_URL = 'https://lh3.googleusercontent.com/d/1X6luiQjo_b3hIDTbldt0VPvOQWdwxtpO';

/**
 * Converts Google Drive sharing links to direct fast CDN image URLs (CORS enabled)
 * Example: https://drive.google.com/file/d/1X6luiQjo_b3hIDTbldt0VPvOQWdwxtpO/view?usp=sharing
 * -> https://lh3.googleusercontent.com/d/1X6luiQjo_b3hIDTbldt0VPvOQWdwxtpO
 */
export function resolveImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Google Drive match patterns
  // Pattern 1: /file/d/FILE_ID/
  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Pattern 2: id=FILE_ID
  const idMatch = trimmed.match(/drive\.google\.com\/(?:uc\?|open\?|thumbnail\?).*id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return trimmed;
}

/**
 * Formats an employee's English name to a single line with standard abbreviation (Mr. / Ms.)
 */
export function formatEmployeeEnglishName(nameEn?: string, thaiName?: string): string {
  if (!nameEn || !nameEn.trim()) {
    if (thaiName) {
      if (thaiName.startsWith('นาย')) {
        return `Mr. ${thaiName.replace(/^นาย\s*/, '')}`;
      }
      if (thaiName.startsWith('นางสาว') || thaiName.startsWith('น.ส.') || thaiName.startsWith('นาง')) {
        return `Ms. ${thaiName.replace(/^(?:นางสาว|น\.ส\.|นาง)\s*/, '')}`;
      }
    }
    return '';
  }

  let formatted = nameEn.trim();

  // Normalize Miss / Mrs -> Ms.
  formatted = formatted.replace(/^Miss\s+/i, 'Ms. ');
  formatted = formatted.replace(/^Mrs\.\s*/i, 'Ms. ');

  // Ensure Mr. and Ms. have standard spacing
  formatted = formatted.replace(/^Mr\.([A-Za-z])/i, 'Mr. $1');
  formatted = formatted.replace(/^Ms\.([A-Za-z])/i, 'Ms. $1');

  // If starts with Mr / Ms without dot
  formatted = formatted.replace(/^Mr\s+/i, 'Mr. ');
  formatted = formatted.replace(/^Ms\s+/i, 'Ms. ');

  // If no prefix at all and Thai name has one
  if (!/^M[rs]\.\s/i.test(formatted) && thaiName) {
    if (thaiName.startsWith('นาย')) {
      formatted = `Mr. ${formatted}`;
    } else if (thaiName.startsWith('นางสาว') || thaiName.startsWith('น.ส.') || thaiName.startsWith('นาง')) {
      formatted = `Ms. ${formatted}`;
    }
  }

  return formatted;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats an employee's start date into standard "DD/Mon/YYYY" (e.g. 20/Jan/2014)
 */
export function formatEmployeeStartDate(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // If already in DD/Mon/YYYY format (e.g. 20/Jan/2014)
  const alreadyMatch = trimmed.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})$/);
  if (alreadyMatch) {
    const day = alreadyMatch[1].padStart(2, '0');
    const mon = alreadyMatch[2].charAt(0).toUpperCase() + alreadyMatch[2].slice(1, 3).toLowerCase();
    const yr = alreadyMatch[3];
    return `${day}/${mon}/${yr}`;
  }

  // Check DD-Mon-YYYY, DD Mon YYYY, DD/Mon/YY
  const textMonMatch = trimmed.match(/^(\d{1,2})[\s\-\/\.]([A-Za-z]{3,10})[\s\-\/\.](\d{2,4})$/);
  if (textMonMatch) {
    const day = textMonMatch[1].padStart(2, '0');
    const monStr = textMonMatch[2].toLowerCase();
    let yr = parseInt(textMonMatch[3], 10);
    if (yr < 100) yr += 2000;
    if (yr > 2400) yr -= 543;

    const engIdx = MONTHS_SHORT.findIndex(m => m.toLowerCase() === monStr.slice(0, 3));
    if (engIdx !== -1) {
      return `${day}/${MONTHS_SHORT[engIdx]}/${yr}`;
    }
  }

  // Check ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (isoMatch) {
    let yr = parseInt(isoMatch[1], 10);
    if (yr > 2400) yr -= 543;
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    if (month >= 0 && month < 12) {
      return `${day}/${MONTHS_SHORT[month]}/${yr}`;
    }
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    let yr = parseInt(dmyMatch[3], 10);
    if (yr < 100) yr += 2000;
    if (yr > 2400) yr -= 543;

    let day = p1;
    let month = p2 - 1;

    // If p1 <= 12 and p2 > 12, it's likely MM/DD/YYYY
    if (p1 <= 12 && p2 > 12) {
      day = p2;
      month = p1 - 1;
    }

    if (month >= 0 && month < 12) {
      return `${String(day).padStart(2, '0')}/${MONTHS_SHORT[month]}/${yr}`;
    }
  }

  // Try Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = MONTHS_SHORT[parsed.getMonth()];
    let yr = parsed.getFullYear();
    if (yr > 2400) yr -= 543;
    return `${day}/${month}/${yr}`;
  }

  return trimmed;
}

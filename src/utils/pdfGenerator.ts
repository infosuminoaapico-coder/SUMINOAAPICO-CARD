import jsPDF from 'jspdf';
import { CardTemplate, Employee, PrintSettings } from '../types';
import { generateBarcodeDataUrl, generateQrDataUrl } from './barcodeUtils';
import { resolveImageUrl, formatEmployeeEnglishName, formatEmployeeStartDate, DEFAULT_LOGO_URL } from './imageUtils';

/**
 * Render single card to high-res offscreen canvas
 */
export async function renderCardToCanvas(
  employee: Employee,
  template: CardTemplate,
  side: 'front' | 'back',
  scale = 4 // 4x for crystal clear 300+ DPI print quality
): Promise<HTMLCanvasElement> {
  const widthMm = template.cardWidthMm || 85;
  const heightMm = template.cardHeightMm || 55;
  const mmToPx = 3.7795275591 * scale; // 1mm = 3.7795px at 96dpi * scale

  const widthPx = Math.round(widthMm * mmToPx);
  const heightPx = Math.round(heightMm * mmToPx);

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  const bg = side === 'front' ? template.frontBackground : template.backBackground;
  
  if (bg.type === 'color') {
    ctx.fillStyle = bg.value || '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);
  } else if (bg.type === 'gradient') {
    // Parse simple linear gradient or draw default stylish gradient
    if (bg.value.includes('linear-gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, widthPx, heightPx);
      if (side === 'front') {
        if (template.category === 'permanent') {
          gradient.addColorStop(0, '#0f172a');
          gradient.addColorStop(0.35, '#1e3a8a');
          gradient.addColorStop(0.36, '#ffffff');
          gradient.addColorStop(1, '#ffffff');
        } else if (template.category === 'contractor') {
          gradient.addColorStop(0, '#ea580c');
          gradient.addColorStop(0.18, '#ea580c');
          gradient.addColorStop(0.19, '#ffffff');
          gradient.addColorStop(1, '#ffffff');
        } else if (template.category === 'visitor') {
          gradient.addColorStop(0, '#059669');
          gradient.addColorStop(0.2, '#10b981');
          gradient.addColorStop(0.21, '#ffffff');
          gradient.addColorStop(1, '#ffffff');
        } else {
          gradient.addColorStop(0, '#111827');
          gradient.addColorStop(1, '#1e293b');
        }
      } else {
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(0.18, '#0f172a');
        gradient.addColorStop(0.19, '#f8fafc');
        gradient.addColorStop(1, '#ffffff');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, widthPx, heightPx);
    } else {
      ctx.fillStyle = bg.value || '#ffffff';
      ctx.fillRect(0, 0, widthPx, heightPx);
    }
  }

  // If custom background image uploaded
  if (bg.imageUrl) {
    try {
      const bgImg = await loadImage(bg.imageUrl);
      ctx.drawImage(bgImg, 0, 0, widthPx, heightPx);
    } catch (e) {
      console.error('Failed to load custom background image', e);
    }
  }

  // Draw Card Elements
  const elements = template.elements
    .filter(el => el.side === side && el.visible)
    .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

  for (const el of elements) {
    const x = el.xMm * mmToPx;
    const y = el.yMm * mmToPx;
    const w = el.widthMm * mmToPx;
    const h = el.heightMm * mmToPx;

    ctx.save();
    if (el.opacity !== undefined) {
      ctx.globalAlpha = el.opacity;
    }

    if (el.type === 'shape') {
      if (el.shapeType === 'rectangle' || !el.shapeType) {
        if (el.backgroundColor) {
          ctx.fillStyle = el.backgroundColor;
          const radius = (el.borderRadiusMm || 0) * mmToPx;
          if (radius > 0) {
            drawRoundedRect(ctx, x, y, w, h, radius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, w, h);
          }
        }
        if (el.borderColor && el.borderWidthMm) {
          ctx.strokeStyle = el.borderColor;
          ctx.lineWidth = el.borderWidthMm * mmToPx;
          const radius = (el.borderRadiusMm || 0) * mmToPx;
          if (radius > 0) {
            drawRoundedRect(ctx, x, y, w, h, radius);
            ctx.stroke();
          } else {
            ctx.strokeRect(x, y, w, h);
          }
        }
      } else if (el.shapeType === 'line') {
        ctx.strokeStyle = el.backgroundColor || el.borderColor || '#cbd5e1';
        ctx.lineWidth = Math.max(1, (el.heightMm || 0.3) * mmToPx);
        ctx.beginPath();
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();
      }
    } else if (el.type === 'badge') {
      ctx.fillStyle = el.backgroundColor || '#1e3a8a';
      const radius = (el.borderRadiusMm || 1) * mmToPx;
      drawRoundedRect(ctx, x, y, w, h, radius);
      ctx.fill();
    } else if (el.type === 'logo') {
      const logoUrl = resolveImageUrl(el.imageUrl || template.logoUrl || DEFAULT_LOGO_URL);
      if (el.backgroundColor) {
        ctx.fillStyle = el.backgroundColor;
        const radius = (el.borderRadiusMm || 0) * mmToPx;
        if (radius > 0) {
          drawRoundedRect(ctx, x, y, w, h, radius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, w, h);
        }
      }
      if (logoUrl) {
        try {
          const logoImg = await loadImage(logoUrl);
          const imgAspect = logoImg.width / logoImg.height;
          const boxAspect = w / h;
          let drawW = w;
          let drawH = h;
          let drawX = x;
          let drawY = y;
          if (imgAspect > boxAspect) {
            drawW = w;
            drawH = w / imgAspect;
            drawY = y + (h - drawH) / 2;
          } else {
            drawH = h;
            drawW = h * imgAspect;
            drawX = x + (w - drawW) / 2;
          }
          ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
        } catch (e) {
          console.warn('Failed to load logo in PDF rendering', e);
        }
      }
    } else if (el.type === 'photo') {
      // Draw employee photo
      const radius = (el.borderRadiusMm || 0) * mmToPx;
      ctx.save();
      if (radius > 0) {
        drawRoundedRect(ctx, x, y, w, h, radius);
        ctx.clip();
      }
      
      // Clean white background for ID card photo
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);

      const resolvedPhotoUrl = resolveImageUrl(employee.photoUrl);
      if (resolvedPhotoUrl) {
        try {
          const img = await loadSafeImage(resolvedPhotoUrl);
          if (img && img.width > 0 && img.height > 0) {
            // Crop with aspect-ratio cover, centered horizontally and zoomed focusing down to level below chest pockets
            const imgAspect = img.width / img.height;
            const boxAspect = w / h; // ID card photo ratio (~0.738)
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

            if (imgAspect >= boxAspect) {
              // Image is wider/square relative to box:
              // Crop sides symmetrically (50% horizontal center), focus from top of head (small headroom) to under chest pockets
              sHeight = img.height * 0.94;
              sWidth = sHeight * boxAspect;
              if (sWidth > img.width) {
                sWidth = img.width;
                sHeight = sWidth / boxAspect;
              }
              sx = (img.width - sWidth) / 2;
              sy = Math.max(0, img.height * 0.02); // 2% headroom
            } else {
              // Image is taller portrait:
              // Focus on head down to below chest pockets
              sWidth = img.width * 0.94;
              sHeight = sWidth / boxAspect;
              sx = (img.width - sWidth) / 2;
              sy = Math.max(0, (img.height - sHeight) * 0.08);
            }
            ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
          } else {
            drawSilhouette(ctx, x, y, w, h);
          }
        } catch (e) {
          console.warn(`PDF Canvas photo render error for ${employee.empId}:`, e);
          // Draw clean vector silhouette icon on error
          drawSilhouette(ctx, x, y, w, h);
        }
      } else {
        drawSilhouette(ctx, x, y, w, h);
      }
      ctx.restore();

      if (el.borderColor && el.borderWidthMm) {
        ctx.strokeStyle = el.borderColor;
        ctx.lineWidth = el.borderWidthMm * mmToPx;
        if (radius > 0) {
          drawRoundedRect(ctx, x, y, w, h, radius);
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, w, h);
        }
      }
    } else if (el.type === 'qrcode') {
      const qrText = employee.qrValue || `https://verify.company.co.th/emp/${employee.empId}`;
      const qrDataUrl = await generateQrDataUrl(qrText, { width: Math.round(w) });
      if (qrDataUrl) {
        const qrImg = await loadImage(qrDataUrl);
        ctx.drawImage(qrImg, x, y, w, h);
      }
    } else if (el.type === 'barcode') {
      const barcodeText = employee.barcodeValue || employee.empId;
      const barDataUrl = generateBarcodeDataUrl(barcodeText, { width: 2, height: Math.round(h * 0.8) });
      if (barDataUrl) {
        const barImg = await loadImage(barDataUrl);
        ctx.drawImage(barImg, x, y, w, h);
      }
    } else if (el.type === 'text' || el.type === 'field') {
      const isNameEn = el.type === 'field' && el.fieldKey === 'nameEn';
      const isStartDate = el.type === 'field' && el.fieldKey === 'startDate';
      const hasFieldLabel = el.type === 'field' && !!el.label && !isNameEn;

      if (hasFieldLabel) {
        const labelText = el.label || '';
        let valText = String(employee[el.fieldKey as keyof Employee] || '');
        if (isStartDate) {
          valText = formatEmployeeStartDate(employee.startDate);
        }
        const labelWidthMm = el.labelWidthMm || (labelText.length <= 6 ? 12.5 : labelText.length * 2.2);
        const labelW = labelWidthMm * mmToPx;

        ctx.fillStyle = el.color || '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        let effectivePt = el.fontSizePt || 8.5;
        const combinedLen = labelText.length + valText.length;
        if (combinedLen > 32) {
          effectivePt = Math.max(7.0, effectivePt * 0.82);
        } else if (combinedLen > 26) {
          effectivePt = Math.max(7.6, effectivePt * 0.90);
        }

        const ptToPx = effectivePt * (scale * 1.3333);
        const labelFontWt = 'bold ';
        const valFontWt = el.fontWeight === 'bold' ? 'bold ' : el.fontWeight === '600' ? '600 ' : 'bold ';

        // 1. Draw Label aligned to Left at X
        ctx.font = `${labelFontWt}${ptToPx}px 'Sarabun', 'Prompt', 'Noto Sans Thai', sans-serif`;
        ctx.fillText(labelText, x, y);

        // 2. Draw Value aligned to Left
        let valX = x + labelW;
        if (isStartDate) {
          const labelWidth = ctx.measureText(labelText).width;
          const spaceWidth = ctx.measureText(' ').width;
          valX = x + labelWidth + (spaceWidth * 5);
        }

        ctx.font = `${valFontWt}${ptToPx}px 'Sarabun', 'Prompt', 'Noto Sans Thai', sans-serif`;
        ctx.fillText(valText, valX, y);
      } else {
        let textToDraw = '';

        if (isNameEn) {
          const formattedEn = formatEmployeeEnglishName(employee.nameEn, employee.name);
          textToDraw = el.label ? `${el.label} ${formattedEn}` : formattedEn;
        } else if (el.type === 'field' && el.fieldKey) {
          if (isStartDate) {
            textToDraw = formatEmployeeStartDate(employee.startDate);
          } else {
            const val = employee[el.fieldKey as keyof Employee];
            textToDraw = `${val || ''}`;
          }
        } else if (el.staticText) {
          const formattedEn = formatEmployeeEnglishName(employee.nameEn, employee.name);
          const formattedStart = formatEmployeeStartDate(employee.startDate);
          // Substitute template tags like {bloodType}, {startDate}
          textToDraw = el.staticText
            .replace('{empId}', employee.empId || '')
            .replace('{name}', employee.name || '')
            .replace('{nameEn}', formattedEn || '')
            .replace('{bloodType}', employee.bloodType || 'O')
            .replace('{startDate}', formattedStart || '')
            .replace('{department}', employee.department || '')
            .replace('{division}', employee.division || '')
            .replace('{position}', employee.position || '');
        }

        ctx.fillStyle = el.color || '#000000';
        let effectivePt = el.fontSizePt || 8;
        if (isNameEn && textToDraw) {
          const charCount = textToDraw.length;
          if (charCount > 34) {
            effectivePt = Math.max(6.8, effectivePt * 0.68);
          } else if (charCount > 28) {
            effectivePt = Math.max(7.6, effectivePt * 0.76);
          } else if (charCount > 22) {
            effectivePt = Math.max(8.5, effectivePt * 0.85);
          }
        } else if (el.id?.includes('company')) {
          if (textToDraw.length > 36) {
            effectivePt = Math.min(effectivePt, 7.2);
          }
        } else if (el.id?.includes('address')) {
          if (textToDraw.length > 70) {
            effectivePt = Math.min(effectivePt, 4.4);
          }
        }

        let ptToPx = effectivePt * (scale * 1.3333);
        const fontWt = el.fontWeight === 'bold' ? 'bold ' : el.fontWeight === '600' ? '600 ' : '';
        ctx.font = `${fontWt}${ptToPx}px 'Sarabun', 'Prompt', 'Noto Sans Thai', sans-serif`;

        // Check if single-line text exceeds width w and auto-scale if necessary
        const measured = ctx.measureText(textToDraw).width;
        if (measured > w && w > 0 && !textToDraw.includes('\n')) {
          const shrinkFactor = (w * 0.98) / measured;
          effectivePt = effectivePt * shrinkFactor;
          ptToPx = effectivePt * (scale * 1.3333);
          ctx.font = `${fontWt}${ptToPx}px 'Sarabun', 'Prompt', 'Noto Sans Thai', sans-serif`;
        }

        ctx.textBaseline = 'top';

        const lines = textToDraw.split('\n');
        const lineH = ptToPx * (el.lineHeight || 1.3);

        lines.forEach((line, lineIdx) => {
          let textX = x;
          if (el.textAlign === 'center') {
            textX = x + w / 2;
            ctx.textAlign = 'center';
          } else if (el.textAlign === 'right') {
            textX = x + w;
            ctx.textAlign = 'right';
          } else {
            ctx.textAlign = 'left';
          }
          ctx.fillText(line, textX, y + lineIdx * lineH);
        });
      }
    }

    ctx.restore();
  }

  return canvas;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#94a3b8';
  // Head
  const headR = Math.min(w, h) * 0.22;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.38, headR, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.95, w * 0.45, Math.PI, 0);
  ctx.fill();
}

function loadSafeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src || typeof src !== 'string') {
      reject(new Error('Empty or invalid image source'));
      return;
    }

    const resolved = resolveImageUrl(src);
    const img = new Image();

    // For data or blob URLs, no CORS header needed
    if (!resolved.startsWith('data:') && !resolved.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const timeout = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error('Image load timeout: ' + resolved.substring(0, 60)));
    }, 12000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };

    img.onerror = async () => {
      clearTimeout(timeout);
      // Fallback: If external URL CORS failed, try fetching as blob and converting to data URL
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
        try {
          const response = await fetch(resolved, { mode: 'cors' });
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const fallbackImg = new Image();
              fallbackImg.onload = () => resolve(fallbackImg);
              fallbackImg.onerror = (err) => reject(err);
              fallbackImg.src = dataUrl;
            };
            reader.readAsDataURL(blob);
            return;
          }
        } catch (fetchErr) {
          // fetch also failed
        }
      }
      reject(new Error('Failed to load image: ' + resolved.substring(0, 60)));
    };

    img.src = resolved;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return loadSafeImage(src);
}

/**
 * Generate PDF Document for A3 / A4 printing with 100% front-back duplex alignment
 */
export async function generateDuplexPrintPdf(
  employees: Employee[],
  template: CardTemplate,
  settings: PrintSettings,
  onProgress?: (progress: number, statusText: string) => void
): Promise<jsPDF> {
  // A3 dimensions: Landscape 420mm x 297mm
  const isA3 = settings.paperSize === 'A3';
  const isLandscape = settings.paperOrientation === 'landscape';

  const pageWidth = isA3 ? (isLandscape ? 420 : 297) : (isLandscape ? 297 : 210);
  const pageHeight = isA3 ? (isLandscape ? 297 : 420) : (isLandscape ? 210 : 297);

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: settings.paperSize.toLowerCase() as 'a3' | 'a4',
    compress: true,
  });

  const cols = settings.columns;
  const rows = settings.rows;
  const cardsPerPage = cols * rows;
  
  // Proportional card dimensions ensuring 100% fitting within sheet boundaries & safety margins
  const maxSafeGridW = pageWidth - 14; // 7mm safety margin each side for registration marks
  const maxSafeGridH = pageHeight - 16; // 8mm safety margin each side
  const cardAspect = (template.cardWidthMm || 85) / (template.cardHeightMm || 55);

  let cardW = settings.cardWidthMm || 85;
  let cardH = settings.cardHeightMm || 55;
  const gapX = settings.horizontalGapMm || 0;
  const gapY = settings.verticalGapMm || 0;

  // Auto-fit if requested card dimensions would overflow paper (e.g. 5x5 of 85mm on 420mm A3)
  if (cols * cardW + (cols - 1) * gapX > maxSafeGridW || rows * cardH + (rows - 1) * gapY > maxSafeGridH) {
    const fitW = (maxSafeGridW - (cols - 1) * gapX) / cols;
    const fitH = fitW / cardAspect;
    if (fitH * rows + (rows - 1) * gapY > maxSafeGridH) {
      cardH = (maxSafeGridH - (rows - 1) * gapY) / rows;
      cardW = cardH * cardAspect;
    } else {
      cardW = fitW;
      cardH = fitH;
    }
  }

  const totalGridW = cols * cardW + (cols - 1) * gapX;
  const totalGridH = rows * cardH + (rows - 1) * gapY;

  const originX = settings.autoCenter ? (pageWidth - totalGridW) / 2 : settings.marginLeftMm;
  const originY = settings.autoCenter ? (pageHeight - totalGridH) / 2 : settings.marginTopMm;

  const totalSheets = Math.ceil(employees.length / cardsPerPage);

  for (let sheetIdx = 0; sheetIdx < totalSheets; sheetIdx++) {
    const sheetEmployees = employees.slice(sheetIdx * cardsPerPage, (sheetIdx + 1) * cardsPerPage);

    // ==========================================
    // 1. FRONT SIDE PAGE
    // ==========================================
    if (sheetIdx > 0 || doc.getNumberOfPages() > 1) {
      doc.addPage(settings.paperSize.toLowerCase() as 'a3' | 'a4', isLandscape ? 'landscape' : 'portrait');
    }

    if (onProgress) {
      onProgress(
        Math.round(((sheetIdx * 2 + 0.5) / (totalSheets * 2)) * 100),
        `กำลังสร้างหน้าด้านหน้า (แผ่นที่ ${sheetIdx + 1}/${totalSheets})...`
      );
    }

    // Draw Front Registration Marks
    if (settings.registrationMarks) {
      drawPdfRegistrationMarks(doc, pageWidth, pageHeight);
    }

    // Render Front Cards
    for (let i = 0; i < sheetEmployees.length; i++) {
      const emp = sheetEmployees[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const posX = originX + col * (cardW + gapX) + (settings.frontOffsetX || 0);
      const posY = originY + row * (cardH + gapY) + (settings.frontOffsetY || 0);

      // Render card canvas
      const canvas = await renderCardToCanvas(emp, template, 'front', 3);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', posX, posY, cardW, cardH);

      // Crop ticks / card borders
      if (settings.showCardBorders) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(posX, posY, cardW, cardH);
      }
      if (settings.cropMarks) {
        drawCropMarks(doc, posX, posY, cardW, cardH);
      }
    }

    // ==========================================
    // 2. BACK SIDE PAGE (100% Duplex Mirrored Alignment)
    // ==========================================
    if (settings.duplexMode !== 'simplex') {
      doc.addPage(settings.paperSize.toLowerCase() as 'a3' | 'a4', isLandscape ? 'landscape' : 'portrait');

      if (onProgress) {
        onProgress(
          Math.round(((sheetIdx * 2 + 1.5) / (totalSheets * 2)) * 100),
          `กำลังสร้างหน้าด้านหลัง จัดตำแหน่งตรง 100% (แผ่นที่ ${sheetIdx + 1}/${totalSheets})...`
        );
      }

      // Draw Back Registration Marks
      if (settings.registrationMarks) {
        drawPdfRegistrationMarks(doc, pageWidth, pageHeight);
      }

      // Render Back Cards with exact duplex mirroring
      for (let i = 0; i < sheetEmployees.length; i++) {
        const emp = sheetEmployees[i];
        const col = i % cols;
        const row = Math.floor(i / cols);

        let backCol = col;
        let backRow = row;

        if (settings.duplexMode === 'duplex_long_edge') {
          // Horizontal flip: mirror columns
          backCol = cols - 1 - col;
        } else if (settings.duplexMode === 'duplex_short_edge') {
          // Vertical flip: mirror rows
          backRow = rows - 1 - row;
        }

        const posX = originX + backCol * (cardW + gapX) + (settings.backOffsetX || 0);
        const posY = originY + backRow * (cardH + gapY) + (settings.backOffsetY || 0);

        const canvas = await renderCardToCanvas(emp, template, 'back', 3);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', posX, posY, cardW, cardH);

        if (settings.showCardBorders) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.rect(posX, posY, cardW, cardH);
        }
        if (settings.cropMarks) {
          drawCropMarks(doc, posX, posY, cardW, cardH);
        }
      }
    }
  }

  if (onProgress) {
    onProgress(100, 'เสร็จสมบูรณ์!');
  }

  return doc;
}

/**
 * Draw 4-corner Registration Marks ┌ ┐ └ ┘ and center crosshairs
 */
function drawPdfRegistrationMarks(doc: jsPDF, w: number, h: number) {
  const margin = 8;
  const arm = 7;
  const tick = 4;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Top-Left ┌
  doc.line(margin, margin + arm, margin, margin);
  doc.line(margin, margin, margin + arm, margin);
  // Crosshair
  doc.line(margin - tick, margin, margin + arm, margin);
  doc.line(margin, margin - tick, margin, margin + arm);

  // Top-Right ┐
  doc.line(w - margin - arm, margin, w - margin, margin);
  doc.line(w - margin, margin, w - margin, margin + arm);
  doc.line(w - margin - arm, margin, w - margin + tick, margin);
  doc.line(w - margin, margin - tick, w - margin, margin + arm);

  // Bottom-Left └
  doc.line(margin, h - margin - arm, margin, h - margin);
  doc.line(margin, h - margin, margin + arm, h - margin);
  doc.line(margin - tick, h - margin, margin + arm, h - margin);
  doc.line(margin, h - margin - arm, margin, h - margin + tick);

  // Bottom-Right ┘
  doc.line(w - margin - arm, h - margin, w - margin, h - margin);
  doc.line(w - margin, h - margin - arm, w - margin, h - margin);
  doc.line(w - margin - arm, h - margin, w - margin + tick, h - margin);
  doc.line(w - margin, h - margin - arm, w - margin, h - margin + tick);

  // Sheet Center marks
  doc.line(w / 2, margin - 4, w / 2, margin + 4);
  doc.line(w / 2, h - margin - 4, w / 2, h - margin + 4);
  doc.line(margin - 4, h / 2, margin + 4, h / 2);
  doc.line(w - margin - 4, h / 2, w - margin + 4, h / 2);
}

/**
 * Draw crop marks around a single card
 */
function drawCropMarks(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const len = 3;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.15);

  // Top-left
  doc.line(x - len, y, x, y);
  doc.line(x, y - len, x, y);
  // Top-right
  doc.line(x + w, y, x + w + len, y);
  doc.line(x + w, y - len, x + w, y);
  // Bottom-left
  doc.line(x - len, y + h, x, y + h);
  doc.line(x, y + h, x, y + h + len);
  // Bottom-right
  doc.line(x + w, y + h, x + w + len, y + h);
  doc.line(x + w, y + h, x + w, y + h + len);
}

/**
 * Generate Printer Alignment Test Calibration Sheet PDF
 */
export function generateCalibrationTestPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const w = 420;
  const h = 297;

  // PAGE 1: FRONT CALIBRATION
  drawPdfRegistrationMarks(doc, w, h);

  doc.setFontSize(16);
  doc.text('A3 Duplex Calibration Test Sheet (Page 1: FRONT)', w / 2, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.text('พิมพ์แผ่นนี้เพื่อวัดระยะชดเชยหัวพิมพ์ (Offset Calibration) ให้ด้านหน้า-หลังตรงกัน 100%', w / 2, 33, { align: 'center' });

  // 100mm Rulers
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(50, 50, 100, 10);
  doc.text('100.0 mm Precise Metric Guide', 100, 46, { align: 'center' });

  // Crosshairs in Center
  doc.circle(w / 2, h / 2, 20);
  doc.circle(w / 2, h / 2, 40);
  doc.line(w / 2 - 50, h / 2, w / 2 + 50, h / 2);
  doc.line(w / 2, h / 2 - 50, w / 2, h / 2 + 50);

  // 4 corners boxes
  doc.rect(20, 20, 85, 55);
  doc.text('Card Pos 1 (Top-Left)', 62.5, 47.5, { align: 'center' });

  doc.rect(w - 105, 20, 85, 55);
  doc.text('Card Pos 5 (Top-Right)', w - 62.5, 47.5, { align: 'center' });

  doc.rect(20, h - 75, 85, 55);
  doc.text('Card Pos 21 (Bottom-Left)', 62.5, h - 47.5, { align: 'center' });

  doc.rect(w - 105, h - 75, 85, 55);
  doc.text('Card Pos 25 (Bottom-Right)', w - 62.5, h - 47.5, { align: 'center' });

  // PAGE 2: BACK CALIBRATION
  doc.addPage('a3', 'landscape');
  drawPdfRegistrationMarks(doc, w, h);

  doc.setFontSize(16);
  doc.text('A3 Duplex Calibration Test Sheet (Page 2: BACK)', w / 2, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.text('เมื่อส่องผ่านไฟ หรือมองทะลุ เส้นกากบาทและกล่อง 85x55mm จะต้องทับซ้อนกันสนิทพอดี', w / 2, 33, { align: 'center' });

  doc.circle(w / 2, h / 2, 20);
  doc.circle(w / 2, h / 2, 40);
  doc.line(w / 2 - 50, h / 2, w / 2 + 50, h / 2);
  doc.line(w / 2, h / 2 - 50, w / 2, h / 2 + 50);

  // Mirrored Boxes for Long Edge Duplex
  doc.rect(w - 105, 20, 85, 55);
  doc.text('Card Back 1 (Mirrored to Right)', w - 62.5, 47.5, { align: 'center' });

  doc.rect(20, 20, 85, 55);
  doc.text('Card Back 5 (Mirrored to Left)', 62.5, 47.5, { align: 'center' });

  doc.rect(w - 105, h - 75, 85, 55);
  doc.text('Card Back 21 (Mirrored Bottom-Right)', w - 62.5, h - 47.5, { align: 'center' });

  doc.rect(20, h - 75, 85, 55);
  doc.text('Card Back 25 (Mirrored Bottom-Left)', 62.5, h - 47.5, { align: 'center' });

  return doc;
}

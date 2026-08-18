import React, { useState, useEffect } from 'react';
import { CardTemplate, Employee, CardElement } from '../types';
import { INITIAL_EMPLOYEES } from '../data/mockEmployees';
import { generateBarcodeDataUrl, generateQrDataUrl } from '../utils/barcodeUtils';
import { resolveImageUrl, formatEmployeeEnglishName, formatEmployeeStartDate, DEFAULT_LOGO_URL } from '../utils/imageUtils';
import { User, ShieldAlert, Sparkles, Phone, Droplet, Calendar, Building, Briefcase } from 'lucide-react';

interface SingleCardPreviewProps {
  employee?: Employee;
  template: CardTemplate;
  side?: 'front' | 'back';
  scale?: number; // scale multiplier (default 1)
  interactiveFlip?: boolean;
  showGuides?: boolean;
  gridSizeMm?: number; // 0 for off, 1, 5, 10
  className?: string;
  onElementClick?: (element: CardElement) => void;
  selectedElementId?: string;
}

export const SingleCardPreview: React.FC<SingleCardPreviewProps> = ({
  employee: propEmployee,
  template,
  side = 'front',
  scale = 1,
  interactiveFlip = false,
  showGuides = false,
  gridSizeMm = 0,
  className = '',
  onElementClick,
  selectedElementId,
}) => {
  const employee = propEmployee || INITIAL_EMPLOYEES[0];
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>(side);
  const [qrFront, setQrFront] = useState<string>('');
  const [qrBack, setQrBack] = useState<string>('');
  const [barFront, setBarFront] = useState<string>('');
  const [barBack, setBarBack] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(side === 'back');

  useEffect(() => {
    setCurrentSide(side);
    setIsFlipped(side === 'back');
  }, [side]);

  // Generate dynamic QR and Barcodes on the fly
  useEffect(() => {
    let isMounted = true;
    const safeEmpId = employee?.empId || 'SAT0000';
    const qrText = employee?.qrValue || `https://verify.company.co.th/emp/${safeEmpId}`;
    const barText = employee?.barcodeValue || safeEmpId;

    generateQrDataUrl(qrText, { width: 140 })
      .then((url) => {
        if (isMounted) setQrFront(url);
      })
      .catch((err) => console.warn('QR generation error:', err));

    generateQrDataUrl(`https://company.co.th/verify/${safeEmpId}`, { width: 140 })
      .then((url) => {
        if (isMounted) setQrBack(url);
      })
      .catch((err) => console.warn('QR generation error:', err));

    const bFront = generateBarcodeDataUrl(barText, { height: 28 });
    const bBack = generateBarcodeDataUrl(barText, { height: 20 });
    if (isMounted) {
      setBarFront(bFront);
      setBarBack(bBack);
    }

    return () => {
      isMounted = false;
    };
  }, [employee]);

  // Card dimensions in mm: standard 85 x 55 mm
  const cardW = template.cardWidthMm || 85;
  const cardH = template.cardHeightMm || 55;

  // Base display scale: 1mm = 4px at standard 100% preview
  const mmToPx = 4 * scale;
  const pixelWidth = cardW * mmToPx;
  const pixelHeight = cardH * mmToPx;

  const renderSideContent = (targetSide: 'front' | 'back') => {
    const bg = targetSide === 'front' ? template.frontBackground : template.backBackground;
    const elements = template.elements
      .filter((el) => el.side === targetSide && el.visible)
      .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

    let bgStyle: React.CSSProperties = {};
    if (bg.type === 'color') {
      bgStyle.backgroundColor = bg.value;
    } else if (bg.type === 'gradient') {
      bgStyle.background = bg.value;
    }
    if (bg.imageUrl) {
      bgStyle.backgroundImage = `url(${bg.imageUrl})`;
      bgStyle.backgroundSize = 'cover';
      bgStyle.backgroundPosition = 'center';
    }

    return (
      <div
        className="relative w-full h-full overflow-hidden select-none"
        style={bgStyle}
      >
        {/* Grid overlay for design mode */}
        {gridSizeMm > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-50 opacity-25"
            style={{
              backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
              backgroundSize: `${gridSizeMm * mmToPx}px ${gridSizeMm * mmToPx}px`,
            }}
          />
        )}

        {/* Outer safety margin / bleed line guide */}
        {showGuides && (
          <div
            className="absolute inset-[3mm] border border-dashed border-red-400 pointer-events-none z-40 opacity-40"
            style={{
              top: `${2 * mmToPx}px`,
              left: `${2 * mmToPx}px`,
              right: `${2 * mmToPx}px`,
              bottom: `${2 * mmToPx}px`,
            }}
          />
        )}

        {/* Card Elements */}
        {elements.map((el) => {
          const elX = el.xMm * mmToPx;
          const elY = el.yMm * mmToPx;
          const elW = el.widthMm * mmToPx;
          const elH = el.heightMm * mmToPx;
          const isSelected = selectedElementId === el.id;

          let elementContent: React.ReactNode = null;

          if (el.type === 'logo') {
            const logoSrc = resolveImageUrl(el.imageUrl || template.logoUrl || DEFAULT_LOGO_URL);
            elementContent = (
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: el.backgroundColor || 'transparent',
                  borderRadius: `${(el.borderRadiusMm || 0) * mmToPx}px`,
                }}
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Building className="text-slate-400 w-3/4 h-3/4" />
                )}
              </div>
            );
          } else if (el.type === 'photo') {
            const photoSrc = resolveImageUrl(employee.photoUrl);
            elementContent = (
              <div
                className="w-full h-full overflow-hidden flex items-center justify-center bg-white relative"
                style={{
                  borderRadius: `${(el.borderRadiusMm || 0) * mmToPx}px`,
                  border: el.borderColor && el.borderWidthMm ? `${el.borderWidthMm * mmToPx}px solid ${el.borderColor}` : '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: '50% 8%',
                      filter: 'brightness(102%) contrast(103%) saturate(102%)',
                      backgroundColor: '#ffffff',
                    }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Hide broken image and show background
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="text-slate-300 w-3/5 h-3/5" />
                )}
              </div>
            );
          } else if (el.type === 'qrcode') {
            const qrSrc = targetSide === 'front' ? qrFront : qrBack;
            elementContent = (
              <div className="w-full h-full bg-white p-0.5 rounded flex items-center justify-center shadow-xs">
                {qrSrc ? (
                  <img src={qrSrc} alt="QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse" />
                )}
              </div>
            );
          } else if (el.type === 'barcode') {
            const barSrc = targetSide === 'front' ? barFront : barBack;
            elementContent = (
              <div className="w-full h-full bg-white/90 p-0.5 rounded flex flex-col items-center justify-center">
                {barSrc && <img src={barSrc} alt="Barcode" className="w-full h-full object-contain" />}
              </div>
            );
          } else if (el.type === 'shape') {
            elementContent = (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: el.backgroundColor,
                  border: el.borderColor && el.borderWidthMm ? `${el.borderWidthMm * mmToPx}px solid ${el.borderColor}` : undefined,
                  borderRadius: `${(el.borderRadiusMm || 0) * mmToPx}px`,
                }}
              />
            );
          } else if (el.type === 'badge') {
            elementContent = (
              <div
                className="w-full h-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: el.backgroundColor || '#1e3a8a',
                  borderRadius: `${(el.borderRadiusMm || 1) * mmToPx}px`,
                }}
              />
            );
          } else if (el.type === 'text' || el.type === 'field') {
            let displayText = '';
            const isNameEnField = el.type === 'field' && el.fieldKey === 'nameEn';
            const isStartDateField = el.type === 'field' && el.fieldKey === 'startDate';
            const hasFieldLabel = el.type === 'field' && !!el.label && !isNameEnField;
            
            if (isNameEnField) {
              const formattedName = formatEmployeeEnglishName(employee.nameEn, employee.name);
              displayText = el.label ? `${el.label} ${formattedName}` : formattedName;
            } else if (hasFieldLabel) {
              // Handled with aligned 2-column layout below
            } else if (el.type === 'field' && el.fieldKey) {
              if (isStartDateField) {
                displayText = formatEmployeeStartDate(employee.startDate);
              } else {
                const val = employee[el.fieldKey as keyof Employee] || '';
                displayText = String(val);
              }
            } else if (el.staticText) {
              const formattedNameEn = formatEmployeeEnglishName(employee.nameEn, employee.name);
              const formattedStartDate = formatEmployeeStartDate(employee.startDate);
              displayText = el.staticText
                .replace('{empId}', employee.empId || '')
                .replace('{name}', employee.name || '')
                .replace('{nameEn}', formattedNameEn || '')
                .replace('{bloodType}', employee.bloodType || 'O')
                .replace('{startDate}', formattedStartDate || '')
                .replace('{department}', employee.department || '')
                .replace('{division}', employee.division || '')
                .replace('{position}', employee.position || '');
            }

            let effectivePt = el.fontSizePt || 8;
            const isCompanyField = el.id?.includes('company') || el.id?.includes('address');
            if (isNameEnField && displayText) {
              const charCount = displayText.length;
              if (charCount > 32) {
                effectivePt = Math.max(7.2, effectivePt * 0.72);
              } else if (charCount > 26) {
                effectivePt = Math.max(8.0, effectivePt * 0.80);
              } else if (charCount > 21) {
                effectivePt = Math.max(8.8, effectivePt * 0.88);
              }
            } else if (isCompanyField && displayText) {
              if (el.id?.includes('company')) {
                // Ensure bold company title fits in available width
                if (displayText.length > 36) {
                  effectivePt = Math.min(effectivePt, 7.2);
                }
              } else if (el.id?.includes('address')) {
                // Ensure address fits clearly in frame
                if (displayText.length > 70) {
                  effectivePt = Math.min(effectivePt, 4.4);
                }
              }
            } else if (hasFieldLabel) {
              let val = String(employee[el.fieldKey as keyof Employee] || '');
              if (isStartDateField) {
                val = formatEmployeeStartDate(employee.startDate);
              }
              const totalLen = (el.label?.length || 0) + val.length;
              if (totalLen > 32) {
                effectivePt = Math.max(7.0, effectivePt * 0.82);
              } else if (totalLen > 26) {
                effectivePt = Math.max(7.6, effectivePt * 0.90);
              }
            }

            const ptToPx = effectivePt * (scale * 1.3333);

            if (hasFieldLabel) {
              const labelText = el.label || '';
              let valText = String(employee[el.fieldKey as keyof Employee] || '');
              if (isStartDateField) {
                valText = formatEmployeeStartDate(employee.startDate);
              }
              const labelWidthMm = el.labelWidthMm || (labelText.length <= 6 ? 12.5 : labelText.length * 2.2);
              const labelWidthPx = labelWidthMm * mmToPx;

              if (isStartDateField) {
                elementContent = (
                  <div
                    className="w-full h-full leading-tight font-sans flex items-center whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{
                      fontSize: `${ptToPx}px`,
                      color: el.color || '#000000',
                      letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 'bold',
                        display: 'inline-block',
                        textAlign: 'left',
                        color: el.color || '#1e293b',
                        whiteSpace: 'pre',
                      }}
                    >
                      {labelText + '     '}
                    </span>
                    <span
                      className="truncate"
                      style={{
                        fontWeight: el.fontWeight || 'bold',
                        color: el.color || '#1e293b',
                        textAlign: 'left',
                      }}
                    >
                      {valText}
                    </span>
                  </div>
                );
              } else {
                elementContent = (
                  <div
                    className="w-full h-full leading-tight font-sans flex items-center whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{
                      fontSize: `${ptToPx}px`,
                      color: el.color || '#000000',
                      letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                    }}
                  >
                    <span
                      style={{
                        width: `${labelWidthPx}px`,
                        flexShrink: 0,
                        fontWeight: 'bold',
                        display: 'inline-block',
                        textAlign: 'left',
                        color: el.color || '#1e293b',
                      }}
                    >
                      {labelText}
                    </span>
                    <span
                      className="truncate"
                      style={{
                        fontWeight: el.fontWeight || 'bold',
                        color: el.color || '#1e293b',
                        textAlign: 'left',
                      }}
                    >
                      {valText}
                    </span>
                  </div>
                );
              }
            } else {
              const isSingleLine = isNameEnField || (el.type === 'field') || el.id?.includes('address') || el.id?.includes('company');

              elementContent = (
                <div
                  className={`w-full h-full leading-tight font-sans flex items-center ${
                    isSingleLine ? 'whitespace-nowrap overflow-hidden text-ellipsis' : 'whitespace-pre-wrap'
                  }`}
                  style={{
                    fontSize: `${ptToPx}px`,
                    fontWeight: el.fontWeight || 'normal',
                    color: el.color || '#000000',
                    justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    textAlign: el.textAlign || 'left',
                    letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                  }}
                >
                  {displayText}
                </div>
              );
            }
          }

          return (
            <div
              key={el.id}
              onClick={(e) => {
                if (onElementClick) {
                  e.stopPropagation();
                  onElementClick(el);
                }
              }}
              className={`absolute cursor-pointer transition-all duration-150 ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-50' : 'hover:outline-1 hover:outline-dashed hover:outline-blue-400'
              }`}
              style={{
                left: `${elX}px`,
                top: `${elY}px`,
                width: `${elW}px`,
                height: `${elH}px`,
                zIndex: el.zIndex || 1,
                opacity: el.opacity !== undefined ? el.opacity : 1,
              }}
            >
              {elementContent}
            </div>
          );
        })}
      </div>
    );
  };

  if (interactiveFlip) {
    return (
      <div
        className={`group perspective-1000 inline-block cursor-pointer ${className}`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          width: `${pixelWidth}px`,
          height: `${pixelHeight}px`,
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 rounded-xl shadow-lg border border-slate-300 transform-style-3d"
          style={{
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden">
            {renderSideContent('front')}
          </div>
          {/* BACK */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden"
            style={{ transform: 'rotateY(180deg)' }}
          >
            {renderSideContent('back')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block rounded-xl shadow-md border border-slate-300/80 overflow-hidden bg-white ${className}`}
      style={{
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
    >
      {renderSideContent(currentSide)}
    </div>
  );
};

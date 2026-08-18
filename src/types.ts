export type CardOrientation = 'landscape' | 'portrait';
export type CardSide = 'front' | 'back';
export type DuplexMode = 'duplex_long_edge' | 'duplex_short_edge' | 'simplex';
export type PaperSize = 'A3' | 'A4';

export interface Employee {
  id: string;
  empId: string; // e.g. SAT0564
  name: string; // e.g. สมชาย ใจดี
  nameEn?: string; // e.g. Somchai Jaidee
  department: string; // e.g. ฝ่ายผลิต (Production)
  division: string; // e.g. โรงงาน 1 (Factory 1)
  position: string; // e.g. หัวหน้าช่างเทคนิค
  startDate: string; // e.g. 01/05/2021
  bloodType: string; // e.g. O, A, B, AB
  phone: string; // e.g. 081-234-5678
  email?: string; // e.g. somchai@company.co.th
  nationalId?: string; // e.g. 1-1002-00345-67-8
  emergencyContact?: string; // e.g. 089-987-6543
  photoUrl: string; // Base64 or URL
  barcodeValue?: string; // Default to empId
  qrValue?: string; // URL or encoded payload
  customField1?: string;
  customField2?: string;
  status: 'active' | 'temporary' | 'contractor' | 'visitor';
  notes?: string;
}

export type ElementType =
  | 'photo'
  | 'logo'
  | 'text'
  | 'field'
  | 'qrcode'
  | 'barcode'
  | 'shape'
  | 'badge'
  | 'divider'
  | 'chip'
  | 'sign';

export interface CardElement {
  id: string;
  type: ElementType;
  side: CardSide;
  xMm: number; // in millimeters (0 to 85)
  yMm: number; // in millimeters (0 to 55)
  widthMm: number; // in millimeters
  heightMm: number; // in millimeters
  zIndex: number;
  rotation?: number; // 0, 90, 180, 270 degrees
  visible: boolean;

  // Text & Typography
  fieldKey?: keyof Employee | 'companyName' | 'companyNameEn' | 'companyAddress' | 'disclaimer' | 'custom';
  staticText?: string;
  label?: string; // e.g. "Dept.:", "Div.:", "Post.:"
  labelWidthMm?: number; // width in mm for aligning label column (default ~12.5mm)
  fontSizePt?: number; // in points (e.g. 8pt, 10pt, 14pt)
  fontFamily?: string; // 'Prompt', 'Sarabun', 'Inter', 'monospace'
  fontWeight?: 'normal' | 'bold' | '600' | '700';
  color?: string; // HEX color
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;

  // Visual Styles
  backgroundColor?: string;
  borderColor?: string;
  borderWidthMm?: number;
  borderRadiusMm?: number;
  opacity?: number;
  shadow?: boolean;

  // Media / Special
  imageUrl?: string;
  shapeType?: 'rectangle' | 'circle' | 'line' | 'rounded';
  badgeStyle?: 'pill' | 'tag' | 'header' | 'chip';
  barcodeFormat?: 'CODE128' | 'EAN13' | 'UPC';
}

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'permanent' | 'temporary' | 'contractor' | 'visitor' | 'executive';
  cardWidthMm: number; // default 85
  cardHeightMm: number; // default 55
  orientation: CardOrientation; // 'landscape'
  companyName: string;
  companyNameEn?: string;
  logoUrl: string;
  
  frontBackground: {
    type: 'color' | 'gradient' | 'image';
    value: string; // color or CSS gradient or base64 image
    imageUrl?: string;
    opacity?: number;
  };
  backBackground: {
    type: 'color' | 'gradient' | 'image';
    value: string;
    imageUrl?: string;
    opacity?: number;
  };

  elements: CardElement[];
  createdAt: string;
  updatedAt: string;
}

export interface PrintSettings {
  paperSize: PaperSize; // 'A3' | 'A4'
  paperOrientation: 'landscape' | 'portrait';
  columns: number; // 5 for A3
  rows: number; // 5 for A3 (25 cards per sheet)
  cardWidthMm: number; // 85 mm
  cardHeightMm: number; // 55 mm
  horizontalGapMm: number; // gap between cards (e.g. 0 to 4mm)
  verticalGapMm: number; // gap between cards (e.g. 0 to 4mm)
  
  duplexMode: DuplexMode;
  
  // High-precision alignment offsets (±10 mm)
  frontOffsetX: number; // mm
  frontOffsetY: number; // mm
  backOffsetX: number; // mm
  backOffsetY: number; // mm
  
  // Cut and alignment marks
  registrationMarks: boolean; // Corner marks ┌ ┐ └ ┘
  cropMarks: boolean; // Tick lines for guillotine cutter
  cuttingGuides: boolean; // Subtle dashed cut lines
  showCardBorders: boolean;
  bleedMm: number; // Bleed margin (e.g. 1mm)
  
  // Margin overrides
  marginTopMm: number;
  marginLeftMm: number;
  
  // Output quality
  dpi: 300 | 600;
  autoCenter: boolean;
}

export interface BatchPhotoMatchResult {
  fileName: string;
  originalFileName?: string;
  empId: string;
  renamedFileName?: string; // Standardized as [empId].jpg
  matchedEmployee?: Employee;
  fileDataUrl: string;
  status: 'matched' | 'unmatched' | 'duplicate';
  matchMethod?: 'exact_id' | 'numeric_id' | 'pattern_id' | 'name_th' | 'name_en' | 'manual';
  confidenceScore?: number; // 0 to 100
}

export interface PrinterCalibrationProfile {
  id: string;
  name: string; // e.g. "Canon imageRUNNER A3", "Epson L18050"
  frontOffsetX: number;
  frontOffsetY: number;
  backOffsetX: number;
  backOffsetY: number;
  notes: string;
  isDefault: boolean;
}

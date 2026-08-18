import React, { useState, useRef, useEffect } from 'react';
import { Employee, BatchPhotoMatchResult } from '../types';
import { saveEmployeesToLocal } from '../utils/storageUtils';
import JSZip from 'jszip';
import {
  Camera,
  Upload,
  Sparkles,
  RotateCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  UserCheck,
  UserX,
  Trash2,
  Crop,
  Sun,
  Contrast,
  RefreshCw,
  X,
  Search,
  Check,
  ZoomIn,
  Move,
  Palette,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Wand2,
  Layers,
  Download,
  Focus,
  Maximize2,
  Tag,
  ArrowRight,
  Filter,
  FileCheck,
  FolderArchive,
  Edit3
} from 'lucide-react';

interface PhotoManagerProps {
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
}

interface FilterPreset {
  id: string;
  name: string;
  desc: string;
  brightness: number;
  contrast: number;
  saturation: number;
  highKeyStrength: number;
  skinWhitening: number;
  focusY: number;
  zoom: number;
  bgColor: string;
}

/**
 * Smart matching algorithm to pair any uploaded photo filename with the correct Employee record
 * Handles exact IDs, prefix variations (SAT-0009, sat_0009), numbers (9.jpg, 0009.jpg),
 * and Thai / English employee names.
 */
export function smartMatchPhotoToEmployee(
  fileName: string,
  employees: Employee[]
): {
  matchedEmployee?: Employee;
  empId: string;
  renamedFileName: string;
  matchMethod: 'exact_id' | 'numeric_id' | 'pattern_id' | 'name_th' | 'name_en' | 'manual';
  confidenceScore: number;
  explanation: string;
} {
  const rawBase = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase() : '.jpg';
  const cleanBase = rawBase.trim();
  const upperBase = cleanBase.toUpperCase();

  // 1. Exact Match on empId (e.g. "SAT0009.jpg" -> SAT0009)
  for (const emp of employees) {
    const empIdUpper = emp.empId.toUpperCase();
    if (upperBase === empIdUpper) {
      return {
        matchedEmployee: emp,
        empId: emp.empId,
        renamedFileName: `${emp.empId}.jpg`,
        matchMethod: 'exact_id',
        confidenceScore: 100,
        explanation: `ตรงรหัสพนักงาน ${emp.empId} เป๊ะ (Exact 100%)`,
      };
    }
  }

  // 2. Pattern Match in Filename (e.g. "SAT-0009", "SAT_0009", "SAT 0009", "IMG_SAT0009_v1", "photo-sat0009")
  for (const emp of employees) {
    const empIdUpper = emp.empId.toUpperCase();
    const prefixMatch = empIdUpper.match(/^([A-Z]+)(\d+)$/);
    if (prefixMatch) {
      const [, pfx, digits] = prefixMatch;
      const numVal = parseInt(digits, 10);
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${pfx}[-_\\s.]*0*${numVal}([^a-zA-Z0-9]|$)`, 'i');
      if (regex.test(upperBase) || upperBase.includes(empIdUpper)) {
        return {
          matchedEmployee: emp,
          empId: emp.empId,
          renamedFileName: `${emp.empId}.jpg`,
          matchMethod: 'pattern_id',
          confidenceScore: 95,
          explanation: `ตรวจพบรหัสพนักงานในชื่อไฟล์ ➔ ${emp.empId}`,
        };
      }
    }
  }

  // 3. Numeric ID Match with Zero Padding (e.g. "0009.jpg", "9.jpg", "IMG_9.jpg", "075.png")
  const numberTokens = cleanBase.match(/\d+/g);
  if (numberTokens) {
    for (const token of numberTokens) {
      const numVal = parseInt(token, 10);
      if (!isNaN(numVal) && numVal > 0) {
        for (const emp of employees) {
          const empNumMatch = emp.empId.match(/\d+/);
          if (empNumMatch) {
            const empNum = parseInt(empNumMatch[0], 10);
            if (empNum === numVal) {
              return {
                matchedEmployee: emp,
                empId: emp.empId,
                renamedFileName: `${emp.empId}.jpg`,
                matchMethod: 'numeric_id',
                confidenceScore: 88,
                explanation: `ตัวเลขรหัสตรงกัน (#${numVal} ➔ ${emp.empId})`,
              };
            }
          }
        }
      }
    }
  }

  // 4. Employee Thai Name Match (e.g. "สมคิด นุ่มเจริญ.jpg", "สมคิด.jpg")
  for (const emp of employees) {
    const thaiWords = emp.name.split(/\s+/).filter((w) => w.length >= 3);
    for (const w of thaiWords) {
      if (cleanBase.includes(w)) {
        return {
          matchedEmployee: emp,
          empId: emp.empId,
          renamedFileName: `${emp.empId}.jpg`,
          matchMethod: 'name_th',
          confidenceScore: 90,
          explanation: `ตรวจพบชื่อไทย "${w}" ➔ ${emp.empId} (${emp.name})`,
        };
      }
    }

    // English name if available
    if (emp.nameEn) {
      const enWords = emp.nameEn.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
      const lowerBase = cleanBase.toLowerCase();
      for (const w of enWords) {
        if (lowerBase.includes(w)) {
          return {
            matchedEmployee: emp,
            empId: emp.empId,
            renamedFileName: `${emp.empId}.jpg`,
            matchMethod: 'name_en',
            confidenceScore: 85,
            explanation: `ตรวจพบชื่ออังกฤษ "${w}" ➔ ${emp.empId} (${emp.nameEn})`,
          };
        }
      }
    }
  }

  // 5. Unmatched
  return {
    matchedEmployee: undefined,
    empId: cleanBase.toUpperCase(),
    renamedFileName: `${cleanBase}.jpg`,
    matchMethod: 'manual',
    confidenceScore: 0,
    explanation: 'ไม่พบรหัสที่ตรงกัน กรุณาเลือกรหัสพนักงานด้วยตนเอง',
  };
}

const HIGH_KEY_PRESETS: FilterPreset[] = [
  {
    id: 'high-key-clean',
    name: '🌟 High-Key ขาวสะอาด สตูดิโอ (Studio Clean)',
    desc: 'โทนสีขาวสว่างใส ตัดเงามืด ผิวเรียบเนียน พื้นหลังขาวบริสุทธิ์ 100%',
    brightness: 108,
    contrast: 106,
    saturation: 102,
    highKeyStrength: 25,
    skinWhitening: 20,
    focusY: 17,
    zoom: 100,
    bgColor: '#ffffff',
  },
  {
    id: 'high-key-clarity',
    name: '💎 High-Key คมชัดสูง (Ultra Clarity)',
    desc: 'ขับเน้นรายละเอียดใบหน้า เส้นผม ขอบเสื้อผ้า คอนทราสต์คมชัด สีสันสมจริง',
    brightness: 104,
    contrast: 112,
    saturation: 104,
    highKeyStrength: 18,
    skinWhitening: 12,
    focusY: 17,
    zoom: 100,
    bgColor: '#ffffff',
  },
  {
    id: 'high-key-soft-glow',
    name: '🌸 High-Key ผิวนุ่มนวล (Soft Glow & White)',
    desc: 'ปรับผิวหน้าเนียนนุ่ม ลดเงาใต้ตา ปรับแสงให้กระจายทั่วใบหน้า โทนสีผิวสุขภาพดี',
    brightness: 110,
    contrast: 102,
    saturation: 106,
    highKeyStrength: 30,
    skinWhitening: 28,
    focusY: 17,
    zoom: 102,
    bgColor: '#ffffff',
  },
  {
    id: 'high-key-corporate',
    name: '👔 High-Key บัตรพนักงานทางการ (Corporate ID)',
    desc: 'ระดับมืออาชีพ แสงสมดุล ไม่สว่างจ้าเกินไป เหมาะสำหรับพิมพ์ลงบัตร PVC',
    brightness: 105,
    contrast: 108,
    saturation: 100,
    highKeyStrength: 15,
    skinWhitening: 10,
    focusY: 17,
    zoom: 100,
    bgColor: '#ffffff',
  },
];

/**
 * Canvas API Image Processor helper
 * Processes image through pure Canvas API, calculating auto-center, golden ratio focal point,
 * High-Key curves, skin whitening, background enhancement and renders high-res result.
 */
async function processImageToHighKeyCanvas(
  sourceUrl: string,
  options: {
    brightness: number;
    contrast: number;
    saturation: number;
    highKeyStrength: number;
    skinWhitening: number;
    focusY: number;
    zoom: number;
    rotation: number;
    targetWidth?: number;
    targetHeight?: number;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const outW = options.targetWidth || 480;
        const outH = options.targetHeight || 640;
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(sourceUrl);
          return;
        }

        // 1. Fill clean white studio background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);

        // 2. Calculate Auto-Center Crop with Golden Ratio portrait framing
        const imgAspect = img.width / img.height;
        const boxAspect = outW / outH;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        const zoomFactor = Math.max(0.8, options.zoom / 100);

        if (imgAspect > boxAspect) {
          // Wider than 3:4 -> crop sides, center horizontally
          sWidth = (img.height * boxAspect) / zoomFactor;
          sx = (img.width - sWidth) / 2;
          sHeight = img.height / zoomFactor;
          sy = (img.height - sHeight) * (options.focusY / 100);
        } else {
          // Taller than 3:4 -> crop top/bottom using vertical focus bias
          sHeight = (img.width / boxAspect) / zoomFactor;
          sWidth = img.width / zoomFactor;
          sx = (img.width - sWidth) / 2;
          sy = (img.height - sHeight) * (options.focusY / 100);
        }

        // Bound checks
        sx = Math.max(0, Math.min(img.width - sWidth, sx));
        sy = Math.max(0, Math.min(img.height - sHeight, sy));

        // 3. Apply CSS-like filter parameters on canvas context
        ctx.save();
        ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%)`;

        // Handle rotation if present
        if (options.rotation !== 0) {
          ctx.translate(outW / 2, outH / 2);
          ctx.rotate((options.rotation * Math.PI) / 180);
          ctx.drawImage(img, sx, sy, sWidth, sHeight, -outW / 2, -outH / 2, outW, outH);
        } else {
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outW, outH);
        }
        ctx.restore();

        // 4. Pixel-level High-Key Tone Mapping & Skin Whitening (Canvas ImageData)
        if (options.highKeyStrength > 0 || options.skinWhitening > 0) {
          const imgData = ctx.getImageData(0, 0, outW, outH);
          const data = imgData.data;
          const hk = options.highKeyStrength / 100;
          const sw = options.skinWhitening / 100;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Calculate luminance
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // High-Key Lift: Lift shadows and compress highlights smoothly towards clean white
            if (hk > 0) {
              const lift = Math.sin((lum / 255) * Math.PI) * (30 * hk);
              r = Math.min(255, r + lift);
              g = Math.min(255, g + lift);
              b = Math.min(255, b + lift);

              // Background whitening: If pixel is already very bright/grayish (like background), blend directly to #ffffff
              if (lum > 220 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
                const bgBoost = ((lum - 220) / 35) * hk;
                r = Math.min(255, r + (255 - r) * bgBoost);
                g = Math.min(255, g + (255 - g) * bgBoost);
                b = Math.min(255, b + (255 - b) * bgBoost);
              }
            }

            // Skin Tone Whitening & Soft Glow
            if (sw > 0 && r > g && g > b) {
              // Characteristic of warm skin tone
              const skinFactor = ((r - b) / 255) * sw;
              r = Math.min(255, r + 15 * skinFactor);
              g = Math.min(255, g + 12 * skinFactor);
              b = Math.min(255, b + 18 * skinFactor); // Add subtle coolness to reduce yellow cast
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }

          ctx.putImageData(imgData, 0, 0);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
        resolve(dataUrl);
      } catch (err) {
        console.error('Canvas processing error:', err);
        resolve(sourceUrl);
      }
    };
    img.onerror = () => {
      resolve(sourceUrl);
    };
    img.src = sourceUrl;
  });
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  employees,
  onUpdateEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'upload' | 'webcam'>('studio');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPreset, setSelectedPreset] = useState<string>('high-key-clean');

  // Studio Adjustments State (High-Key Controls)
  const [brightness, setBrightness] = useState<number>(108);
  const [contrast, setContrast] = useState<number>(106);
  const [saturation, setSaturation] = useState<number>(102);
  const [highKeyStrength, setHighKeyStrength] = useState<number>(25);
  const [skinWhitening, setSkinWhitening] = useState<number>(20);
  const [focusY, setFocusY] = useState<number>(17); // 17% top bias = golden ratio eye/head alignment
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState<string | null>(null);

  // Batch Processing Progress State
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);

  // Batch Upload & Match State
  const [matchResults, setMatchResults] = useState<BatchPhotoMatchResult[]>([]);
  const [uploadFilter, setUploadFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [uploadSearchQuery, setUploadSearchQuery] = useState<string>('');
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [webcamEmpId, setWebcamEmpId] = useState<string>('');
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Individual photo edit state
  const [indRotation, setIndRotation] = useState<number>(0);
  const [indBrightness, setIndBrightness] = useState<number>(108);
  const [indContrast, setIndContrast] = useState<number>(106);
  const [indSaturation, setIndSaturation] = useState<number>(102);
  const [indHighKey, setIndHighKey] = useState<number>(25);
  const [indSkinWhitening, setIndSkinWhitening] = useState<number>(20);
  const [indFocusY, setIndFocusY] = useState<number>(17);
  const [indZoom, setIndZoom] = useState<number>(100);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [indPreviewCanvasUrl, setIndPreviewCanvasUrl] = useState<string | null>(null);

  // Webcam refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      emp.empId.toLowerCase().includes(q) ||
      emp.name.toLowerCase().includes(q) ||
      (emp.nameEn && emp.nameEn.toLowerCase().includes(q)) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q);
    const matchDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchSearch && matchDept;
  });

  // Filtered uploaded batch match results
  const filteredMatchResults = matchResults.filter((item) => {
    const q = uploadSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.fileName.toLowerCase().includes(q) ||
      (item.renamedFileName && item.renamedFileName.toLowerCase().includes(q)) ||
      item.empId.toLowerCase().includes(q) ||
      (item.matchedEmployee && item.matchedEmployee.name.toLowerCase().includes(q)) ||
      (item.matchedEmployee && item.matchedEmployee.department.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (uploadFilter === 'matched') return item.status === 'matched';
    if (uploadFilter === 'unmatched') return item.status === 'unmatched';
    return true;
  });

  const matchedCount = matchResults.filter((m) => m.status === 'matched').length;
  const unmatchedCount = matchResults.filter((m) => m.status === 'unmatched').length;

  // Apply preset filter
  const applyPreset = (preset: FilterPreset) => {
    setSelectedPreset(preset.id);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setHighKeyStrength(preset.highKeyStrength);
    setSkinWhitening(preset.skinWhitening);
    setFocusY(preset.focusY);
    setZoomScale(preset.zoom);
    setBgColor(preset.bgColor);
  };

  // Reset face center to golden ratio (17%)
  const handleAutoCenterFace = () => {
    setFocusY(17);
    setZoomScale(100);
    setAppliedSuccessMsg('✓ จัดตำแหน่งใบหน้าให้อยู่กึ่งกลางสัดส่วนทองคำ (Golden Ratio 17%) เรียบร้อยแล้ว');
    setTimeout(() => setAppliedSuccessMsg(null), 3000);
  };

  // Live Canvas processing for Individual Modal Preview
  useEffect(() => {
    if (!selectedEmployeeForEdit || !selectedEmployeeForEdit.photoUrl || !isEditModalOpen) {
      setIndPreviewCanvasUrl(null);
      return;
    }

    let isSubscribed = true;
    processImageToHighKeyCanvas(selectedEmployeeForEdit.photoUrl, {
      brightness: indBrightness,
      contrast: indContrast,
      saturation: indSaturation,
      highKeyStrength: indHighKey,
      skinWhitening: indSkinWhitening,
      focusY: indFocusY,
      zoom: indZoom,
      rotation: indRotation,
      targetWidth: 360,
      targetHeight: 480,
    }).then((canvasUrl) => {
      if (isSubscribed) {
        setIndPreviewCanvasUrl(canvasUrl);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [
    selectedEmployeeForEdit,
    isEditModalOpen,
    indBrightness,
    indContrast,
    indSaturation,
    indHighKey,
    indSkinWhitening,
    indFocusY,
    indZoom,
    indRotation,
  ]);

  // Batch Canvas API High-Key processing & auto-center for ALL employees
  const handleBatchProcessHighKeyCanvas = async () => {
    if (employees.length === 0) return;
    setIsBatchProcessing(true);
    setBatchProgress(0);

    const updatedEmployees = [...employees];
    const total = employees.length;

    for (let i = 0; i < total; i++) {
      const emp = updatedEmployees[i];
      if (emp.photoUrl) {
        try {
          // If it's unsplash, optimize resolution first
          let sourceUrl = emp.photoUrl;
          if (sourceUrl.includes('images.unsplash.com')) {
            const base = sourceUrl.split('?')[0];
            sourceUrl = `${base}?w=600&h=800&auto=format&fit=crop&crop=faces,top&q=90`;
          }

          // Process through High-Key Canvas API Engine
          const bakedDataUrl = await processImageToHighKeyCanvas(sourceUrl, {
            brightness,
            contrast,
            saturation,
            highKeyStrength,
            skinWhitening,
            focusY,
            zoom: zoomScale,
            rotation: 0,
            targetWidth: 480,
            targetHeight: 640,
          });

          updatedEmployees[i] = {
            ...emp,
            photoUrl: bakedDataUrl,
          };
        } catch (e) {
          console.error(`Error processing photo for ${emp.empId}:`, e);
        }
      }
      setBatchProgress(Math.round(((i + 1) / total) * 100));
    }

    onUpdateEmployees(updatedEmployees);
    setIsBatchProcessing(false);
    setAppliedSuccessMsg(`✓ ประมวลผล Canvas High-Key และจัดตำแหน่งกึ่งกลางให้พนักงานทั้งหมด ${total} ท่านสำเร็จ!`);
    setTimeout(() => setAppliedSuccessMsg(null), 5000);
  };

  // Handle batch file upload and auto-match with High-Key Canvas auto-process
  const handleBatchUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let processedCount = 0;
    const newMatches: BatchPhotoMatchResult[] = [];
    const empPhotoUpdates: Record<string, string> = {};

    fileArray.forEach((file) => {
      try {
        const rawName = file.name;
        const match = smartMatchPhotoToEmployee(rawName, employees);

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const rawDataUrl = e.target?.result as string;
            if (!rawDataUrl) return;

            // Auto High-Key Process uploaded photo directly via Canvas API
            const processedUrl = await processImageToHighKeyCanvas(rawDataUrl, {
              brightness,
              contrast,
              saturation,
              highKeyStrength,
              skinWhitening,
              focusY,
              zoom: zoomScale,
              rotation: 0,
            });

            const item: BatchPhotoMatchResult = {
              fileName: rawName,
              originalFileName: rawName,
              empId: match.empId,
              renamedFileName: match.renamedFileName,
              matchedEmployee: match.matchedEmployee,
              fileDataUrl: processedUrl,
              status: match.matchedEmployee ? 'matched' : 'unmatched',
              matchMethod: match.matchMethod,
              confidenceScore: match.confidenceScore,
            };

            newMatches.push(item);
            if (match.matchedEmployee) {
              empPhotoUpdates[match.empId.toUpperCase()] = processedUrl;
            }

            setMatchResults((prev) => [
              item,
              ...prev.filter((p) => p.fileName !== rawName),
            ]);

            processedCount++;
            if (processedCount === fileArray.length) {
              // Apply all matched photos to employees state immediately
              const updatedEmployees = employees.map((emp) => {
                const newPhoto = empPhotoUpdates[emp.empId.toUpperCase()];
                if (newPhoto) {
                  return { ...emp, photoUrl: newPhoto };
                }
                return emp;
              });
              onUpdateEmployees(updatedEmployees);
              saveEmployeesToLocal(updatedEmployees);
              const matchedTotal = Object.keys(empPhotoUpdates).length;
              setAppliedSuccessMsg(`✓ อัปโหลด บันทึก Local Data และจับคู่รูปภาพเข้ากับบัตรพนักงาน ${matchedTotal} ท่านเรียบร้อย พร้อมพิมพ์ A3 ทันที!`);
              setTimeout(() => setAppliedSuccessMsg(null), 5000);
            }
          } catch (err) {
            console.error('Error processing uploaded file in onload:', err);
          }
        };
        reader.onerror = (err) => {
          console.error('FileReader error:', err);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error starting file read:', err);
      }
    });
  };

  // Manually re-assign / fix employee match for an uploaded photo
  const handleReassignMatch = (fileName: string, targetEmpId: string) => {
    const targetEmp = employees.find((e) => e.empId === targetEmpId);
    let matchedItemUrl = '';

    setMatchResults((prev) =>
      prev.map((item) => {
        if (item.fileName === fileName) {
          matchedItemUrl = item.fileDataUrl;
          if (targetEmp) {
            return {
              ...item,
              empId: targetEmp.empId,
              renamedFileName: `${targetEmp.empId}.jpg`,
              matchedEmployee: targetEmp,
              status: 'matched',
              matchMethod: 'manual',
              confidenceScore: 100,
            };
          } else {
            return {
              ...item,
              empId: targetEmpId,
              renamedFileName: `${targetEmpId}.jpg`,
              matchedEmployee: undefined,
              status: 'unmatched',
              matchMethod: 'manual',
              confidenceScore: 0,
            };
          }
        }
        return item;
      })
    );

    if (targetEmp && matchedItemUrl) {
      const updated = employees.map((emp) =>
        emp.empId === targetEmp.empId ? { ...emp, photoUrl: matchedItemUrl } : emp
      );
      onUpdateEmployees(updated);
      setAppliedSuccessMsg(`✓ เชื่อมโยงรูปภาพเข้ากับ ${targetEmp.name} (${targetEmp.empId}) สำเร็จ`);
      setTimeout(() => setAppliedSuccessMsg(null), 4000);
    }
  };

  // Apply single matched item to employee profile
  const handleApplySingleMatch = (item: BatchPhotoMatchResult) => {
    if (!item.matchedEmployee) return;
    const updated = employees.map((emp) =>
      emp.empId === item.empId ? { ...emp, photoUrl: item.fileDataUrl } : emp
    );
    onUpdateEmployees(updated);
    setAppliedSuccessMsg(`✓ บันทึกรูปถ่าย ${item.renamedFileName} ให้กับ ${item.matchedEmployee.name} (${item.empId}) สำเร็จ`);
    setTimeout(() => setAppliedSuccessMsg(null), 4000);
  };

  // Delete single uploaded item from list
  const handleDeleteUploadedItem = (fileName: string) => {
    setMatchResults((prev) => prev.filter((item) => item.fileName !== fileName));
  };

  // Download single image directly
  const handleDownloadSinglePhoto = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all renamed photos as ZIP archive
  const handleDownloadAllRenamedZip = async () => {
    if (matchResults.length === 0) {
      alert('ไม่มีรูปภาพที่อัปโหลด');
      return;
    }

    try {
      const zip = new JSZip();
      const folder = zip.folder('high_key_employee_photos') || zip;

      for (let i = 0; i < matchResults.length; i++) {
        const item = matchResults[i];
        const dataUrl = item.fileDataUrl;
        const base64Data = dataUrl.split(',')[1];
        const finalName = item.renamedFileName || `${item.empId}.jpg`;
        folder.file(finalName, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Employee_Photos_Standardized_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setAppliedSuccessMsg(`✓ ดาวน์โหลดไฟล์ ZIP รูปภาพพนักงานเปลี่ยนชื่อตรงตามรหัส ${matchResults.length} รูป เรียบร้อยแล้ว`);
      setTimeout(() => setAppliedSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error generating zip:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP');
    }
  };

  // Upload single photo for a specific employee directly from studio view
  const handleDirectSingleEmpUpload = (emp: Employee, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawDataUrl = e.target?.result as string;
          if (!rawDataUrl) return;
          const processedUrl = await processImageToHighKeyCanvas(rawDataUrl, {
            brightness,
            contrast,
            saturation,
            highKeyStrength,
            skinWhitening,
            focusY: 17,
            zoom: 100,
            rotation: 0,
            targetWidth: 480,
            targetHeight: 640,
          });

          const updated = employees.map((item) =>
            item.id === emp.id ? { ...item, photoUrl: processedUrl } : item
          );
          onUpdateEmployees(updated);
          saveEmployeesToLocal(updated);
          setAppliedSuccessMsg(`✓ อัปโหลด บันทึกลง Local Data และแปลงชื่อรูปเป็น ${emp.empId}.jpg ให้กับ ${emp.name} สำเร็จ`);
          setTimeout(() => setAppliedSuccessMsg(null), 4000);
        } catch (err) {
          console.error('Error processing single upload photo:', err);
        }
      };
      reader.onerror = (err) => {
        console.error('FileReader error during single upload:', err);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error initiating single upload read:', err);
    }
  };

  const handleApplyAllMatched = () => {
    const matchedItems = matchResults.filter((m) => m.status === 'matched');
    if (matchedItems.length === 0) {
      alert('ไม่มีรูปภาพที่จับคู่กับรหัสพนักงานได้');
      return;
    }

    const updatedEmployees = employees.map((emp) => {
      const match = matchedItems.find(
        (m) => m.empId.toUpperCase() === emp.empId.toUpperCase()
      );
      if (match) {
        return {
          ...emp,
          photoUrl: match.fileDataUrl,
        };
      }
      return emp;
    });

    onUpdateEmployees(updatedEmployees);
    setAppliedSuccessMsg(`✓ อัปเดตรูปภาพ High-Key ให้พนักงานสำเร็จจำนวน ${matchedItems.length} ท่าน`);
    setTimeout(() => setAppliedSuccessMsg(null), 4000);
  };

  // Start webcam
  const startWebcam = async () => {
    try {
      setIsWebcamOpen(true);
      if (employees.length > 0 && !webcamEmpId) {
        setWebcamEmpId(employees[0].empId);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Webcam error:', err);
      alert('ไม่สามารถเข้าถึงกล้องเว็บแคมได้ กรุณาตรวจสอบสิทธิ์การใช้งานกล้อง');
      setIsWebcamOpen(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsWebcamOpen(false);
  };

  // Capture webcam photo with High-Key Canvas processing
  const captureWebcam = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 640;
    tempCanvas.height = 640;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    const videoW = video.videoWidth;
    const videoH = video.videoHeight;
    const cropW = videoH;
    const startX = (videoW - cropW) / 2;

    tCtx.drawImage(video, startX, 0, cropW, videoH, 0, 0, 640, 640);
    const rawSnap = tempCanvas.toDataURL('image/jpeg', 0.95);

    // Run High-Key & Auto-Center processing
    const processedSnap = await processImageToHighKeyCanvas(rawSnap, {
      brightness,
      contrast,
      saturation,
      highKeyStrength,
      skinWhitening,
      focusY: 17,
      zoom: 100,
      rotation: 0,
      targetWidth: 480,
      targetHeight: 640,
    });

    const targetEmp = employees.find((e) => e.empId === webcamEmpId);
    if (targetEmp) {
      const updated = employees.map((e) =>
        e.empId === webcamEmpId ? { ...e, photoUrl: processedSnap } : e
      );
      onUpdateEmployees(updated);
    }

    stopWebcam();
    setAppliedSuccessMsg(`✓ บันทึกภาพถ่าย High-Key สตูดิโอขาวสำหรับ ${webcamEmpId} สำเร็จ`);
    setTimeout(() => setAppliedSuccessMsg(null), 4000);
  };

  // Save individual adjusted image using Canvas API
  const saveIndividualPhoto = async () => {
    if (!selectedEmployeeForEdit || !selectedEmployeeForEdit.photoUrl) return;

    const finalBakedUrl = await processImageToHighKeyCanvas(selectedEmployeeForEdit.photoUrl, {
      brightness: indBrightness,
      contrast: indContrast,
      saturation: indSaturation,
      highKeyStrength: indHighKey,
      skinWhitening: indSkinWhitening,
      focusY: indFocusY,
      zoom: indZoom,
      rotation: indRotation,
      targetWidth: 480,
      targetHeight: 640,
    });

    const updated = employees.map((e) =>
      e.id === selectedEmployeeForEdit.id ? { ...e, photoUrl: finalBakedUrl } : e
    );
    onUpdateEmployees(updated);
    saveEmployeesToLocal(updated);
    setIsEditModalOpen(false);
    setSelectedEmployeeForEdit(null);
    setAppliedSuccessMsg(`✓ ปรับแต่ง บันทึกลง Local Data และอัปเดตภาพ High-Key สำหรับ ${selectedEmployeeForEdit.name} สำเร็จ`);
    setTimeout(() => setAppliedSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              ระบบปรับแต่งภาพถ่าย High-Key & จัดกึ่งกลางอัตโนมัติ (Canvas High-Key Studio)
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              พนักงานทั้งหมด {employees.length} ท่าน
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            ปรับโทนภาพเป็นสีขาวสะอาด (High-Key) ตัดเงาดำ ปรับผิวสว่างขาวใส จัดตำแหน่งใบหน้ากึ่งกลางบัตรอัตโนมัติด้วย Canvas API ก่อนบันทึก
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBatchProcessHighKeyCanvas}
            disabled={isBatchProcessing}
            className="px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            {isBatchProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isBatchProcessing ? `กำลังประมวลผล ${batchProgress}%...` : 'ประมวลผล Canvas High-Key ทั้งหมด (Bake to Cards)'}
          </button>

          <button
            onClick={handleAutoCenterFace}
            className="px-3.5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            title="จัดตำแหน่งใบหน้าให้อยู่กึ่งกลางสายตาพอดีตามสัดส่วนมาตรฐาน"
          >
            <Focus className="w-4 h-4 text-blue-600" />
            จัดกึ่งกลางอัตโนมัติ
          </button>

          <button
            onClick={startWebcam}
            className="px-3.5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            กล้องสตูดิโอ
          </button>
        </div>
      </div>

      {/* Batch Processing Progress Bar */}
      {isBatchProcessing && (
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 animate-fadeIn">
          <div className="flex justify-between text-xs font-bold text-blue-900">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              กำลังประมวลผลภาพถ่าย High-Key และคำนวณจุดกึ่งกลางใบหน้าด้วย Canvas API...
            </span>
            <span>{batchProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-blue-200/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200 rounded-full"
              style={{ width: `${batchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Notification */}
      {appliedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-semibold shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{appliedSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAppliedSuccessMsg(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'studio'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          สตูดิโอ High-Key & ปรับแต่งกึ่งกลาง ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          นำเข้ารูปภาพเป็นชุด (Batch Upload)
        </button>
      </div>

      {/* TAB 1: STUDIO ENHANCEMENT CONTROLS */}
      {activeTab === 'studio' && (
        <div className="space-y-6">
          {/* Preset Filters Selector */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-blue-600" />
                  เลือกพรีเซ็ตโทนภาพ High-Key สตูดิโอ (High-Key Presets)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  คลิกพรีเซ็ตเพื่อปรับโทนผิวขาวใส พื้นหลังขาวบริสุทธิ์ และจัดกึ่งกลางใบหน้าอัตโนมัติ
                </p>
              </div>
              <button
                onClick={handleAutoCenterFace}
                className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
              >
                <Focus className="w-3.5 h-3.5" />
                รีเซ็ตกึ่งกลางใบหน้า (Golden 17%)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {HIGH_KEY_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    <div className="font-bold text-xs text-slate-800">{preset.name}</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{preset.desc}</p>
                    <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono text-slate-600 bg-white/80 px-2 py-1 rounded-lg border border-slate-200">
                      <span>High-Key: {preset.highKeyStrength}%</span>
                      <span>•</span>
                      <span>สว่าง: {preset.brightness}%</span>
                      <span>•</span>
                      <span>โฟกัส: {preset.focusY}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Studio Sliders & Settings (Canvas API Controls) */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* High-Key Strength */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> โทน High-Key:
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{highKeyStrength}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={highKeyStrength}
                  onChange={(e) => {
                    setHighKeyStrength(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Skin Whitening */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-rose-500" /> ผิวขาวเนียนใส:
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{skinWhitening}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={skinWhitening}
                  onChange={(e) => {
                    setSkinWhitening(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> ความสว่าง (Bright):
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="135"
                  value={brightness}
                  onChange={(e) => {
                    setBrightness(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Contrast className="w-3.5 h-3.5 text-indigo-500" /> คอนทราสต์:
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="135"
                  value={contrast}
                  onChange={(e) => {
                    setContrast(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Face Center Focus (Y) */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-emerald-600" /> จุดกึ่งกลางใบหน้า:
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{focusY}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="32"
                  value={focusY}
                  onChange={(e) => {
                    setFocusY(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Zoom Scale */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-purple-600" /> ระยะโฟกัสซูม:
                  </span>
                  <span className="font-mono text-blue-600 font-bold">{zoomScale}%</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="125"
                  value={zoomScale}
                  onChange={(e) => {
                    setZoomScale(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Search & Department Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px] max-w-sm flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหารหัส หรือชื่อพนักงาน..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
              >
                <option value="all">ทุกแผนก ({employees.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              แสดง {filteredEmployees.length} จาก {employees.length} ท่าน
            </div>
          </div>

          {/* Employee Studio Photo Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 space-y-2.5 hover:shadow-md transition-all group relative"
              >
                {/* Photo Portrait Box with applied live High-Key & Auto-center filter */}
                <div
                  className="aspect-3/4 rounded-xl overflow-hidden shadow-xs relative border border-slate-200/80 flex items-center justify-center bg-white"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  {emp.photoUrl ? (
                    <img
                      src={emp.photoUrl}
                      alt={emp.name}
                      className="w-full h-full object-cover transition-all"
                      style={{
                        objectPosition: `50% ${focusY}%`,
                        transform: `scale(${zoomScale / 100})`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) drop-shadow(0 0 1px rgba(255,255,255,0.5))`,
                        backgroundColor: '#ffffff',
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-2">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] font-bold">ไม่มีรูป</span>
                    </div>
                  )}

                  {/* High-Key Badge */}
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-blue-600/90 text-white text-[9px] font-bold shadow-xs">
                    High-Key
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-0.5 text-left">
                  <div className="text-xs font-bold text-slate-800 truncate">{emp.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-blue-600">{emp.empId}</span>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded" title="ชื่อไฟล์รูปมาตรฐาน">
                      {emp.empId}.jpg
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{emp.department} • {emp.position}</div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {/* Single Canvas Edit Button */}
                  <button
                    onClick={() => {
                      setSelectedEmployeeForEdit(emp);
                      setIndRotation(0);
                      setIndBrightness(brightness);
                      setIndContrast(contrast);
                      setIndSaturation(saturation);
                      setIndHighKey(highKeyStrength);
                      setIndSkinWhitening(skinWhitening);
                      setIndFocusY(focusY);
                      setIndZoom(zoomScale);
                      setShowOriginalComparison(false);
                      setIsEditModalOpen(true);
                    }}
                    className="py-1.5 text-[10px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Crop className="w-3 h-3" />
                    ปรับแต่ง
                  </button>

                  {/* Direct Upload for this Employee */}
                  <label className="py-1.5 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all">
                    <Upload className="w-3 h-3" />
                    อัปโหลดรูป
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDirectSingleEmpUpload(emp, file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BATCH UPLOAD DROPZONE & MATCHING SYSTEM */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Dropzone */}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) {
                handleBatchUpload(e.dataTransfer.files);
              }
            }}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-linear-to-b from-blue-50/30 to-white rounded-2xl p-8 text-center cursor-pointer block transition-all shadow-xs"
          >
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={(e) => {
                if (e.target.files) {
                  handleBatchUpload(e.target.files);
                }
              }}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-base font-bold text-slate-800 block">
              ลากไฟล์รูปภาพพนักงานมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (Batch Upload)
            </span>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xl mx-auto">
              ระบบจะจับคู่ชื่อไฟล์กับ <strong className="text-slate-700">รหัสพนักงาน (Emp ID)</strong> หรือชื่อพนักงานโดยอัตโนมัติ 
              พร้อมปรับแต่งภาพเป็นโทน High-Key ขาวสะอาด จัดกึ่งกลางใบหน้า และเปลี่ยนชื่อไฟล์เป็น <strong className="text-blue-600 font-mono">[รหัสพนักงาน].jpg</strong> ให้ทันที
            </p>
          </label>

          {/* Results & Management Section */}
          {matchResults.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-5">
              {/* Header Stats and Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base">
                      รายการรูปภาพและผลการจับคู่รหัสพนักงาน
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {matchResults.length} รูป
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ตรวจสอบและแก้ไขการจับคู่รูปถ่ายกับรหัสพนักงานก่อนทำการบันทึกลงบัตร
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Download All as ZIP */}
                  <button
                    type="button"
                    onClick={handleDownloadAllRenamedZip}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                    title="ดาวน์โหลดรูปภาพทั้งหมดที่เปลี่ยนชื่อเป็นรหัสพนักงานแล้ว [empId].jpg"
                  >
                    <FolderArchive className="w-4 h-4 text-amber-600" />
                    ดาวน์โหลด .ZIP (ชื่อตามรหัส)
                  </button>

                  {/* Apply All Matched */}
                  <button
                    type="button"
                    onClick={handleApplyAllMatched}
                    disabled={matchedCount === 0}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    บันทึกรูปที่ตรงรหัสทั้งหมด ({matchedCount} ท่าน)
                  </button>

                  {/* Clear list */}
                  <button
                    type="button"
                    onClick={() => setMatchResults([])}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ล้างรายการ
                  </button>
                </div>
              </div>

              {/* Status Summary Pills & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setUploadFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      uploadFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    ทั้งหมด ({matchResults.length})
                  </button>

                  <button
                    onClick={() => setUploadFilter('matched')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      uploadFilter === 'matched'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ตรงรหัสพนักงาน ({matchedCount})
                  </button>

                  <button
                    onClick={() => setUploadFilter('unmatched')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      uploadFilter === 'unmatched'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    ยังไม่ตรงรหัส ({unmatchedCount})
                  </button>
                </div>

                {/* Search within Uploads */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อไฟล์ หรือรหัส..."
                    value={uploadSearchQuery}
                    onChange={(e) => setUploadSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Uploaded Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatchResults.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                      item.status === 'matched'
                        ? 'bg-white border-emerald-200 shadow-xs hover:border-emerald-300'
                        : 'bg-amber-50/40 border-amber-200 shadow-xs hover:border-amber-300'
                    }`}
                  >
                    {/* Top Row: Photo Preview + Name Mapping */}
                    <div className="flex gap-3.5">
                      {/* Photo Thumbnail */}
                      <div className="w-20 h-26 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group shadow-xs">
                        <img
                          src={item.fileDataUrl}
                          alt={item.fileName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 right-1 px-1 py-0.2 bg-black/60 text-white rounded text-[8px] font-mono">
                          High-Key
                        </span>
                      </div>

                      {/* File Mapping Info */}
                      <div className="flex-1 min-w-0 space-y-1.5 text-left text-xs">
                        {/* Original vs Renamed filenames */}
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block">ชื่อไฟล์เดิม:</span>
                          <span className="text-xs font-bold text-slate-700 truncate block font-mono" title={item.originalFileName || item.fileName}>
                            {item.originalFileName || item.fileName}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-blue-600 font-bold block flex items-center gap-1">
                            <Tag className="w-3 h-3" /> ชื่อไฟล์มาตรฐาน (ตรงรหัส):
                          </span>
                          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 inline-block">
                            {item.renamedFileName || `${item.empId}.jpg`}
                          </span>
                        </div>

                        {/* Match Status Badge */}
                        <div className="pt-0.5">
                          {item.status === 'matched' && item.matchedEmployee ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                              <Check className="w-3 h-3" />
                              {item.matchMethod === 'exact_id'
                                ? 'ตรงรหัสเป๊ะ 100%'
                                : item.matchMethod === 'numeric_id'
                                ? 'ตรงจากตัวเลขรหัส'
                                : item.matchMethod === 'name_th'
                                ? 'ตรงจากชื่อไทย'
                                : item.matchMethod === 'name_en'
                                ? 'ตรงจากชื่ออังกฤษ'
                                : item.matchMethod === 'pattern_id'
                                ? 'ตรงจากรูปแบบรหัส'
                                : 'เลือกเอง'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                              <AlertCircle className="w-3 h-3" />
                              ยังไม่ตรงรหัสพนักงาน
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Matched Employee Details or Re-Assign Dropdown */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>พนักงานที่จับคู่:</span>
                        {item.matchedEmployee && (
                          <span className="font-mono text-blue-600 font-bold">{item.matchedEmployee.empId}</span>
                        )}
                      </div>

                      {/* Dropdown Selector to change/confirm employee */}
                      <select
                        value={item.matchedEmployee?.empId || ''}
                        onChange={(e) => handleReassignMatch(item.fileName, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="">-- เลือกรหัสพนักงาน (Re-assign) --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.empId}>
                            {emp.empId} : {emp.name} ({emp.department})
                          </option>
                        ))}
                      </select>

                      {item.matchedEmployee && (
                        <div className="text-[11px] text-slate-600 pt-0.5 truncate">
                          <strong className="text-slate-800">{item.matchedEmployee.name}</strong> • {item.matchedEmployee.department}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for this card */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1.5 text-xs">
                      {/* Download single */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadSinglePhoto(
                            item.fileDataUrl,
                            item.renamedFileName || `${item.empId}.jpg`
                          )
                        }
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="ดาวน์โหลดรูปภาพนี้ (ชื่อไฟล์ตรงรหัส)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteUploadedItem(item.fileName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="ลบออกจากรายการนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Apply single to employee */}
                      <button
                        type="button"
                        disabled={!item.matchedEmployee}
                        onClick={() => handleApplySingleMatch(item)}
                        className="flex-1 py-1 px-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        บันทึกลงบัตรท่านนี้
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMatchResults.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  ไม่พบรูปภาพตามเงื่อนไขการค้นหา/ตัวกรอง
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* WEBCAM MODAL */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                ถ่ายรูปพนักงานด้วยเว็บแคม High-Key (Studio Oval Guide)
              </h3>
              <button
                onClick={stopWebcam}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-left text-xs space-y-1">
              <label className="font-bold text-slate-700">เลือกรหัสพนักงานที่ต้องการถ่ายรูป:</label>
              <select
                value={webcamEmpId}
                onChange={(e) => setWebcamEmpId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.empId}>
                    {emp.empId} - {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-64 border-2 border-dashed border-emerald-400/90 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                <span className="text-[11px] font-semibold text-white bg-black/60 px-3 py-1 rounded-full mt-3">
                  จัดตำแหน่งใบหน้าให้อยู่ในกรอบวงรีกึ่งกลาง
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={stopWebcam}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={captureWebcam}
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                ถ่ายภาพและประมวลผล High-Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL PHOTO CANVAS EDIT MODAL */}
      {isEditModalOpen && selectedEmployeeForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Crop className="w-5 h-5 text-blue-600" />
                    ปรับแต่งรูปถ่าย Canvas High-Key: {selectedEmployeeForEdit.name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedEmployeeForEdit.empId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>ชื่อไฟล์รูปมาตรฐาน:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {selectedEmployeeForEdit.empId}.jpg
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before / After Preview Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Original Preview */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-bold text-slate-500">ภาพต้นฉบับ (Original)</span>
                <div className="aspect-3/4 max-w-[200px] mx-auto rounded-2xl overflow-hidden bg-slate-100 border border-slate-300 shadow-inner flex items-center justify-center">
                  <img
                    src={selectedEmployeeForEdit.photoUrl}
                    alt="original"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* High-Key Canvas Processed Result */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-bold text-blue-600 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> ภาพเรนเดอร์ Canvas High-Key
                </span>
                <div className="aspect-3/4 max-w-[200px] mx-auto rounded-2xl overflow-hidden bg-white border-2 border-blue-500 shadow-md flex items-center justify-center relative">
                  {indPreviewCanvasUrl ? (
                    <img
                      src={indPreviewCanvasUrl}
                      alt="high-key preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  )}

                  {/* Golden Ratio Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none border border-blue-400/20">
                    <div className="w-full h-[17%] border-b border-dashed border-emerald-400/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Auto Center Button */}
            <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-xl border border-blue-200/60 text-xs">
              <span className="font-semibold text-blue-900">จัดตำแหน่งใบหน้าให้อยู่ในสัดส่วนมาตรฐาน:</span>
              <button
                type="button"
                onClick={() => {
                  setIndFocusY(17);
                  setIndZoom(100);
                  setIndRotation(0);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1 transition-all"
              >
                <Focus className="w-3.5 h-3.5" />
                จัดกึ่งกลางอัตโนมัติ (Auto-Center)
              </button>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* High-Key Strength */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> โทน High-Key สตูดิโอ:
                  </span>
                  <span className="font-mono font-bold text-blue-600">{indHighKey}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={indHighKey}
                  onChange={(e) => setIndHighKey(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Skin Whitening */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-rose-500" /> ผิวขาวกระจ่างใส:
                  </span>
                  <span className="font-mono font-bold text-blue-600">{indSkinWhitening}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={indSkinWhitening}
                  onChange={(e) => setIndSkinWhitening(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> ความสว่าง (Brightness):
                  </span>
                  <span className="font-mono font-bold text-blue-600">{indBrightness}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="135"
                  value={indBrightness}
                  onChange={(e) => setIndBrightness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Contrast className="w-3.5 h-3.5 text-indigo-500" /> ความคมชัด (Contrast):
                  </span>
                  <span className="font-mono font-bold text-blue-600">{indContrast}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="135"
                  value={indContrast}
                  onChange={(e) => setIndContrast(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Vertical Focal Point */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-emerald-600" /> จุดกึ่งกลางใบหน้า (Y):
                  </span>
                  <span className="font-mono font-bold text-blue-600">{indFocusY}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  value={indFocusY}
                  onChange={(e) => setIndFocusY(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Zoom Scale & Rotate */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-slate-700 font-semibold mb-1">
                    <span>ระยะซูม:</span>
                    <span className="font-mono font-bold text-blue-600">{indZoom}%</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="130"
                    value={indZoom}
                    onChange={(e) => setIndZoom(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIndRotation((r) => (r + 90) % 360)}
                  className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold flex items-center gap-1 mt-3"
                  title="หมุน 90 องศา"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {indRotation}°
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t">
              <div>
                {indPreviewCanvasUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadSinglePhoto(
                        indPreviewCanvasUrl,
                        `${selectedEmployeeForEdit.empId}.jpg`
                      )
                    }
                    className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-all border border-slate-300"
                    title="ดาวน์โหลดรูปภาพเดี่ยวนี้พร้อมตั้งชื่อเป็นรหัสพนักงาน"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    ดาวน์โหลดภาพ ({selectedEmployeeForEdit.empId}.jpg)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={saveIndividualPhoto}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  บันทึกภาพ High-Key ลงบัตร
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

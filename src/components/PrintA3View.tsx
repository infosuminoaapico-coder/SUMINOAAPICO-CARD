import React, { useState, useRef } from 'react';
import { CardTemplate, Employee, PrintSettings } from '../types';
import { SingleCardPreview } from './SingleCardPreview';
import { generateDuplexPrintPdf, generateCalibrationTestPdf } from '../utils/pdfGenerator';
import { resolveImageUrl } from '../utils/imageUtils';
import {
  Printer,
  FileDown,
  Layers,
  RotateCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileCheck,
  Camera,
  Upload,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

interface PrintA3ViewProps {
  employees: Employee[];
  template: CardTemplate;
  settings: PrintSettings;
  onUpdateSettings: (newSettings: Partial<PrintSettings>) => void;
  onNavigateToInspector: () => void;
  onNavigateToPhotoManager?: () => void;
  onUpdateEmployees?: (updated: Employee[]) => void;
}

export const PrintA3View: React.FC<PrintA3ViewProps> = ({
  employees,
  template,
  settings,
  onUpdateSettings,
  onNavigateToInspector,
  onNavigateToPhotoManager,
  onUpdateEmployees,
}) => {
  const [currentSheetIdx, setCurrentSheetIdx] = useState<number>(0);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [pdfStatusText, setPdfStatusText] = useState<string>('');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);

  const cols = settings.columns || 5;
  const rows = settings.rows || 5;
  const cardsPerSheet = cols * rows; // 25 cards
  const totalSheets = Math.max(1, Math.ceil(employees.length / cardsPerSheet));

  // Current sheet employees slice
  const sheetEmployees = employees.slice(
    currentSheetIdx * cardsPerSheet,
    (currentSheetIdx + 1) * cardsPerSheet
  );

  // Count employees with photos
  const totalEmployeesWithPhoto = employees.filter((e) => !!resolveImageUrl(e.photoUrl)).length;
  const sheetEmployeesWithPhoto = sheetEmployees.filter((e) => !!resolveImageUrl(e.photoUrl)).length;

  const handleQuickUploadPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpdateEmployees) return;

    const fileList: File[] = Array.from(files);
    let updatedCount = 0;
    const photoMap: Record<string, string> = {};

    let filesRead = 0;
    fileList.forEach((file) => {
      const fileName = file.name;
      const rawBase = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const upper = rawBase.trim().toUpperCase();

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          // Find matching employee by empId
          const matched = employees.find(
            (emp) => emp.empId.toUpperCase() === upper || upper.includes(emp.empId.toUpperCase())
          );
          if (matched) {
            photoMap[matched.empId.toUpperCase()] = dataUrl;
            updatedCount++;
          }
        }
        filesRead++;
        if (filesRead === fileList.length) {
          if (updatedCount > 0) {
            const newEmployees = employees.map((emp) => {
              const newPhoto = photoMap[emp.empId.toUpperCase()];
              return newPhoto ? { ...emp, photoUrl: newPhoto } : emp;
            });
            onUpdateEmployees(newEmployees);
            setUploadFeedback(`✓ เพิ่มรูปถ่ายให้พนักงาน ${updatedCount} ท่านสำเร็จ พร้อมพิมพ์/ส่งออก A3 ทันที!`);
            setTimeout(() => setUploadFeedback(null), 5000);
          } else {
            setUploadFeedback(`ตรวจพบ ${fileList.length} ไฟล์ แต่ยังไม่ตรงกับรหัสพนักงาน กรุณาไปที่เมนู "จัดการรูปภาพ"`);
            setTimeout(() => setUploadFeedback(null), 5000);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (quickUploadInputRef.current) {
      quickUploadInputRef.current.value = '';
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfProgress(10);
      setPdfStatusText('กำลังเตรียมข้อมูลและจัดโครงสร้างหน้า A3...');

      const doc = await generateDuplexPrintPdf(
        employees,
        template,
        settings,
        (progress, status) => {
          setPdfProgress(progress);
          setPdfStatusText(status);
        }
      );

      doc.save(`A3_Employee_Cards_${template.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      setTimeout(() => {
        setIsGeneratingPdf(false);
      }, 500);
    } catch (err) {
      console.error('PDF Generation error:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintCalibrationSheet = () => {
    const doc = generateCalibrationTestPdf();
    doc.save('A3_Duplex_Calibration_Test_Sheet.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              พิมพ์บัตรลงกระดาษ A3 (A3 Duplex Printing)
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              ขนาด A3 (420 × 297 mm) • 25 ใบ/แผ่น
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                totalEmployeesWithPhoto === employees.length
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : totalEmployeesWithPhoto > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              มีรูปถ่ายแล้ว {totalEmployeesWithPhoto} / {employees.length} ท่าน
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            จัดวางแบบ 5 คอลัมน์ × 5 แถว พร้อม Registration Marks ┌ ┐ └ ┘ และระบบชดเชยหน้า-หลังตรงกัน 100%
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToPhotoManager && (
            <button
              onClick={onNavigateToPhotoManager}
              className="px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center gap-1.5"
              title="เปิดสตูดิโอปรับแต่งและจับคู่รูปถ่ายพนักงาน"
            >
              <Camera className="w-4 h-4 text-purple-600" />
              จัดการรูปถ่ายพนักงาน
            </button>
          )}

          {onUpdateEmployees && (
            <label className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4 text-slate-600" />
              อัปโหลดรูปด่วน
              <input
                ref={quickUploadInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleQuickUploadPhotos}
                className="hidden"
              />
            </label>
          )}

          <button
            onClick={handlePrintCalibrationSheet}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            title="พิมพ์แผ่นทดสอบความตรงของเครื่องพิมพ์"
          >
            <Compass className="w-4 h-4 text-slate-600" />
            แผ่นวัดชดเชย
          </button>

          <button
            onClick={onNavigateToInspector}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            ตรวจหน้า-หลังตรงกัน
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            {isGeneratingPdf ? 'กำลังสร้าง PDF...' : 'ส่งออก A3 PDF คมชัดสูง'}
          </button>
        </div>
      </div>

      {/* Upload notification toast */}
      {uploadFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{uploadFeedback}</span>
        </div>
      )}

      {/* Progress modal when exporting PDF */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-bounce">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              กำลังประมวลผลและสร้างไฟล์ PDF คุณภาพสูง (300 DPI)
            </h3>
            <p className="text-xs text-slate-500">{pdfStatusText}</p>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">{pdfProgress}%</span>
          </div>
        </div>
      )}

      {/* Sheet Navigation & Settings Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        {/* Sheet Pager */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSheetIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentSheetIdx === 0}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-700 px-2">
            แผ่นที่ {currentSheetIdx + 1} / {totalSheets} (พนักงาน {currentSheetIdx * cardsPerSheet + 1} - {Math.min(employees.length, (currentSheetIdx + 1) * cardsPerSheet)}) • แผ่นนี้มีรูปแล้ว {sheetEmployeesWithPhoto}/{sheetEmployees.length} คน
          </span>

          <button
            onClick={() => setCurrentSheetIdx((prev) => Math.min(totalSheets - 1, prev + 1))}
            disabled={currentSheetIdx >= totalSheets - 1}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Front / Back Sheet Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSide('front')}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSide === 'front'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            หน้า 1: ด้านหน้า (Front Sheet)
          </button>
          <button
            onClick={() => setActiveSide('back')}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSide === 'back'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            หน้า 2: ด้านหลังกลับด้านตรงกัน (Back Mirrored Sheet)
          </button>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.registrationMarks}
              onChange={(e) => onUpdateSettings({ registrationMarks: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>เครื่องหมาย ┌ ┐ └ ┘</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.cropMarks}
              onChange={(e) => onUpdateSettings({ cropMarks: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>เส้นกากบาทตัด (Crop Marks)</span>
          </label>
        </div>
      </div>

      {/* A3 Sheet Visual Stage */}
      <div className="bg-slate-800 rounded-3xl p-6 md:p-10 shadow-inner border border-slate-700 flex flex-col items-center justify-center overflow-x-auto">
        <div className="text-center mb-3">
          <span className="text-xs text-slate-400 font-mono">
            {activeSide === 'front' ? '• ด้านหน้า (FRONT SIDE) •' : '• ด้านหลัง (BACK SIDE - MIRRORED 100%) •'}
          </span>
        </div>

        {/* The Simulated A3 Sheet Container */}
        <div
          id="printable-a3-sheet"
          className="relative bg-white shadow-2xl rounded-sm p-8 transition-all border border-slate-400"
          style={{
            width: '960px', // Scaled preview of 420mm
            minHeight: '678px', // Scaled preview of 297mm (Ratio 1.414)
          }}
        >
          {/* Registration Marks ┌ ┐ └ ┘ */}
          {settings.registrationMarks && (
            <>
              <div className="absolute top-2 left-2 text-slate-900 font-mono text-2xl font-black">┌</div>
              <div className="absolute top-2 right-2 text-slate-900 font-mono text-2xl font-black">┐</div>
              <div className="absolute bottom-2 left-2 text-slate-900 font-mono text-2xl font-black">└</div>
              <div className="absolute bottom-2 right-2 text-slate-900 font-mono text-2xl font-black">┘</div>

              {/* Sheet Center ticks */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-900" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-900" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-slate-900" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-slate-900" />
            </>
          )}

          {/* 5x5 Grid of Cards */}
          <div
            className="grid grid-cols-5 gap-1.5"
            style={{
              transform:
                activeSide === 'front'
                  ? `translate(${settings.frontOffsetX * 2}px, ${settings.frontOffsetY * 2}px)`
                  : `translate(${settings.backOffsetX * 2}px, ${settings.backOffsetY * 2}px)`,
            }}
          >
            {Array.from({ length: 25 }).map((_, slotIdx) => {
              const col = slotIdx % cols;
              const row = Math.floor(slotIdx / cols);

              // If front: index matches standard slotIdx
              // If back in Duplex Long Edge: mirror column (cols - 1 - col)
              let targetIndex = slotIdx;
              if (activeSide === 'back') {
                if (settings.duplexMode === 'duplex_long_edge') {
                  targetIndex = row * cols + (cols - 1 - col);
                } else if (settings.duplexMode === 'duplex_short_edge') {
                  targetIndex = (rows - 1 - row) * cols + col;
                }
              }

              const employee = sheetEmployees[targetIndex];

              return (
                <div
                  key={slotIdx}
                  className="relative aspect-[85/55] border border-dashed border-slate-200 rounded-sm overflow-hidden flex items-center justify-center bg-slate-50/40"
                >
                  {employee ? (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      <SingleCardPreview
                        employee={employee}
                        template={template}
                        side={activeSide}
                        scale={0.53}
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-mono">
                      {slotIdx + 1}
                    </span>
                  )}

                  {/* Corner Cut Crosshairs */}
                  {settings.cropMarks && (
                    <div className="absolute inset-0 pointer-events-none border border-slate-300/60" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

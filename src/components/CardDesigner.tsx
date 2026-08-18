import React, { useState, useRef } from 'react';
import { CardTemplate, CardElement, CardSide, ElementType, Employee } from '../types';
import { SingleCardPreview } from './SingleCardPreview';
import { DEFAULT_LOGO_URL } from '../utils/imageUtils';
import {
  Layers,
  Move,
  Type,
  Image as ImageIcon,
  QrCode,
  Barcode,
  Square,
  BadgeAlert,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Upload,
  Sparkles,
  Grid,
  Magnet,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Save,
  RotateCcw,
  Palette,
  ChevronRight,
  Plus,
  Building
} from 'lucide-react';

interface CardDesignerProps {
  template: CardTemplate;
  sampleEmployee: Employee;
  onSaveTemplate: (updatedTemplate: CardTemplate) => void;
  onDuplicateTemplate?: (template: CardTemplate) => void;
}

export const CardDesigner: React.FC<CardDesignerProps> = ({
  template,
  sampleEmployee,
  onSaveTemplate,
}) => {
  const [currentSide, setCurrentSide] = useState<CardSide>('front');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [gridSizeMm, setGridSizeMm] = useState<number>(5); // 0 (off), 1, 5, 10
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1.8);
  const [isDraggingBg, setIsDraggingBg] = useState<boolean>(false);

  // Local state copy of template
  const [currentTemplate, setCurrentTemplate] = useState<CardTemplate>(template);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const selectedElement = currentTemplate.elements.find(
    (el) => el.id === selectedElementId && el.side === currentSide
  );

  const updateElement = (elementId: string, updates: Partial<CardElement>) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => {
        if (el.id === elementId) {
          return { ...el, ...updates };
        }
        return el;
      }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddElement = (type: ElementType) => {
    const newId = `el-${Date.now()}`;
    let newElement: CardElement = {
      id: newId,
      type,
      side: currentSide,
      xMm: 10,
      yMm: 10,
      widthMm: 30,
      heightMm: 8,
      zIndex: currentTemplate.elements.length + 1,
      visible: true,
      color: '#0f172a',
      fontSizePt: 8,
    };

    if (type === 'text') {
      newElement.staticText = 'ข้อความใหม่';
      newElement.fontSizePt = 8;
      newElement.fontWeight = 'bold';
    } else if (type === 'field') {
      newElement.fieldKey = 'name';
      newElement.label = 'ชื่อ:';
      newElement.fontSizePt = 9;
      newElement.fontWeight = 'bold';
    } else if (type === 'qrcode') {
      newElement.widthMm = 14;
      newElement.heightMm = 14;
    } else if (type === 'barcode') {
      newElement.widthMm = 35;
      newElement.heightMm = 8;
    } else if (type === 'logo') {
      newElement.widthMm = 24;
      newElement.heightMm = 7.6;
      newElement.imageUrl = DEFAULT_LOGO_URL;
      newElement.borderRadiusMm = 1.2;
      newElement.backgroundColor = '#ffffff';
    } else if (type === 'photo') {
      newElement.widthMm = 24;
      newElement.heightMm = 32;
      newElement.borderRadiusMm = 1.5;
      newElement.borderColor = '#1e3a8a';
      newElement.borderWidthMm = 0.5;
    } else if (type === 'shape') {
      newElement.shapeType = 'rectangle';
      newElement.backgroundColor = '#1e3a8a';
      newElement.widthMm = 85;
      newElement.heightMm = 4;
      newElement.xMm = 0;
      newElement.yMm = 0;
    } else if (type === 'badge') {
      newElement.backgroundColor = '#2563eb';
      newElement.borderRadiusMm = 1;
      newElement.widthMm = 25;
      newElement.heightMm = 5;
    }

    setCurrentTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElementId(newId);
  };

  const handleDeleteElement = (id: string) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleDuplicateElement = (el: CardElement) => {
    const duplicated: CardElement = {
      ...el,
      id: `el-${Date.now()}`,
      xMm: Math.min(el.xMm + 3, currentTemplate.cardWidthMm - el.widthMm),
      yMm: Math.min(el.yMm + 3, currentTemplate.cardHeightMm - el.heightMm),
      zIndex: currentTemplate.elements.length + 1,
    };
    setCurrentTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, duplicated],
    }));
    setSelectedElementId(duplicated.id);
  };

  // Background upload handlers
  const handleBgUpload = (file: File, targetSide: CardSide) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCurrentTemplate((prev) => {
        if (targetSide === 'front') {
          return {
            ...prev,
            frontBackground: {
              ...prev.frontBackground,
              type: 'image',
              imageUrl: dataUrl,
            },
          };
        } else {
          return {
            ...prev,
            backBackground: {
              ...prev.backBackground,
              type: 'image',
              imageUrl: dataUrl,
            },
          };
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveTemplate(currentTemplate);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">
              ออกแบบบัตรพนักงาน (Card Designer)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {currentTemplate.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ขนาดบัตรมาตรฐาน: {currentTemplate.cardWidthMm} × {currentTemplate.cardHeightMm} mm (แนวนอน) • ลากปรับตำแหน่งและตั้งค่าแบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            {savedSuccess ? 'บันทึกเทมเพลตเรียบร้อย!' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Toolbar: Add Elements & Backgrounds */}
        <div className="lg:col-span-3 space-y-4">
          {/* Side Selector (Front / Back) */}
          <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200/80">
            <label className="text-xs font-bold text-slate-600 block mb-2">เลือกด้านที่ต้องการออกแบบ:</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setCurrentSide('front')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  currentSide === 'front'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ด้านหน้า (Front Side)
              </button>
              <button
                onClick={() => setCurrentSide('back')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  currentSide === 'back'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ด้านหลัง (Back Side)
              </button>
            </div>
          </div>

          {/* Add Elements Toolbox */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              เพิ่มองค์ประกอบในบัตร
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddElement('field')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <Type className="w-4 h-4 text-blue-600" />
                <span>ฟิลด์ข้อมูล</span>
              </button>

              <button
                onClick={() => handleAddElement('text')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <Type className="w-4 h-4 text-indigo-600" />
                <span>ข้อความอิสระ</span>
              </button>

              <button
                onClick={() => handleAddElement('photo')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>รูปพนักงาน</span>
              </button>

              <button
                onClick={() => handleAddElement('logo')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <Building className="w-4 h-4 text-sky-600" />
                <span>โลโก้บริษัท</span>
              </button>

              <button
                onClick={() => handleAddElement('qrcode')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>QR Code</span>
              </button>

              <button
                onClick={() => handleAddElement('barcode')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <Barcode className="w-4 h-4 text-amber-600" />
                <span>Barcode</span>
              </button>

              <button
                onClick={() => handleAddElement('shape')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all text-xs font-medium text-slate-700 flex items-center gap-2"
              >
                <Square className="w-4 h-4 text-rose-600" />
                <span>แถบสี / กล่อง</span>
              </button>
            </div>
          </div>

          {/* Background Management */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              จัดการพื้นหลัง ({currentSide === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'})
            </h3>

            {/* Upload Custom BG */}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingBg(true);
              }}
              onDragLeave={() => setIsDraggingBg(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingBg(false);
                if (e.dataTransfer.files?.[0]) {
                  handleBgUpload(e.dataTransfer.files[0], currentSide);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer block transition-all ${
                isDraggingBg
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50'
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleBgUpload(e.target.files[0], currentSide);
                  }
                }}
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <span className="text-xs font-semibold text-slate-700 block">
                อัปโหลดรูปพื้นหลัง {currentSide === 'front' ? 'ด้านหน้า' : 'ด้านหลัง'}
              </span>
              <span className="text-[10px] text-slate-500">JPG, PNG หรือลากไฟล์มาวาง</span>
            </label>

            {/* Clear Image BG if uploaded */}
            {(currentSide === 'front'
              ? currentTemplate.frontBackground.imageUrl
              : currentTemplate.backBackground.imageUrl) && (
              <button
                onClick={() => {
                  setCurrentTemplate((prev) => ({
                    ...prev,
                    [currentSide === 'front' ? 'frontBackground' : 'backBackground']: {
                      type: 'color',
                      value: '#ffffff',
                      imageUrl: undefined,
                    },
                  }));
                }}
                className="w-full py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg transition-all"
              >
                ลบรูปพื้นหลังที่อัปโหลด
              </button>
            )}
          </div>
        </div>

        {/* Center: Interactive Visual Stage with Grid */}
        <div className="lg:col-span-6 space-y-4">
          {/* Stage Controls */}
          <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
            {/* Grid selector */}
            <div className="flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-600">เส้น Grid:</span>
              <select
                value={gridSizeMm}
                onChange={(e) => setGridSizeMm(parseInt(e.target.value))}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
              >
                <option value={0}>ปิด Grid</option>
                <option value={1}>1 มิลลิเมตร (ละเอียด)</option>
                <option value={5}>5 มิลลิเมตร (มาตรฐาน)</option>
                <option value={10}>10 มิลลิเมตร</option>
              </select>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">มุมมอง:</span>
              <button
                onClick={() => setZoomScale(Math.max(1, zoomScale - 0.2))}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200"
              >
                <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <span className="font-mono font-bold text-slate-700 w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale(Math.min(2.8, zoomScale + 0.2))}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200"
              >
                <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Canvas Working Area */}
          <div className="bg-slate-800 rounded-2xl p-8 shadow-inner border border-slate-700 min-h-[460px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Subtle stage rulers */}
            <div className="absolute top-2 text-[10px] font-mono text-slate-400">
              ขนาดบัตรมาตรฐาน {currentTemplate.cardWidthMm} มม. × {currentTemplate.cardHeightMm} มม.
            </div>

            {/* The Live Rendered Card */}
            <SingleCardPreview
              employee={sampleEmployee}
              template={currentTemplate}
              side={currentSide}
              scale={zoomScale}
              showGuides={true}
              gridSizeMm={gridSizeMm}
              selectedElementId={selectedElementId || undefined}
              onElementClick={(el) => setSelectedElementId(el.id)}
            />

            <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
              <span>คลิกที่องค์ประกอบบนบัตรเพื่อเลือกและแก้ไขพิกัด (X, Y, W, H)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Element Properties Inspector */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                คุณสมบัติองค์ประกอบ (Inspector)
              </h3>
              {selectedElement && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateElement(selectedElement)}
                    title="ทำซ้ำ"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    title="ลบองค์ประกอบ"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {selectedElement ? (
              <div className="space-y-4 text-xs">
                {/* Element Type Indicator */}
                <div className="bg-slate-100 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-slate-600">ชนิด:</span>
                  <span className="font-bold text-blue-700 uppercase">{selectedElement.type}</span>
                </div>

                {/* Field binding if type === 'field' */}
                {selectedElement.type === 'field' && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">ผูกกับข้อมูลพนักงาน:</label>
                    <select
                      value={selectedElement.fieldKey || 'name'}
                      onChange={(e) => updateElement(selectedElement.id, { fieldKey: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                    >
                      <option value="empId">รหัสพนักงาน (Emp ID)</option>
                      <option value="name">ชื่อ-นามสกุล (Name TH)</option>
                      <option value="nameEn">ชื่อภาษาอังกฤษ (Name EN)</option>
                      <option value="department">แผนก (Department)</option>
                      <option value="division">หน่วยงาน / โรงงาน (Division)</option>
                      <option value="position">ตำแหน่ง (Position)</option>
                      <option value="startDate">วันที่เริ่มงาน (Start Date)</option>
                      <option value="bloodType">หมู่เลือด (Blood Type)</option>
                      <option value="phone">เบอร์โทรศัพท์ (Phone)</option>
                      <option value="emergencyContact">ติดต่อฉุกเฉิน (Emergency)</option>
                      <option value="nationalId">เลขบัตรประชาชน (National ID)</option>
                    </select>

                    <div className="pt-2 space-y-1">
                      <label className="font-semibold text-slate-700">ข้อความกำกับ (Label):</label>
                      <input
                        type="text"
                        value={selectedElement.label || ''}
                        onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                        placeholder="เช่น ตำแหน่ง / Pos:"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Static Text if type === 'text' */}
                {selectedElement.type === 'text' && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">ข้อความ:</label>
                    <textarea
                      rows={3}
                      value={selectedElement.staticText || ''}
                      onChange={(e) => updateElement(selectedElement.id, { staticText: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                    />
                  </div>
                )}

                {/* Coordinate & Sizing (mm) */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold">ตำแหน่ง X (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={currentTemplate.cardWidthMm}
                      value={selectedElement.xMm}
                      onChange={(e) => updateElement(selectedElement.id, { xMm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold">ตำแหน่ง Y (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={currentTemplate.cardHeightMm}
                      value={selectedElement.yMm}
                      onChange={(e) => updateElement(selectedElement.id, { yMm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold">ความกว้าง W (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={selectedElement.widthMm}
                      onChange={(e) => updateElement(selectedElement.id, { widthMm: parseFloat(e.target.value) || 1 })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold">ความสูง H (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={selectedElement.heightMm}
                      onChange={(e) => updateElement(selectedElement.id, { heightMm: parseFloat(e.target.value) || 1 })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-center font-mono font-bold mt-1"
                    />
                  </div>
                </div>

                {/* Typography / Color settings if text */}
                {(selectedElement.type === 'text' || selectedElement.type === 'field') && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">ขนาดตัวอักษร (pt)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="4"
                          max="36"
                          value={selectedElement.fontSizePt || 8}
                          onChange={(e) => updateElement(selectedElement.id, { fontSizePt: parseFloat(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono font-bold text-center mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">สีตัวอักษร</label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="color"
                            value={selectedElement.color || '#000000'}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                          />
                          <input
                            type="text"
                            value={selectedElement.color || '#000000'}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 font-mono text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">การจัดวาง (Align)</label>
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        {(['left', 'center', 'right'] as const).map((al) => (
                          <button
                            key={al}
                            onClick={() => updateElement(selectedElement.id, { textAlign: al })}
                            className={`py-1 rounded border text-xs font-medium capitalize ${
                              selectedElement.textAlign === al
                                ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            {al === 'left' ? 'ชิดซ้าย' : al === 'center' ? 'กึ่งกลาง' : 'ชิดขวา'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shape / Badge Background color */}
                {(selectedElement.type === 'shape' || selectedElement.type === 'badge') && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">สีพื้นหลัง (Background)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedElement.backgroundColor || '#1e3a8a'}
                        onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={selectedElement.backgroundColor || '#1e3a8a'}
                        onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Move className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">คลิกเลือกองค์ประกอบในบัตรเพื่อแก้ไขคุณสมบัติ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { CardTemplate, Employee, PrintSettings } from '../types';
import { INITIAL_EMPLOYEES } from '../data/mockEmployees';
import { SingleCardPreview } from './SingleCardPreview';
import { 
  Layers, 
  RotateCw, 
  Sun, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Crosshair, 
  Maximize2, 
  RefreshCw,
  Printer,
  Sparkles,
  Info
} from 'lucide-react';

interface DuplexInspectorProps {
  template: CardTemplate;
  employee?: Employee;
  sampleEmployee?: Employee;
  settings: PrintSettings;
  onUpdateSettings: (newSettings: Partial<PrintSettings>) => void;
  onSwitchToPrint?: () => void;
}

export const DuplexInspector: React.FC<DuplexInspectorProps> = ({
  template,
  employee,
  sampleEmployee,
  settings,
  onUpdateSettings,
  onSwitchToPrint,
}) => {
  const activeEmployee = employee || sampleEmployee || INITIAL_EMPLOYEES[0];
  const [viewMode, setViewMode] = useState<'overlay' | 'flip' | 'light_table' | 'split' | 'registration'>('overlay');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.5);
  const [zoomScale, setZoomScale] = useState<number>(1.6);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showRulerGuide, setShowRulerGuide] = useState<boolean>(true);

  // Card dimensions in mm
  const cardW = template.cardWidthMm || 85;
  const cardH = template.cardHeightMm || 55;
  const mmToPx = 4 * zoomScale;
  const pixelWidth = cardW * mmToPx;
  const pixelHeight = cardH * mmToPx;

  // Calculate alignment status
  const isPerfectAligned = 
    Math.abs(settings.frontOffsetX) < 0.05 && 
    Math.abs(settings.frontOffsetY) < 0.05 && 
    Math.abs(settings.backOffsetX) < 0.05 && 
    Math.abs(settings.backOffsetY) < 0.05;

  return (
    <div className="space-y-6">
      {/* Header & Status Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">
              ระบบตรวจสอบและจัดตำแหน่งหน้า-หลังตรงกัน 100% (Duplex Alignment)
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Duplex Engine พร้อมทำงาน
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            จำลองการพิมพ์สองด้าน (Duplex) บนกระดาษ A3 พร้อมระบบชดเชยการป้อนกระดาษ ±10 มม. และตรวจสอบความตรงก่อนสั่งพิมพ์จริง
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onUpdateSettings({
                frontOffsetX: 0,
                frontOffsetY: 0,
                backOffsetX: 0,
                backOffsetY: 0,
              });
            }}
            className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            รีเซ็ตค่าชดเชย (0 mm)
          </button>
          <button
            onClick={onSwitchToPrint}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            ไปที่หน้าพิมพ์ A3
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Inspector Canvas */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mode Selector Tabs */}
          <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'overlay'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Overlay Mode (ซ้อนทับโปร่งแสง)
              </button>
              <button
                onClick={() => setViewMode('light_table')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'light_table'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light Table (กล่องไฟส่องทะลุ)
              </button>
              <button
                onClick={() => setViewMode('flip')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'flip'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                3D Flip (พลิกดูบัตรจริง)
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Split View (หน้า-หลังคู่กัน)
              </button>
              <button
                onClick={() => setViewMode('registration')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'registration'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                Registration Mark (กากบาทตัด)
              </button>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2 px-3">
              <span className="text-xs text-slate-500 font-medium">ขยาย:</span>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={zoomScale}
                onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                {Math.round(zoomScale * 100)}%
              </span>
            </div>
          </div>

          {/* Main Inspection Stage */}
          <div className="bg-slate-900/95 rounded-2xl p-8 shadow-inner border border-slate-800 min-h-[480px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Stage Background Grid */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Center Rulers & Guides */}
            {showRulerGuide && (
              <>
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500/30 pointer-events-none" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-500/30 pointer-events-none" />
              </>
            )}

            {/* 1. OVERLAY MODE */}
            {viewMode === 'overlay' && (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative rounded-xl overflow-hidden shadow-2xl transition-transform"
                  style={{
                    width: `${pixelWidth}px`,
                    height: `${pixelHeight}px`,
                  }}
                >
                  {/* Base Layer: Front Side */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `translate(${settings.frontOffsetX * mmToPx}px, ${settings.frontOffsetY * mmToPx}px)`,
                    }}
                  >
                    <SingleCardPreview
                      employee={activeEmployee}
                      template={template}
                      side="front"
                      scale={zoomScale}
                    />
                  </div>

                  {/* Overlaid Layer: Back Side (Mirrored horizontally for standard duplex inspection) */}
                  <div
                    className="absolute inset-0 mix-blend-multiply transition-opacity pointer-events-none"
                    style={{
                      opacity: overlayOpacity,
                      transform: `translate(${settings.backOffsetX * mmToPx}px, ${settings.backOffsetY * mmToPx}px)`,
                    }}
                  >
                    <SingleCardPreview
                      employee={activeEmployee}
                      template={template}
                      side="back"
                      scale={zoomScale}
                    />
                  </div>

                  {/* 4 Corner Registration Cut Lines Overlay */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-emerald-400/80 rounded-xl" />
                </div>

                {/* Opacity Control Slider */}
                <div className="bg-slate-800/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-700 flex items-center gap-4 text-white text-xs">
                  <span className="font-medium text-slate-300">ด้านหน้า (100%)</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-48 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="font-medium text-blue-400">
                    ด้านหลัง ({Math.round(overlayOpacity * 100)}%)
                  </span>
                </div>
              </div>
            )}

            {/* 2. LIGHT TABLE (X-RAY) MODE */}
            {viewMode === 'light_table' && (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.4)] border-4 border-amber-300/60 bg-white"
                  style={{
                    width: `${pixelWidth}px`,
                    height: `${pixelHeight}px`,
                  }}
                >
                  {/* Front Side with high backlight */}
                  <div
                    className="absolute inset-0 opacity-80"
                    style={{
                      transform: `translate(${settings.frontOffsetX * mmToPx}px, ${settings.frontOffsetY * mmToPx}px)`,
                    }}
                  >
                    <SingleCardPreview
                      employee={activeEmployee}
                      template={template}
                      side="front"
                      scale={zoomScale}
                    />
                  </div>

                  {/* Back Side flipped & shining through */}
                  <div
                    className="absolute inset-0 opacity-45 mix-blend-difference pointer-events-none"
                    style={{
                      transform: `scaleX(-1) translate(${settings.backOffsetX * mmToPx}px, ${settings.backOffsetY * mmToPx}px)`,
                    }}
                  >
                    <SingleCardPreview
                      employee={activeEmployee}
                      template={template}
                      side="back"
                      scale={zoomScale}
                    />
                  </div>
                </div>
                <p className="text-xs text-amber-200/80 bg-amber-950/60 px-4 py-1.5 rounded-full border border-amber-800/60">
                  💡 จำลองการส่องบัตรผ่านแสงไฟโต๊ะตัดกระดาษ (Light Box) เพื่อดูความสมมาตรของขอบและบาร์โค้ด
                </p>
              </div>
            )}

            {/* 3. 3D FLIP MODE */}
            {viewMode === 'flip' && (
              <div className="flex flex-col items-center gap-4">
                <SingleCardPreview
                  employee={activeEmployee}
                  template={template}
                  scale={zoomScale}
                  interactiveFlip={true}
                />
                <p className="text-xs text-slate-400 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
                  👆 คลิกที่บัตรเพื่อพลิกดูด้านหน้าและด้านหลัง 3D
                </p>
              </div>
            )}

            {/* 4. SPLIT VIEW */}
            {viewMode === 'split' && (
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="text-center space-y-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    ด้านหน้า (Front Side)
                  </span>
                  <SingleCardPreview
                    employee={activeEmployee}
                    template={template}
                    side="front"
                    scale={zoomScale * 0.85}
                  />
                </div>
                <div className="text-center space-y-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    ด้านหลัง (Back Side)
                  </span>
                  <SingleCardPreview
                    employee={activeEmployee}
                    template={template}
                    side="back"
                    scale={zoomScale * 0.85}
                  />
                </div>
              </div>
            )}

            {/* 5. REGISTRATION MARKS */}
            {viewMode === 'registration' && (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative bg-white rounded-xl shadow-2xl p-6 flex items-center justify-center"
                  style={{
                    width: `${pixelWidth + 80}px`,
                    height: `${pixelHeight + 80}px`,
                  }}
                >
                  {/* 4 Corner Registration Marks ┌ ┐ └ ┘ */}
                  <div className="absolute top-2 left-2 text-slate-900 font-mono text-xl font-bold">┌</div>
                  <div className="absolute top-2 right-2 text-slate-900 font-mono text-xl font-bold">┐</div>
                  <div className="absolute bottom-2 left-2 text-slate-900 font-mono text-xl font-bold">└</div>
                  <div className="absolute bottom-2 right-2 text-slate-900 font-mono text-xl font-bold">┘</div>

                  {/* Guillotine alignment ticks */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-l border-dashed border-red-500" />
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 border-t border-dashed border-red-500" />

                  {/* Card Container */}
                  <SingleCardPreview
                    employee={activeEmployee}
                    template={template}
                    side={isFlipped ? 'back' : 'front'}
                    scale={zoomScale}
                  />
                </div>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700"
                >
                  สลับดูหน้า: {isFlipped ? 'ด้านหลัง (Back)' : 'ด้านหน้า (Front)'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: High-Precision Offset Controls */}
        <div className="lg:col-span-4 space-y-5">
          {/* Duplex Mode Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <RotateCw className="w-4 h-4 text-blue-600" />
              <span>โหมดพิมพ์สองด้าน (Duplex Printing)</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label
                onClick={() => onUpdateSettings({ duplexMode: 'duplex_long_edge' })}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  settings.duplexMode === 'duplex_long_edge'
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="duplex"
                  checked={settings.duplexMode === 'duplex_long_edge'}
                  onChange={() => onUpdateSettings({ duplexMode: 'duplex_long_edge' })}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Duplex (Long Edge / พลิกด้านยาว)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    มาตรฐานเครื่องพิมพ์ A3 อัตโนมัติ สลับคอลัมน์ซ้าย-ขวาพอดี 100%
                  </div>
                </div>
              </label>

              <label
                onClick={() => onUpdateSettings({ duplexMode: 'duplex_short_edge' })}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  settings.duplexMode === 'duplex_short_edge'
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="duplex"
                  checked={settings.duplexMode === 'duplex_short_edge'}
                  onChange={() => onUpdateSettings({ duplexMode: 'duplex_short_edge' })}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Duplex (Short Edge / พลิกด้านสั้น)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    สำหรับพิมพ์แบบพลิกหัวกระดาษขึ้นบน
                  </div>
                </div>
              </label>

              <label
                onClick={() => onUpdateSettings({ duplexMode: 'simplex' })}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  settings.duplexMode === 'simplex'
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="duplex"
                  checked={settings.duplexMode === 'simplex'}
                  onChange={() => onUpdateSettings({ duplexMode: 'simplex' })}
                  className="mt-1 text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Simplex (พิมพ์หน้าเดียวก่อน แล้วป้อนกระดาษซ้ำ)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    สำหรับเครื่องพิมพ์ที่ไม่มีระบบพิมพ์สองด้านอัตโนมัติ
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Millimeter Offset Calibration Box */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>ชดเชยตำแหน่งหัวพิมพ์ (Offset ±10 mm)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                ละเอียด 0.1 mm
              </span>
            </div>

            {/* Front Side Offsets */}
            <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                ตำแหน่งด้านหน้า (Front Offset)
              </span>

              {/* Front X */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>แนวนอน (Front Offset X):</span>
                  <span className="font-mono font-bold text-blue-700">
                    {settings.frontOffsetX > 0 ? `+${settings.frontOffsetX.toFixed(1)}` : settings.frontOffsetX.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.2"
                  value={settings.frontOffsetX}
                  onChange={(e) => onUpdateSettings({ frontOffsetX: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Front Y */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>แนวตั้ง (Front Offset Y):</span>
                  <span className="font-mono font-bold text-blue-700">
                    {settings.frontOffsetY > 0 ? `+${settings.frontOffsetY.toFixed(1)}` : settings.frontOffsetY.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.2"
                  value={settings.frontOffsetY}
                  onChange={(e) => onUpdateSettings({ frontOffsetY: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Back Side Offsets */}
            <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                ตำแหน่งด้านหลัง (Back Offset)
              </span>

              {/* Back X */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>แนวนอน (Back Offset X):</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {settings.backOffsetX > 0 ? `+${settings.backOffsetX.toFixed(1)}` : settings.backOffsetX.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.2"
                  value={settings.backOffsetX}
                  onChange={(e) => onUpdateSettings({ backOffsetX: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Back Y */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>แนวตั้ง (Back Offset Y):</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {settings.backOffsetY > 0 ? `+${settings.backOffsetY.toFixed(1)}` : settings.backOffsetY.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.2"
                  value={settings.backOffsetY}
                  onChange={(e) => onUpdateSettings({ backOffsetY: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Quick Helper Tips */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                คำแนะนำการปรับชดเชย:
              </div>
              <p className="text-[11px] leading-relaxed text-blue-700">
                หากเครื่องพิมพ์ดึงกระดาษเบี่ยงขวา ให้เลื่อนค่า Back Offset X ไปทางลบ (- mm) เพื่อให้ภาพด้านหลังกลับมาทับซ้อนกับด้านหน้าพอดี 100%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

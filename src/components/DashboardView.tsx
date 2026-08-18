import React from 'react';
import { Employee, CardTemplate, PrintSettings } from '../types';
import { SingleCardPreview } from './SingleCardPreview';
import {
  Users,
  Printer,
  Layers,
  Sparkles,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Award,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface DashboardViewProps {
  employees: Employee[];
  template: CardTemplate;
  templates: CardTemplate[];
  settings: PrintSettings;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  template,
  templates,
  settings,
  onNavigate,
}) => {
  const missingPhotos = employees.filter((e) => !e.photoUrl).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            ระบบออกบัตรพนักงานอัตโนมัติ พิมพ์ A3 หน้า-หลังตรงกัน 100%
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Employee ID Card Generator (A3 Duplex Suite)
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            สร้างบัตรพนักงานมาตรฐาน 8.5 × 5.5 ซม. พร้อมระบบวางผัง 5×5 (25 ใบต่อแผ่น) บนกระดาษ A3 จัดตำแหน่งหน้า-หลังตรงกัน 100% ไม่มีปัญหาการเหลื่อมหรือกลับด้าน
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('auto_generate')}
              className="px-5 py-2.5 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              สร้างบัตรอัตโนมัติ (Auto Batch)
            </button>

            <button
              onClick={() => onNavigate('inspector')}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              ตรวจสอบความตรงหน้า-หลัง
            </button>

            <button
              onClick={() => onNavigate('print_a3')}
              className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              แท่นพิมพ์ A3
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              พนักงานทั้งหมด
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {employees.length}{' '}
            <span className="text-xs font-medium text-slate-500">ท่าน</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel / CSV พร้อมใช้งาน
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('photos')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              สถานะรูปถ่าย
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {employees.length - missingPhotos}{' '}
            <span className="text-xs font-medium text-slate-500">
              / {employees.length}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {missingPhotos === 0 ? 'รูปถ่ายครบถ้วน' : `ขาดอีก ${missingPhotos} รูป`}
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('templates')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              เทมเพลตบัตร
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {templates.length}{' '}
            <span className="text-xs font-medium text-slate-500">รูปแบบ</span>
          </div>
          <div className="text-[11px] text-purple-600 font-semibold">
            {template.name.split(' ')[0]} (ใช้งานอยู่)
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate('inspector')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ความตรงหน้า-หลัง
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            100%{' '}
            <span className="text-xs font-medium text-emerald-600">
              (Duplex Calibrated)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Front: 0.0mm | Back: 0.0mm
          </div>
        </div>
      </div>

      {/* Featured Showcase: Active Card Preview & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Template Card 3D Flip Showcase */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                ตัวอย่างบัตรที่กำลังใช้งาน (Active Template Showcase)
              </h3>
              <p className="text-xs text-slate-500">
                {template.name} • ขนาด 85 × 55 มม.
              </p>
            </div>
            <button
              onClick={() => onNavigate('designer')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              แก้ไขการจัดวาง <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[260px]">
            {employees.length > 0 && (
              <SingleCardPreview
                employee={employees[0]}
                template={template}
                scale={1.35}
                interactiveFlip={true}
              />
            )}
            <p className="text-xs text-slate-400 mt-4">
              👆 คลิกที่บัตรเพื่อพลิกดูด้านหน้าและด้านหลัง 3D
            </p>
          </div>
        </div>

        {/* Right: Essential Workflows */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">
            ขั้นตอนการทำงานที่แนะนำ (Recommended Workflow)
          </h3>

          <div
            onClick={() => onNavigate('employees')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
              1
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800">
                นำเข้าข้อมูลพนักงาน (Excel / CSV)
              </h4>
              <p className="text-[11px] text-slate-500">
                อัปโหลดรายชื่อพนักงาน แผนก ตำแหน่ง และรหัสพนักงาน
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-all" />
          </div>

          <div
            onClick={() => onNavigate('photos')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              2
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800">
                อัปโหลดรูปพนักงานชุด (Auto Match SAT0564.jpg)
              </h4>
              <p className="text-[11px] text-slate-500">
                ระบบจะจับคู่รูปภาพกับรหัสพนักงานให้อัตโนมัติ หรือถ่ายด้วยเว็บแคม
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
          </div>

          <div
            onClick={() => onNavigate('inspector')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
              3
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800">
                ตรวจสอบความตรงหน้า-หลัง (Duplex Alignment)
              </h4>
              <p className="text-[11px] text-slate-500">
                ใช้โหมด Overlay หรือกล่องไฟส่องทะลุเพื่อยืนยันว่าตรงกัน 100%
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-all" />
          </div>

          <div
            onClick={() => onNavigate('print_a3')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all">
              4
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800">
                พิมพ์ลงกระดาษ A3 / ส่งออก PDF คุณภาพสูง
              </h4>
              <p className="text-[11px] text-slate-500">
                จัดวาง 25 ใบต่อแผ่น พร้อมเส้นตัดและมาร์ก Registration
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

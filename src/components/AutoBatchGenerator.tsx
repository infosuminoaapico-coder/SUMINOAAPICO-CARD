import React, { useState } from 'react';
import { Employee, CardTemplate, PrintSettings } from '../types';
import { SingleCardPreview } from './SingleCardPreview';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Users,
  Layers,
  ArrowRight,
  Filter,
  Check,
  Search,
  Eye
} from 'lucide-react';

interface AutoBatchGeneratorProps {
  employees: Employee[];
  template: CardTemplate;
  templates: CardTemplate[];
  onSelectTemplate: (template: CardTemplate) => void;
  onNavigateToPrint: (selectedEmployees: Employee[]) => void;
  onNavigateToInspector: () => void;
}

export const AutoBatchGenerator: React.FC<AutoBatchGeneratorProps> = ({
  employees,
  template,
  templates,
  onSelectTemplate,
  onNavigateToPrint,
  onNavigateToInspector,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(employees.map((e) => e.id));
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchSearch && matchDept;
  });

  const selectedEmployees = employees.filter((e) => selectedIds.includes(e.id));
  const missingPhotoCount = selectedEmployees.filter((e) => !e.photoUrl).length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
              สร้างบัตรอัตโนมัติ (Auto Batch Generator)
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              สร้างแล้ว {selectedEmployees.length} ใบ
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            ระบบจะสร้างรหัสบาร์โค้ด QR Code ข้อมูลพนักงาน และเชื่อมต่อรูปภาพให้อัตโนมัติในคลิกเดียว พร้อมส่งไปยังแท่นพิมพ์ A3
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToInspector}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            ตรวจหน้า-หลังตรงกัน 100%
          </button>

          <button
            onClick={() => onNavigateToPrint(selectedEmployees)}
            disabled={selectedEmployees.length === 0}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            ส่งพิมพ์ A3 ({selectedEmployees.length} ใบ)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Template Switcher & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Template Selection */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            เทมเพลตที่ใช้งาน
          </span>
          <select
            value={template.id}
            onChange={(e) => {
              const t = templates.find((tpl) => tpl.id === e.target.value);
              if (t) onSelectTemplate(t);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({tpl.category})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500">
            {template.description}
          </div>
        </div>

        {/* Card 2: Batch Calculation */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            การจัดวางลงกระดาษ A3
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">
              {Math.ceil(selectedEmployees.length / 25)}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              แผ่นกระดาษ A3 (พิมพ์หน้า-หลัง 25 ใบ/แผ่น)
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            คำนวณจากตาราง 5 คอลัมน์ × 5 แถว ขนาดมาตรฐาน 8.5 × 5.5 ซม.
          </div>
        </div>

        {/* Card 3: Photo Completeness Status */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            ความพร้อมของรูปภาพ
          </span>
          {missingPhotoCount === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>รูปภาพครบถ้วน 100% (พร้อมพิมพ์)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>ขาดรูปภาพ {missingPhotoCount} ท่าน (ใช้รูปเงาเริ่มต้น)</span>
            </div>
          )}
          <div className="text-[11px] text-slate-500">
            สามารถอัปโหลดรูปชุดได้ที่เมนู "จัดการรูปภาพ"
          </div>
        </div>
      </div>

      {/* Filter and Switch Side View */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800"
          />
        </div>

        {/* Filter Department */}
        <div className="flex items-center gap-3">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">ทุกแผนก / All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Front / Back Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPreviewSide('front')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                previewSide === 'front'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ดูด้านหน้า
            </button>
            <button
              onClick={() => setPreviewSide('back')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                previewSide === 'back'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ดูด้านหลัง
            </button>
          </div>
        </div>
      </div>

      {/* Live Generated Cards Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                filteredEmployees.length > 0 &&
                selectedIds.length === filteredEmployees.length
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>
              เลือกทั้งหมด ({selectedEmployees.length} / {filteredEmployees.length} คน)
            </span>
          </div>
          <span className="text-xs text-slate-400">
            แสดงตัวอย่างขนาด 8.5 × 5.5 ซม.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => {
            const isSelected = selectedIds.includes(emp.id);
            return (
              <div
                key={emp.id}
                onClick={() => handleToggleSelect(emp.id)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer space-y-3 relative group ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Checkbox badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-mono font-bold text-xs text-blue-600">
                      {emp.empId}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[120px]">
                    {emp.name}
                  </span>
                </div>

                {/* Scaled Card Preview */}
                <div className="flex justify-center overflow-hidden py-1">
                  <SingleCardPreview
                    employee={emp}
                    template={template}
                    side={previewSide}
                    scale={0.88}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

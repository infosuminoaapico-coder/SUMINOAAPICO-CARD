import React, { useState } from 'react';
import { CardTemplate, Employee } from '../types';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';
import { SingleCardPreview } from './SingleCardPreview';
import {
  Layers,
  Plus,
  Copy,
  Download,
  Upload,
  Check,
  Edit3,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileJson,
  RotateCcw
} from 'lucide-react';

interface TemplateManagerProps {
  templates: CardTemplate[];
  activeTemplate: CardTemplate;
  sampleEmployee: Employee;
  onSelectTemplate: (template: CardTemplate) => void;
  onUpdateTemplates: (templates: CardTemplate[]) => void;
  onEditTemplate: (template: CardTemplate) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  activeTemplate,
  sampleEmployee,
  onSelectTemplate,
  onUpdateTemplates,
  onEditTemplate,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredTemplates = templates.filter((tpl) => {
    return filterCategory === 'all' || tpl.category === filterCategory;
  });

  const handleDuplicate = (tpl: CardTemplate) => {
    const newTpl: CardTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (สำเนา)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateTemplates([newTpl, ...templates]);
  };

  const handleDelete = (id: string) => {
    if (templates.length <= 1) {
      alert('ไม่สามารถลบเทมเพลตสุดท้ายได้');
      return;
    }
    if (confirm('คุณต้องการลบเทมเพลตนี้ใช่หรือไม่?')) {
      const remaining = templates.filter((t) => t.id !== id);
      onUpdateTemplates(remaining);
      if (activeTemplate.id === id) {
        onSelectTemplate(remaining[0]);
      }
    }
  };

  const handleExportJson = (tpl: CardTemplate) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tpl, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `template_${tpl.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as CardTemplate;
        if (!imported.name || !imported.elements) {
          throw new Error('Invalid template format');
        }
        imported.id = `tpl-imported-${Date.now()}`;
        onUpdateTemplates([imported, ...templates]);
        onSelectTemplate(imported);
        alert(`นำเข้าเทมเพลต "${imported.name}" สำเร็จ`);
      } catch (err) {
        alert('ไฟล์ JSON ไม่ถูกต้องตามรูปแบบเทมเพลต');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              จัดการเทมเพลตบัตร (Template Management)
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {templates.length} รูปแบบ
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            เลือกเทมเพลตมาตรฐาน ออกแบบใหม่ หรือนำเข้า/ส่งออกไฟล์เทมเพลตแบบกำหนดเอง
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Templates */}
          <button
            onClick={() => {
              if (confirm('คุณต้องการรีเซ็ตเทมเพลตเป็นค่ามาตรฐานของบริษัท ซูมิโน อาปิโก (ไทยแลนด์) จำกัด ใช่หรือไม่?')) {
                onUpdateTemplates(DEFAULT_TEMPLATES);
                onSelectTemplate(DEFAULT_TEMPLATES[0]);
              }
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            title="รีเซ็ตเป็นเทมเพลตมาตรฐาน ซูมิโน อาปิโก"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>รีเซ็ตเทมเพลตมาตรฐาน</span>
          </button>

          {/* Import JSON */}
          <label className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>นำเข้า JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* New Blank Template */}
          <button
            onClick={() => {
              const blank: CardTemplate = {
                id: `tpl-custom-${Date.now()}`,
                name: 'เทมเพลตกำหนดเอง (Custom Design)',
                description: 'เทมเพลตเปล่าสำหรับออกแบบตามความต้องการ',
                category: 'permanent',
                cardWidthMm: 85,
                cardHeightMm: 55,
                orientation: 'landscape',
                companyName: 'บริษัท ของคุณ จำกัด',
                companyNameEn: 'YOUR COMPANY CO., LTD.',
                logoUrl: '',
                frontBackground: { type: 'color', value: '#ffffff' },
                backBackground: { type: 'color', value: '#f8fafc' },
                elements: [
                  {
                    id: 'el-1',
                    type: 'field',
                    side: 'front',
                    fieldKey: 'name',
                    xMm: 30,
                    yMm: 15,
                    widthMm: 50,
                    heightMm: 6,
                    fontSizePt: 10,
                    fontWeight: 'bold',
                    zIndex: 1,
                    visible: true,
                  },
                  {
                    id: 'el-2',
                    type: 'photo',
                    side: 'front',
                    xMm: 4,
                    yMm: 10,
                    widthMm: 24,
                    heightMm: 32,
                    zIndex: 1,
                    visible: true,
                  },
                  {
                    id: 'el-3',
                    type: 'qrcode',
                    side: 'front',
                    xMm: 65,
                    yMm: 35,
                    widthMm: 15,
                    heightMm: 15,
                    zIndex: 1,
                    visible: true,
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              onUpdateTemplates([blank, ...templates]);
              onSelectTemplate(blank);
              onEditTemplate(blank);
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            สร้างเทมเพลตใหม่
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'permanent', 'contractor', 'visitor'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              filterCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat === 'all'
              ? 'ทั้งหมด (All Templates)'
              : cat === 'permanent'
              ? 'พนักงานประจำ'
              : cat === 'contractor'
              ? 'ผู้รับเหมา (Contractor)'
              : 'ผู้มาติดต่อ (Visitor)'}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => {
          const isActive = activeTemplate.id === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`bg-white rounded-3xl p-5 border transition-all space-y-4 relative ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {tpl.description}
                  </p>
                </div>
                {isActive && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    กำลังใช้งาน
                  </span>
                )}
              </div>

              {/* 3D Flip Card Preview */}
              <div className="flex justify-center py-2">
                <SingleCardPreview
                  employee={sampleEmployee}
                  template={tpl}
                  scale={0.92}
                  interactiveFlip={true}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                คลิกที่บัตรเพื่อพลิกดูด้านหน้าและหลัง 3D
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    title="ทำซ้ำเทมเพลต"
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExportJson(tpl)}
                    title="ส่งออก JSON"
                    className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  >
                    <FileJson className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    title="ลบเทมเพลต"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditTemplate(tpl)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    แก้ไขการจัดวาง
                  </button>

                  {!isActive && (
                    <button
                      onClick={() => onSelectTemplate(tpl)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
                    >
                      เลือกใช้เทมเพลตนี้
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PrintSettings, PrinterCalibrationProfile } from '../types';
import { generateCalibrationTestPdf } from '../utils/pdfGenerator';
import {
  Settings,
  Sliders,
  Printer,
  Database,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  HelpCircle,
  HardDrive
} from 'lucide-react';

interface SettingsViewProps {
  settings: PrintSettings;
  onUpdateSettings: (newSettings: Partial<PrintSettings>) => void;
  onResetAllData?: () => void;
}

const DEFAULT_PROFILES: PrinterCalibrationProfile[] = [
  {
    id: 'prof-1',
    name: 'Canon imageRUNNER ADVANCE A3 (มาตรฐาน)',
    frontOffsetX: 0,
    frontOffsetY: 0,
    backOffsetX: 0,
    backOffsetY: 0,
    notes: 'เครื่องพิมพ์เลเซอร์สีระบบป้อนกระดาษแม่นยำสูง',
    isDefault: true,
  },
  {
    id: 'prof-2',
    name: 'Epson EcoTank L18050 / L1800 (A3 Photo)',
    frontOffsetX: 0.5,
    frontOffsetY: -0.2,
    backOffsetX: -0.5,
    backOffsetY: -0.2,
    notes: 'ชดเชยระยะดึงกระดาษด้านหลังเบี่ยงขวา 0.5 มม.',
    isDefault: false,
  },
  {
    id: 'prof-3',
    name: 'Fuji Xerox DocuCentre A3 Laser',
    frontOffsetX: 0,
    frontOffsetY: 0.4,
    backOffsetX: 0,
    backOffsetY: 0.4,
    notes: 'ชดเชยระยะมาร์จิ้นบนล่าง',
    isDefault: false,
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const [profiles, setProfiles] = useState<PrinterCalibrationProfile[]>(DEFAULT_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('prof-1');
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const handleApplyProfile = (profile: PrinterCalibrationProfile) => {
    setSelectedProfileId(profile.id);
    onUpdateSettings({
      frontOffsetX: profile.frontOffsetX,
      frontOffsetY: profile.frontOffsetY,
      backOffsetX: profile.backOffsetX,
      backOffsetY: profile.backOffsetY,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleSaveCurrentAsProfile = () => {
    if (!newProfileName.trim()) {
      alert('กรุณาระบุชื่อเครื่องพิมพ์');
      return;
    }

    const newProf: PrinterCalibrationProfile = {
      id: `prof-${Date.now()}`,
      name: newProfileName,
      frontOffsetX: settings.frontOffsetX,
      frontOffsetY: settings.frontOffsetY,
      backOffsetX: settings.backOffsetX,
      backOffsetY: settings.backOffsetY,
      notes: 'กำหนดเอง',
      isDefault: false,
    };

    setProfiles([...profiles, newProf]);
    setSelectedProfileId(newProf.id);
    setNewProfileName('');
    alert(`บันทึกโปรไฟล์ "${newProf.name}" เรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              ตั้งค่าระบบ & โปรไฟล์เครื่องพิมพ์ (System Settings)
            </h2>
            {saveToast && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                บันทึกการตั้งค่าแล้ว
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกโปรไฟล์การชดเชยเครื่องพิมพ์ (Offset Profiles) และการเชื่อมต่อฐานข้อมูลภายนอก
          </p>
        </div>

        <button
          onClick={() => {
            const doc = generateCalibrationTestPdf();
            doc.save('A3_Duplex_Calibration_Test_Sheet.pdf');
          }}
          className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4 text-blue-600" />
          พิมพ์แผ่นทดสอบ Calibration Sheet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Printer Calibration Profiles */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              โปรไฟล์การชดเชยเครื่องพิมพ์ (Printer Calibration Profiles)
            </h3>
          </div>

          <div className="space-y-3">
            {profiles.map((prof) => {
              const isSelected = selectedProfileId === prof.id;
              return (
                <div
                  key={prof.id}
                  onClick={() => handleApplyProfile(prof)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      {prof.name}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                        กำลังใช้งาน
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">{prof.notes}</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-100/70 p-2 rounded-xl">
                    <div>
                      Front: X={prof.frontOffsetX}mm, Y={prof.frontOffsetY}mm
                    </div>
                    <div>
                      Back: X={prof.backOffsetX}mm, Y={prof.backOffsetY}mm
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Profile from Current Settings */}
          <div className="pt-3 border-t space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              บันทึกค่าชดเชยปัจจุบันเป็นโปรไฟล์ใหม่:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="เช่น เครื่องพิมพ์ HP ชั้น 2"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium"
              />
              <button
                onClick={handleSaveCurrentAsProfile}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shrink-0"
              >
                บันทึกโปรไฟล์
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Database & Cloud Sync Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            การเชื่อมต่อฐานข้อมูลและคลาวด์ (Database & Cloud)
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-purple-50/70 border border-purple-200/60 rounded-2xl space-y-2">
              <div className="font-bold text-purple-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-700" />
                MySQL 8.0+ Integration
              </div>
              <p className="text-purple-800 leading-relaxed text-[11px]">
                รองรับการเชื่อมต่อไปยังเซิร์ฟเวอร์ MySQL ประจำองค์กร โดยสามารถส่งออกคำสั่งสร้างตาราง (DDL) และชุดข้อมูลพนักงานได้ที่เมนู "จัดการข้อมูลพนักงาน"
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Google Sheets Real-time Sync
              </div>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                คุณสามารถแชร์ลิงก์ Google Sheets ในรูปแบบ CSV (File &gt; Share &gt; Publish to web &gt; CSV) เพื่อให้ระบบดึงข้อมูลพนักงานรุ่นล่าสุดได้แบบอัตโนมัติ
              </p>
            </div>

            <div className="pt-4 border-t space-y-3">
              <span className="font-bold text-slate-700 block">จัดการข้อมูลภายในเครื่อง (Local Storage):</span>
              <button
                onClick={() => {
                  if (confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นจากโรงงาน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

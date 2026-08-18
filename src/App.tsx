import React, { useState, useEffect } from 'react';
import { Employee, CardTemplate, PrintSettings } from './types';
import { INITIAL_EMPLOYEES } from './data/mockEmployees';
import { DEFAULT_TEMPLATES } from './data/defaultTemplates';
import { DashboardView } from './components/DashboardView';
import { EmployeeManager } from './components/EmployeeManager';
import { PhotoManager } from './components/PhotoManager';
import { AutoBatchGenerator } from './components/AutoBatchGenerator';
import { DuplexInspector } from './components/DuplexInspector';
import { PrintA3View } from './components/PrintA3View';
import { CardDesigner } from './components/CardDesigner';
import { TemplateManager } from './components/TemplateManager';
import { SettingsView } from './components/SettingsView';
import {
  saveEmployeesToLocal,
  loadEmployeesFromLocal,
  saveTemplatesToLocal,
  loadTemplatesFromLocal,
  LOCAL_STORAGE_KEYS,
} from './utils/storageUtils';
import {
  LayoutDashboard,
  Users,
  Camera,
  Zap,
  Layers,
  Printer,
  Palette,
  FolderKanban,
  Settings,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  CreditCard,
  Compass
} from 'lucide-react';

const STORAGE_KEYS = LOCAL_STORAGE_KEYS;

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: 'A3',
  paperOrientation: 'landscape',
  columns: 5,
  rows: 5,
  cardWidthMm: 85,
  cardHeightMm: 55,
  horizontalGapMm: 0,
  verticalGapMm: 0,
  duplexMode: 'duplex_long_edge',
  frontOffsetX: 0,
  frontOffsetY: 0,
  backOffsetX: 0,
  backOffsetY: 0,
  registrationMarks: true,
  cropMarks: true,
  cuttingGuides: true,
  showCardBorders: true,
  bleedMm: 1.5,
  marginTopMm: 0,
  marginLeftMm: 0,
  dpi: 300,
  autoCenter: true,
};

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State: Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES) ||
                  localStorage.getItem('eid_employees_v10');
    if (saved) {
      try {
        const parsed: Employee[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((emp) => {
            if (emp.photoUrl && emp.photoUrl.includes('images.unsplash.com') && !emp.photoUrl.includes('crop=faces')) {
              const base = emp.photoUrl.split('?')[0];
              return { ...emp, photoUrl: `${base}?w=480&h=640&auto=format&fit=crop&crop=faces,top&q=85` };
            }
            return emp;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_EMPLOYEES;
  });

  // State: Templates
  const [templates, setTemplates] = useState<CardTemplate[]>(() => {
    const saved = loadTemplatesFromLocal();
    if (saved && saved.length > 0) {
      return saved;
    }
    return DEFAULT_TEMPLATES;
  });

  // State: Active Template
  const [activeTemplate, setActiveTemplate] = useState<CardTemplate>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEMPLATE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_TEMPLATES[0];
  });

  // State: Print Settings
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRINT_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PRINT_SETTINGS;
  });

  // Async load from IndexedDB on startup
  useEffect(() => {
    async function initFromStorage() {
      try {
        const storedEmps = await loadEmployeesFromLocal();
        if (storedEmps && storedEmps.length > 0) {
          setEmployees(storedEmps);
        }
      } catch (err) {
        console.warn('Initial storage load warning:', err);
      }
    }
    initFromStorage();
  }, []);

  // Safe Local Persistence helpers
  useEffect(() => {
    saveEmployeesToLocal(employees);
  }, [employees]);

  useEffect(() => {
    saveTemplatesToLocal(templates);
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE, JSON.stringify(activeTemplate));
    } catch (e) {
      console.warn('LocalStorage quota or write error (ACTIVE_TEMPLATE):', e);
    }
  }, [activeTemplate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRINT_SETTINGS, JSON.stringify(printSettings));
    } catch (e) {
      console.warn('LocalStorage quota or write error (PRINT_SETTINGS):', e);
    }
  }, [printSettings]);

  const handleUpdatePrintSettings = (newSettings: Partial<PrintSettings>) => {
    setPrintSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSaveTemplate = (updatedTemplate: CardTemplate) => {
    setActiveTemplate(updatedTemplate);
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'employees', label: 'จัดการพนักงาน', icon: Users, badge: employees.length },
    { id: 'photos', label: 'จัดการรูปภาพ', icon: Camera },
    { id: 'auto_generate', label: 'สร้างบัตรอัตโนมัติ', icon: Zap },
    { id: 'inspector', label: 'ตรวจหน้า-หลังตรงกัน', icon: Layers, highlight: true },
    { id: 'print_a3', label: 'แท่นพิมพ์ A3 (Duplex)', icon: Printer },
    { id: 'designer', label: 'ออกแบบเทมเพลต', icon: Palette },
    { id: 'templates', label: 'คลังเทมเพลต', icon: FolderKanban },
    { id: 'settings', label: 'ตั้งค่า & โปรไฟล์', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base text-slate-900 tracking-tight">
                    ระบบออกบัตรพนักงาน
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-block">
                    A3 DUPLEX PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  จัดวาง 5×5 (25 ใบ/แผ่น) • แม่นยำตรงกัน 100%
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : item.highlight
                        ? 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-blue-800 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Quick Action: Print A3 Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('print_a3')}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>พิมพ์ A3</span>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            employees={employees}
            template={activeTemplate}
            templates={templates}
            settings={printSettings}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManager
            employees={employees}
            template={activeTemplate}
            onUpdateEmployees={setEmployees}
          />
        )}

        {activeTab === 'photos' && (
          <PhotoManager
            employees={employees}
            onUpdateEmployees={setEmployees}
          />
        )}

        {activeTab === 'auto_generate' && (
          <AutoBatchGenerator
            employees={employees}
            template={activeTemplate}
            templates={templates}
            onSelectTemplate={setActiveTemplate}
            onNavigateToPrint={(selected) => {
              setActiveTab('print_a3');
            }}
            onNavigateToInspector={() => setActiveTab('inspector')}
          />
        )}

        {activeTab === 'inspector' && (
          <DuplexInspector
            template={activeTemplate}
            employee={employees[0] || INITIAL_EMPLOYEES[0]}
            sampleEmployee={employees[0] || INITIAL_EMPLOYEES[0]}
            settings={printSettings}
            onUpdateSettings={handleUpdatePrintSettings}
            onSwitchToPrint={() => setActiveTab('print_a3')}
          />
        )}

        {activeTab === 'print_a3' && (
          <PrintA3View
            employees={employees}
            template={activeTemplate}
            settings={printSettings}
            onUpdateSettings={handleUpdatePrintSettings}
            onNavigateToInspector={() => setActiveTab('inspector')}
            onNavigateToPhotoManager={() => setActiveTab('photos')}
            onUpdateEmployees={setEmployees}
          />
        )}

        {activeTab === 'designer' && (
          <CardDesigner
            template={activeTemplate}
            sampleEmployee={employees[0] || INITIAL_EMPLOYEES[0]}
            onSaveTemplate={handleSaveTemplate}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateManager
            templates={templates}
            activeTemplate={activeTemplate}
            sampleEmployee={employees[0] || INITIAL_EMPLOYEES[0]}
            onSelectTemplate={setActiveTemplate}
            onUpdateTemplates={setTemplates}
            onEditTemplate={(tpl) => {
              setActiveTemplate(tpl);
              setActiveTab('designer');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={printSettings}
            onUpdateSettings={handleUpdatePrintSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">ระบบออกบัตรพนักงานอัตโนมัติ</span>
            <span>•</span>
            <span>มาตรฐานบัตร 8.5 × 5.5 ซม.</span>
            <span>•</span>
            <span>กระดาษ A3 (5×5, 25 ใบ/แผ่น)</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>MySQL 8.0+ Ready</span>
            <span>•</span>
            <span>100% Duplex Alignment Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

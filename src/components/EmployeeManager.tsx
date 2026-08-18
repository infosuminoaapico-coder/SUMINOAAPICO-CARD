import React, { useState } from 'react';
import { Employee, CardTemplate } from '../types';
import { INITIAL_EMPLOYEES } from '../data/mockEmployees';
import { parseEmployeeFile, exportEmployeesToExcel, downloadSampleExcelTemplate, generateMySqlSchema } from '../utils/excelUtils';
import { SingleCardPreview } from './SingleCardPreview';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Upload,
  Database,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Image as ImageIcon,
  FileCode2,
  X,
  Plus,
  RotateCcw
} from 'lucide-react';

interface EmployeeManagerProps {
  employees: Employee[];
  template: CardTemplate;
  onUpdateEmployees: (employees: Employee[]) => void;
  onSelectEmployeeForPreview?: (employee: Employee) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  template,
  onUpdateEmployees,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  
  // Current active employee for editing/previewing
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // New Employee Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    empId: '',
    name: '',
    nameEn: '',
    department: 'ฝ่ายวิศวกรรมการผลิต',
    division: 'โรงงาน 1',
    position: 'ช่างเทคนิค',
    startDate: '01/01/2026',
    bloodType: 'O',
    phone: '',
    email: '',
    nationalId: '',
    emergencyContact: '',
    photoUrl: '',
    status: 'active',
  });

  // Extract unique departments for filter dropdown
  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.nameEn && emp.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDept = filterDepartment === 'all' || emp.department === filterDepartment;
    const matchStatus = filterStatus === 'all' || emp.status === filterStatus;

    return matchSearch && matchDept && matchStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลพนักงานท่านนี้ใช่หรือไม่?')) {
      onUpdateEmployees(employees.filter((e) => e.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleBatchDelete = () => {
    if (confirm(`คุณต้องการลบพนักงานที่เลือกจำนวน ${selectedIds.length} รายการใช่หรือไม่?`)) {
      onUpdateEmployees(employees.filter((e) => !selectedIds.includes(e.id)));
      setSelectedIds([]);
    }
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empId || !formData.name) {
      alert('กรุณากรอกรหัสพนักงานและชื่อ-นามสกุล');
      return;
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      empId: formData.empId || '',
      name: formData.name || '',
      nameEn: formData.nameEn || '',
      department: formData.department || '',
      division: formData.division || '',
      position: formData.position || '',
      startDate: formData.startDate || '',
      bloodType: formData.bloodType || 'O',
      phone: formData.phone || '',
      email: formData.email || '',
      nationalId: formData.nationalId || '',
      emergencyContact: formData.emergencyContact || '',
      photoUrl: formData.photoUrl || '',
      barcodeValue: formData.empId || '',
      qrValue: `https://verify.company.co.th/emp/${formData.empId}`,
      status: (formData.status as any) || 'active',
    };

    onUpdateEmployees([newEmp, ...employees]);
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      empId: '',
      name: '',
      nameEn: '',
      department: 'ฝ่ายวิศวกรรมการผลิต',
      division: 'โรงงาน 1',
      position: 'ช่างเทคนิค',
      startDate: '01/01/2026',
      bloodType: 'O',
      phone: '',
      email: '',
      nationalId: '',
      emergencyContact: '',
      photoUrl: '',
      status: 'active',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    onUpdateEmployees(
      employees.map((e) => (e.id === currentEmployee.id ? currentEmployee : e))
    );
    setIsEditModalOpen(false);
    setCurrentEmployee(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseEmployeeFile(file);
      if (imported.length === 0) {
        alert('ไม่พบข้อมูลพนักงานในไฟล์');
        return;
      }
      onUpdateEmployees([...imported, ...employees]);
      setIsImportModalOpen(false);
      alert(`นำเข้าข้อมูลพนักงานสำเร็จจำนวน ${imported.length} รายการ`);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel/CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">
              จัดการข้อมูลพนักงาน (Employee Records)
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              ทั้งหมด {employees.length} รายชื่อ
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            นำเข้าและแก้ไขข้อมูลพนักงาน รองรับ Excel, CSV, Google Sheets และ MySQL Database
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (confirm('คุณต้องการรีเซ็ตหรือโหลดรายชื่อพนักงานทั้งหมด 107 คนใช่หรือไม่?')) {
                onUpdateEmployees(INITIAL_EMPLOYEES);
              }
            }}
            className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            title="รีเซ็ตเป็นรายชื่อพนักงานทั้งหมด 107 คน"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            โหลดรายชื่อทั้งหมด (107 คน)
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            นำเข้า Excel / CSV
          </button>

          <button
            onClick={() => exportEmployeesToExcel(employees)}
            className="px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ส่งออก Excel
          </button>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3.5 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Database className="w-4 h-4" />
            MySQL Schema
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            เพิ่มพนักงานใหม่
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
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
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">ทุกประเภทพนักงาน</option>
            <option value="active">พนักงานประจำ (Active)</option>
            <option value="contractor">ผู้รับเหมา (Contractor)</option>
            <option value="visitor">ผู้มาติดต่อ (Visitor)</option>
          </select>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ลบที่เลือก ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredEmployees.length > 0 &&
                      selectedIds.length === filteredEmployees.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-4 w-16 text-center">รูปถ่าย</th>
                <th className="p-4">รหัสพนักงาน</th>
                <th className="p-4">ชื่อ-นามสกุล</th>
                <th className="p-4">แผนก / หน่วยงาน</th>
                <th className="p-4">ตำแหน่ง</th>
                <th className="p-4 text-center">หมู่เลือด</th>
                <th className="p-4">เบอร์โทรศัพท์</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-right pr-6">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => handleToggleSelect(emp.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-slate-200 shadow-xs mx-auto flex items-center justify-center">
                        {emp.photoUrl ? (
                          <img
                            src={emp.photoUrl}
                            alt={emp.name}
                            className="w-full h-full object-cover"
                            style={{
                              objectPosition: '50% 18%',
                              filter: 'brightness(103%) contrast(104%)',
                              backgroundColor: '#ffffff',
                            }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            NO PIC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-600">
                      {emp.empId}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{emp.name}</div>
                      {emp.nameEn && (
                        <div className="text-xs text-slate-400">{emp.nameEn}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{emp.department}</div>
                      {emp.division && (
                        <div className="text-xs text-slate-400">{emp.division}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-800">{emp.position}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                        {emp.bloodType || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-600">
                      {emp.phone || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'contractor'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {emp.status === 'active'
                          ? 'พนักงานประจำ'
                          : emp.status === 'contractor'
                          ? 'ผู้รับเหมา'
                          : 'ผู้มาติดต่อ'}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setCurrentEmployee(emp);
                            setIsPreviewModalOpen(true);
                          }}
                          title="ดูตัวอย่างบัตร"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentEmployee(emp);
                            setIsEditModalOpen(true);
                          }}
                          title="แก้ไขข้อมูล"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          title="ลบข้อมูล"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD EMPLOYEE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                เพิ่มข้อมูลพนักงานใหม่
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    รหัสพนักงาน (Emp ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น SAT0564"
                    value={formData.empId}
                    onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    สถานะพนักงาน
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  >
                    <option value="active">พนักงานประจำ (Permanent)</option>
                    <option value="temporary">พนักงานชั่วคราว (Temporary)</option>
                    <option value="contractor">ผู้รับเหมา (Contractor)</option>
                    <option value="visitor">ผู้มาติดต่อ (Visitor)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อ-นามสกุล (ภาษาไทย) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายเกรียงไกร ชำนาญกิจ"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อภาษาอังกฤษ (English Name)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Kriangkrai Chamnankit"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    แผนก (Department)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ฝ่ายวิศวกรรมการผลิต"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หน่วยงาน / โรงงาน (Division)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น โรงงาน 1 (Bangna)"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่ง (Position)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น วิศวกรอาวุโส"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    วันที่เริ่มงาน (Start Date)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 15/01/2020"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หมู่เลือด (Blood Type)
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  >
                    <option value="O">O</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    เบอร์โทรศัพท์ (Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 081-456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ติดต่อฉุกเฉิน (Emergency Contact)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 089-112-2334 (ภรรยา)"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    URL หรือ Base64 รูปภาพ
                  </label>
                  <input
                    type="text"
                    placeholder="https://... หรืออัปโหลดในเมนูรูปภาพ"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EMPLOYEE */}
      {isEditModalOpen && currentEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                แก้ไขข้อมูลพนักงาน ({currentEmployee.empId})
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    รหัสพนักงาน (Emp ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={currentEmployee.empId}
                    onChange={(e) =>
                      setCurrentEmployee({ ...currentEmployee, empId: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อ-นามสกุล (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    required
                    value={currentEmployee.name}
                    onChange={(e) =>
                      setCurrentEmployee({ ...currentEmployee, name: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อภาษาอังกฤษ (English Name)
                  </label>
                  <input
                    type="text"
                    value={currentEmployee.nameEn || ''}
                    onChange={(e) =>
                      setCurrentEmployee({ ...currentEmployee, nameEn: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    แผนก (Department)
                  </label>
                  <input
                    type="text"
                    value={currentEmployee.department}
                    onChange={(e) =>
                      setCurrentEmployee({ ...currentEmployee, department: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่ง (Position)
                  </label>
                  <input
                    type="text"
                    value={currentEmployee.position}
                    onChange={(e) =>
                      setCurrentEmployee({ ...currentEmployee, position: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    เบอร์โทรศัพท์ (Phone)
                  </label>
                  <input
                    type="text"
                    value={currentEmployee.phone}
                    onChange={(e) =>
                      setCurrentEmployee({ ...currentEmployee, phone: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW CARD 3D FLIP */}
      {isPreviewModalOpen && currentEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">
                ตัวอย่างบัตร: {currentEmployee.name} ({currentEmployee.empId})
              </h3>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex justify-center">
              <SingleCardPreview
                employee={currentEmployee}
                template={template}
                scale={1.5}
                interactiveFlip={true}
              />
            </div>
            <p className="text-xs text-slate-500">
              💡 คลิกที่บัตรเพื่อพลิกดูด้านหน้าและด้านหลัง 3D
            </p>

            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="w-full py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: IMPORT EXCEL / CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                นำเข้าข้อมูลพนักงานจาก Excel / CSV
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-blue-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  รองรับไฟล์ Excel (.xlsx, .xls) และ CSV
                </div>
                <p className="text-blue-700 leading-relaxed text-[11px]">
                  ระบบจะจับคู่คอลัมน์ให้อัตโนมัติ (เช่น รหัสพนักงาน, ชื่อ-นามสกุล, แผนก, ตำแหน่ง, วันที่เริ่มงาน, หมู่เลือด, เบอร์โทรศัพท์)
                </p>
                <button
                  onClick={downloadSampleExcelTemplate}
                  className="mt-1 px-3 py-1.5 bg-white text-blue-700 font-bold border border-blue-300 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  ดาวน์โหลดไฟล์ตัวอย่าง (Sample Template)
                </button>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer block transition-all">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm font-bold text-slate-700 block">
                  คลิกเพื่อเลือกไฟล์ Excel / CSV หรือลากไฟล์มาวาง
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  .XLSX, .XLS, .CSV สูงสุด 5,000 รายชื่อ
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: MYSQL SCHEMA & SEED SCRIPT */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                โครงสร้างฐานข้อมูล MySQL (Schema DDL & Seed)
              </h3>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              สคริปต์ SQL พร้อมใช้งานสำหรับ MySQL 8.0+ ประกอบด้วยตาราง <code>employees</code>, <code>card_templates</code>, และ <code>print_logs</code> พร้อมข้อมูลปัจจุบัน
            </p>

            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-auto flex-1 max-h-96">
              {generateMySqlSchema(employees)}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateMySqlSchema(employees));
                  alert('คัดลอกคำสั่ง SQL ไปยังคลิปบอร์ดแล้ว!');
                }}
                className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl"
              >
                คัดลอก SQL (Copy to Clipboard)
              </button>

              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

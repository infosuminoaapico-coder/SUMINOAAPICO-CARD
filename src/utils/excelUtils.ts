import * as XLSX from 'xlsx';
import { Employee } from '../types';

/**
 * Parse uploaded Excel or CSV file into Employee objects
 */
export async function parseEmployeeFile(file: File): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        const employees: Employee[] = jsonData.map((row, index) => {
          // Normalize column keys (lowercase, trim)
          const keys = Object.keys(row);
          const findVal = (possibleNames: string[]): string => {
            for (const key of keys) {
              const cleanKey = key.trim().toLowerCase();
              if (possibleNames.some(p => cleanKey.includes(p.toLowerCase()))) {
                return String(row[key]).trim();
              }
            }
            return '';
          };

          const empId = findVal(['empid', 'emp_id', 'emp.no', 'emp no', 'รหัสพนักงาน', 'รหัส', 'id']) || `EMP${String(index + 1).padStart(4, '0')}`;
          const name = findVal(['name-thai', 'name thai', 'ชื่อไทย', 'name', 'ชื่อ-นามสกุล', 'ชื่อพนักงาน', 'ชื่อ', 'fullname']) || `พนักงาน ${index + 1}`;
          const nameEn = findVal(['name-eng', 'name eng', 'nameen', 'name_en', 'ชื่อภาษาอังกฤษ', 'english name']);
          const department = findVal(['department', 'แผนก', 'ฝ่าย', 'dept']) || 'ฝ่ายทั่วไป';
          const division = findVal(['division', 'หน่วยงาน', 'สังกัด', 'สาขา', 'โรงงาน']) || 'สำนักงานใหญ่';
          const position = findVal(['position', 'ตำแหน่ง', 'หน้าที่']) || 'พนักงาน';
          const startDate = findVal(['start working', 'start_working', 'start-working', 'startdate', 'start_date', 'วันที่เริ่มงาน', 'วันเริ่มงาน', 'วันที่เข้างาน']) || '01/01/2026';
          const bloodType = findVal(['bloodtype', 'blood_type', 'หมู่เลือด', 'กรุ๊ปเลือด', 'blood']) || 'O';
          const phone = findVal(['phone', 'mobile', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'โทรศัพท์', 'tel']) || '-';
          const email = findVal(['email', 'อีเมล', 'e-mail']);
          const nationalId = findVal(['nationalid', 'บัตรประชาชน', 'citizenid']);
          const emergencyContact = findVal(['emergency', 'ฉุกเฉิน', 'บุคคลติดต่อฉุกเฉิน']);
          const photoUrl = findVal(['photo', 'photourl', 'รูปภาพ', 'ภาพถ่าย', 'picture']) || '';

          return {
            id: `imported-${Date.now()}-${index}`,
            empId,
            name,
            nameEn,
            department,
            division,
            position,
            startDate,
            bloodType,
            phone,
            email,
            nationalId,
            emergencyContact,
            photoUrl,
            barcodeValue: empId,
            qrValue: `https://verify.company.co.th/emp/${empId}`,
            status: 'active',
          };
        });

        resolve(employees);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

/**
 * Export employees array to Excel (.xlsx)
 */
export function exportEmployeesToExcel(employees: Employee[], filename = 'employee_list.xlsx') {
  const exportData = employees.map(emp => ({
    'รหัสพนักงาน (Emp ID)': emp.empId,
    'ชื่อ-นามสกุล (Full Name)': emp.name,
    'ชื่อภาษาอังกฤษ (English Name)': emp.nameEn || '',
    'แผนก (Department)': emp.department,
    'หน่วยงาน / โรงงาน (Division)': emp.division,
    'ตำแหน่ง (Position)': emp.position,
    'วันที่เริ่มงาน (Start Date)': emp.startDate,
    'หมู่เลือด (Blood Type)': emp.bloodType,
    'เบอร์โทรศัพท์ (Phone)': emp.phone,
    'อีเมล (Email)': emp.email || '',
    'เลขบัตรประชาชน (National ID)': emp.nationalId || '',
    'ติดต่อฉุกเฉิน (Emergency Contact)': emp.emergencyContact || '',
    'สถานะ (Status)': emp.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'พนักงาน');
  XLSX.writeFile(workbook, filename);
}

/**
 * Download sample Excel template for easy employee data entry
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'รหัสพนักงาน (Emp ID)': 'SAT0564',
      'ชื่อ-นามสกุล (Full Name)': 'นายเกรียงไกร ชำนาญกิจ',
      'ชื่อภาษาอังกฤษ (English Name)': 'Kriangkrai Chamnankit',
      'แผนก (Department)': 'ฝ่ายวิศวกรรมการผลิต',
      'หน่วยงาน / โรงงาน (Division)': 'โรงงาน 1 (Bangna)',
      'ตำแหน่ง (Position)': 'วิศวกรอาวุโส',
      'วันที่เริ่มงาน (Start Date)': '15/01/2020',
      'หมู่เลือด (Blood Type)': 'O',
      'เบอร์โทรศัพท์ (Phone)': '081-456-7890',
      'อีเมล (Email)': 'kriangkrai.c@company.co.th',
      'เลขบัตรประชาชน (National ID)': '1-1002-00345-67-8',
      'ติดต่อฉุกเฉิน (Emergency Contact)': '089-112-2334',
    },
    {
      'รหัสพนักงาน (Emp ID)': 'SAT0607',
      'ชื่อ-นามสกุล (Full Name)': 'น.ส. พิมลพรรณ วัฒนากุล',
      'ชื่อภาษาอังกฤษ (English Name)': 'Pimonpan Wattanakul',
      'แผนก (Department)': 'ฝ่ายควบคุมคุณภาพ (QA/QC)',
      'หน่วยงาน / โรงงาน (Division)': 'ห้องปฏิบัติการกลาง',
      'ตำแหน่ง (Position)': 'หัวหน้างานตรวจสอบคุณภาพ',
      'วันที่เริ่มงาน (Start Date)': '01/06/2021',
      'หมู่เลือด (Blood Type)': 'B',
      'เบอร์โทรศัพท์ (Phone)': '089-765-4321',
      'อีเมล (Email)': 'pimonpan.w@company.co.th',
      'เลขบัตรประชาชน (National ID)': '3-1020-00891-22-1',
      'ติดต่อฉุกเฉิน (Emergency Contact)': '081-998-8776',
    },
    {
      'รหัสพนักงาน (Emp ID)': 'SAT0576',
      'ชื่อ-นามสกุล (Full Name)': 'นายธนพัฒน์ สิริโสภณ',
      'ชื่อภาษาอังกฤษ (English Name)': 'Thanapat Sirisophon',
      'แผนก (Department)': 'ฝ่ายซ่อมบำรุงและเทคนิค',
      'หน่วยงาน / โรงงาน (Division)': 'โรงงาน 2 (Rayong)',
      'ตำแหน่ง (Position)': 'ช่างเทคนิคพิเศษ',
      'วันที่เริ่มงาน (Start Date)': '10/08/2022',
      'หมู่เลือด (Blood Type)': 'A',
      'เบอร์โทรศัพท์ (Phone)': '086-332-1144',
      'อีเมล (Email)': 'thanapat.s@company.co.th',
      'เลขบัตรประชาชน (National ID)': '1-1004-00123-45-6',
      'ติดต่อฉุกเฉิน (Emergency Contact)': '084-556-7788',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee_Template');
  XLSX.writeFile(workbook, 'employee_template_sumino.xlsx');
}

/**
 * Generate MySQL Database Schema DDL & Seed SQL
 */
export function generateMySqlSchema(employees: Employee[]): string {
  return `-- ==========================================================
-- Database Schema for Employee ID Card System (MySQL 8.0+)
-- Auto-generated by Employee ID Generator
-- ==========================================================

CREATE DATABASE IF NOT EXISTS \`employee_cards_db\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE \`employee_cards_db\`;

-- 1. Table: employees (ข้อมูลพนักงาน)
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`emp_id\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`name_en\` VARCHAR(255) NULL,
  \`department\` VARCHAR(150) NOT NULL,
  \`division\` VARCHAR(150) NULL,
  \`position\` VARCHAR(150) NOT NULL,
  \`start_date\` VARCHAR(50) NULL,
  \`blood_type\` VARCHAR(10) NULL,
  \`phone\` VARCHAR(50) NULL,
  \`email\` VARCHAR(150) NULL,
  \`national_id\` VARCHAR(50) NULL,
  \`emergency_contact\` VARCHAR(150) NULL,
  \`photo_url\` LONGTEXT NULL,
  \`status\` ENUM('active', 'temporary', 'contractor', 'visitor') DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_emp_id\` (\`emp_id\`),
  INDEX \`idx_department\` (\`department\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: card_templates (เทมเพลตบัตร)
CREATE TABLE IF NOT EXISTS \`card_templates\` (
  \`id\` VARCHAR(100) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(50) NOT NULL,
  \`card_width_mm\` DECIMAL(5,2) DEFAULT 85.00,
  \`card_height_mm\` DECIMAL(5,2) DEFAULT 55.00,
  \`template_json\` LONGTEXT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: print_logs (ประวัติการพิมพ์บัตร)
CREATE TABLE IF NOT EXISTS \`print_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`emp_id\` VARCHAR(50) NOT NULL,
  \`template_id\` VARCHAR(100) NOT NULL,
  \`paper_size\` VARCHAR(20) DEFAULT 'A3',
  \`duplex_mode\` VARCHAR(50) DEFAULT 'duplex_long_edge',
  \`printed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_log_empid\` (\`emp_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Employee Records INSERT
INSERT INTO \`employees\` (\`emp_id\`, \`name\`, \`name_en\`, \`department\`, \`division\`, \`position\`, \`start_date\`, \`blood_type\`, \`phone\`, \`email\`, \`status\`)
VALUES
${employees.map(e => `('${e.empId}', '${e.name.replace(/'/g, "\\'")}', '${(e.nameEn || '').replace(/'/g, "\\'")}', '${e.department.replace(/'/g, "\\'")}', '${(e.division || '').replace(/'/g, "\\'")}', '${e.position.replace(/'/g, "\\'")}', '${e.startDate}', '${e.bloodType}', '${e.phone}', '${e.email || ''}', '${e.status}')`).join(',\n')}
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`position\`=VALUES(\`position\`);
`;
}

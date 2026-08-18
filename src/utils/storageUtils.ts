import { Employee, CardTemplate, PrintSettings } from '../types';

const DB_NAME = 'SUMINO_EID_LOCAL_STORE';
const DB_VERSION = 1;
const STORE_EMPLOYEES = 'employees';
const STORE_TEMPLATES = 'templates';
const STORE_SETTINGS = 'settings';

export const LOCAL_STORAGE_KEYS = {
  EMPLOYEES: 'eid_employees_v11',
  TEMPLATES: 'eid_templates_v14',
  ACTIVE_TEMPLATE: 'eid_active_template_v14',
  PRINT_SETTINGS: 'eid_print_settings_v3',
  PHOTOS_SYNC_TIMESTAMP: 'eid_photos_last_saved',
};

/**
 * Open or initialize IndexedDB for large photo datasets & offline persistence
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_EMPLOYEES)) {
        db.createObjectStore(STORE_EMPLOYEES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save employees with all high-res photos to Local Data (IndexedDB + LocalStorage backup)
 */
export async function saveEmployeesToLocal(employees: Employee[]): Promise<boolean> {
  if (!Array.isArray(employees)) return false;

  // 1. Save to IndexedDB (unlimited storage for photos)
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_EMPLOYEES, 'readwrite');
    const store = tx.objectStore(STORE_EMPLOYEES);

    // Clear existing to keep in sync
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    // Put all records
    for (const emp of employees) {
      store.put(emp);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error for employees:', err);
  }

  // 2. Also save to LocalStorage as quick synchronous cache
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    localStorage.setItem(LOCAL_STORAGE_KEYS.PHOTOS_SYNC_TIMESTAMP, new Date().toISOString());
  } catch (quotaError) {
    console.warn('LocalStorage quota reached (photos preserved in IndexedDB):', quotaError);
    // If quota exceeded, save metadata without heavy base64 to LocalStorage so index is preserved
    try {
      const lightweight = employees.map((emp) => ({
        ...emp,
        photoUrl: emp.photoUrl?.startsWith('data:') ? '' : emp.photoUrl,
      }));
      localStorage.setItem(LOCAL_STORAGE_KEYS.EMPLOYEES, JSON.stringify(lightweight));
    } catch (e) {
      // Ignore
    }
  }

  return true;
}

/**
 * Load employees from Local Data (IndexedDB first, fallback to LocalStorage)
 */
export async function loadEmployeesFromLocal(): Promise<Employee[] | null> {
  // 1. Try IndexedDB first (contains all high-res photos)
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_EMPLOYEES, 'readonly');
    const store = tx.objectStore(STORE_EMPLOYEES);

    const records = await new Promise<Employee[]>((resolve, reject) => {
      const getReq = store.getAll();
      getReq.onsuccess = () => resolve(getReq.result as Employee[]);
      getReq.onerror = () => reject(getReq.error);
    });

    if (records && records.length > 0) {
      return records;
    }
  } catch (err) {
    console.warn('IndexedDB read error, falling back to LocalStorage:', err);
  }

  // 2. Fallback to LocalStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.EMPLOYEES) ||
                  localStorage.getItem('eid_employees_v10') ||
                  localStorage.getItem('eid_employees_v9');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('LocalStorage read error:', e);
  }

  return null;
}

/**
 * Save templates to Local Data
 */
export async function saveTemplatesToLocal(templates: CardTemplate[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.warn('LocalStorage error saving templates:', e);
  }
}

/**
 * Load templates from Local Data
 */
export function loadTemplatesFromLocal(): CardTemplate[] | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TEMPLATES) ||
                  localStorage.getItem('eid_templates_v9');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

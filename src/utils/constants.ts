export const APP_NAME = 'ANAC RFID Attendance System';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const DEFAULT_LANGUAGE = import.meta.env.VITE_DEFAULT_LANGUAGE || 'fr';

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  WORKER: 'worker',
} as const;

export const ATTENDANCE_TYPES = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  OPTIONS: [10, 25, 50, 100],
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH: 'auth-storage',
  UI: 'ui-storage',
  LANGUAGE: 'i18nextLng',
} as const;

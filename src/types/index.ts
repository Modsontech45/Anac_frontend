// User Roles
export type UserRole = 'admin' | 'manager' | 'worker';

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string | null;
  organizationId: string | null;
  rfidTag: string | null;
  isActive: boolean;
  emailVerified: boolean;
  totalHoursWorked?: number;
  createdAt: string;
  updatedAt: string;
}

// Department interface
export interface Department {
  id: string;
  name: string;
  description: string | null;
  managerId: string | null;
  manager?: User | null;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Device interface
export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  location: string;
  departmentId: string | null;
  department?: Department | null;
  isOnline: boolean;
  lastPing: string | null;
  firmwareVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

// Attendance Record Types
export type AttendanceType = 'check_in' | 'check_out';

export interface AttendanceRecord {
  id: string;
  userId: string;
  user?: User;
  deviceId: string;
  device?: Device;
  type: AttendanceType;
  timestamp: string;
  createdAt: string;
}

// Auth interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Organization interface
export interface Organization {
  id: string;
  name: string;
  apiKey: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Form interfaces
export interface CreateUserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: string;
  rfidTag?: string;
}

export interface UpdateUserForm {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string | null;
  rfidTag?: string | null;
  isActive?: boolean;
}

export interface CreateDepartmentForm {
  name: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartmentForm {
  name?: string;
  description?: string | null;
  managerId?: string | null;
}

export interface CreateDeviceForm {
  name: string;
  serialNumber: string;
  location: string;
  departmentId?: string;
}

export interface UpdateDeviceForm {
  name?: string;
  location?: string;
  departmentId?: string | null;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalDepartments: number;
  totalDevices: number;
  onlineDevices: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  presentToday: number;
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
}

export interface AttendanceChartData {
  date: string;
  checkIns: number;
  checkOuts: number;
}

// Payroll types
export interface DepartmentRate {
  id: string;
  departmentId: string;
  departmentName?: string;
  hourlyRate: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePayroll {
  id: string;
  name: string;
  email: string;
  department: string;
  departmentId: string;
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
}

export interface PayrollSummary {
  month: string;
  totalPayroll: number;
  totalHours: number;
  employeeCount: number;
  departmentBreakdown: {
    departmentId: string;
    departmentName: string;
    totalHours: number;
    totalPay: number;
    employeeCount: number;
  }[];
  employees: EmployeePayroll[];
}

// Filter interfaces
export interface AttendanceFilters {
  userId?: string;
  departmentId?: string;
  deviceId?: string;
  type?: AttendanceType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: UserRole;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// UI State
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
}

// Table Column Definition
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// Navigation Item
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles?: UserRole[];
  children?: NavItem[];
}

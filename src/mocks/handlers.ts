import { http, HttpResponse, delay } from 'msw';
import type { User, Department, Device, AttendanceRecord } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper for pagination
const paginate = <T>(items: T[], page: number, limit: number) => {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
    },
  };
};

// Mock data arrays
const users: User[] = [];
const departments: Department[] = [];
const devices: Device[] = [];
const attendance: AttendanceRecord[] = [];

export const handlers = [
  // Auth
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    await delay(500);
    const { email, password } = await request.json() as { email: string; password: string };
    const user = users.find(u => u.email === email);
    if (!user || password !== 'Admin@123') return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    return HttpResponse.json({ success: true, data: { user, token: 'mock-jwt-' + user.id, refreshToken: 'mock-refresh-' + user.id } });
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_URL}/auth/me`, async ({ request }) => {
    await delay(200);
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return HttpResponse.json({ success: true, data: users[0] || null });
  }),

  // Users GET with pagination
  http.get(`${API_URL}/users`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search')?.toLowerCase() || '';

    let filtered = users;
    if (search) filtered = filtered.filter(u =>
      u.firstName.toLowerCase().includes(search) ||
      u.lastName.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );

    return HttpResponse.json({ success: true, ...paginate(filtered, page, limit) });
  }),

  // Departments GET with pagination
  http.get(`${API_URL}/departments`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search')?.toLowerCase() || '';

    let filtered = departments;
    if (search) filtered = filtered.filter(d => d.name.toLowerCase().includes(search));

    return HttpResponse.json({ success: true, ...paginate(filtered, page, limit) });
  }),

  // Devices GET with pagination
  http.get(`${API_URL}/devices`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({ success: true, ...paginate(devices, page, limit) });
  }),

  // Attendance GET with pagination
  http.get(`${API_URL}/attendance`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Enrich attendance with user & device info
    const enriched = attendance.map(a => ({
      ...a,
      user: users.find(u => u.id === a.userId) || null,
      device: devices.find(d => d.id === a.deviceId) || null,
    }));

    return HttpResponse.json({ success: true, ...paginate(enriched, page, limit) });
  }),

  // POST examples (users, departments, devices, attendance)
  http.post(`${API_URL}/users`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<User>;
    const newUser: User = { ...body, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as User;
    users.push(newUser);
    return HttpResponse.json({ success: true, data: newUser }, { status: 201 });
  }),

  http.post(`${API_URL}/departments`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<Department>;
    const newDept: Department = { ...body, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Department;
    departments.push(newDept);
    return HttpResponse.json({ success: true, data: newDept }, { status: 201 });
  }),

  http.post(`${API_URL}/devices`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<Device>;
    const newDevice: Device = { ...body, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Device;
    devices.push(newDevice);
    return HttpResponse.json({ success: true, data: newDevice }, { status: 201 });
  }),

  http.post(`${API_URL}/attendance/record`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<AttendanceRecord>;
    const newRecord: AttendanceRecord = { ...body, id: generateId(), timestamp: new Date().toISOString(), createdAt: new Date().toISOString() } as AttendanceRecord;
    attendance.push(newRecord);
    return HttpResponse.json({ success: true, data: newRecord }, { status: 201 });
  }),
];

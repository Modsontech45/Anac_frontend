import { http, HttpResponse, delay } from 'msw';
import {
  mockUsers,
  mockDepartments,
  mockDevices,
  mockAttendance,
  generateAttendanceChartData,
} from './data';
import type { User, Department, Device, AttendanceRecord } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Mutable copies for CRUD operations
let users = [...mockUsers];
let departments = [...mockDepartments];
let devices = [...mockDevices];
let attendance = [...mockAttendance];

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

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as { email: string; password: string };

    const user = users.find((u) => u.email === body.email);

    if (!user || body.password !== 'Admin@123') {
      return HttpResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user,
        token: 'mock-jwt-token-' + user.id,
        refreshToken: 'mock-refresh-token-' + user.id,
      },
    });
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_URL}/auth/refresh`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token-refreshed',
        refreshToken: 'mock-refresh-token-refreshed',
      },
    });
  }),

  http.get(`${API_URL}/auth/me`, async ({ request }) => {
    await delay(200);
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Return admin user for mock
    return HttpResponse.json({
      success: true,
      data: users[0],
    });
  }),

  // Users handlers
  http.get(`${API_URL}/users`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const role = url.searchParams.get('role');
    const departmentId = url.searchParams.get('departmentId');
    const search = url.searchParams.get('search');

    let filtered = [...users];

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (departmentId) {
      filtered = filtered.filter((u) => u.departmentId === departmentId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(searchLower) ||
          u.lastName.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    const result = paginate(filtered, page, limit);
    return HttpResponse.json({ success: true, ...result });
  }),

  http.get(`${API_URL}/users/:id`, async ({ params }) => {
    await delay(200);
    const user = users.find((u) => u.id === params.id);
    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: user });
  }),

  http.post(`${API_URL}/users`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<User>;
    const newUser: User = {
      id: generateId(),
      email: body.email || '',
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      role: body.role || 'worker',
      departmentId: body.departmentId || null,
      rfidTag: body.rfidTag || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    return HttpResponse.json({ success: true, data: newUser }, { status: 201 });
  }),

  http.put(`${API_URL}/users/:id`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as Partial<User>;
    const index = users.findIndex((u) => u.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    users[index] = {
      ...users[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data: users[index] });
  }),

  http.delete(`${API_URL}/users/:id`, async ({ params }) => {
    await delay(300);
    const index = users.findIndex((u) => u.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    users.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Departments handlers
  // IMPORTANT: Specific routes must come before parameterized routes
  http.get(`${API_URL}/departments/stats`, async () => {
    await delay(300);
    const stats = departments.map((d) => ({
      departmentId: d.id,
      departmentName: d.name,
      totalEmployees: users.filter((u) => u.departmentId === d.id).length,
      presentToday: Math.floor(Math.random() * 5) + 1,
      absentToday: Math.floor(Math.random() * 3),
    }));
    return HttpResponse.json({ success: true, data: stats });
  }),

  http.get(`${API_URL}/departments`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search');

    let filtered = [...departments];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((d) =>
        d.name.toLowerCase().includes(searchLower)
      );
    }

    const result = paginate(filtered, page, limit);
    return HttpResponse.json({ success: true, ...result });
  }),

  http.get(`${API_URL}/departments/:id`, async ({ params }) => {
    await delay(200);
    const dept = departments.find((d) => d.id === params.id);
    if (!dept) {
      return HttpResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: dept });
  }),

  http.post(`${API_URL}/departments`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<Department>;
    const newDept: Department = {
      id: generateId(),
      name: body.name || '',
      description: body.description || null,
      managerId: body.managerId || null,
      employeeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    departments.push(newDept);
    return HttpResponse.json({ success: true, data: newDept }, { status: 201 });
  }),

  http.put(`${API_URL}/departments/:id`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as Partial<Department>;
    const index = departments.findIndex((d) => d.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }
    departments[index] = {
      ...departments[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data: departments[index] });
  }),

  http.delete(`${API_URL}/departments/:id`, async ({ params }) => {
    await delay(300);
    const index = departments.findIndex((d) => d.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }
    departments.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Devices handlers
  http.get(`${API_URL}/devices`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const departmentId = url.searchParams.get('departmentId');
    const isOnline = url.searchParams.get('isOnline');

    let filtered = [...devices];

    if (departmentId) {
      filtered = filtered.filter((d) => d.departmentId === departmentId);
    }
    if (isOnline !== null) {
      filtered = filtered.filter((d) => d.isOnline === (isOnline === 'true'));
    }

    const result = paginate(filtered, page, limit);
    return HttpResponse.json({ success: true, ...result });
  }),

  http.get(`${API_URL}/devices/:id`, async ({ params }) => {
    await delay(200);
    const device = devices.find((d) => d.id === params.id);
    if (!device) {
      return HttpResponse.json(
        { success: false, message: 'Device not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: device });
  }),

  http.post(`${API_URL}/devices`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<Device>;
    const newDevice: Device = {
      id: generateId(),
      name: body.name || '',
      serialNumber: body.serialNumber || '',
      location: body.location || '',
      departmentId: body.departmentId || null,
      isOnline: false,
      lastPing: null,
      firmwareVersion: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    devices.push(newDevice);
    return HttpResponse.json({ success: true, data: newDevice }, { status: 201 });
  }),

  http.put(`${API_URL}/devices/:id`, async ({ params, request }) => {
    await delay(300);
    const body = await request.json() as Partial<Device>;
    const index = devices.findIndex((d) => d.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Device not found' },
        { status: 404 }
      );
    }
    devices[index] = {
      ...devices[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ success: true, data: devices[index] });
  }),

  http.delete(`${API_URL}/devices/:id`, async ({ params }) => {
    await delay(300);
    const index = devices.findIndex((d) => d.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, message: 'Device not found' },
        { status: 404 }
      );
    }
    devices.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Attendance handlers
  http.get(`${API_URL}/attendance`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const userId = url.searchParams.get('userId');
    const deviceId = url.searchParams.get('deviceId');
    const type = url.searchParams.get('type');

    let filtered = [...attendance];

    if (userId) {
      filtered = filtered.filter((a) => a.userId === userId);
    }
    if (deviceId) {
      filtered = filtered.filter((a) => a.deviceId === deviceId);
    }
    if (type) {
      filtered = filtered.filter((a) => a.type === type);
    }

    // Add user and device info
    const enriched = filtered.map((a) => ({
      ...a,
      user: users.find((u) => u.id === a.userId),
      device: devices.find((d) => d.id === a.deviceId),
    }));

    const result = paginate(enriched, page, limit);
    return HttpResponse.json({ success: true, ...result });
  }),

  http.get(`${API_URL}/attendance/me`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // For mock, return records for user 2 (manager)
    const filtered = attendance.filter((a) => a.userId === '2');
    const enriched = filtered.map((a) => ({
      ...a,
      user: users.find((u) => u.id === a.userId),
      device: devices.find((d) => d.id === a.deviceId),
    }));

    const result = paginate(enriched, page, limit);
    return HttpResponse.json({ success: true, ...result });
  }),

  http.get(`${API_URL}/attendance/stats/dashboard`, async () => {
    await delay(300);
    const stats = {
      totalUsers: users.length,
      totalDepartments: departments.length,
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.isOnline).length,
      todayCheckIns: attendance.filter((a) => a.type === 'check_in').length,
      todayCheckOuts: attendance.filter((a) => a.type === 'check_out').length,
      presentToday: 4,
    };
    return HttpResponse.json({ success: true, data: stats });
  }),

  http.get(`${API_URL}/attendance/stats/chart`, async () => {
    await delay(300);
    const chartData = generateAttendanceChartData();
    return HttpResponse.json({ success: true, data: chartData });
  }),

  http.post(`${API_URL}/attendance/record`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as { rfidTag: string; deviceId: string; type: 'check_in' | 'check_out' };
    const user = users.find((u) => u.rfidTag === body.rfidTag);

    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'User not found for RFID tag' },
        { status: 404 }
      );
    }

    const newRecord: AttendanceRecord = {
      id: generateId(),
      userId: user.id,
      deviceId: body.deviceId,
      type: body.type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    attendance.push(newRecord);
    return HttpResponse.json({ success: true, data: newRecord }, { status: 201 });
  }),

  // Manual attendance recording (for admin/manager when device has issues)
  http.post(`${API_URL}/attendance/manual`, async ({ request }) => {
    await delay(300);
    const body = await request.json() as { userId: string; type: 'check_in' | 'check_out' };
    const user = users.find((u) => u.id === body.userId);

    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const newRecord: AttendanceRecord = {
      id: generateId(),
      userId: body.userId,
      deviceId: 'manual', // Mark as manual entry
      type: body.type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    attendance.push(newRecord);
    return HttpResponse.json({ success: true, data: newRecord }, { status: 201 });
  }),
];

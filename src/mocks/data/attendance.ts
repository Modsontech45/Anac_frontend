import type { AttendanceRecord } from '@/types';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

export const mockAttendance: AttendanceRecord[] = [
  // Today's records
  {
    id: '1',
    userId: '2',
    deviceId: '1',
    type: 'check_in',
    timestamp: new Date(today.setHours(8, 30, 0)).toISOString(),
    createdAt: new Date(today.setHours(8, 30, 0)).toISOString(),
  },
  {
    id: '2',
    userId: '3',
    deviceId: '1',
    type: 'check_in',
    timestamp: new Date(today.setHours(8, 45, 0)).toISOString(),
    createdAt: new Date(today.setHours(8, 45, 0)).toISOString(),
  },
  {
    id: '3',
    userId: '4',
    deviceId: '1',
    type: 'check_in',
    timestamp: new Date(today.setHours(9, 0, 0)).toISOString(),
    createdAt: new Date(today.setHours(9, 0, 0)).toISOString(),
  },
  {
    id: '4',
    userId: '5',
    deviceId: '2',
    type: 'check_in',
    timestamp: new Date(today.setHours(9, 15, 0)).toISOString(),
    createdAt: new Date(today.setHours(9, 15, 0)).toISOString(),
  },
  {
    id: '5',
    userId: '2',
    deviceId: '1',
    type: 'check_out',
    timestamp: new Date(today.setHours(12, 0, 0)).toISOString(),
    createdAt: new Date(today.setHours(12, 0, 0)).toISOString(),
  },
  {
    id: '6',
    userId: '2',
    deviceId: '1',
    type: 'check_in',
    timestamp: new Date(today.setHours(13, 0, 0)).toISOString(),
    createdAt: new Date(today.setHours(13, 0, 0)).toISOString(),
  },
  // Yesterday's records
  {
    id: '7',
    userId: '2',
    deviceId: '1',
    type: 'check_in',
    timestamp: new Date(yesterday.setHours(8, 30, 0)).toISOString(),
    createdAt: new Date(yesterday.setHours(8, 30, 0)).toISOString(),
  },
  {
    id: '8',
    userId: '2',
    deviceId: '1',
    type: 'check_out',
    timestamp: new Date(yesterday.setHours(17, 30, 0)).toISOString(),
    createdAt: new Date(yesterday.setHours(17, 30, 0)).toISOString(),
  },
  {
    id: '9',
    userId: '3',
    deviceId: '1',
    type: 'check_in',
    timestamp: new Date(yesterday.setHours(9, 0, 0)).toISOString(),
    createdAt: new Date(yesterday.setHours(9, 0, 0)).toISOString(),
  },
  {
    id: '10',
    userId: '3',
    deviceId: '1',
    type: 'check_out',
    timestamp: new Date(yesterday.setHours(18, 0, 0)).toISOString(),
    createdAt: new Date(yesterday.setHours(18, 0, 0)).toISOString(),
  },
];

export const generateAttendanceChartData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      checkIns: Math.floor(Math.random() * 20) + 10,
      checkOuts: Math.floor(Math.random() * 20) + 8,
    });
  }
  return data;
};

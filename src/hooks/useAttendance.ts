import { useState, useCallback } from 'react';
import { attendanceService } from '@/services';
import type {
  AttendanceRecord,
  AttendanceFilters,
  DashboardStats,
  AttendanceChartData,
} from '@/types';

export const useAttendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<AttendanceChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchRecords = useCallback(async (filters?: AttendanceFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceService.getAll(filters);
      setRecords(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyRecords = useCallback(async (filters?: AttendanceFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceService.getMyRecords(filters);
      setRecords(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await attendanceService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch stats');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChartData = useCallback(
    async (startDate: string, endDate: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await attendanceService.getChartData(startDate, endDate);
        setChartData(data);
      } catch (err) {
        setError('Failed to fetch chart data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const exportCSV = useCallback(async (filters?: AttendanceFilters) => {
    try {
      const blob = await attendanceService.exportCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export CSV');
      console.error(err);
    }
  }, []);

  return {
    records,
    stats,
    chartData,
    isLoading,
    error,
    pagination,
    fetchRecords,
    fetchMyRecords,
    fetchStats,
    fetchChartData,
    exportCSV,
  };
};

export default useAttendance;

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Download,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useAuthStore } from '@/store/authStore';
import { attendanceService, userService, departmentService } from '@/services';
import websocketService from '@/services/websocket.service';
import type { AttendanceRecord, User, Department } from '@/types';

interface TimeEntry {
  checkIn: string;
  checkOut: string | null;
  duration: number | null; // in minutes
}

interface DailyAttendance {
  id: string;
  date: string;
  userId: string;
  userName: string;
  userEmail: string;
  departmentName: string;
  entries: TimeEntry[];
  firstEntry: string | null;
  lastExit: string | null;
  totalMinutes: number;
  status: 'present' | 'incomplete' | 'absent';
}

const Attendance = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Date filter state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  // Manual attendance state
  const [manualUserId, setManualUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualFeedback, setManualFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // WebSocket connection status
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Memoized fetch function for WebSocket updates
  const fetchRecordsForWs = useCallback(async () => {
    try {
      const filters: Record<string, string | number | undefined> = {
        limit: 1000,
        startDate,
        endDate,
      };

      if (selectedUserId) filters.userId = selectedUserId;
      if (selectedDepartmentId) filters.departmentId = selectedDepartmentId;

      let response;
      if (currentUser?.role === 'worker') {
        response = await attendanceService.getMyRecords(filters);
      } else {
        response = await attendanceService.getAll(filters);
      }
      setRecords(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  }, [startDate, endDate, selectedUserId, selectedDepartmentId, currentUser?.role]);

  // WebSocket connection and real-time updates
  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect()
      .then(() => {
        setWsConnected(true);
        // Authenticate as dashboard client
        websocketService.authenticate('attendance-page');
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        setWsConnected(false);
      });

    // Listen for connection status
    const unsubscribeConnected = websocketService.on('connected', () => {
      setWsConnected(true);
    });

    const unsubscribeDisconnected = websocketService.on('disconnected', () => {
      setWsConnected(false);
    });

    // Listen for real-time attendance updates
    const unsubscribeAttendance = websocketService.on('attendance_update', (data) => {
      console.log('[Attendance] Real-time update received:', data);
      // Refresh the attendance records
      fetchRecordsForWs();
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeAttendance();
    };
  }, [fetchRecordsForWs]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, selectedUserId, selectedDepartmentId]);

  const fetchInitialData = async () => {
    try {
      const [usersResponse, deptResponse] = await Promise.all([
        userService.getAll({ limit: 100 }),
        departmentService.getAll({ limit: 100 }),
      ]);
      setUsers(usersResponse.data);
      setDepartments(deptResponse.data);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string | number | undefined> = {
        limit: 1000,
        startDate,
        endDate,
      };

      if (selectedUserId) filters.userId = selectedUserId;
      if (selectedDepartmentId) filters.departmentId = selectedDepartmentId;

      let response;
      if (currentUser?.role === 'worker') {
        response = await attendanceService.getMyRecords(filters);
      } else {
        response = await attendanceService.getAll(filters);
      }
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAttendance = async (type: 'check_in' | 'check_out') => {
    if (!manualUserId) {
      setManualFeedback({
        type: 'error',
        message: 'Veuillez sélectionner un employé',
      });
      return;
    }

    setIsSubmitting(true);
    setManualFeedback(null);

    try {
      await attendanceService.recordManualAttendance(manualUserId, type);
      const selectedUser = users.find((u) => u.id === manualUserId);
      const userName = selectedUser
        ? `${selectedUser.firstName} ${selectedUser.lastName}`
        : 'Employé';

      setManualFeedback({
        type: 'success',
        message: `${type === 'check_in' ? 'Entrée' : 'Sortie'} enregistrée pour ${userName}`,
      });

      // Refresh records after a short delay
      setTimeout(() => {
        fetchRecords();
        setManualUserId('');
      }, 1000);
    } catch (error) {
      console.error('Failed to record manual attendance:', error);
      setManualFeedback({
        type: 'error',
        message: 'Erreur lors de l\'enregistrement. Veuillez réessayer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process records to get daily attendance with multiple entry/exit pairs
  const dailyAttendance = useMemo(() => {
    const dailyMap = new Map<string, {
      records: { type: 'check_in' | 'check_out'; time: Date; timeStr: string }[];
      user: User | undefined;
      dept: Department | undefined;
    }>();

    // Group records by user-date
    records.forEach((record) => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      const key = `${record.userId}-${date}`;
      const user = record.user || users.find((u) => u.id === record.userId);
      const dept = user?.departmentId
        ? departments.find((d) => d.id === user.departmentId)
        : undefined;

      if (!dailyMap.has(key)) {
        dailyMap.set(key, { records: [], user, dept });
      }

      const time = new Date(record.timestamp);
      const timeStr = time.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      dailyMap.get(key)!.records.push({
        type: record.type,
        time,
        timeStr,
      });
    });

    // Process each day's records into entry/exit pairs
    const result: DailyAttendance[] = [];

    dailyMap.forEach((data, key) => {
      // Key format: "userId-YYYY-MM-DD", extract date (last 10 chars) and userId (rest)
      const date = key.slice(-10); // YYYY-MM-DD
      const userId = key.slice(0, -11); // Everything before "-YYYY-MM-DD"

      // Sort records by time
      const sortedRecords = [...data.records].sort((a, b) => a.time.getTime() - b.time.getTime());

      // Build entry/exit pairs using for loop for better type inference
      const entries: TimeEntry[] = [];
      let pendingCheckIn: { time: Date; timeStr: string } | null = null;

      for (let i = 0; i < sortedRecords.length; i++) {
        const record = sortedRecords[i];
        if (record.type === 'check_in') {
          // If we already have a check-in without check-out, close it as incomplete
          if (pendingCheckIn) {
            entries.push({
              checkIn: pendingCheckIn.timeStr,
              checkOut: null,
              duration: null,
            });
          }
          pendingCheckIn = { time: record.time, timeStr: record.timeStr };
        } else if (record.type === 'check_out') {
          if (pendingCheckIn) {
            // Calculate duration in minutes
            const durationMs = record.time.getTime() - pendingCheckIn.time.getTime();
            const durationMinutes = Math.round(durationMs / 60000);

            entries.push({
              checkIn: pendingCheckIn.timeStr,
              checkOut: record.timeStr,
              duration: durationMinutes,
            });
            pendingCheckIn = null;
          } else {
            // Check-out without check-in
            entries.push({
              checkIn: '-',
              checkOut: record.timeStr,
              duration: null,
            });
          }
        }
      }

      // If there's an unclosed check-in at the end
      if (pendingCheckIn) {
        entries.push({
          checkIn: pendingCheckIn.timeStr,
          checkOut: null,
          duration: null,
        });
      }

      // Calculate totals
      const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
      const firstEntry = entries.length > 0 && entries[0].checkIn !== '-' ? entries[0].checkIn : null;
      const lastExit = entries.length > 0 ? entries[entries.length - 1].checkOut : null;
      const hasIncomplete = entries.some((e) => e.checkOut === null || e.checkIn === '-');

      result.push({
        id: key,
        date,
        userId,
        userName: data.user ? `${data.user.firstName} ${data.user.lastName}` : '-',
        userEmail: data.user?.email || '-',
        departmentName: data.dept?.name || t('users.noDepartment'),
        entries,
        firstEntry,
        lastExit,
        totalMinutes,
        status: entries.length === 0 ? 'absent' : hasIncomplete ? 'incomplete' : 'present',
      });
    });

    // Sort by date descending, then by user name
    return result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.userName.localeCompare(b.userName);
    });
  }, [records, users, departments, t]);

  // Filter by search term
  const filteredAttendance = dailyAttendance.filter((entry) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.userName.toLowerCase().includes(searchLower) ||
      entry.userEmail.toLowerCase().includes(searchLower) ||
      entry.departmentName.toLowerCase().includes(searchLower)
    );
  });

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleExportCSV = async () => {
    try {
      const blob = await attendanceService.exportCSV({
        startDate,
        endDate,
        userId: selectedUserId || undefined,
        departmentId: selectedDepartmentId || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pointage_${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null || minutes === 0) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    return `${h}h ${m.toString().padStart(2, '0')}min`;
  };

  // Calculate summary stats
  const totalDays = new Set(dailyAttendance.map((e) => e.date)).size;
  const completeDays = dailyAttendance.filter((e) => e.status === 'present').length;
  const totalMinutesWorked = dailyAttendance.reduce((sum, e) => sum + e.totalMinutes, 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">
            {currentUser?.role === 'worker' ? t('dashboard.myAttendance') : t('attendance.title')}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-windows-textSecondary">
              {filteredAttendance.length} enregistrements
            </p>
            {/* Real-time connection indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
              wsConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {wsConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>En direct</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Hors ligne</span>
                </>
              )}
            </div>
            {lastUpdate && (
              <span className="text-xs text-windows-textSecondary">
                Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {t('common.filter')}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            {t('attendance.exportCSV')}
          </Button>
        </div>
      </div>

      {/* Manual Attendance Marking - Admin/Manager only */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-windows-accent" />
            <h2 className="text-lg font-semibold text-windows-text">
              Pointage Manuel
            </h2>
            <span className="text-sm text-windows-textSecondary">
              (en cas de problème avec l'appareil)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <Select
                label="Sélectionner un employé"
                options={[
                  { value: '', label: '-- Choisir un employé --' },
                  ...users
                    .filter((u) => u.role === 'worker' || u.role === 'manager')
                    .map((u) => ({
                      value: u.id,
                      label: `${u.firstName} ${u.lastName}`,
                    })),
                ]}
                value={manualUserId}
                onChange={(e) => {
                  setManualUserId(e.target.value);
                  setManualFeedback(null);
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                leftIcon={<LogIn className="w-4 h-4" />}
                onClick={() => handleManualAttendance('check_in')}
                isLoading={isSubmitting}
                disabled={!manualUserId || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                Entrée
              </Button>
              <Button
                variant="primary"
                leftIcon={<LogOut className="w-4 h-4" />}
                onClick={() => handleManualAttendance('check_out')}
                isLoading={isSubmitting}
                disabled={!manualUserId || isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                Sortie
              </Button>
            </div>
          </div>

          {/* Feedback message */}
          {manualFeedback && (
            <div
              className={`mt-4 p-3 rounded-windows flex items-center gap-2 ${
                manualFeedback.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {manualFeedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{manualFeedback.message}</span>
            </div>
          )}
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-windows-textSecondary">Jours enregistr&eacute;s</p>
              <p className="text-2xl font-bold text-windows-text">{totalDays}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-windows-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-windows-textSecondary">Journ&eacute;es compl&egrave;tes</p>
              <p className="text-2xl font-bold text-green-600">{completeDays}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-windows-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-windows-textSecondary">Heures totales</p>
              <p className="text-2xl font-bold text-windows-accent">{formatDuration(totalMinutesWorked)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-windows-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label={t('attendance.startDate')}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label={t('attendance.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {currentUser?.role !== 'worker' && (
              <>
                <Select
                  label={t('attendance.filterByUser')}
                  options={[
                    { value: '', label: t('common.all') },
                    ...users.map((u) => ({
                      value: u.id,
                      label: `${u.firstName} ${u.lastName}`,
                    })),
                  ]}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                />
                <Select
                  label={t('attendance.filterByDepartment')}
                  options={[
                    { value: '', label: t('common.all') },
                    ...departments.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-windows-textSecondary" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-windows-text placeholder-windows-textSecondary"
          />
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-windows-accent"></div>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="px-4 py-8 text-center text-windows-textSecondary">
            {t('attendance.noRecords')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-windows-border">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">Date</th>
                  {currentUser?.role !== 'worker' && (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                      {t('attendance.user')}
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                    Premi&egrave;re entr&eacute;e
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                    Derni&egrave;re sortie
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                    Passages
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                    Dur&eacute;e totale
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                    {t('common.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      className="border-b border-windows-border hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => entry.entries.length > 1 && toggleRowExpand(entry.id)}
                    >
                      <td className="px-4 py-3">
                        {entry.entries.length > 1 && (
                          <button className="p-1 hover:bg-gray-200 rounded">
                            {expandedRows.has(entry.id) ? (
                              <ChevronUp className="w-4 h-4 text-windows-textSecondary" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-windows-textSecondary" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-windows-textSecondary" />
                          <span className="font-medium">{formatDate(entry.date)}</span>
                        </div>
                      </td>
                      {currentUser?.role !== 'worker' && (
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-windows-text">{entry.userName}</p>
                            <p className="text-xs text-windows-textSecondary">{entry.departmentName}</p>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.firstEntry ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-green-700 font-medium">{entry.firstEntry}</span>
                            </>
                          ) : (
                            <span className="text-windows-textSecondary">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.lastExit ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              <span className="text-red-700 font-medium">{entry.lastExit}</span>
                            </>
                          ) : (
                            <span className="text-windows-textSecondary">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {entry.entries.length} {entry.entries.length > 1 ? 'passages' : 'passage'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-windows-textSecondary" />
                          <span className={entry.totalMinutes > 0 ? 'font-semibold text-windows-accent' : ''}>
                            {formatDuration(entry.totalMinutes)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : entry.status === 'incomplete'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.status === 'present'
                            ? 'Complet'
                            : entry.status === 'incomplete'
                              ? 'Incomplet'
                              : 'Absent'}
                        </span>
                      </td>
                    </tr>
                    {/* Expanded details row */}
                    {expandedRows.has(entry.id) && entry.entries.length > 1 && (
                      <tr key={`${entry.id}-details`} className="bg-gray-50">
                        <td colSpan={currentUser?.role !== 'worker' ? 8 : 7} className="px-4 py-3">
                          <div className="ml-10">
                            <p className="text-sm font-medium text-windows-text mb-2">
                              D&eacute;tail des passages:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {entry.entries.map((e, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white p-3 rounded-windows border border-windows-border"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-windows-textSecondary">
                                      Passage {idx + 1}
                                    </span>
                                    {e.duration !== null && (
                                      <span className="text-xs font-medium text-windows-accent">
                                        {formatDuration(e.duration)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                                      <span className="font-medium">{e.checkIn}</span>
                                    </div>
                                    <span className="text-windows-textSecondary">&rarr;</span>
                                    <div className="flex items-center gap-1">
                                      <div className={`w-2 h-2 rounded-full ${e.checkOut ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                      <span className={e.checkOut ? 'font-medium' : 'text-yellow-600'}>
                                        {e.checkOut || 'En cours...'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Attendance;

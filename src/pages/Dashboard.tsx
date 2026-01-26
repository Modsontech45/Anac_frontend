import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Building2,
  Cpu,
  LogIn,
  LogOut,
  UserCheck,
  Wifi,
  Filter,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/store/authStore';
import { attendanceService, departmentService } from '@/services';
import type { DashboardStats, AttendanceChartData, DepartmentStats, Department } from '@/types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card className="relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-windows-textSecondary">{title}</p>
        <p className="text-2xl font-bold text-windows-text mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-windows-lg ${color}`}>{icon}</div>
    </div>
  </Card>
);

type PeriodOption = '7' | '14' | '30' | 'custom';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<AttendanceChartData[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [period, setPeriod] = useState<PeriodOption>('7');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate date range based on period
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    if (period === 'custom') {
      return { startDate: customStartDate, endDate: customEndDate };
    }

    const days = parseInt(period);
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getAll({ limit: 100 });
        setDepartments(response.data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch dashboard data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange();

        const [statsData, chartDataResult, deptStats] = await Promise.all([
          attendanceService.getDashboardStats(),
          attendanceService.getChartData(startDate, endDate),
          departmentService.getAllStats(),
        ]);

        setStats(statsData);
        setChartData(chartDataResult);

        // Filter department stats if a department is selected
        if (selectedDepartmentId) {
          setDepartmentStats(deptStats.filter(d => d.departmentId === selectedDepartmentId));
        } else {
          setDepartmentStats(deptStats);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period, selectedDepartmentId, customStartDate, customEndDate]);

  const handleRefresh = () => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange();

    Promise.all([
      attendanceService.getDashboardStats(),
      attendanceService.getChartData(startDate, endDate),
      departmentService.getAllStats(),
    ]).then(([statsData, chartDataResult, deptStats]) => {
      setStats(statsData);
      setChartData(chartDataResult);
      if (selectedDepartmentId) {
        setDepartmentStats(deptStats.filter(d => d.departmentId === selectedDepartmentId));
      } else {
        setDepartmentStats(deptStats);
      }
    }).catch(error => {
      console.error('Failed to refresh dashboard data:', error);
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case '7': return '7 derniers jours';
      case '14': return '14 derniers jours';
      case '30': return '30 derniers jours';
      case 'custom': return 'Période personnalisée';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-windows-accent"></div>
      </div>
    );
  }

  const renderAdminDashboard = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t('dashboard.totalUsers')}
          value={stats?.totalUsers || 0}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title={t('dashboard.totalDepartments')}
          value={stats?.totalDepartments || 0}
          icon={<Building2 className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title={t('dashboard.totalDevices')}
          value={stats?.totalDevices || 0}
          icon={<Cpu className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
        <StatCard
          title={t('dashboard.onlineDevices')}
          value={stats?.onlineDevices || 0}
          icon={<Wifi className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title={t('dashboard.todayCheckIns')}
          value={stats?.todayCheckIns || 0}
          icon={<LogIn className="w-6 h-6 text-white" />}
          color="bg-teal-500"
        />
        <StatCard
          title={t('dashboard.todayCheckOuts')}
          value={stats?.todayCheckOuts || 0}
          icon={<LogOut className="w-6 h-6 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title={t('dashboard.presentToday')}
          value={stats?.presentToday || 0}
          icon={<UserCheck className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Attendance Line Chart */}
        <Card title={t('dashboard.weeklyAttendance')}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B6B6B', fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                    })
                  }
                />
                <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="checkIns"
                  name={t('attendance.checkIn')}
                  stroke="#0078D4"
                  strokeWidth={2}
                  dot={{ fill: '#0078D4' }}
                />
                <Line
                  type="monotone"
                  dataKey="checkOuts"
                  name={t('attendance.checkOut')}
                  stroke="#D13438"
                  strokeWidth={2}
                  dot={{ fill: '#D13438' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Stats Bar Chart */}
        <Card title={t('dashboard.departmentStats')}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis type="number" tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="departmentName"
                  tick={{ fill: '#6B6B6B', fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="presentToday"
                  name="Présents"
                  fill="#107C10"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="absentToday"
                  name="Absents"
                  fill="#D13438"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Attendance Summary Bar Chart */}
      <Card title="Résumé des pointages de la semaine">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B6B6B', fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '4px',
                }}
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                }
              />
              <Legend />
              <Bar
                dataKey="checkIns"
                name={t('attendance.checkIn')}
                fill="#0078D4"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="checkOuts"
                name={t('attendance.checkOut')}
                fill="#D13438"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );

  const renderManagerDashboard = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title={t('dashboard.todayCheckIns')}
          value={stats?.todayCheckIns || 0}
          icon={<LogIn className="w-6 h-6 text-white" />}
          color="bg-teal-500"
        />
        <StatCard
          title={t('dashboard.todayCheckOuts')}
          value={stats?.todayCheckOuts || 0}
          icon={<LogOut className="w-6 h-6 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title={t('dashboard.presentToday')}
          value={stats?.presentToday || 0}
          icon={<UserCheck className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card title={t('dashboard.weeklyAttendance')}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B6B6B', fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                    })
                  }
                />
                <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="checkIns"
                  name={t('attendance.checkIn')}
                  stroke="#0078D4"
                  strokeWidth={2}
                  dot={{ fill: '#0078D4' }}
                />
                <Line
                  type="monotone"
                  dataKey="checkOuts"
                  name={t('attendance.checkOut')}
                  stroke="#D13438"
                  strokeWidth={2}
                  dot={{ fill: '#D13438' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart */}
        <Card title="Résumé des pointages">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B6B6B', fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                    })
                  }
                />
                <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="checkIns"
                  name={t('attendance.checkIn')}
                  fill="#0078D4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="checkOuts"
                  name={t('attendance.checkOut')}
                  fill="#D13438"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );

  const renderWorkerDashboard = () => (
    <>
      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-windows-lg">
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-windows-textSecondary">
                {t('dashboard.lastCheckIn')}
              </p>
              <p className="text-lg font-semibold text-windows-text">
                08:30 - Entrée principale
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-windows-lg">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-windows-textSecondary">
                {t('dashboard.lastCheckOut')}
              </p>
              <p className="text-lg font-semibold text-windows-text">
                17:30 - Sortie parking
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Personal Attendance Bar Chart */}
      <Card title={t('dashboard.myAttendance')}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B6B6B', fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                  })
                }
              />
              <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '4px',
                }}
              />
              <Legend />
              <Bar
                dataKey="checkIns"
                name={t('attendance.checkIn')}
                fill="#0078D4"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="checkOuts"
                name={t('attendance.checkOut')}
                fill="#D13438"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">
            {t('dashboard.title')}
          </h1>
          <p className="text-windows-textSecondary mt-1">
            {t('dashboard.welcome')}, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-windows-textSecondary">
            <Calendar className="w-4 h-4" />
            <span>{getPeriodLabel()}</span>
          </div>
          <Button
            variant="secondary"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {t('common.filter')}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Période"
              options={[
                { value: '7', label: '7 derniers jours' },
                { value: '14', label: '14 derniers jours' },
                { value: '30', label: '30 derniers jours' },
                { value: 'custom', label: 'Personnalisée' },
              ]}
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            />

            {(user?.role === 'admin' || user?.role === 'manager') && (
              <Select
                label={t('attendance.filterByDepartment')}
                options={[
                  { value: '', label: t('common.all') },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
              />
            )}

            {period === 'custom' && (
              <>
                <Input
                  label={t('attendance.startDate')}
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <Input
                  label={t('attendance.endDate')}
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </>
            )}
          </div>

          {/* Active Filters Summary */}
          <div className="mt-4 pt-4 border-t border-windows-border flex items-center gap-2 flex-wrap">
            <span className="text-sm text-windows-textSecondary">Filtres actifs:</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {getPeriodLabel()}
            </span>
            {selectedDepartmentId && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                {departments.find(d => d.id === selectedDepartmentId)?.name}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Role-based Dashboard Content */}
      {user?.role === 'admin' && renderAdminDashboard()}
      {user?.role === 'manager' && renderManagerDashboard()}
      {user?.role === 'worker' && renderWorkerDashboard()}
    </div>
  );
};

export default Dashboard;

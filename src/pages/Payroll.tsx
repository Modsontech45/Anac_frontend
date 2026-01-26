import { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  Building2,
  Clock,
  Save,
  Download,
  Users,
} from 'lucide-react';
import {
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
import { Input } from '@/components/common/Input';
import { departmentService, userService, attendanceService } from '@/services';
import type { Department, User, AttendanceRecord } from '@/types';

interface DepartmentRate {
  departmentId: string;
  departmentName: string;
  hourlyRate: number;
  currency: string;
}

interface EmployeePayroll {
  id: string;
  name: string;
  email: string;
  department: string;
  departmentId: string;
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
}

const Payroll = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [departmentRates, setDepartmentRates] = useState<DepartmentRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Load saved rates from localStorage
  useEffect(() => {
    const savedRates = localStorage.getItem('departmentRates');
    if (savedRates) {
      setDepartmentRates(JSON.parse(savedRates));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptResponse, usersResponse, attendanceResponse] = await Promise.all([
        departmentService.getAll({ limit: 100 }),
        userService.getAll({ limit: 100 }),
        attendanceService.getAll({
          limit: 10000,
          startDate: `${selectedMonth}-01`,
          endDate: `${selectedMonth}-31`,
        }),
      ]);

      setDepartments(deptResponse.data);
      setUsers(usersResponse.data);
      setAttendance(attendanceResponse.data);

      // Initialize rates for new departments
      const savedRates = localStorage.getItem('departmentRates');
      const existingRates: DepartmentRate[] = savedRates ? JSON.parse(savedRates) : [];

      const updatedRates = deptResponse.data.map((dept) => {
        const existing = existingRates.find((r) => r.departmentId === dept.id);
        return existing || {
          departmentId: dept.id,
          departmentName: dept.name,
          hourlyRate: 0,
          currency: 'XAF',
        };
      });

      setDepartmentRates(updatedRates);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (departmentId: string, rate: number) => {
    setDepartmentRates((prev) =>
      prev.map((r) =>
        r.departmentId === departmentId ? { ...r, hourlyRate: rate } : r
      )
    );
  };

  const handleSaveRates = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('departmentRates', JSON.stringify(departmentRates));
      // Show success message (you could add a toast notification here)
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error('Failed to save rates:', error);
      setIsSaving(false);
    }
  };

  // Calculate employee payroll
  const employeePayroll = useMemo(() => {
    const payrollMap = new Map<string, { totalMinutes: number; user: User }>();

    // Group attendance by user and calculate total minutes
    attendance.forEach((record) => {
      const user = record.user || users.find((u) => u.id === record.userId);
      if (!user) return;

      if (!payrollMap.has(user.id)) {
        payrollMap.set(user.id, { totalMinutes: 0, user });
      }
    });

    // Calculate hours from attendance records (simplified - pairs check-ins with check-outs)
    const userRecords = new Map<string, AttendanceRecord[]>();
    attendance.forEach((record) => {
      const userId = record.userId;
      if (!userRecords.has(userId)) {
        userRecords.set(userId, []);
      }
      userRecords.get(userId)!.push(record);
    });

    userRecords.forEach((records, visitorId) => {
      const user = users.find((u) => u.id === visitorId);
      if (!user) return;

      // Sort records by timestamp
      const sorted = [...records].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let totalMinutes = 0;
      let pendingCheckIn: Date | null = null;

      sorted.forEach((record) => {
        if (record.type === 'check_in') {
          pendingCheckIn = new Date(record.timestamp);
        } else if (record.type === 'check_out' && pendingCheckIn) {
          const checkOut = new Date(record.timestamp);
          const diff = (checkOut.getTime() - pendingCheckIn.getTime()) / 60000;
          totalMinutes += diff;
          pendingCheckIn = null;
        }
      });

      if (payrollMap.has(visitorId)) {
        payrollMap.get(visitorId)!.totalMinutes = totalMinutes;
      } else {
        payrollMap.set(visitorId, { totalMinutes, user });
      }
    });

    // Convert to payroll array
    const payroll: EmployeePayroll[] = [];
    payrollMap.forEach(({ totalMinutes, user }) => {
      const dept = departments.find((d) => d.id === user.departmentId);
      const rate = departmentRates.find((r) => r.departmentId === user.departmentId);
      const hourlyRate = rate?.hourlyRate || 0;
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
      const totalPay = Math.round(totalHours * hourlyRate);

      payroll.push({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        department: dept?.name || 'Non assigné',
        departmentId: user.departmentId || '',
        totalHours,
        hourlyRate,
        totalPay,
      });
    });

    return payroll.sort((a, b) => b.totalPay - a.totalPay);
  }, [attendance, users, departments, departmentRates]);

  // Calculate department summary
  const departmentSummary = useMemo(() => {
    const summary = new Map<string, { name: string; totalHours: number; totalPay: number; employees: number }>();

    employeePayroll.forEach((emp) => {
      if (!summary.has(emp.departmentId)) {
        summary.set(emp.departmentId, {
          name: emp.department,
          totalHours: 0,
          totalPay: 0,
          employees: 0,
        });
      }
      const dept = summary.get(emp.departmentId)!;
      dept.totalHours += emp.totalHours;
      dept.totalPay += emp.totalPay;
      dept.employees += 1;
    });

    return Array.from(summary.values());
  }, [employeePayroll]);

  const totalPayroll = employeePayroll.reduce((sum, emp) => sum + emp.totalPay, 0);
  const totalHours = employeePayroll.reduce((sum, emp) => sum + emp.totalHours, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}min`;
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Email', 'Département', 'Heures', 'Taux horaire', 'Total'];
    const rows = employeePayroll.map((emp) => [
      emp.name,
      emp.email,
      emp.department,
      emp.totalHours.toFixed(2),
      emp.hourlyRate.toString(),
      emp.totalPay.toString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paie_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-windows-accent"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">
            Gestion de la Paie
          </h1>
          <p className="text-windows-textSecondary mt-1">
            Configurez les taux horaires et calculez la paie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Exporter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-windows-textSecondary">Total Paie</p>
              <p className="text-2xl font-bold text-windows-accent">{formatCurrency(totalPayroll)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-windows-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-windows-textSecondary">Heures Totales</p>
              <p className="text-2xl font-bold text-windows-text">{formatHours(totalHours)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-windows-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-windows-textSecondary">Employés</p>
              <p className="text-2xl font-bold text-windows-text">{employeePayroll.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-windows-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-windows-textSecondary">Départements</p>
              <p className="text-2xl font-bold text-windows-text">{departments.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-windows-lg">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Department Rates Configuration */}
        <Card title="Taux Horaires par Département" className="lg:col-span-1">
          <div className="space-y-4">
            {departmentRates.map((rate) => (
              <div key={rate.departmentId} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-windows-text">{rate.departmentName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={rate.hourlyRate}
                    onChange={(e) =>
                      handleRateChange(rate.departmentId, parseFloat(e.target.value) || 0)
                    }
                    className="w-28 text-right"
                    min={0}
                  />
                  <span className="text-sm text-windows-textSecondary">XAF/h</span>
                </div>
              </div>
            ))}
            <Button
              variant="primary"
              className="w-full mt-4"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveRates}
              isLoading={isSaving}
            >
              Enregistrer les taux
            </Button>
          </div>
        </Card>

        {/* Department Summary Chart */}
        <Card title="Paie par Département" className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis type="number" tick={{ fill: '#6B6B6B', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#6B6B6B', fontSize: 12 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '4px',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend />
                <Bar
                  dataKey="totalPay"
                  name="Total Paie"
                  fill="#0078D4"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Employee Payroll Table */}
      <Card title="Détail de la Paie par Employé" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-windows-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                  Employé
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-windows-text">
                  Département
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-windows-text">
                  Heures travaillées
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-windows-text">
                  Taux horaire
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-windows-text">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {employeePayroll.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-windows-textSecondary">
                    Aucune donnée de pointage pour cette période
                  </td>
                </tr>
              ) : (
                employeePayroll.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-windows-border hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-windows-text">{emp.name}</p>
                        <p className="text-xs text-windows-textSecondary">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Clock className="w-4 h-4 text-windows-textSecondary" />
                        <span className="font-medium">{formatHours(emp.totalHours)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-windows-textSecondary">
                      {formatCurrency(emp.hourlyRate)}/h
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-windows-accent">
                        {formatCurrency(emp.totalPay)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {employeePayroll.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={2} className="px-4 py-3 font-semibold text-windows-text">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatHours(totalHours)}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-bold text-windows-accent text-lg">
                    {formatCurrency(totalPayroll)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Payroll;

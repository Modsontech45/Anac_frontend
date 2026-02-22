import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Building2,
  Cpu,
  ClipboardList,
  Wallet,
  Settings,
  CreditCard,
  X,
  GraduationCap,
  BookOpen,
  Dumbbell,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { UserRole, OrganizationType } from '@/types';

interface NavItem {
  id: string;
  labelKey: string;
  customLabel?: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
  orgTypes?: OrganizationType[]; // if set, only show for these org types; if absent, show for all
}

const getNavItems = (_orgType: OrganizationType | null): NavItem[] => [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/',
    roles: ['admin', 'manager', 'worker'],
  },
  {
    id: 'users',
    labelKey: 'nav.users',
    icon: <Users className="w-5 h-5" />,
    path: '/users',
    roles: ['admin'],
  },
  {
    id: 'departments',
    labelKey: 'nav.departments',
    icon: <Building2 className="w-5 h-5" />,
    path: '/departments',
    roles: ['admin', 'manager'],
    orgTypes: ['enterprise', 'school'],
  },
  {
    id: 'devices',
    labelKey: 'nav.devices',
    icon: <Cpu className="w-5 h-5" />,
    path: '/devices',
    roles: ['admin'],
  },
  {
    id: 'attendance',
    labelKey: 'nav.attendance',
    icon: <ClipboardList className="w-5 h-5" />,
    path: '/attendance',
    roles: ['admin', 'manager', 'worker'],
  },
  // Enterprise: Payroll
  {
    id: 'payroll',
    labelKey: 'nav.payroll',
    icon: <Wallet className="w-5 h-5" />,
    path: '/payroll',
    roles: ['admin'],
    orgTypes: ['enterprise'],
  },
  // School: Fee Structures + Student Payments
  {
    id: 'fee-structures',
    labelKey: 'nav.feeStructures',
    customLabel: 'Tranches de Frais',
    icon: <GraduationCap className="w-5 h-5" />,
    path: '/fee-structures',
    roles: ['admin'],
    orgTypes: ['school'],
  },
  {
    id: 'student-payments',
    labelKey: 'nav.studentPayments',
    customLabel: 'Paiements Élèves',
    icon: <BookOpen className="w-5 h-5" />,
    path: '/student-payments',
    roles: ['admin', 'manager'],
    orgTypes: ['school'],
  },
  // Gym: Memberships
  {
    id: 'memberships',
    labelKey: 'nav.memberships',
    customLabel: 'Abonnements',
    icon: <Dumbbell className="w-5 h-5" />,
    path: '/memberships',
    roles: ['admin', 'manager'],
    orgTypes: ['gym'],
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: <Settings className="w-5 h-5" />,
    path: '/settings',
    roles: ['admin'],
  },
  {
    id: 'subscription',
    labelKey: 'nav.subscription',
    icon: <CreditCard className="w-5 h-5" />,
    path: '/subscription',
    roles: ['admin'],
  },
];

const Sidebar = () => {
  const { t } = useTranslation();
  const { user, organizationType } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();

  const navItems = getNavItems(organizationType);

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (!item.roles.includes(user.role)) return false;
    if (item.orgTypes && !item.orgTypes.includes(organizationType || 'enterprise')) return false;
    return true;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 w-64 bg-windows-surface border-r border-windows-border
          transform transition-transform duration-300 ease-in-out z-50
          lg:translate-x-0 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-windows-border lg:hidden">
          <span className="font-semibold text-windows-text">Menu</span>
          <button
            onClick={closeSidebar}
            className="p-1 rounded-windows hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-windows-textSecondary" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 overflow-y-auto h-[calc(100%-4rem)] lg:h-[calc(100%-3rem)]">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-windows transition-colors ${
                      isActive
                        ? 'bg-windows-accent/10 text-windows-accent'
                        : 'text-windows-text hover:bg-gray-100'
                    }`
                  }
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.customLabel || t(item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-windows-border">
          <p className="text-xs text-windows-textSecondary text-center">
            ANAC RFID v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

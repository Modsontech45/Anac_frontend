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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { UserRole } from '@/types';

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
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
  {
    id: 'payroll',
    labelKey: 'nav.payroll',
    icon: <Wallet className="w-5 h-5" />,
    path: '/payroll',
    roles: ['admin'],
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
  const { user } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

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
                  <span className="text-sm font-medium">{t(item.labelKey)}</span>
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

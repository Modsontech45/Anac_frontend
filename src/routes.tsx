import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout';
import {
  Login,
  Signup,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
  Dashboard,
  Users,
  Departments,
  Devices,
  Attendance,
  Payroll,
  Settings,
} from '@/pages';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const routes = [
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/signup',
        element: <Signup />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: '/reset-password/:token',
        element: <ResetPassword />,
      },
      {
        path: '/verify-email/:token',
        element: <VerifyEmail />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/',
            element: <Dashboard />,
          },
          {
            path: '/attendance',
            element: <Attendance />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin', 'manager']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/departments',
            element: <Departments />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/users',
            element: <Users />,
          },
          {
            path: '/devices',
            element: <Devices />,
          },
          {
            path: '/payroll',
            element: <Payroll />,
          },
          {
            path: '/settings',
            element: <Settings />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export default routes;

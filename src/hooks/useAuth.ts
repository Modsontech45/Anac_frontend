import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services';
import type { LoginCredentials } from '@/types';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const response = await authService.login(credentials);
        storeLogin(response.user, response.token, response.refreshToken);
        navigate('/');
        return response;
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate, storeLogin, setLoading]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      storeLogout();
      navigate('/login');
    }
  }, [navigate, storeLogout]);

  const hasRole = useCallback(
    (roles: string | string[]) => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isWorker = user?.role === 'worker';

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    isAdmin,
    isManager,
    isWorker,
  };
};

export default useAuth;

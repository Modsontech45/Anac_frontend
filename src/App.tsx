import { useRoutes } from 'react-router-dom';
import { useEffect } from 'react';
import routes from './routes';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/common';

function App() {
  const element = useRoutes(routes);
  const { initializeAuth, isInitialized, isLoading } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show loading state while checking auth
  if (!isInitialized && isLoading) {
    return <PageLoader fullScreen message="Loading..." />;
  }

  return element;
}

export default App;

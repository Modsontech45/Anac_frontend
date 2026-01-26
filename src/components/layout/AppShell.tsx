import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppShell = () => {
  return (
    <div className="min-h-screen bg-windows-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-0 min-h-[calc(100vh-3.5rem)] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;

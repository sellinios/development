import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { User } from '../types';
import { Menu, X, Home } from 'lucide-react';
import { clearPermissionsCache } from '../hooks/usePermissions';
import NotificationBell from './NotificationBell';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      console.log('Layout: Current location:', location.pathname);
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          // Not authenticated
          console.log('Layout: No auth, redirecting to login');
          navigate('/login');
          return;
        }

        // Set user from localStorage
        setUser(JSON.parse(storedUser));
        setLoading(false);
        console.log('Layout: User authenticated, current path:', location.pathname);
      } catch (error) {
        console.error('Authentication check failed', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearPermissionsCache();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Black Header */}
      <nav className="bg-black">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Aethra in White with nice font */}
              <h1 className="text-2xl font-light text-white tracking-wider">
                AETHRA
              </h1>
            </div>
            
            {/* Desktop Navigation - Right side */}
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-sm text-gray-300">
                {user?.first_name} {user?.last_name}
              </span>
              {/* Home Button */}
              <a
                href="/home"
                className="text-white hover:bg-gray-800 p-2 rounded-md transition-colors duration-200"
                title="Home"
              >
                <Home className="h-5 w-5" />
              </a>
              {/* Notification Bell - for admins and superadmins */}
              {(user?.role === 'superadmin' || user?.role === 'admin') && (
                <div className="text-white">
                  <NotificationBell />
                </div>
              )}
              {/* Admin Panel Button - Only for superadmins */}
              {user?.role === 'superadmin' && (
                <a
                  href="/admin"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Admin Panel
                </a>
              )}
              <button
                onClick={handleLogout}
                className="text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <div className="text-sm text-gray-300 px-3 py-2">
                {user?.first_name} {user?.last_name}
              </div>
              <a
                href="/intranet/home"
                className="flex items-center gap-2 text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                <Home className="h-4 w-4" />
                Home
              </a>
              {user?.role === 'superadmin' && (
                <a
                  href="/intranet/admin"
                  className="block bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Admin Panel
                </a>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
import { useTranslation } from 'react-i18next';
import { Menu, Bell, User, LogOut, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-windows-surface border-b border-windows-border h-14 flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-windows hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-windows-text" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/Logo.png"
            alt="ANAC"
            className="w-8 h-8 object-contain"
          />
          <span className="font-semibold text-windows-text hidden sm:block">
            ANAC
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-2 rounded-windows hover:bg-gray-100 transition-colors flex items-center gap-1"
            aria-label="Change language"
          >
            <Globe className="w-5 h-5 text-windows-textSecondary" />
            <span className="text-sm text-windows-text uppercase">
              {i18n.language}
            </span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 mt-1 w-32 bg-windows-surface rounded-windows-lg shadow-windows-elevated border border-windows-border py-1 animate-fade-in">
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  i18n.language === 'fr' ? 'text-windows-accent font-medium' : 'text-windows-text'
                }`}
              >
                Fran\u00e7ais
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  i18n.language === 'en' ? 'text-windows-accent font-medium' : 'text-windows-text'
                }`}
              >
                English
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          className="p-2 rounded-windows hover:bg-gray-100 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-windows-textSecondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-windows-error rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-windows hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-windows-text hidden sm:block">
              {user?.firstName} {user?.lastName}
            </span>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-windows-surface rounded-windows-lg shadow-windows-elevated border border-windows-border py-1 animate-fade-in">
              <div className="px-4 py-2 border-b border-windows-border">
                <p className="text-sm font-medium text-windows-text">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-windows-textSecondary">{user?.email}</p>
                <p className="text-xs text-windows-accent mt-1">
                  {t(`users.roles.${user?.role}`)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-windows-error hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

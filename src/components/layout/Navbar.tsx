import { useTranslation } from 'react-i18next';
import { Menu, Bell, User, LogOut, Globe, Clock, Thermometer } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import organizationService, { type Organization } from '@/services/organization.service';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherLocation, setWeatherLocation] = useState<string>('');
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

  // Fetch organization data for logo
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const data = await organizationService.getMyOrganization();
        setOrganization(data);
      } catch (error) {
        console.error('Failed to fetch organization:', error);
      }
    };
    fetchOrganization();
  }, []);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather/temperature
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              // Use Open-Meteo API (free, no API key required)
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
              );
              const data = await response.json();
              if (data.current_weather) {
                setTemperature(Math.round(data.current_weather.temperature));
              }
              // Try to get location name
              try {
                const geoResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                );
                const geoData = await geoResponse.json();
                setWeatherLocation(geoData.address?.city || geoData.address?.town || '');
              } catch {
                // Ignore geocoding errors
              }
            },
            () => {
              // If geolocation denied, use default location (Yaounde, Cameroon)
              fetchDefaultWeather();
            }
          );
        } else {
          fetchDefaultWeather();
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      }
    };

    const fetchDefaultWeather = async () => {
      try {
        // Default to Yaounde, Cameroon
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=3.8667&longitude=11.5167&current_weather=true'
        );
        const data = await response.json();
        if (data.current_weather) {
          setTemperature(Math.round(data.current_weather.temperature));
          setWeatherLocation('Yaounde');
        }
      } catch {
        // Ignore errors
      }
    };

    fetchWeather();
    // Refresh weather every 30 minutes
    const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, []);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // Get logo URL (Cloudinary returns full URL)
  const getLogoUrl = () => {
    if (organization?.logoUrl) {
      return organization.logoUrl; // Full Cloudinary URL
    }
    return '/Logo.png'; // Fallback to default logo
  };

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
            src={getLogoUrl()}
            alt={organization?.name || 'ANAC'}
            className="w-8 h-8 object-contain"
          />
          <span className="font-semibold text-windows-text hidden sm:block">
            {organization?.name || 'ANAC'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Clock & Date */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-windows border border-windows-border">
          <Clock className="w-4 h-4 text-windows-accent" />
          <div className="text-sm">
            <span className="font-medium text-windows-text">{formatTime(currentTime)}</span>
            <span className="text-windows-textSecondary ml-2">{formatDate(currentTime)}</span>
          </div>
        </div>

        {/* Temperature */}
        {temperature !== null && (
          <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-windows border border-windows-border">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-windows-text">{temperature}°C</span>
            {weatherLocation && (
              <span className="text-xs text-windows-textSecondary">{weatherLocation}</span>
            )}
          </div>
        )}

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

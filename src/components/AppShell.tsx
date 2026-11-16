import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  HeartPulse,
  Pill,
  Siren,
  Users,
  CalendarClock,
  Mic,
  Settings,
  HelpCircle,
  LogOut,
  Globe,
  User as UserIcon,
  Type,
  Eye,
} from 'lucide-react';
import { ElderEaseLogo } from './ElderEaseLogo';
import { useAuth } from '../context/AuthContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, language, setLanguage, largeText, highContrast, setAccessibility, logout, t } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const sidebarItems = [
    { to: '/dashboard', label: t.nav.home, Icon: Home },
    { to: '/health', label: t.nav.health, Icon: HeartPulse },
    { to: '/medicines', label: t.nav.medicines, Icon: Pill },
    { to: '/sos', label: t.nav.sos, Icon: Siren },
    { to: '/family', label: t.nav.family, Icon: Users },
    { to: '/appointments', label: t.nav.appointments, Icon: CalendarClock },
    { to: '/voice', label: t.nav.voice, Icon: Mic },
    { to: '/settings', label: t.nav.settings, Icon: Settings },
    { to: '/help', label: t.nav.help, Icon: HelpCircle },
  ];

  const bottomNavItems = [
    { to: '/dashboard', label: t.nav.home, Icon: Home },
    { to: '/health', label: t.nav.health, Icon: HeartPulse },
    { to: '/appointments', label: t.nav.appointments, Icon: CalendarClock },
    { to: '/settings', label: t.nav.settings, Icon: Settings },
    { to: '/help', label: t.nav.help, Icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#14274E] flex flex-col lg:flex-row">
      {/* Desktop Navigation Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 bg-white border-r border-[#E6DFD3] px-5 py-6 justify-between sticky top-0 h-screen"
        aria-label="Sidebar Navigation"
      >
        <div>
          <Link to="/dashboard" className="block mb-8">
            <ElderEaseLogo size="sm" showTagline taglineText={t.tagline} />
          </Link>

          <nav className="space-y-1.5">
            {sidebarItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-base font-semibold transition-colors min-h-[48px] ${
                    isActive
                      ? 'bg-[#14274E] text-white'
                      : 'text-[#14274E] hover:bg-[#FEF8EA]'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E6DFD3] space-y-3">
          {user && (
            <div className="px-2">
              <p className="text-sm font-bold text-[#14274E] truncate">{user.full_name}</p>
              <p className="text-xs text-[#4A5568] truncate">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#FDF0F0] text-[#9B2C2C] font-bold text-base hover:bg-[#fbdcdc] transition-colors min-h-[48px]"
          >
            <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        {/* Top Utility Header */}
        <header className="bg-[#FAF7F2]/95 backdrop-blur border-b border-[#E6DFD3] sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <Link to="/dashboard">
                <ElderEaseLogo size="sm" />
              </Link>
            </div>

            <div className="hidden lg:block text-sm font-medium text-[#4A5568]">
              {t.tagline}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
                aria-label="Switch language"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#E6DFD3] text-sm font-bold text-[#14274E] hover:bg-[#FEF8EA] transition-colors min-h-[42px] whitespace-nowrap"
              >
                <Globe className="w-4 h-4 text-[#14274E]" aria-hidden="true" />
                <span>{language === 'en' ? 'EN' : 'ML'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessibility({ large_text: !largeText })}
                aria-pressed={largeText}
                title={t.settings.largeTextLabel}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-full border text-sm font-bold transition-colors min-h-[42px] whitespace-nowrap ${
                  largeText
                    ? 'bg-[#14274E] text-white border-[#14274E]'
                    : 'bg-white text-[#14274E] border-[#E6DFD3]'
                }`}
              >
                <Type className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Aa</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessibility({ high_contrast: !highContrast })}
                aria-pressed={highContrast}
                title={t.settings.highContrastLabel}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-full border text-sm font-bold transition-colors min-h-[42px] whitespace-nowrap ${
                  highContrast
                    ? 'bg-[#14274E] text-white border-[#14274E]'
                    : 'bg-white text-[#14274E] border-[#E6DFD3]'
                }`}
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
              </button>

              <Link
                to="/settings"
                aria-label={t.nav.settings}
                className="w-11 h-11 rounded-full bg-white border border-[#E6DFD3] flex items-center justify-center text-[#14274E] hover:bg-[#EEF4FD] transition-colors"
              >
                <UserIcon className="w-5 h-5" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FDF0F0] text-[#9B2C2C] text-sm font-bold min-h-[42px]"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{t.nav.logout}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar matching Reference UI */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E6DFD3] shadow-lg"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors px-1 ${
                  isActive
                    ? 'text-[#B57913] border-b-4 border-[#D49425]'
                    : 'text-[#4A5568] hover:text-[#14274E]'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-full">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { LogOut, Menu, X, Sun, Moon, Bell, User, ChevronDown, Check } from 'lucide-react';
import { navigation, filterNavigationByRole, Role } from '@/lib/navigation';
import { alertsService, type Alert } from '@/lib/services';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isInitialized, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const visibleNavigation = filterNavigationByRole(navigation, user?.role as Role | undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Load alerts when notifications panel opens
  useEffect(() => {
    if (notifOpen && isAuthenticated) {
      setAlertsLoading(true);
      alertsService
        .getAll()
        .then((data) => setAlerts(data))
        .catch(() => setAlerts([]))
        .finally(() => setAlertsLoading(false));
    }
  }, [notifOpen, isAuthenticated]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAlertAsRead = async (id: string) => {
    try {
      await alertsService.markAsRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    } catch {
      // ignore
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sai-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--sai-accent)' }} />
          <p className="mt-4" style={{ color: 'var(--sai-text-secondary)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  const cardStyleObj = {
    background: 'var(--sai-bg-card)',
    border: '1px solid var(--sai-border)',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--sai-bg-primary)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--sai-bg-sidebar)',
          borderRight: '1px solid var(--sai-border)',
          boxShadow: 'var(--sai-shadow-lg)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--sai-border)' }}>
            <div className="w-full">
              <img
                src="/sidebar-logo.svg"
                alt="SAI - Sistema Ambiental Integrado"
                className="h-10 w-auto"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
              style={{ color: 'var(--sai-text-secondary)' }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {/* Modules section */}
            {visibleNavigation.filter(i => i.section === 'modules').length > 0 && (
              <>
                <div className="px-4 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>Módulos</p>
                </div>
                {visibleNavigation.filter(i => i.section === 'modules').map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200"
                      style={{
                        background: isActive ? 'var(--sai-accent-light)' : 'transparent',
                        color: isActive ? 'var(--sai-accent-text)' : 'var(--sai-text-primary)',
                        fontWeight: isActive ? 600 : 500,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--sai-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}

            {/* Admin section */}
            {visibleNavigation.filter(i => i.section === 'admin').length > 0 && (
              <>
                <div className="my-4" style={{ borderTop: '1px solid var(--sai-border)' }} />
                <div className="px-4 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sai-text-tertiary)' }}>Administración</p>
                </div>
                {visibleNavigation.filter(i => i.section === 'admin').map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200"
                      style={{
                        background: isActive ? 'var(--sai-accent-light)' : 'transparent',
                        color: isActive ? 'var(--sai-accent-text)' : 'var(--sai-text-primary)',
                        fontWeight: isActive ? 600 : 500,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'var(--sai-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* User section */}
          <div className="p-4" style={{ borderTop: '1px solid var(--sai-border)' }}>
            <div className="mb-3">
              <p className="text-sm font-medium" style={{ color: 'var(--sai-text-primary)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ color: 'var(--sai-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--sai-danger-bg)';
                e.currentTarget.style.color = 'var(--sai-danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--sai-text-secondary)';
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header
          style={{
            background: 'var(--sai-bg-header)',
            borderBottom: '1px solid var(--sai-border)',
            boxShadow: 'var(--sai-shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{ color: 'var(--sai-text-secondary)' }}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1 lg:flex-none" />
            
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={(e) => {
                  const icon = e.currentTarget.querySelector('.theme-toggle-icon');
                  icon?.classList.add('spinning');
                  setTimeout(() => icon?.classList.remove('spinning'), 500);
                  toggleTheme(e);
                }}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: 'var(--sai-bg-tertiary)',
                  color: 'var(--sai-text-secondary)',
                  border: '1px solid var(--sai-border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sai-accent-light)';
                  e.currentTarget.style.color = 'var(--sai-accent)';
                  e.currentTarget.style.borderColor = 'var(--sai-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sai-bg-tertiary)';
                  e.currentTarget.style.color = 'var(--sai-text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--sai-border)';
                }}
                title={!mounted ? 'Tema' : theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {!mounted ? (
                  <div className="w-5 h-5" />
                ) : theme === 'light' ? (
                  <Moon className="w-5 h-5 theme-toggle-icon" />
                ) : (
                  <Sun className="w-5 h-5 theme-toggle-icon" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    background: 'var(--sai-bg-tertiary)',
                    color: 'var(--sai-text-secondary)',
                    border: '1px solid var(--sai-border)',
                  }}
                  aria-label="Notificaciones"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: 'var(--sai-danger)', color: '#fff' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-50" style={cardStyleObj}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--sai-border)' }}>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--sai-text-primary)' }}>Notificaciones</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs" style={{ color: 'var(--sai-text-tertiary)' }}>{unreadCount} sin leer</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {alertsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--sai-accent)' }} />
                        </div>
                      ) : alerts.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--sai-text-tertiary)' }}>
                          No hay notificaciones
                        </div>
                      ) : (
                        alerts.map((alert) => (
                          <div key={alert.id} className={`px-4 py-3 ${alert.read ? 'opacity-60' : ''}`} style={{ borderBottom: '1px solid var(--sai-border)' }}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: 'var(--sai-text-primary)' }}>{alert.type}</p>
                                <p className="text-sm truncate" style={{ color: 'var(--sai-text-secondary)' }}>{alert.message}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--sai-text-tertiary)' }}>
                                  {new Date(alert.createdAt).toLocaleDateString('es-CO')}
                                </p>
                              </div>
                              {!alert.read && (
                                <button onClick={() => markAlertAsRead(alert.id)} className="p-1 rounded transition-colors" style={{ color: 'var(--sai-text-tertiary)' }} title="Marcar como leída">
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: 'var(--sai-accent)', color: 'var(--sai-text-inverse)' }}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span className="hidden md:block text-sm font-medium" style={{ color: 'var(--sai-text-secondary)' }}>
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--sai-text-tertiary)' }} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50 py-1" style={cardStyleObj}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sai-border)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--sai-text-primary)' }}>{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--sai-text-tertiary)' }}>{user?.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm transition-colors" style={{ color: 'var(--sai-text-secondary)' }}>
                      <User className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </Link>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm transition-colors" style={{ color: 'var(--sai-text-secondary)' }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

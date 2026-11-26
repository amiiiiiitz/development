import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FolderKanban,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Settings,
  Users,
  UserCog,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { hasAnyPermission } from '../../utils/permissions';
import { dashboardService } from '../../services/erpServices';
import { formatDateTime } from '../../utils/formatters';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perms: ['dashboard:read'] },
  { to: '/projects', label: 'Projects', icon: FolderKanban, perms: ['projects:read'] },
  { to: '/inventory', label: 'Inventory', icon: Home, perms: ['inventory:read'] },
  {
    to: '/customers',
    label: 'Customers & Leads',
    icon: Users,
    perms: ['customers:read', 'leads:read'],
  },
  { to: '/bookings', label: 'Bookings', icon: ClipboardList, perms: ['bookings:read'] },
  { to: '/collections', label: 'Collections', icon: CreditCard, perms: ['collections:read'] },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, perms: ['complaints:read'] },
  {
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    perms: ['reports:operational', 'reports:financial'],
  },
  { to: '/employees', label: 'Employees', icon: UserCog, perms: ['employees:read'] },
  { to: '/settings', label: 'Settings', icon: Settings, perms: [] },
];

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  inventory: 'Inventory',
  customers: 'Customers & Leads',
  bookings: 'Bookings',
  collections: 'Collections',
  complaints: 'Complaints',
  reports: 'Reports',
  employees: 'Employees',
  settings: 'Settings',
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const visibleNav = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => item.perms.length === 0 || hasAnyPermission(user, item.perms)
      ),
    [user]
  );

  const breadcrumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((segment, idx) => {
      const path = `/${parts.slice(0, idx + 1).join('/')}`;
      const label = ROUTE_LABELS[segment] || (segment.length > 20 ? 'Details' : segment);
      return { path, label };
    });
  }, [location.pathname]);

  const { data: notifData } = useQuery({
    queryKey: ['header-notifications'],
    queryFn: () => dashboardService.get(),
    enabled: Boolean(user),
    staleTime: 60000,
  });

  const notifications = notifData?.recent_activities || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const renderSidebarLinks = (onSelect) => (
    <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onSelect}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Real Estate ERP
          </span>
        </div>
        {renderSidebarLinks()}
        <div className="border-t border-slate-200 p-3">
          <div className="px-2 py-1.5 text-xs text-slate-500">
            <p className="font-medium text-slate-800 truncate">{user?.full_name}</p>
            <p className="truncate">{user?.role_name?.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex w-64 max-w-xs flex-col bg-white border-r border-slate-200 z-10">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-900" />
                <span className="font-display text-sm font-bold text-slate-900">
                  Real Estate ERP
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderSidebarLinks(() => setMobileNavOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-md p-2 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <Link to="/dashboard" className="hover:text-slate-900 whitespace-nowrap">
                Workspace
              </Link>
              {breadcrumbs.map((bc) => (
                <React.Fragment key={bc.path}>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <Link
                    to={bc.path}
                    className="font-medium text-slate-800 hover:text-slate-900 whitespace-nowrap truncate"
                  >
                    {bc.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                setProfileOpen(false);
              }}
              aria-label="Recent operational notifications"
              className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Bell className="h-4 w-4" />
            </button>

            {notifOpen && (
              <div className="absolute right-12 top-11 w-80 rounded-lg border border-slate-200 bg-white shadow-lg p-3 z-40">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="text-xs font-semibold text-slate-900">
                    Recent Operational Activity
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Close
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">
                    No recent activity recorded.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id} className="py-2 text-xs">
                        <p className="font-medium text-slate-800">{n.summary}</p>
                        <p className="text-slate-500 mt-0.5">
                          {n.employee_name || 'System'} · {formatDateTime(n.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap"
              >
                <span>{user?.full_name}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{user?.employee_code}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-52 rounded-lg border border-slate-200 bg-white shadow-lg py-1.5 z-40">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-700 hover:bg-red-50 text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

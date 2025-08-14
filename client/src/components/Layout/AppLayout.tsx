
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  FileText,
  Settings,
  Menu,
  X,
  Building2,
  LogOut,
  User,
  Target,
  BarChart3,
  Image,
  Zap,
  Layout,
  ChevronDown,
  Bell,
  Search,
  Plus,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { NotificationCenter } from "../NotificationCenter";
import { ThemeSelector } from "../ThemeSelector";
import { useTheme } from "../../hooks/useTheme";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { state, dispatch } = useAppContext();
  const { currentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigationMode, setNavigationMode] = useState<'sidebar' | 'top'>('sidebar');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home, category: "main" },
    { name: "Content", href: "/content", icon: FileText, category: "content" },
    { name: "Schedule", href: "/schedule", icon: Calendar, category: "content" },
    { name: "Media", href: "/media", icon: Image, category: "content" },
    { name: "Campaigns", href: "/campaigns", icon: Target, category: "marketing" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, category: "marketing" },
    { name: "AI Training", href: "/ai-training", icon: Zap, category: "ai" },
    { name: "Templates", href: "/templates", icon: Layout, category: "content" },
    { name: "Companies", href: "/companies", icon: Building2, category: "main" },
    { name: "Settings", href: "/settings", icon: Settings, category: "main" },
  ];

  const categorizedNav = {
    main: navigationItems.filter(item => item.category === 'main'),
    content: navigationItems.filter(item => item.category === 'content'),
    marketing: navigationItems.filter(item => item.category === 'marketing'),
    ai: navigationItems.filter(item => item.category === 'ai'),
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/auth");
  };

  useEffect(() => {
    setSidebarOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const renderSidebarNavigation = () => (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <div className="flex h-full flex-col theme-bg-card backdrop-blur-lg">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="theme-text-primary font-bold text-lg">
              Social AI
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNavigationMode(navigationMode === 'sidebar' ? 'top' : 'sidebar')}
              className="p-1 theme-text-secondary hover:theme-text-primary transition-colors"
              title="Switch Navigation Mode"
            >
              <Layout className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden theme-text-secondary hover:theme-text-primary"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {Object.entries(categorizedNav).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="theme-text-light text-xs font-semibold uppercase tracking-wider mb-2 px-3">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "theme-bg-primary theme-text-primary shadow-lg scale-105"
                        : "theme-text-secondary hover:theme-bg-secondary hover:theme-text-primary hover:scale-102"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t theme-border px-3 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="theme-text-primary text-sm font-medium truncate max-w-24">
                  {state.user?.name || "User"}
                </p>
                <p className="theme-text-light text-xs truncate max-w-24">
                  {state.user?.plan || "free"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <ThemeSelector />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 theme-text-light hover:theme-text-primary transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTopNavigation = () => (
    <div className="sticky top-0 z-50 theme-bg-card backdrop-blur-lg border-b theme-border">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="theme-text-primary font-bold text-lg">
              Social AI
            </span>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {Object.entries(categorizedNav).map(([category, items]) => (
              <div key={category} className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === category ? null : category)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary transition-all duration-200"
                >
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {activeDropdown === category && (
                  <div className="absolute top-full left-0 mt-1 w-48 theme-bg-card rounded-lg shadow-xl border theme-border py-2 z-50">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                            isActive
                              ? "theme-text-primary theme-bg-primary"
                              : "theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-light" />
              <input
                type="text"
                placeholder="Search..."
                className="theme-input pl-10 pr-4 py-2 w-64 rounded-lg text-sm"
              />
            </div>
          </div>

          <button className="theme-button-secondary p-2 rounded-lg">
            <Plus className="w-5 h-5" />
          </button>

          <NotificationCenter />
          <ThemeSelector />

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNavigationMode(navigationMode === 'sidebar' ? 'top' : 'sidebar')}
              className="p-2 theme-text-secondary hover:theme-text-primary transition-colors"
              title="Switch to Sidebar"
            >
              <Layout className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden theme-text-secondary hover:theme-text-primary"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bgGradient}`}>
      <div className="absolute inset-0 animated-bg opacity-30"></div>

      {navigationMode === 'sidebar' ? renderSidebarNavigation() : renderTopNavigation()}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && navigationMode === 'top' && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar for top nav mode */}
      {navigationMode === 'top' && (
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col theme-bg-card">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="theme-text-primary font-bold text-lg">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="theme-text-secondary hover:theme-text-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mb-1 ${
                      isActive
                        ? "theme-bg-primary theme-text-primary shadow-lg"
                        : "theme-text-secondary hover:theme-bg-secondary hover:theme-text-primary"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={navigationMode === 'sidebar' ? 'lg:pl-64' : ''}>
        {navigationMode === 'sidebar' && (
          <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 theme-bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 theme-text-secondary lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="relative flex flex-1 items-center">
                <h1 className="theme-text-primary text-xl font-semibold">
                  {navigationItems.find((item) => item.href === location.pathname)
                    ?.name || "Dashboard"}
                </h1>
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <NotificationCenter />
              </div>
            </div>
          </div>
        )}

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
};

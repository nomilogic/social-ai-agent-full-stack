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

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Content", href: "/content", icon: FileText },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Campaigns", href: "/campaigns", icon: Target },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/auth");
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bgGradient}`}>
      <div className="absolute inset-0 animated-bg opacity-30"></div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col theme-bg-card">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="theme-text-primary font-bold text-lg">
                Social AI
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden theme-text-secondary hover:theme-text-primary"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
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

          <div className="border-t theme-border px-3 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="theme-text-primary text-sm font-medium">
                    {state.user?.name || "User"}
                  </p>
                  <p className="theme-text-light text-xs">
                    {state.user?.email}
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
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

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
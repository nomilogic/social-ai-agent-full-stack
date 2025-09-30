import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  PenTool,
  Calendar,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Target,
  LogOut,
  User,
  Building2,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useLoading } from "../../context/LoadingContext";
import { NotificationCenter } from "../NotificationCenter";
import { ThemeSelector } from "../ThemeSelector";
import { useTheme } from "../../hooks/useTheme";
import Icon from "../Icon";
import { WalletBalance } from "../WalletBalance";
import PreloaderOverlay from "../PreloaderOverlay";

// Define the props for AppLayout
interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAppContext();
  const { loadingState } = useLoading();
  const { currentTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close notification center when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth");
    setShowUserMenu(false);
  };

  const navigation = [
    { name: "Create Content", path: "/content", icon: PenTool },
    // { name: "Dashboard", path: "/dashboard", icon: Home },
    // { name: "Campaigns", path: "/campaigns", icon: Target },
    
    // { name: "Schedule", path: "/schedule", icon: Calendar },
    // { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Themed Background */}
      <div
        className={`fixed inset-0 bg-gradient-to-br ${currentTheme.bgGradient}`}
      >
        {/* <div className="absolute inset-0 bg-black/20"></div> */}
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div> */}
      </div>


      {/* Sidebar */}

      <div className="relative z-10">
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 theme-bg-trinary border-r border-white/10 transform ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          {/* Close button */}
          <div className="flex items-center justify-end px-4 py-3 border-b border-white/20">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md theme-text-light hover:theme-text-primary"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center space-x-3 mb-3">
              <img
                className="h-10 w-10 rounded-full object-cover border-2 border-white/30 theme-bg-trinary"
                src={
                  user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.name || user?.email || "User")}&background=00000000&color=fff`
                }
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium theme-text-primary truncate">
                  {user?.user_metadata?.name || user?.email || "User"}
                </div>
                <div className="text-xs theme-text-light truncate">{user?.email}</div>
              </div>
            </div>
            
            {/* Sign out button */}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors theme-text-light hover:theme-bg-secondary hover:theme-text-primary"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "theme-bg-primary theme-text-secondary"
                      : "theme-text-light hover:theme-bg-secondary hover:theme-text-primary"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Profile Settings */}
            <div className="border-t border-white/20 pt-2 mt-2">
              <Link
                to="/settings"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === "/settings"
                    ? "theme-bg-primary theme-text-secondary"
                    : "theme-text-light hover:theme-bg-secondary hover:theme-text-primary"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </div>
          </nav>
        </div>
        {/* Top Navigation */}
        <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-white/20 px-4 py-0">
          <div className="relative flex items-center justify-between mt-3">
            {/* Left: Mobile menu button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1 rounded-md theme-text-primary hover:theme-text-secondary"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Center: Logo + Brand */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none select-none">
              <Icon name="logo" size={50} className="ml-0 lg:ml-0" />
              <span className="theme-text-primary text-2xl lg:text-3xl font-extrabold tracking-tight">𝗢𝗺𝗻𝗶𝗦𝗵𝗮𝗿𝗲</span>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-1">
              {/* Theme Selector */}
              <ThemeSelector />

              {/* Notifications */}
              {/* <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 theme-text-primary hover:theme-text-secondary relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                    3
                  </span>
                </button>
                {showNotifications && (
                  <NotificationCenter
                    onClose={() => setShowNotifications(false)}
                    userId={user?.id}
                  />
                )}
              </div> */}
              <div>
                <WalletBalance />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="py-0 h-full-dec-hf overflow-auto theme-bg-card lg:px-[20%]">
          <div className="w-full mx-auto sm:px-0 lg:px-0 overflow-auto">
            <div className="  p-0  ">{children}</div>
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 w-full theme-bg-card border-t border-white/20 mt-0">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-4 py-2">
            <div className="text-center flex flex-col items-center justify-center">
              <div className="theme-text-primary text-xs">
                © 2025 OMNI SHARE. Powered by 
              </div>
              <div className="mt-2 flex justify-center space-x-6 text-xs theme-text-secondary">
                <Link
                  to="/privacy"
                  className="hover:theme-text-primary transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <span className="text-white/20">•</span>
                <a
                  href="#"
                  className="hover:theme-text-primary transition-colors duration-200"
                >
                  Terms of Service
                </a>
                <span className="text-white/20">•</span>
                <a
                  href="#"
                  className="hover:theme-text-primary transition-colors duration-200"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Preloader Overlay */}
      <PreloaderOverlay loadingState={loadingState} />
    </div>
  );
};

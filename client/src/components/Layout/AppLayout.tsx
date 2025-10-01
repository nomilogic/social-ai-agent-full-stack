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
  History,
  CreditCard,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useLoading } from "../../context/LoadingContext";
import { NotificationCenter } from "../NotificationCenter";
import { ThemeSelector } from "../ThemeSelector";
import { useTheme } from "../../hooks/useTheme";
import { useUnreadPosts } from "../../hooks/useUnreadPosts";
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
  const { unreadCount, markAllAsRead: markAllUnreadAsRead } = useUnreadPosts();
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

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // API call to mark all as read
      const response = await fetch('/api/post-history/history/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local unread count immediately
        markAllUnreadAsRead();
        console.log('📚 All posts marked as read from sidebar badge');
      }
    } catch (error) {
      console.error('Error marking all posts as read:', error);
    }
  };

  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Create Content", path: "/content", icon: PenTool },
    { name: "Accounts", path: "/accounts", icon: Building2 },
    { name: "History", path: "/history", icon: History },
    { name: "Price Plan", path: "/pricing", icon: CreditCard },
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
          <div className="flex items-center justify-end border-b border-white/20 p-2">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md theme-text-light hover:theme-text-primary"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-1 border-b border-white/20">
            <div className="flex items-center space-x-3 mb-1">
              <img
                className="h-10 w-10 rounded-full object-cover border-2 border-white/30 theme-bg-trinary"
                src={
                  user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.name || user?.email || "User")}&background=00000000&color=fff`
                }
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium theme-text-light truncate">
                  {user?.user_metadata?.name || user?.email || "User"}
                </div>
                <div className="text-xs theme-text-light truncate">{user?.email}</div>
              </div>
            </div>
            
            
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const showBadge = item.name === 'History' && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "theme-bg-primary theme-text-secondary"
                      : "theme-text-light hover:theme-bg-secondary hover:theme-text-primary"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  {showBadge && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="h-6 w-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-xs text-white font-bold transition-colors duration-200 cursor-pointer border-0 outline-none"
                      title={`Mark all ${unreadCount} unread posts as read`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </button>
                  )}
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
         <div>
              <footer className="fixed bottom-0 w-full ">
                {/* Sign out button */}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors theme-text-light hover:theme-bg-secondary hover:theme-text-primary border-b border-white/20 p-2"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          <div className="w-full mx-auto">
            <div className="text-center flex flex-col items-center justify-center">
              <div className="theme-text-light text-xs">
                © 2025 OMNI SHARE
              </div>
              <div className="mb-2 flex justify-center space-x-1 text-xs theme-text-light">
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
        </div>
        {/* Top Navigation */}
        <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-white/20 px-4 py-0">
          <div className="relative flex items-center justify-between mt-3">
            {/* Left: Mobile menu button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1 rounded-md theme-text-primary hover:theme-text-secondary relative"
              >
                <Menu className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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
  
      </div>

      {/* Global Preloader Overlay */}
      <PreloaderOverlay loadingState={loadingState} />
    </div>
  );
};

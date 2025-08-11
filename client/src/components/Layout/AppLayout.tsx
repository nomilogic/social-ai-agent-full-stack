import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Sparkles, LogOut, Bell, Home, Building2, Calendar, Settings, Plus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { NotificationCenter } from '../NotificationCenter';

export const AppLayout: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'RESET_STATE' });
    navigate('/auth');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/companies', icon: Building2, label: 'Companies' },
    { path: '/content', icon: Plus, label: 'Create Content' },
    { path: '/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Social AI Agent</h1>
                  <p className="text-sm text-gray-600">AI-Powered Social Media Content Generator</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActivePath(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              {state.user && (
                <span className="text-sm text-gray-600">
                  Welcome, {state.user.user_metadata?.name || state.user.email}
                </span>
              )}
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 hover:bg-gray-100 rounded-lg"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        userId={state.user?.id}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Social AI Agent. Powered by advanced AI for smarter social media content.
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
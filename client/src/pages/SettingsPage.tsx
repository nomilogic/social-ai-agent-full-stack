import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { User, Shield, Bell, Palette } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { state } = useAppContext();
  const location = useLocation();

  const settingsNavItems = [
    { path: '/settings/profile', icon: User, label: 'Profile' },
    { path: '/settings/security', icon: Shield, label: 'Security' },
    { path: '/settings/notifications', icon: Bell, label: 'Notifications' },
    { path: '/settings/appearance', icon: Palette, label: 'Appearance' },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <Routes>
              <Route
                index
                element={
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Settings</h3>
                    <p className="text-gray-600">Select a category from the left to manage your settings.</p>
                  </div>
                }
              />
              <Route
                path="profile"
                element={
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={state.user?.email || ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={state.user?.user_metadata?.name || ''}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Save Changes
                      </button>
                    </div>
                  </div>
                }
              />
              <Route
                path="security"
                element={
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Password</h4>
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                          Change Password
                        </button>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                        <p className="text-gray-600 mb-4">Add an extra layer of security to your account.</p>
                        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                }
              />
              <Route
                path="notifications"
                element={
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-gray-600">Receive updates about your posts and campaigns.</p>
                        </div>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">Push Notifications</h4>
                          <p className="text-gray-600">Get instant alerts in your browser.</p>
                        </div>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </div>
                    </div>
                  </div>
                }
              />
              <Route
                path="appearance"
                element={
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Appearance</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Theme</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                            <div className="w-full h-20 bg-white border rounded mb-2"></div>
                            <p className="text-center text-sm font-medium">Light</p>
                          </div>
                          <div className="p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                            <div className="w-full h-20 bg-gray-800 border rounded mb-2"></div>
                            <p className="text-center text-sm font-medium">Dark</p>
                          </div>
                          <div className="p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                            <div className="w-full h-20 bg-gradient-to-br from-blue-50 to-purple-50 border rounded mb-2"></div>
                            <p className="text-center text-sm font-medium">Auto</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};
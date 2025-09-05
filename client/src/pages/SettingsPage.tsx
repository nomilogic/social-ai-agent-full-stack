import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { User, Shield, Bell, Palette, Save, Check, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';

export const SettingsPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const { currentTheme, changeTheme, availableThemes, currentThemeKey } = useTheme();
  
  // Form states
  const [profileData, setProfileData] = useState({
    displayName: state.user?.user_metadata?.name || '',
    email: state.user?.email || ''
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    updates: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const settingsNavItems = [
    { path: '/settings/profile', icon: User, label: 'Profile' },
    { path: '/settings/security', icon: Shield, label: 'Security' },
    { path: '/settings/notifications', icon: Bell, label: 'Notifications' },
    { path: '/settings/appearance', icon: Palette, label: 'Appearance' },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // Add your profile save logic here
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="theme-card-bg">
      <div className="mx-auto px-4 py-4 space-y-6">
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
                        ? 'theme-bg-card theme-text-primary border border-white/20'
                        : 'theme-text-light hover:theme-text-primary hover:theme-bg-primary'
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
            <div className="theme-bg-card rounded-2xl shadow-sm border border-white/20 p-8 backdrop-blur-lg">
              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}
              
              <Routes>
                <Route
                  index
                  element={
                    <div className="text-center py-8">
                      <h3 className="text-lg font-semibold theme-text-primary mb-2">Account Settings</h3>
                      <p className="theme-text-light">Select a category from the left to manage your settings.</p>
                    </div>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <div>
                      <h3 className="text-xl font-semibold theme-text-primary mb-6">Profile Settings</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-2">Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full px-4 py-2 border border-white/20 rounded-lg theme-bg-primary theme-text-light"
                          />
                          <p className="text-xs theme-text-light mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-2">Display Name</label>
                          <input
                            type="text"
                            value={profileData.displayName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                            className="w-full px-4 py-2 border border-white/20 rounded-lg theme-bg-primary theme-text-primary focus:ring-2 focus:ring-white/30 focus:border-transparent"
                            placeholder="Enter your display name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-2">Current Plan</label>
                          <div className="px-4 py-2 theme-bg-primary rounded-lg border border-white/20">
                            <span className="theme-text-primary font-medium capitalize">
                              {state.userPlan || 'No plan selected'}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={handleProfileSave}
                          disabled={loading}
                          className="flex items-center gap-2 theme-button-primary text-white px-6 py-2 rounded-lg hover:theme-button-hover transition-colors duration-200 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  }
              />
                <Route
                  path="security"
                  element={
                    <div>
                      <h3 className="text-xl font-semibold theme-text-primary mb-6">Security Settings</h3>
                      <div className="space-y-6">
                        <div className="theme-bg-primary p-6 rounded-lg border border-white/20">
                          <h4 className="text-lg font-medium theme-text-primary mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Password
                          </h4>
                          <p className="theme-text-light text-sm mb-4">Update your password to keep your account secure.</p>
                          <button className="theme-button-secondary text-white px-6 py-2 rounded-lg hover:theme-button-hover transition-colors duration-200">
                            Change Password
                          </button>
                        </div>
                        <div className="theme-bg-primary p-6 rounded-lg border border-white/20">
                          <h4 className="text-lg font-medium theme-text-primary mb-4">Two-Factor Authentication</h4>
                          <p className="theme-text-light text-sm mb-4">Add an extra layer of security to your account with 2FA.</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="theme-text-secondary text-sm">Status: </span>
                              <span className="text-red-400 text-sm">Disabled</span>
                            </div>
                            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
                              Enable 2FA
                            </button>
                          </div>
                        </div>
                        <div className="theme-bg-primary p-6 rounded-lg border border-white/20">
                          <h4 className="text-lg font-medium theme-text-primary mb-4">Account Deletion</h4>
                          <p className="theme-text-light text-sm mb-4">Permanently delete your account and all data.</p>
                          <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                            Delete Account
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
                      <h3 className="text-xl font-semibold theme-text-primary mb-6">Notification Preferences</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'email', title: 'Email Notifications', desc: 'Receive updates about your posts and content.' },
                          { key: 'push', title: 'Push Notifications', desc: 'Get instant alerts in your browser.' },
                          { key: 'marketing', title: 'Marketing Emails', desc: 'Receive news about features and updates.' },
                          { key: 'updates', title: 'Product Updates', desc: 'Get notified about new features and improvements.' }
                        ].map((item) => (
                          <div key={item.key} className="theme-bg-primary p-4 rounded-lg border border-white/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-medium theme-text-primary">{item.title}</h4>
                                <p className="theme-text-light text-sm">{item.desc}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifications[item.key as keyof typeof notifications]}
                                  onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  }
              />
                <Route
                  path="appearance"
                  element={
                    <div>
                      <h3 className="text-xl font-semibold theme-text-primary mb-6">Appearance</h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-medium theme-text-primary mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            App Themes
                          </h4>
                          <p className="theme-text-light text-sm mb-6">
                            Choose from our collection of beautiful themes based on the app's features.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableThemes.map((theme) => (
                              <div
                                key={theme.key}
                                onClick={() => changeTheme(theme.key)}
                                className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                  currentThemeKey === theme.key
                                    ? 'border-white/40 ring-2 ring-white/30'
                                    : 'border-white/20 hover:border-white/40'
                                }`}
                              >
                                <div className={`w-full h-20 bg-gradient-to-r ${theme.bgGradient} rounded-lg mb-3 relative overflow-hidden`}>
                                  <div className="absolute inset-2 bg-white/10 rounded border border-white/20"></div>
                                  <div className="absolute bottom-2 left-2 right-2 h-2 bg-white/20 rounded"></div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium theme-text-primary">{theme.name}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: theme.primary }}></div>
                                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: theme.secondary }}></div>
                                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: theme.accent }}></div>
                                    </div>
                                  </div>
                                  {currentThemeKey === theme.key && (
                                    <Check className="w-5 h-5 text-green-400" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="theme-bg-primary p-4 rounded-lg border border-white/20 mt-6">
                            <p className="text-xs theme-text-light">
                              💡 <strong>Tip:</strong> Themes are based on the app's feature categories from the onboarding process. 
                              Changes apply instantly across the entire application.
                            </p>
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
    </div>
  );
};

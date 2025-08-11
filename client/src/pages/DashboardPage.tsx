import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Calendar, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const DashboardPage: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Create Content',
      description: 'Generate AI-powered social media posts',
      icon: Plus,
      color: 'bg-blue-600',
      action: () => navigate('/content/create'),
    },
    {
      title: 'Manage Companies',
      description: 'Add or edit your company profiles',
      icon: TrendingUp,
      color: 'bg-green-600',
      action: () => navigate('/companies'),
    },
    {
      title: 'Schedule Posts',
      description: 'Plan and schedule your content',
      icon: Calendar,
      color: 'bg-purple-600',
      action: () => navigate('/schedule'),
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: Settings,
      color: 'bg-gray-600',
      action: () => navigate('/settings'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome back, {state.user?.user_metadata?.name || state.user?.email}!
        </h1>
        <p className="text-gray-600 text-lg">
          Ready to create amazing social media content with AI? Let's get started.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              onClick={action.action}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {/* Placeholder for recent activity */}
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity yet. Start creating content to see your activity here!</p>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Posts Created</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Scheduled Posts</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-sm text-gray-600">Upcoming</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connected Platforms</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
          <p className="text-sm text-gray-600">Social accounts</p>
        </div>
      </div>
    </div>
  );
};
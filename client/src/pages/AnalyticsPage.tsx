
import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Eye, Heart, Share2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const metrics = [
    { label: 'Total Impressions', value: '0', icon: Eye, change: '+0%' },
    { label: 'Engagement Rate', value: '0%', icon: Heart, change: '+0%' },
    { label: 'Shares', value: '0', icon: Share2, change: '+0%' },
    { label: 'Followers', value: '0', icon: Users, change: '+0%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="theme-text-primary text-2xl font-bold">Analytics</h1>
          <p className="theme-text-secondary">Track your social media performance</p>
        </div>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="theme-input px-4 py-2 rounded-lg"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="theme-bg-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="theme-bg-secondary p-3 rounded-lg">
                  <Icon className="w-6 h-6 theme-text-primary" />
                </div>
                <span className="theme-text-primary text-sm font-medium">{metric.change}</span>
              </div>
              <h3 className="theme-text-primary text-2xl font-bold">{metric.value}</h3>
              <p className="theme-text-secondary text-sm">{metric.label}</p>
            </div>
          );
        })}
      </div>

      <div className="theme-bg-card rounded-xl p-6">
        <h3 className="theme-text-primary text-lg font-semibold mb-4">Performance Overview</h3>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 theme-text-light mx-auto mb-4" />
          <h4 className="theme-text-primary text-lg font-medium mb-2">No data available</h4>
          <p className="theme-text-secondary mb-4">Start publishing content to see your analytics</p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { PostScheduleDashboard } from '../components/PostScheduleDashboard';
import { useAppContext } from '../context/AppContext';

export const SchedulePage: React.FC = () => {
  const { state } = useAppContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Posts</h1>
        <p className="text-gray-600 mt-2">Plan and schedule your social media content.</p>
      </div>

      <PostScheduleDashboard
        userId={state.user?.id || ''}
        companyId={state.selectedCompany?.id || ''}
      />
    </div>
  );
};
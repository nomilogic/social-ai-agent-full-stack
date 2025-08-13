import React from 'react';
import { PostScheduleDashboard } from '../components/PostScheduleDashboard';
import { FeatureRestriction } from '../components/FeatureRestriction';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import { useAppContext } from '../context/AppContext';

export const SchedulePage: React.FC = () => {
  const { state } = useAppContext();
  const { canSchedule } = usePlanFeatures();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Posts</h1>
        <p className="text-gray-600 mt-2">Plan and schedule your social media content.</p>
      </div>

      {canSchedule ? (
        <PostScheduleDashboard
          userId={state.user?.id || ''}
          companyId={state.selectedProfile?.id || ''}
        />
      ) : (
        <FeatureRestriction 
          feature="Auto Post Scheduling" 
          requiredPlan="ipro"
        >
          <PostScheduleDashboard
            userId={state.user?.id || ''}
            companyId={state.selectedProfile?.id || ''}
          />
        </FeatureRestriction>
      )}
    </div>
  );
};
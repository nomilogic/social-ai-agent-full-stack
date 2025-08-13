import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlanLimits, checkLimit, shouldShowUpgradePrompt } from '../utils/planFeatures';

interface UsageStats {
  posts_this_month?: number;
  ai_generations_today?: number;
  campaigns_created?: number;
  scheduled_posts?: number;
  [key: string]: number | undefined;
}

interface PlanManagement {
  plan: 'free' | 'ipro' | 'business';
  usage: UsageStats;
  checkFeatureLimit: (feature: keyof PlanLimits, currentUsage?: number) => {
    canUse: boolean;
    limit: number;
    remaining: number;
  };
  shouldShowUpgrade: (feature: keyof PlanLimits, currentUsage?: number) => boolean;
  updateUsage: (usageType: string, increment?: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const usePlanManagement = (): PlanManagement => {
  const { user, userPlan } = useAppContext();
  const [usage, setUsage] = useState<UsageStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const plan = (userPlan || 'free') as 'free' | 'ipro' | 'business';

  // Load user plan and usage data
  useEffect(() => {
    const loadPlanData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/plans/user/${user.id}/plan`);
        
        if (response.ok) {
          const data = await response.json();
          setUsage(data.usage_stats || {});
        } else {
          console.warn('Failed to load plan data, using defaults');
          setUsage({});
        }
      } catch (err) {
        console.error('Error loading plan data:', err);
        setError('Failed to load plan information');
        setUsage({});
      } finally {
        setLoading(false);
      }
    };

    loadPlanData();
  }, [user?.id, userPlan]);

  const checkFeatureLimit = (feature: keyof PlanLimits, currentUsage?: number) => {
    const usageValue = currentUsage ?? usage[feature] ?? 0;
    return checkLimit(plan, feature, usageValue);
  };

  const shouldShowUpgrade = (feature: keyof PlanLimits, currentUsage?: number) => {
    const usageValue = currentUsage ?? usage[feature] ?? 0;
    return shouldShowUpgradePrompt(plan, feature, usageValue);
  };

  const updateUsage = async (usageType: string, increment: number = 1) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/plans/user/${user.id}/usage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usage_type: usageType,
          increment,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage_stats || {});
      } else {
        console.error('Failed to update usage');
      }
    } catch (err) {
      console.error('Error updating usage:', err);
    }
  };

  return {
    plan,
    usage,
    checkFeatureLimit,
    shouldShowUpgrade,
    updateUsage,
    loading,
    error,
  };
};
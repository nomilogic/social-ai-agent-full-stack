import { useAppContext } from '../context/AppContext';

type PlanType = 'free' | 'ipro' | 'business';

interface PlanFeatures {
  canSchedule: boolean;
  maxPostsPerMonth: number;
  maxImageGenerations: number;
  schedulingDays: number;
  postsPerDay: number;
  imagesPerDay: number;
  hasAdvancedAI: boolean;
  hasAnalytics: boolean;
  hasTeamCollaboration: boolean;
  hasPrioritySupport: boolean;
  hasCampaigns: boolean;
  maxCampaigns: number;
  hasRealTimeAnalytics: boolean;
  hasBotTraining: boolean;
  hasAdvancedBots: boolean;
  hasVideoGeneration: boolean;
  planName: string;
  planPrice: string;
}

const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    canSchedule: false,
    maxPostsPerMonth: 0,
    maxImageGenerations: 0,
    schedulingDays: 0,
    postsPerDay: 0,
    imagesPerDay: 0,
    hasAdvancedAI: false,
    hasAnalytics: false,
    hasTeamCollaboration: false,
    hasPrioritySupport: false,
    hasCampaigns: false,
    maxCampaigns: 0,
    hasRealTimeAnalytics: false,
    hasBotTraining: false,
    hasAdvancedBots: false,
    hasVideoGeneration: false,
    planName: 'aiFree',
    planPrice: 'Free'
  },
  ipro: {
    canSchedule: true,
    maxPostsPerMonth: 300, // 10 posts/day * 30 days
    maxImageGenerations: 150, // 5 images/day * 30 days
    schedulingDays: 30,
    postsPerDay: 10,
    imagesPerDay: 5,
    hasAdvancedAI: true,
    hasAnalytics: true,
    hasTeamCollaboration: false,
    hasPrioritySupport: true,
    hasCampaigns: true,
    maxCampaigns: 3,
    hasRealTimeAnalytics: true,
    hasBotTraining: true,
    hasAdvancedBots: false,
    hasVideoGeneration: false,
    planName: 'aiPRO',
    planPrice: '$39.99/month'
  },
  business: {
    canSchedule: true,
    maxPostsPerMonth: -1, // unlimited
    maxImageGenerations: -1, // unlimited
    schedulingDays: 180, // 6 months
    postsPerDay: -1, // unlimited
    imagesPerDay: -1, // unlimited
    hasAdvancedAI: true,
    hasAnalytics: true,
    hasTeamCollaboration: true,
    hasPrioritySupport: true,
    hasCampaigns: true,
    maxCampaigns: -1, // unlimited
    hasRealTimeAnalytics: true,
    hasBotTraining: true,
    hasAdvancedBots: true,
    hasVideoGeneration: true,
    planName: 'aiBusiness',
    planPrice: '$99.99/month'
  }
};

export const usePlanFeatures = () => {
  const { state } = useAppContext();
  const currentPlan: PlanType = state.userPlan || 'free';
  
  const features = PLAN_FEATURES[currentPlan];
  
  const canUseFeature = (requiredPlan: PlanType): boolean => {
    const planHierarchy = { free: 0, ipro: 1, business: 2 };
    return planHierarchy[currentPlan] >= planHierarchy[requiredPlan];
  };

  const getRequiredPlanForFeature = (feature: keyof PlanFeatures): PlanType | null => {
    for (const [plan, planFeatures] of Object.entries(PLAN_FEATURES)) {
      if (planFeatures[feature]) {
        return plan as PlanType;
      }
    }
    return null;
  };

  return {
    ...features,
    currentPlan,
    canUseFeature,
    getRequiredPlanForFeature,
    isUnlimited: (value: number) => value === -1
  };
};
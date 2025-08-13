export interface PlanLimits {
  posts_per_month: number;
  ai_generations_per_day: number;
  social_platforms: number;
  campaigns: number;
  scheduled_posts: number;
  analytics_retention_days: number;
  team_members: number;
  auto_posting: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  ai_training: boolean;
  custom_branding: boolean;
  api_access: boolean;
}

export const PLAN_FEATURES: Record<'free' | 'ipro' | 'business', PlanLimits> = {
  free: {
    posts_per_month: 10,
    ai_generations_per_day: 5,
    social_platforms: 2,
    campaigns: 1,
    scheduled_posts: 10,
    analytics_retention_days: 7,
    team_members: 1,
    auto_posting: false,
    advanced_analytics: false,
    priority_support: false,
    ai_training: false,
    custom_branding: false,
    api_access: false,
  },
  ipro: {
    posts_per_month: 100,
    ai_generations_per_day: 50,
    social_platforms: 5,
    campaigns: 10,
    scheduled_posts: 100,
    analytics_retention_days: 30,
    team_members: 3,
    auto_posting: true,
    advanced_analytics: true,
    priority_support: false,
    ai_training: false,
    custom_branding: true,
    api_access: false,
  },
  business: {
    posts_per_month: -1, // unlimited
    ai_generations_per_day: -1, // unlimited
    social_platforms: -1, // unlimited
    campaigns: -1, // unlimited
    scheduled_posts: -1, // unlimited
    analytics_retention_days: 365,
    team_members: -1, // unlimited
    auto_posting: true,
    advanced_analytics: true,
    priority_support: true,
    ai_training: true,
    custom_branding: true,
    api_access: true,
  },
};

export function getPlanLimits(plan: 'free' | 'ipro' | 'business'): PlanLimits {
  return PLAN_FEATURES[plan];
}

export function isFeatureAvailable(
  plan: 'free' | 'ipro' | 'business',
  feature: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  
  // For boolean features, return the value directly
  if (typeof value === 'boolean') {
    return value;
  }
  
  // For numeric features, -1 means unlimited, so it's available
  // Any positive number means it's available with limits
  return value === -1 || value > 0;
}

export function checkLimit(
  plan: 'free' | 'ipro' | 'business',
  feature: keyof PlanLimits,
  currentUsage: number
): { canUse: boolean; limit: number; remaining: number } {
  const limits = getPlanLimits(plan);
  const limit = limits[feature] as number;
  
  if (limit === -1) {
    return { canUse: true, limit: -1, remaining: -1 };
  }
  
  const remaining = Math.max(0, limit - currentUsage);
  return {
    canUse: remaining > 0,
    limit,
    remaining,
  };
}

export function shouldShowUpgradePrompt(
  plan: 'free' | 'ipro' | 'business',
  feature: keyof PlanLimits,
  currentUsage: number
): boolean {
  const { canUse, limit } = checkLimit(plan, feature, currentUsage);
  
  if (limit === -1) return false; // unlimited, no upgrade needed
  
  // Show upgrade prompt if usage is at 80% of limit or can't use
  return !canUse || currentUsage >= limit * 0.8;
}
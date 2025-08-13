import { useState, useCallback } from 'react';
import { ProfileInfo } from '../types';
import { getPlanLimits, isFeatureAvailable, PlanLimits } from '../utils/planFeatures';

export interface UsePlanFeaturesReturn {
  limits: PlanLimits;
  checkFeature: (feature: keyof PlanLimits) => boolean;
  showUpgradeModal: boolean;
  requestedFeature: string | null;
  openUpgradeModal: (featureName: string) => void;
  closeUpgradeModal: () => void;
  canUseFeature: (feature: keyof PlanLimits) => boolean;
  getRemainingUsage: (usageType: 'textualPosts' | 'imageGenerations') => number | null;
}

export const usePlanFeatures = (
  profileType: 'individual' | 'business' = 'individual',
  plan?: string,
  currentUsage?: { textualPosts?: number; imageGenerations?: number }
): UsePlanFeaturesReturn => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [requestedFeature, setRequestedFeature] = useState<string | null>(null);

  const limits = getPlanLimits(profileType, plan);

  const checkFeature = useCallback(
    (feature: keyof PlanLimits) => isFeatureAvailable(profileType, plan, feature),
    [profileType, plan]
  );

  const openUpgradeModal = useCallback((featureName: string) => {
    setRequestedFeature(featureName);
    setShowUpgradeModal(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setRequestedFeature(null);
  }, []);

  const canUseFeature = useCallback(
    (feature: keyof PlanLimits) => {
      if (profileType === 'business') return true;
      return checkFeature(feature);
    },
    [profileType, checkFeature]
  );

  const getRemainingUsage = useCallback(
    (usageType: 'textualPosts' | 'imageGenerations') => {
      if (profileType === 'business') return null; // Unlimited for business
      
      const limit = limits[usageType];
      const used = currentUsage?.[usageType] || 0;
      
      if (limit === 999999) return null; // Unlimited
      return Math.max(0, limit - used);
    },
    [profileType, limits, currentUsage]
  );

  return {
    limits,
    checkFeature,
    showUpgradeModal,
    requestedFeature,
    openUpgradeModal,
    closeUpgradeModal,
    canUseFeature,
    getRemainingUsage
  };
};
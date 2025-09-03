import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser } from '../lib/database';
import { Campaign } from '@shared/schema';

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  profile_type?: 'business' | 'individual';
  plan?: 'free' | 'ipro' | 'business';
  created_at?: string;
  user_metadata?: {
    name?: string;
    [key: string]: any;
  };
}

export interface Profile {
  id: string;
  name: string;
  type: 'individual' | 'business';
  industry: string;
  description?: string;
  tone?: string;
  target_audience?: string;
  userId: string;
  plan: 'free' | 'ipro' | 'business';
  // Campaign fields
  campaignName?: string;
  campaignType?: string;
  campaignGoals?: string[];
  // Additional profile fields
  profession?: string;
  location?: string;
  website?: string;
  bio?: string;
  contentNiche?: string;
  preferredPlatforms?: string[];
  brandVoice?: string;
  socialGoals?: string[];
  businessGoals?: string[];
  postingFrequency?: string;
  // Business specific fields
  businessName?: string;
  jobTitle?: string;
  campaignSize?: string;
  teamCollaboration?: boolean;
  customIntegrations?: string[];
  monthlyBudget?: string;
  contentVolume?: string;
}

// export interface Campaign {
//   id: string;
//   name: string;
//   description?: string;
//   profileId: string;
//   isActive: boolean;
// }

export interface AppState {
  user: User | null;
  userPlan: 'free' | 'ipro' | 'business' | null;
  selectedProfile: Profile | null;
  selectedCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
  generatedPosts: any[];
  contentData: any;
  hasCompletedOnboarding: boolean;
  isBusinessAccount: boolean;
  hasTierSelected: boolean;
  hasProfileSetup: boolean;
}

// Actions
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_USER_PLAN'; payload: 'free' | 'ipro' | 'business' | null }
  | { type: 'SET_SELECTED_PROFILE'; payload: Profile | null }
  | { type: 'SET_SELECTED_CAMPAIGN'; payload: Campaign | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GENERATED_POSTS'; payload: any[] }
  | { type: 'SET_CONTENT_DATA'; payload: any }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_TIER_SELECTED'; payload: boolean }
  | { type: 'SET_PROFILE_SETUP'; payload: boolean }
  | { type: 'RESET_STATE' }
  | { type: 'SET_BUSINESS_ACCOUNT'; payload: boolean };

// Helper function to check if profile is complete based on plan requirements
const checkProfileCompletion = (profile: any): boolean => {
  if (!profile) return false;
  
  // Check basic required fields for all plans
  const hasBasicInfo = profile.name && profile.plan && profile.profession;
  
  // Check campaign fields (required for all plans)
  const hasCampaignInfo = profile.campaignName && profile.campaignType;
  
  // For business plan, check additional business-specific fields
  if (profile.plan === 'business') {
    const hasBusinessInfo = profile.businessName && profile.jobTitle;
    return hasBasicInfo && hasCampaignInfo && hasBusinessInfo;
  }
  
  // For pro and free plans, basic info and campaign info is sufficient
  return hasBasicInfo && hasCampaignInfo;
};

// Helper functions for localStorage persistence
const getStoredContentData = () => {
  try {
    const stored = localStorage.getItem('s_ai_content_data');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredContentData = (data: any) => {
  try {
    if (data) {
     // localStorage.setItem('s_ai_content_data', JSON.stringify(data));
    } else {
    //  localStorage.removeItem('s_ai_content_data');
    }
  } catch (error) {
    console.warn('Failed to store content data:', error);
  }
};

// Initial state
const initialState: AppState = {
  user: null,
  userPlan: null,
  selectedProfile: null,
  selectedCampaign: null,
  loading: true,
  error: null,
  generatedPosts: [],
  contentData:null, // Load from localStorage
  hasCompletedOnboarding: false,
  isBusinessAccount: false,
  hasTierSelected: false,
  hasProfileSetup: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_USER_PLAN':
      return { ...state, userPlan: action.payload };
    case 'SET_SELECTED_PROFILE':
      return {
        ...state,
        selectedProfile: action.payload,
        userPlan: action.payload?.plan || state.userPlan,
        isBusinessAccount: action.payload?.type === 'business'
      }
    case 'SET_SELECTED_CAMPAIGN':
      return { ...state, selectedCampaign: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GENERATED_POSTS':
      return { ...state, generatedPosts: action.payload };
    case 'SET_CONTENT_DATA':
      // Persist contentData to localStorage
      setStoredContentData(action.payload);
      return { ...state, contentData: action.payload };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, hasCompletedOnboarding: action.payload };
    case 'SET_TIER_SELECTED':
      return { ...state, hasTierSelected: action.payload };
    case 'SET_PROFILE_SETUP':
      return { ...state, hasProfileSetup: action.payload };
    case 'RESET_STATE':
      // Clear localStorage when resetting state
      setStoredContentData(null);
      return { ...initialState, loading: false, contentData: null };
    case 'SET_BUSINESS_ACCOUNT':
      return { ...state, isBusinessAccount: action.payload };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize auth on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const authResult = await getCurrentUser();
        if (authResult && authResult.user) {
          const currentUser: User = {
            id: authResult.user.id,
            email: authResult.user.email,
            name: authResult.user.name,
            profile_type: authResult.user.profile_type,
            plan: authResult.user.plan,
            created_at: authResult.user.created_at,
            user_metadata: {
              name: authResult.user.name || authResult.user.user_metadata?.name
            }
          };
          dispatch({ type: 'SET_USER', payload: currentUser });

          // Check if user has tier selection and profile setup
          try {
            const profileResponse = await fetch(`/api/auth/profile?userId=${currentUser.id}&email=${currentUser.email}`);
            if (profileResponse.ok) {
              const existingProfile = await profileResponse.json();
              if (existingProfile && existingProfile.name && existingProfile.plan) {
                // Check if profile is complete based on plan requirements
                const isProfileComplete = checkProfileCompletion(existingProfile);
                
                // User has both tier and profile setup
                dispatch({ type: 'SET_SELECTED_PROFILE', payload: existingProfile });
                dispatch({ type: 'SET_USER_PLAN', payload: existingProfile.plan });
                dispatch({ type: 'SET_TIER_SELECTED', payload: true });
                dispatch({ type: 'SET_PROFILE_SETUP', payload: isProfileComplete });
                dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: isProfileComplete });
                
                if (existingProfile.type === 'business') {
                  dispatch({ type: 'SET_BUSINESS_ACCOUNT', payload: true });
                }
                
                console.log('User has complete setup, going to dashboard');
                return;
              } else if (existingProfile && existingProfile.plan) {
                // User has tier selected but no profile setup
                dispatch({ type: 'SET_USER_PLAN', payload: existingProfile.plan });
                dispatch({ type: 'SET_TIER_SELECTED', payload: true });
                dispatch({ type: 'SET_PROFILE_SETUP', payload: false });
                console.log('User has tier selected but needs profile setup');
                return;
              }
            } else if (profileResponse.status === 404) {
              // Profile not found - user is completely new
              console.log('Profile not found - new user needs tier selection and profile setup');
            }
          } catch (error) {
            console.log('Profile check failed, assuming new user:', error);
          }

          // New user - no tier or profile setup
          dispatch({ type: 'SET_TIER_SELECTED', payload: false });
          dispatch({ type: 'SET_PROFILE_SETUP', payload: false });
          dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: false });
          console.log('New user - needs tier selection and profile setup');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook with convenience methods
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  // Add convenience methods for campaign management
  const selectCampaign = (campaign: Campaign | null) => {
    context.dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaign });
  };
  
  const logout = async () => {
    try {
      // Call the logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('Logout endpoint call failed, but continuing with local logout:', error);
    } finally {
      // Always clear local storage and reset state
      localStorage.removeItem('auth_token');
      context.dispatch({ type: 'RESET_STATE' });
    }
  };
  
  return {
    state: context.state,
    dispatch: context.dispatch,
    user: context.state.user,
    profile: context.state.selectedProfile,
    campaign: context.state.selectedCampaign,
    selectCampaign,
    logout
  };
};

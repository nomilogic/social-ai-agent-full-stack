import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser } from '../lib/database';

// Types
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
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
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  profileId: string;
  isActive: boolean;
}

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
  | { type: 'RESET_STATE' }
  | { type: 'SET_BUSINESS_ACCOUNT'; payload: boolean };

// Initial state
const initialState: AppState = {
  user: null,
  userPlan: null,
  selectedProfile: null,
  selectedCampaign: null,
  loading: true,
  error: null,
  generatedPosts: [],
  contentData: null,
  hasCompletedOnboarding: false,
  isBusinessAccount: false,
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
        isBusinessAccount: action.payload?.type === 'business' || action.payload?.profile_type === 'business'
      }
    case 'SET_SELECTED_CAMPAIGN':
      return { ...state, selectedCampaign: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GENERATED_POSTS':
      return { ...state, generatedPosts: action.payload };
    case 'SET_CONTENT_DATA':
      return { ...state, contentData: action.payload };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, hasCompletedOnboarding: action.payload };
    case 'RESET_STATE':
      return { ...initialState, loading: false };
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
        const currentUser = await getCurrentUser();
        if (currentUser) {
          dispatch({ type: 'SET_USER', payload: currentUser });

          // Check if this is a business account
          const isBusinessUser = currentUser.email === 'nomilogic@gmail.com' || 
                                currentUser.profile_type === 'business' ||
                                currentUser.plan === 'business';

          if (isBusinessUser) {
            dispatch({ type: 'SET_USER_PLAN', payload: 'business' });
            dispatch({ type: 'SET_BUSINESS_ACCOUNT', payload: true });
          }

          // Check if user has completed onboarding by checking for profile
          try {
            const response = await fetch(`/api/auth/profile?userId=${currentUser.id}&email=${currentUser.email}`);
            if (response.ok) {
              const profile = await response.json();
              if (profile) {
                const profilePlan = profile.plan || (isBusinessUser ? 'business' : 'free');
                const profileType = profile.type || profile.profile_type || (isBusinessUser ? 'business' : 'individual');
                
                dispatch({ type: 'SET_USER_PLAN', payload: profilePlan });
                dispatch({ type: 'SET_SELECTED_PROFILE', payload: { ...profile, plan: profilePlan, type: profileType } });
                dispatch({ type: 'SET_BUSINESS_ACCOUNT', payload: profileType === 'business' });
                dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
              }
            }
          } catch (profileError) {
            console.log('No profile found, user needs onboarding');
          }
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

// Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
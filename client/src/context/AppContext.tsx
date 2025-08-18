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
        isBusinessAccount: action.payload?.type === 'business'
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

          // Check if this is a business account
          const isBusinessUser = currentUser.email === 'nomilogic@gmail.com' || 
                                currentUser.profile_type === 'business' ||
                                currentUser.plan === 'business';

          if (isBusinessUser) {
            dispatch({ type: 'SET_USER_PLAN', payload: 'business' });
            dispatch({ type: 'SET_BUSINESS_ACCOUNT', payload: true });
          }

          // Skip profile onboarding - users will create campaigns directly
          // Set default plan based on user type
          const userPlan = isBusinessUser ? 'business' : 'free';
          dispatch({ type: 'SET_USER_PLAN', payload: userPlan });
          dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
          
          console.log('User authenticated successfully, redirecting to campaigns');
          console.log('User plan set to:', userPlan);
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

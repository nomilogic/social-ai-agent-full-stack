import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser } from '../lib/database';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'ipro' | 'business';
  profile_completed: boolean;
  onboarding_completed: boolean;
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
  selectedProfile: Profile | null;
  selectedCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
  generatedPosts: any[];
  contentData: any;
}

// Actions
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SELECTED_PROFILE'; payload: Profile | null }
  | { type: 'SET_SELECTED_CAMPAIGN'; payload: Campaign | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GENERATED_POSTS'; payload: any[] }
  | { type: 'SET_CONTENT_DATA'; payload: any }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  user: null,
  selectedProfile: null,
  selectedCampaign: null,
  loading: true,
  error: null,
  generatedPosts: [],
  contentData: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SELECTED_PROFILE':
      return { ...state, selectedProfile: action.payload };
    case 'SET_SELECTED_CAMPAIGN':
      return { ...state, selectedCampaign: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GENERATED_POSTS':
      return { ...state, generatedPosts: action.payload };
    case 'SET_CONTENT_DATA':
      return { ...state, contentData: action.payload };
    case 'RESET_STATE':
      return { ...initialState, loading: false };
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
        // Check if we have a token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        // Get current user from our custom auth system
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          // Invalid token, remove it
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('auth_token');
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
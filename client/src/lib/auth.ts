import { supabase } from './supabase';

// Simplified authentication - only handles login/logout UI
// All data operations are now handled by the server API

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    [key: string]: any;
  };
}

export const authService = {
  // Get current authenticated user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  // Sign in anonymously (for demo purposes)
  async signInAnonymously(): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Error signing in anonymously:', error);
        throw error;
      }
      
      return data.user;
    } catch (error) {
      console.error('Error in signInAnonymously:', error);
      throw error;
    }
  },

  // Sign in with email
  async signInWithEmail(email: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Error signing in with email:', error);
        throw error;
      }
      
      return data.user;
    } catch (error) {
      console.error('Error in signInWithEmail:', error);
      throw error;
    }
  },

  // Sign up with email
  async signUpWithEmail(email: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        console.error('Error signing up with email:', error);
        throw error;
      }
      
      return data.user;
    } catch (error) {
      console.error('Error in signUpWithEmail:', error);
      throw error;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
};

// Export individual functions for backward compatibility
export const getCurrentUser = authService.getCurrentUser;
export const signInAnonymously = authService.signInAnonymously;

export default authService;

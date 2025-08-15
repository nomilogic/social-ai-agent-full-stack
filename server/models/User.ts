import { supabase } from '../db';
import bcrypt from 'bcrypt';

export interface UserData {
  id?: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  plan?: 'free' | 'ipro' | 'business';
  role?: 'user' | 'admin';
  subscription_status?: 'active' | 'inactive' | 'cancelled';
  subscription_id?: string;
  trial_ends_at?: string;
  plan_limits?: any;
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  setup_step?: number;
  preferences?: any;
  last_login?: string;
  total_posts_created?: number;
  total_campaigns_created?: number;
  created_at?: string;
  updated_at?: string;
}

export class User {
  static async createTable() {
    try {
      // Create users table directly using Supabase client
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, but we can't create it through the client
        // This would need to be done through the Supabase dashboard or SQL editor
        console.log('Users table needs to be created in Supabase dashboard');
        return false;
      }
      
      console.log('Users table exists or was created successfully');
      return true;
    } catch (error) {
      console.error('Error checking users table:', error);
      return false;
    }
  }

  static async findByEmail(email: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async findById(id: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async create(userData: Omit<UserData, 'id' | 'created_at' | 'updated_at'>): Promise<UserData | null> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password!, 12);

      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          password: hashedPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error in user creation:', error);
      return null;
    }
  }

  static async validatePassword(email: string, password: string): Promise<UserData | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user || !user.password) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      // Update last login
      await this.updateLastLogin(user.id!);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error validating password:', error);
      return null;
    }
  }

  static async updateLastLogin(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error updating last login:', error);
      return false;
    }
  }

  static async update(id: string, updates: Partial<UserData>): Promise<UserData | null> {
    try {
      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 12);
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return null;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error in user update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  static async getAllUsers(limit = 50, offset = 0): Promise<UserData[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, plan, role, subscription_status, created_at, last_login')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }
}
import { serverSupabase } from '../supabaseClient';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  profile_type?: 'individual' | 'business';
  plan?: 'free' | 'ipro' | 'business';
  created_at?: Date;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

/**
 * Abstract authentication service
 * Currently uses Supabase Auth but can be easily switched to other providers
 */
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

  /**
   * Register a new user using Supabase Auth
   */
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      // Use Supabase Auth for user creation
      const { data, error } = await serverSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for development
        user_metadata: { name: name || email.split('@')[0] }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Failed to create user');
      }

      // Create corresponding record in our database
      const isBusinessAccount = email === 'nomilogic@gmail.com';
      
      // For our local users table, we still need to store a password hash
      // This is for backup/compatibility, but Supabase handles the actual auth
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await db.insert(users).values({
        id: data.user.id,
        email: data.user.email!,
        name: name || data.user.user_metadata?.name || email.split('@')[0],
        password: hashedPassword, // Store hashed password for compatibility
      }).returning();

      const user = newUser[0];

      // Generate our own JWT tokens
      const tokens = this.generateTokens(user.id, user.email);

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_type: isBusinessAccount ? 'business' : 'individual',
        plan: isBusinessAccount ? 'business' : 'free',
        created_at: user.created_at
      };

      return {
        user: authUser,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Login user using Supabase Auth
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Use Supabase Auth for authentication
      const { data, error } = await serverSupabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Authentication failed');
      }

      // Get user from our database
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, data.user.id))
        .limit(1);

      let user;
      if (userResults.length === 0) {
        // Create user record if it doesn't exist (shouldn't happen, but safety net)
        // We'll use a placeholder password since Supabase handles auth
        const bcrypt = await import('bcrypt');
        const placeholderPassword = await bcrypt.hash('supabase-managed', 10);
        
        const newUser = await db.insert(users).values({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || email.split('@')[0],
          password: placeholderPassword,
        }).returning();
        user = newUser[0];
      } else {
        user = userResults[0];
      }

      // Generate our own JWT tokens
      const tokens = this.generateTokens(user.id, user.email);

      const isBusinessAccount = user.email === 'nomilogic@gmail.com';

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_type: isBusinessAccount ? 'business' : 'individual',
        plan: isBusinessAccount ? 'business' : 'free',
        created_at: user.created_at
      };

      return {
        user: authUser,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Logout user from Supabase
   */
  async logout(userId: string): Promise<void> {
    try {
      // Sign out from Supabase (optional - JWT tokens are stateless)
      await serverSupabase.auth.admin.signOut(userId, 'global');
    } catch (error) {
      // Don't throw error for logout - tokens will expire naturally
      console.warn('Supabase logout warning:', error);
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Get user from database to ensure they still exist
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (userResults.length === 0) {
        return null;
      }

      const user = userResults[0];
      const isBusinessAccount = user.email === 'nomilogic@gmail.com';

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_type: isBusinessAccount ? 'business' : 'individual',
        plan: isBusinessAccount ? 'business' : 'free',
        created_at: user.created_at
      };

    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
      
      // Verify user still exists
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (userResults.length === 0) {
        throw new Error('User not found');
      }

      const user = userResults[0];
      const tokens = this.generateTokens(user.id, user.email);

      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(userId: string, email: string) {
    const payload = { id: userId, email, type: 'access' };
    const refreshPayload = { id: userId, email, type: 'refresh' };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(refreshPayload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
    });

    return { accessToken, refreshToken };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResults.length === 0) {
        return null;
      }

      const user = userResults[0];
      const isBusinessAccount = user.email === 'nomilogic@gmail.com';

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_type: isBusinessAccount ? 'business' : 'individual',
        plan: isBusinessAccount ? 'business' : 'free',
        created_at: user.created_at
      };

    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

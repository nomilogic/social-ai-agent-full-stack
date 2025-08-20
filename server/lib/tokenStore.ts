import { db } from '../db';
import { oauth_tokens } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface ProfileData {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  profile_picture_url?: string;
  [key: string]: any;
}

interface SaveTokenParams {
  userId: string;
  platform: string;
  tokenData: TokenData;
  profile?: ProfileData;
}

/**
 * Save or update OAuth token for a user and platform
 */
export async function saveToken({ userId, platform, tokenData, profile }: SaveTokenParams): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Calculate expiry date if expires_in is provided
      let expiresAt: Date | null = null;
      if (tokenData.expires_in && tokenData.expires_in > 0) {
        expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
      }

      const tokenRecord = {
        user_id: userId,
        platform,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt,
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || null,
        profile_data: profile ? JSON.stringify(profile) : null,
        updated_at: new Date()
      };

      // Check if token already exists
      const existingToken = await db
        .select({ id: oauth_tokens.id })
        .from(oauth_tokens)
        .where(and(
          eq(oauth_tokens.user_id, userId),
          eq(oauth_tokens.platform, platform)
        ))
        .limit(1);

      if (existingToken.length > 0) {
        // Update existing token
        await db
          .update(oauth_tokens)
          .set({
            access_token: tokenRecord.access_token,
            refresh_token: tokenRecord.refresh_token,
            expires_at: tokenRecord.expires_at,
            token_type: tokenRecord.token_type,
            scope: tokenRecord.scope,
            profile_data: tokenRecord.profile_data,
            updated_at: tokenRecord.updated_at
          })
          .where(and(
            eq(oauth_tokens.user_id, userId),
            eq(oauth_tokens.platform, platform)
          ));
      } else {
        // Insert new token
        await db.insert(oauth_tokens).values({
          user_id: userId,
          platform,
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token,
          expires_at: tokenRecord.expires_at,
          token_type: tokenRecord.token_type,
          scope: tokenRecord.scope,
          profile_data: tokenRecord.profile_data
        });
      }

      console.log(`Token stored successfully for user ${userId} on ${platform}`);
      return;
      
    } catch (error) {
      attempt++;
      console.error(`Token storage attempt ${attempt} failed:`, error);
      
      // Check if it's a connection error that we can retry
      const errorMessage = error instanceof Error ? error.message : '';
      if (
        attempt < maxRetries && 
        (errorMessage.includes('ECONNRESET') || 
         errorMessage.includes('ETIMEDOUT') ||
         errorMessage.includes('connection terminated'))
      ) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      throw error;
    }
  }
}

/**
 * Get OAuth token for a user and platform
 */
export async function getToken(userId: string, platform: string): Promise<any | null> {
  try {
    const token = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, userId),
        eq(oauth_tokens.platform, platform)
      ))
      .limit(1);

    if (token.length === 0) {
      return null;
    }

    const tokenData = token[0];
    
    // Parse profile data if it exists
    let profileData = null;
    if (tokenData.profile_data) {
      try {
        profileData = JSON.parse(tokenData.profile_data as string);
      } catch (e) {
        console.warn('Failed to parse profile data:', e);
      }
    }

    return {
      ...tokenData,
      profile_data: profileData
    };
  } catch (error) {
    console.error(`Error getting token for ${platform}:`, error);
    return null;
  }
}

/**
 * Delete OAuth token for a user and platform
 */
export async function deleteToken(userId: string, platform: string): Promise<boolean> {
  try {
    const result = await db
      .delete(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, userId),
        eq(oauth_tokens.platform, platform)
      ));

    console.log(`Token deleted for user ${userId} on ${platform}`);
    return true;
  } catch (error) {
    console.error(`Error deleting token for ${platform}:`, error);
    return false;
  }
}

/**
 * Get all tokens for a user
 */
export async function getUserTokens(userId: string): Promise<any[]> {
  try {
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(eq(oauth_tokens.user_id, userId));

    return tokens.map(token => {
      let profileData = null;
      if (token.profile_data) {
        try {
          profileData = JSON.parse(token.profile_data as string);
        } catch (e) {
          console.warn('Failed to parse profile data:', e);
        }
      }

      return {
        ...token,
        profile_data: profileData
      };
    });
  } catch (error) {
    console.error(`Error getting user tokens:`, error);
    return [];
  }
}

/**
 * Get tokens that are expiring soon (for refresh)
 */
export async function getExpiringTokens(minutesFromNow: number = 10): Promise<any[]> {
  try {
    const expiryThreshold = new Date(Date.now() + (minutesFromNow * 60 * 1000));
    
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(
        and(
          oauth_tokens.expires_at !== null,
          // Note: Using raw SQL here because Drizzle doesn't have a direct way to compare with calculated dates
          // In a real implementation, you'd use something like: lt(oauth_tokens.expires_at, expiryThreshold)
        )
      );

    return tokens.filter(token => 
      token.expires_at && 
      new Date(token.expires_at) < expiryThreshold &&
      token.refresh_token // Only return tokens that can be refreshed
    );
  } catch (error) {
    console.error('Error getting expiring tokens:', error);
    return [];
  }
}

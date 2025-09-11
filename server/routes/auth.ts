import express, { Request, Response } from 'express';
import { db } from '../db';
import { users, profiles } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { authService } from '../lib/authService';
import { authenticateJWT, validateRequestBody } from '../middleware/auth';
import fetch from 'node-fetch';
import crypto from 'crypto';

const router = express.Router();

// Simple auth implementation for demonstration
// In production, use proper authentication libraries

// Register new user
router.post('/register', validateRequestBody(['email', 'password']), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    const result = await authService.register(email, password, name);
    
    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    });
  } catch (error: any) {
    console.error('Registration error:', error.message);
    res.status(400).json({ 
      success: false,
      error: error.message || 'Registration failed' 
    });
  }
});

// Login user
router.post('/login', validateRequestBody(['email', 'password']), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(401).json({ 
      success: false,
      error: error.message || 'Login failed' 
    });
  }
});


// Get current user profile (protected route)
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // User is already attached by middleware
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user information' 
    });
  }
});

// Refresh JWT token
router.post('/refresh', validateRequestBody(['refreshToken']), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    const result = await authService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken
    });
  } catch (error: any) {
    console.error('Token refresh error:', error.message);
    res.status(401).json({ 
      success: false,
      error: error.message || 'Token refresh failed' 
    });
  }
});

// In-memory store to track used OAuth codes (in production, use Redis or database)
const usedOAuthCodes = new Set<string>();

// Google OAuth authentication
router.post('/oauth/google', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;
    
    console.log('🔍 Google OAuth request received:', { 
      hasCode: !!code, 
      codeLength: code?.length, 
      redirectUri,
      timestamp: new Date().toISOString()
    });
    
    if (!code || !redirectUri) {
      console.error('❌ Missing required parameters:', { code: !!code, redirectUri: !!redirectUri });
      return res.status(400).json({ error: 'Missing code or redirect URI' });
    }
    
    // Check if this code has already been used
    if (usedOAuthCodes.has(code)) {
      console.warn('⚠️ OAuth code has already been used:', code.substring(0, 10) + '...');
      return res.status(400).json({ error: 'Authorization code has already been used' });
    }
    
    // Mark code as used immediately
    usedOAuthCodes.add(code);
    
    // Clean up old codes after 10 minutes (OAuth codes expire quickly)
    setTimeout(() => {
      usedOAuthCodes.delete(code);
    }, 10 * 60 * 1000);

    // Exchange code for access token
    console.log('🔄 Exchanging code for token with Google...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    console.log('📋 Google token response:', { 
      ok: tokenResponse.ok, 
      status: tokenResponse.status,
      hasAccessToken: !!tokenData.access_token,
      error: tokenData.error,
      errorDescription: tokenData.error_description
    });
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      const errorMsg = tokenData.error_description || tokenData.error || 'Failed to exchange code for token';
      console.error('❌ Token exchange failed:', errorMsg);
      throw new Error(errorMsg);
    }

    // Get user profile from Google
    const profileResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const googleUser = await profileResponse.json();
    
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile from Google');
    }

    // Check if user exists or create new user
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    let user;
    if (existingUser.length > 0) {
      // Update existing user with Google info if not already set
      const updatedUsers = await db
        .update(users)
        .set({
          name: existingUser[0].name || googleUser.name,
          oauth_provider: 'google',
          oauth_id: googleUser.id,
          avatar_url: existingUser[0].avatar_url || googleUser.picture,
          updated_at: new Date()
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      
      user = updatedUsers[0];
    } else {
      // Create new user from Google profile
      const newUsers = await db
        .insert(users)
        .values({
          email: googleUser.email,
          name: googleUser.name,
          oauth_provider: 'google',
          oauth_id: googleUser.id,
          avatar_url: googleUser.picture,
          email_verified: googleUser.verified_email,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      user = newUsers[0];
    }

    // Generate JWT token (same pattern as authService)
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        oauth_provider: user.oauth_provider
      },
      token,
      refreshToken
    });
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: error.message || 'Google authentication failed' });
  }
});

// Facebook OAuth authentication
router.post('/oauth/facebook', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;
    
    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Missing code or redirect URI' });
    }
    
    // Check if this code has already been used
    if (usedOAuthCodes.has(code)) {
      console.warn('⚠️ Facebook OAuth code has already been used:', code.substring(0, 10) + '...');
      return res.status(400).json({ error: 'Authorization code has already been used' });
    }
    
    // Mark code as used immediately
    usedOAuthCodes.add(code);
    
    // Clean up old codes after 10 minutes (OAuth codes expire quickly)
    setTimeout(() => {
      usedOAuthCodes.delete(code);
    }, 10 * 60 * 1000);

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `code=${code}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`,
      {
        method: 'GET',
      }
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to exchange code for token');
    }

    // Get user profile from Facebook
    const profileResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`,
      {
        method: 'GET',
      }
    );

    const facebookUser = await profileResponse.json();
    
    if (!profileResponse.ok || !facebookUser.email) {
      throw new Error('Failed to fetch user profile from Facebook or email not available');
    }

    // Check if user exists or create new user
    let existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, facebookUser.email))
      .limit(1);

    let user;
    if (existingUser.length > 0) {
      // Update existing user with Facebook info if not already set
      const updatedUsers = await db
        .update(users)
        .set({
          name: existingUser[0].name || facebookUser.name,
          oauth_provider: 'facebook',
          oauth_id: facebookUser.id,
          avatar_url: existingUser[0].avatar_url || facebookUser.picture?.data?.url,
          updated_at: new Date()
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      
      user = updatedUsers[0];
    } else {
      // Create new user from Facebook profile
      const newUsers = await db
        .insert(users)
        .values({
          email: facebookUser.email,
          name: facebookUser.name,
          oauth_provider: 'facebook',
          oauth_id: facebookUser.id,
          avatar_url: facebookUser.picture?.data?.url,
          email_verified: true, // Facebook emails are typically verified
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      user = newUsers[0];
    }

    // Generate JWT token (same pattern as authService)
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        oauth_provider: user.oauth_provider
      },
      token,
      refreshToken
    });
  } catch (error: any) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({ error: error.message || 'Facebook authentication failed' });
  }
});

// Logout user (protected route)
router.post('/logout', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Logout from Supabase (optional)
    if (req.user?.id) {
      await authService.logout(req.user.id);
    }
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed' 
    });
  }
});

// Profile setup and update (protected route)
router.put('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const profileData = req.body;
    console.log('Updating profile:', profileData);

    // User ID is available from the middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    let profile;
    if (existingProfile.length > 0) {
      // Update existing profile
      const updatedProfiles = await db
        .update(profiles)
        .set({
          name: profileData.name || existingProfile[0].name,
          type: profileData.type || existingProfile[0].type,
          industry: profileData.industry || profileData.contentNiche || existingProfile[0].industry,
          description: profileData.bio || existingProfile[0].description,
          tone: profileData.brandVoice || existingProfile[0].tone,
          target_audience: profileData.targetAudience || existingProfile[0].target_audience,
          plan: profileData.plan || existingProfile[0].plan,
          // Campaign fields
          campaign_name: profileData.campaignName || existingProfile[0].campaign_name,
          campaign_type: profileData.campaignType || existingProfile[0].campaign_type,
          campaign_goals: profileData.campaignGoals || existingProfile[0].campaign_goals,
          // Additional profile fields
          profession: profileData.profession || existingProfile[0].profession,
          location: profileData.location || existingProfile[0].location,
          website: profileData.website || existingProfile[0].website,
          bio: profileData.bio || existingProfile[0].bio,
          content_niche: profileData.contentNiche || existingProfile[0].content_niche,
          preferred_platforms: profileData.preferredPlatforms || existingProfile[0].preferred_platforms,
          brand_voice: profileData.brandVoice || existingProfile[0].brand_voice,
          social_goals: profileData.socialGoals || existingProfile[0].social_goals,
          business_goals: profileData.businessGoals || existingProfile[0].business_goals,
          posting_frequency: profileData.postingFrequency || existingProfile[0].posting_frequency,
          // Business specific fields
          business_name: profileData.businessName || existingProfile[0].business_name,
          job_title: profileData.jobTitle || existingProfile[0].job_title,
          campaign_size: profileData.campaignSize || existingProfile[0].campaign_size,
          team_collaboration: profileData.teamCollaboration !== undefined ? profileData.teamCollaboration : existingProfile[0].team_collaboration,
          custom_integrations: profileData.customIntegrations || existingProfile[0].custom_integrations,
          monthly_budget: profileData.monthlyBudget || existingProfile[0].monthly_budget,
          content_volume: profileData.contentVolume || existingProfile[0].content_volume,
          updated_at: new Date()
        })
        .where(eq(profiles.id, existingProfile[0].id))
        .returning();
      
      profile = updatedProfiles[0];
    } else {
      // Create new profile
      const newProfiles = await db
        .insert(profiles)
        .values({
          user_id: userId,
          name: profileData.name || 'Unnamed Profile',
          type: profileData.type || 'individual',
          industry: profileData.industry || profileData.contentNiche,
          description: profileData.bio,
          tone: profileData.brandVoice,
          target_audience: profileData.targetAudience,
          plan: profileData.plan || 'free',
          // Campaign fields
          campaign_name: profileData.campaignName,
          campaign_type: profileData.campaignType,
          campaign_goals: profileData.campaignGoals,
          // Additional profile fields
          profession: profileData.profession,
          location: profileData.location,
          website: profileData.website,
          bio: profileData.bio,
          content_niche: profileData.contentNiche,
          preferred_platforms: profileData.preferredPlatforms,
          brand_voice: profileData.brandVoice,
          social_goals: profileData.socialGoals,
          business_goals: profileData.businessGoals,
          posting_frequency: profileData.postingFrequency,
          // Business specific fields
          business_name: profileData.businessName,
          job_title: profileData.jobTitle,
          campaign_size: profileData.campaignSize,
          team_collaboration: profileData.teamCollaboration || false,
          custom_integrations: profileData.customIntegrations,
          monthly_budget: profileData.monthlyBudget,
          content_volume: profileData.contentVolume
        })
        .returning();
      
      profile = newProfiles[0];
    }

    res.json({
      success: true,
      message: 'Profile saved successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get profile (protected route)
router.get('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // User ID is available from the middleware - ignore query params for security
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check if profile exists in profiles table
    const profileResults = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    if (profileResults.length === 0) {
      // No profile exists - return null to indicate profile setup needed
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = profileResults[0];
    
    // Return the actual profile data
    res.json({
      id: profile.id,
      userId: profile.user_id,
      name: profile.name,
      type: profile.type,
      industry: profile.industry,
      description: profile.description,
      tone: profile.tone,
      target_audience: profile.target_audience,
      plan: profile.plan,
      // Campaign fields
      campaignName: profile.campaign_name,
      campaignType: profile.campaign_type,
      campaignGoals: profile.campaign_goals,
      // Additional profile fields
      profession: profile.profession,
      location: profile.location,
      website: profile.website,
      bio: profile.bio,
      contentNiche: profile.content_niche,
      preferredPlatforms: profile.preferred_platforms,
      brandVoice: profile.brand_voice,
      socialGoals: profile.social_goals,
      businessGoals: profile.business_goals,
      postingFrequency: profile.posting_frequency,
      // Business specific fields
      businessName: profile.business_name,
      jobTitle: profile.job_title,
      campaignSize: profile.campaign_size,
      teamCollaboration: profile.team_collaboration,
      customIntegrations: profile.custom_integrations,
      monthlyBudget: profile.monthly_budget,
      contentVolume: profile.content_volume,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


export default router;

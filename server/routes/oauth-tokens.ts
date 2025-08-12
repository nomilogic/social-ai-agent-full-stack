
import express, { Request, Response } from 'express';
import { db } from '../db';
import { oauth_tokens } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// GET /api/oauth-tokens - Get all tokens for user
router.get('/', async (req: Request, res: Response) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(eq(oauth_tokens.user_id, user_id as string));

    res.json({ success: true, data: tokens });
  } catch (error) {
    console.error('Error fetching OAuth tokens:', error);
    res.status(500).json({ error: 'Failed to fetch OAuth tokens' });
  }
});

// POST /api/oauth-tokens - Store new token
router.post('/', async (req: Request, res: Response) => {
  const { user_id, platform, access_token, refresh_token, expires_at } = req.body;
  
  if (!user_id || !platform || !access_token) {
    return res.status(400).json({ error: 'user_id, platform, and access_token are required' });
  }

  try {
    // Check if token already exists
    const existingToken = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, user_id),
        eq(oauth_tokens.platform, platform)
      ))
      .limit(1);

    if (existingToken.length > 0) {
      // Update existing token
      await db
        .update(oauth_tokens)
        .set({
          access_token,
          refresh_token,
          expires_at: expires_at ? new Date(expires_at) : null,
          updated_at: new Date()
        })
        .where(and(
          eq(oauth_tokens.user_id, user_id),
          eq(oauth_tokens.platform, platform)
        ));
    } else {
      // Insert new token
      await db.insert(oauth_tokens).values({
        user_id,
        platform,
        access_token,
        refresh_token,
        expires_at: expires_at ? new Date(expires_at) : null
      });
    }

    res.json({ success: true, message: 'OAuth token stored successfully' });
  } catch (error) {
    console.error('Error storing OAuth token:', error);
    res.status(500).json({ error: 'Failed to store OAuth token' });
  }
});

// DELETE /api/oauth-tokens/:userId/:platform - Delete token
router.delete('/:userId/:platform', async (req: Request, res: Response) => {
  const { userId, platform } = req.params;

  try {
    await db
      .delete(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, userId),
        eq(oauth_tokens.platform, platform)
      ));

    res.json({ success: true, message: 'OAuth token deleted successfully' });
  } catch (error) {
    console.error('Error deleting OAuth token:', error);
    res.status(500).json({ error: 'Failed to delete OAuth token' });
  }
});

// GET /api/oauth/status/:userId - Check connection status for all platforms
router.get('/status/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(eq(oauth_tokens.user_id, userId));

    const status: Record<string, { connected: boolean; expires_at?: Date }> = {};
    
    for (const token of tokens) {
      const isExpired = token.expires_at && new Date() > token.expires_at;
      status[token.platform] = {
        connected: !isExpired,
        expires_at: token.expires_at || undefined
      };
    }

    res.json(status);
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    res.status(500).json({ error: 'Failed to check OAuth status' });
  }
});

// GET /api/oauth/token/:userId/:platform - Get specific access token
router.get('/token/:userId/:platform', async (req: Request, res: Response) => {
  const { userId, platform } = req.params;

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
      return res.status(404).json({ error: 'Token not found' });
    }

    const tokenData = token[0];
    
    // Check if token is expired
    if (tokenData.expires_at && new Date() > tokenData.expires_at) {
      return res.status(401).json({ error: 'Token expired' });
    }

    res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: 'Bearer',
      expires_at: tokenData.expires_at
    });
  } catch (error) {
    console.error('Error fetching OAuth token:', error);
    res.status(500).json({ error: 'Failed to fetch OAuth token' });
  }
});

export default router;

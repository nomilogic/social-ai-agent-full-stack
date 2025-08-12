
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
  const { user_id, platform, access_token, refresh_token, expires_at, profile_data } = req.body;
  
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
          profile_data,
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
        expires_at: expires_at ? new Date(expires_at) : null,
        profile_data
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

export default router;

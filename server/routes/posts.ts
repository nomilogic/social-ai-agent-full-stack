import express from 'express';
import { supabaseAdmin } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get posts for a user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Return mock posts for now
    const mockPosts = [
      {
        id: '1',
        user_id: userId,
        title: 'Sample Post',
        content: 'This is a sample post for testing',
        platform: 'linkedin',
        status: 'draft',
        created_at: new Date().toISOString()
      }
    ];

    res.json(mockPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { title, content, platform } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Mock creation response
    const newPost = {
      id: Date.now().toString(),
      user_id: userId,
      title,
      content,
      platform,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

export default router;
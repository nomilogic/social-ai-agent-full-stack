import express from 'express';
import { supabase } from '../db';
import { authenticateToken, AuthRequest, validateRequestBody } from '../middleware/auth';

const router = express.Router();

// Get campaigns for a user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Return mock campaigns for now
    const mockCampaigns = [
      {
        id: '1',
        user_id: userId,
        name: 'Spring Marketing Campaign',
        description: 'A comprehensive spring marketing strategy',
        status: 'active',
        start_date: '2025-03-01',
        end_date: '2025-05-31',
        budget: 5000,
        created_at: new Date().toISOString()
      }
    ];

    res.json(mockCampaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create a new campaign
router.post('/', authenticateToken, validateRequestBody(['name']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { name, description, start_date, end_date, budget } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Mock creation response
    const newCampaign = {
      id: Date.now().toString(),
      user_id: userId,
      name,
      description,
      start_date,
      end_date,
      budget,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    res.status(201).json(newCampaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

export default router;
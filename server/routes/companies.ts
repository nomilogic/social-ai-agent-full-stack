import express from 'express';
import { supabase } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Simplified companies management using Supabase direct
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // For now, return a mock company since we haven't created tables yet
    const mockCompanies = [
      {
        id: '1',
        user_id: userId,
        name: 'My Company',
        description: 'A sample company for testing',
        industry: 'Technology',
        created_at: new Date().toISOString()
      }
    ];

    res.json(mockCompanies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { name, description, industry } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Mock creation response
    const newCompany = {
      id: Date.now().toString(),
      user_id: userId,
      name,
      description,
      industry,
      created_at: new Date().toISOString()
    };

    res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

export default router;
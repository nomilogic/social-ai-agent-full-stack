import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Save bot training responses
router.post('/bot-responses', authenticateUser, async (req, res) => {
  try {
    const { responses, timestamp } = req.body;
    const userId = req.user?.id;

    if (!userId || !responses) {
      return res.status(400).json({ error: 'User ID and responses are required' });
    }

    // For now, just log the training data
    // In production, you would save this to a training database
    console.log('Bot training data received:', {
      userId,
      timestamp,
      responseCount: Object.keys(responses).length,
      responses
    });

    res.json({ 
      success: true, 
      message: 'Training data saved successfully',
      responseCount: Object.keys(responses).length
    });
  } catch (error) {
    console.error('Error saving training data:', error);
    res.status(500).json({ error: 'Failed to save training data' });
  }
});

// Get bot training insights (for future use)
router.get('/insights/:userId', authenticateUser, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Return sample insights for now
    res.json({
      userId,
      insights: {
        contentGoals: 'More engagement focused',
        audiencePreferences: 'Casual, friendly tone',
        trendAlignment: 'Balanced approach',
        recommendations: [
          'Focus on interactive content',
          'Use more visual storytelling',
          'Incorporate trending hashtags weekly'
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching training insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
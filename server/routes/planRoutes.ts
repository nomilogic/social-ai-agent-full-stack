import { Router } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { getPlanLimits, checkLimit } from '../../client/src/utils/planFeatures';

const router = Router();

// Get user plan and usage statistics
router.get('/user/:userId/plan', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.select({
      id: users.id,
      plan: users.plan,
      plan_expires_at: users.plan_expires_at,
      usage_stats: users.usage_stats
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plan = user[0].plan || 'free';
    const usage = user[0].usage_stats || {};
    
    res.json({
      plan,
      plan_expires_at: user[0].plan_expires_at,
      usage_stats: usage
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.status(500).json({ error: 'Failed to fetch user plan' });
  }
});

// Update user plan
router.put('/user/:userId/plan', async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan, plan_expires_at } = req.body;

    if (!['free', 'ipro', 'business'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    await db.update(users)
      .set({
        plan,
        plan_expires_at: plan_expires_at ? new Date(plan_expires_at) : null,
        updated_at: new Date()
      })
      .where(eq(users.id, userId));

    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ error: 'Failed to update user plan' });
  }
});

// Update user usage statistics
router.put('/user/:userId/usage', async (req, res) => {
  try {
    const { userId } = req.params;
    const { usage_type, increment = 1 } = req.body;

    const user = await db.select({
      usage_stats: users.usage_stats
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUsage = user[0].usage_stats || {};
    const updatedUsage = {
      ...currentUsage,
      [usage_type]: (currentUsage[usage_type] || 0) + increment
    };

    await db.update(users)
      .set({
        usage_stats: updatedUsage,
        updated_at: new Date()
      })
      .where(eq(users.id, userId));

    res.json({ success: true, usage_stats: updatedUsage });
  } catch (error) {
    console.error('Error updating user usage:', error);
    res.status(500).json({ error: 'Failed to update user usage' });
  }
});

// Check feature limits
router.post('/user/:userId/check-limit', async (req, res) => {
  try {
    const { userId } = req.params;
    const { feature, current_usage } = req.body;

    const user = await db.select({
      plan: users.plan,
      usage_stats: users.usage_stats
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plan = user[0].plan || 'free';
    const usage = user[0].usage_stats || {};
    
    const limits = getPlanLimits(plan as 'free' | 'ipro' | 'business');
    const limitCheck = checkLimit(plan as 'free' | 'ipro' | 'business', feature, current_usage || usage[feature] || 0);
    
    res.json({
      plan,
      feature,
      ...limitCheck,
      usage_stats: usage
    });
  } catch (error) {
    console.error('Error checking feature limit:', error);
    res.status(500).json({ error: 'Failed to check feature limit' });
  }
});

export default router;
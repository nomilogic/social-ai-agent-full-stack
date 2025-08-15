import express, { Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Initialize users table
User.createTable().then(() => {
  console.log('Users table initialized successfully');
}).catch(err => {
  console.error('Error initializing users table:', err);
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user
    const userData = {
      email,
      password,
      name: name || email.split('@')[0],
      plan: 'free' as const,
      profile_completed: false,
      onboarding_completed: false
    };

    const newUser = await User.create(userData);
    if (!newUser) {
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
        profile_completed: newUser.profile_completed
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate user credentials
    const user = await User.validatePassword(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        profile_completed: user.profile_completed,
        onboarding_completed: user.onboarding_completed
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      profile_completed: user.profile_completed,
      onboarding_completed: user.onboarding_completed,
      setup_step: user.setup_step,
      preferences: user.preferences,
      total_posts_created: user.total_posts_created,
      total_campaigns_created: user.total_campaigns_created,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updates = req.body;

    // Don't allow updating sensitive fields through this endpoint
    delete updates.id;
    delete updates.email;
    delete updates.password;
    delete updates.plan;
    delete updates.subscription_status;
    delete updates.created_at;

    const updatedUser = await User.update(userId, updates);
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      plan: updatedUser.plan,
      profile_completed: updatedUser.profile_completed,
      onboarding_completed: updatedUser.onboarding_completed,
      setup_step: updatedUser.setup_step,
      preferences: updatedUser.preferences
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user and verify current password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validUser = await User.validatePassword(user.email, currentPassword);
    if (!validUser) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const updated = await User.update(userId, { password: newPassword });
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
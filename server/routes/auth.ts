import express from 'express';
import { supabase } from '../db';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Simple auth implementation using Supabase Auth
// In production, use proper authentication libraries

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use Supabase Auth to create user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: data.user.id, email: data.user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || name || email.split('@')[0],
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use Supabase Auth to sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!data.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: data.user.id, email: data.user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0],
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    // For now, return a mock user to test the flow
    // In production, you would validate the session/token here
    const mockUser = {
      id: 'f5643ed0-5c7b-45f9-b42f-5ce7c48df6b5',
      email: 'user@example.com',
      name: 'Test User',
      created_at: new Date().toISOString()
    };

    res.json(mockUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Profile setup and update
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const profileData = req.body;
    console.log('Updating profile:', profileData);

    // In production, you would save this to your database
    // For now, just return the updated profile with timestamps
    const updatedProfile = {
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      ...updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // For now, return a mock profile
    // In production, you would fetch this from your database based on user ID
    const mockProfile = {
      id: 'f5643ed0-5c7b-45f9-b42f-5ce7c48df6b5',
      name: 'Your Profile',
      email: 'user@example.com',
      bio: '',
      website: '',
      location: '',
      userType: 'individual',
      plan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json(mockProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
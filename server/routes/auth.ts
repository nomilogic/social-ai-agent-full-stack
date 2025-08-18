import express, { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Simple auth implementation for demonstration
// In production, use proper authentication libraries

router.post('/register', async (req: Request, res: Response) => {

  try {
    const result = await db.select({ id: users.id }).from(users).execute();
    console.log(result); // Should print [ { '1': 1 } ]
  } catch (error) {
    console.error(error);
  }
  try {

    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Registration attempt for email:', email);


    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
     

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUserResults = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      })
      .returning();

    const newUser = newUserResults[0];

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    console.log('Registration successful for user:', newUser.id);

    // Check if this is a business account
    const isBusinessAccount = newUser.email === 'nomilogic@gmail.com';

    res.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        profile_type: isBusinessAccount ? 'business' : 'individual',
        plan: isBusinessAccount ? 'business' : 'free',
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Login attempt for email:', email);

    // Find user
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    console.log('User query results:', userResults.length);

    if (userResults.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResults[0];
    console.log('Found user:', { id: user.id, email: user.email, name: user.name });
    console.log('Password provided length:', password.length);
    console.log('Hashed password in DB exists:', !!user.password);

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', validPassword);
    
    if (!validPassword) {
      console.log('Password validation failed for user:', user.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', user.id);

    // Check if this is a business account
    const isBusinessAccount = user.email === 'nomilogic@gmail.com';

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_type: isBusinessAccount ? 'business' : 'individual',
        plan: isBusinessAccount ? 'business' : 'free',
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    // For JWT, logout is handled client-side by removing the token
    // In a more secure implementation, you might maintain a blacklist of tokens
    console.log('User logged out successfully');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

// Get current user profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;

      // Get user from database
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (userResults.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = userResults[0];
      
      // Check if this is a business account
      const isBusinessAccount = user.email === 'nomilogic@gmail.com';
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        profile_type: isBusinessAccount ? 'business' : 'individual',
        plan: isBusinessAccount ? 'business' : 'free'
      });
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
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
    const userId = req.query.userId as string;
    const userEmail = req.query.email as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user from database
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResults[0];
    const isBusinessEmail = user.email === 'nomilogic@gmail.com';

    const profile = {
      id: user.id,
      name: user.name || (isBusinessEmail ? 'Business Profile' : 'User Profile'),
      email: user.email,
      bio: '',
      website: '',
      location: '',
      type: isBusinessEmail ? 'business' : 'individual',
      plan: isBusinessEmail ? 'business' : 'free',
      profile_type: isBusinessEmail ? 'business' : 'individual',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
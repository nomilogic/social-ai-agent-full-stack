import { createServer, type Server } from "http";
import type { Express } from "express";
import express from 'express';
import path from 'path';
import authRouter from './routes/auth'
import enhancedOAuthRoutes from './routes/oauth-enhanced-integrated';
import linkedinRouter from './routes/linkedin'
import facebookRouter from './routes/facebook'
import instagramRouter from './routes/instagram'
import twitterRouter from './routes/twitter'
import tiktokRouter from './routes/tiktok'
import youtubeRouter from './routes/youtube'
import socialRouter from './routes/social'
import aiRouter from './routes/ai'
import postsRouter from './routes/posts'
import campaignsRouter from './routes/campaigns'
import scheduleRouter from './routes/schedule'
import notificationsRouter from './routes/notifications'
import mediaRouter from './routes/media'

export async function registerRoutes(app: Express): Promise<Server> {
    // Static file serving for uploaded media
    app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')))

    // API routes
app.use('/api/auth', authRouter)
// Simplified OAuth Manager (handles all platforms)
app.use('/api/oauth', enhancedOAuthRoutes);
app.use('/api/linkedin', linkedinRouter)
app.use('/api/facebook', facebookRouter)
app.use('/api/instagram', instagramRouter)
app.use('/api/twitter', twitterRouter)
app.use('/api/tiktok', tiktokRouter)
app.use('/api/youtube', youtubeRouter)
app.use('/api/social', socialRouter)
app.use('/api/ai', aiRouter)
app.use('/api/posts', postsRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/media', mediaRouter)

// Legacy routes for backwards compatibility
app.use('/share', linkedinRouter)
app.use('/api/v2', linkedinRouter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

  const httpServer = createServer(app);
  return httpServer;
}
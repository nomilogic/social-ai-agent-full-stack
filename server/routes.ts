import { createServer, type Server } from "http";
import type { Express } from "express";
import express from 'express';
import path from 'path';
import authRouter from './routes/auth'
import oauthRoutes from './routes/oauth';
import oauthEnhancedRoutes from './routes/oauth-enhanced';
import oauthTokensRoutes from './routes/oauth-tokens';
import linkedinRouter from './routes/linkedin'
import socialRouter from './routes/social'
import aiRouter from './routes/ai'
import companiesRouter from './routes/companies'
import postsRouter from './routes/posts'
import campaignsRouter from './routes/campaigns'
import scheduleRouter from './routes/schedule'
import notificationsRouter from './routes/notifications'
import mediaRouter from './routes/media'
import analyticsRouter from './routes/analytics'

export async function registerRoutes(app: Express): Promise<Server> {
    // Static file serving for uploaded media
    app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')))

    // API routes
app.use('/api/auth', authRouter)
app.use('/api/oauth', oauthRoutes);
  app.use('/api/oauth-enhanced', oauthEnhancedRoutes);
  app.use('/api/oauth-tokens', oauthTokensRoutes);
app.use('/api/linkedin', linkedinRouter)
app.use('/api/social', socialRouter)
app.use('/api/ai', aiRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/posts', postsRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/media', mediaRouter)
app.use('/api/analytics', analyticsRouter)

// Legacy routes for backwards compatibility
app.use('/share', linkedinRouter)
app.use('/api/v2', linkedinRouter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

  const httpServer = createServer(app);
  return httpServer;
}
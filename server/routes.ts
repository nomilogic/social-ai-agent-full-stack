import { createServer, type Server } from "http";
import type { Express } from "express";
import oauthRouter from './routes/oauth'
import linkedinRouter from './routes/linkedin'
import socialRouter from './routes/social'
import aiRouter from './routes/ai'

export async function registerRoutes(app: Express): Promise<Server> {
    // API routes
app.use('/api/oauth', oauthRouter)
app.use('/api/linkedin', linkedinRouter)
app.use('/api/social', socialRouter)
app.use('/api/ai', aiRouter)

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
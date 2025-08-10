import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import oauthRouter from './routes/oauth'
import linkedinRouter from './routes/linkedin'
import socialRouter from './routes/social'
import facebookRouter from './routes/facebook'
import instagramRouter from './routes/instagram'
import twitterRouter from './routes/twitter'
import tiktokRouter from './routes/tiktok'
import youtubeRouter from './routes/youtube'
import aiRouter from './routes/ai'
import companiesRouter from './routes/companies'
import postsRouter from './routes/posts'
import mediaRouter from './routes/media'
import scheduleRouter from './routes/schedule'
import campaignsRouter from './routes/campaigns'
import notificationsRouter from './routes/notifications'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173", "http://localhost:5000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use('/api/oauth', oauthRouter)
app.use('/api/social', socialRouter)
app.use('/api/ai', aiRouter)

// Individual platform routes
app.use('/api/linkedin', linkedinRouter)
app.use('/api/facebook', facebookRouter)
app.use('/api/instagram', instagramRouter)
app.use('/api/twitter', twitterRouter)
app.use('/api/tiktok', tiktokRouter)
app.use('/api/youtube', youtubeRouter)

// Data API routes (replacing direct Supabase calls)
app.use('/api/companies', companiesRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/posts', postsRouter)
app.use('/api/media', mediaRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api', scheduleRouter)

// Legacy routes for backwards compatibility
app.use('/share', linkedinRouter)
app.use('/api/v2', linkedinRouter)

// Serve static files from client build directory
const clientDistPath = path.join(__dirname, '../../dist/client')
app.use(express.static(clientDistPath))

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/oauth/') || req.path.startsWith('/share/')) {
    return next()
  }
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

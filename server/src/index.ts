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

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173"],
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
app.use('/api/posts', postsRouter)
app.use('/api/media', mediaRouter)

// Legacy routes for backwards compatibility
app.use('/share', linkedinRouter)
app.use('/api/v2', linkedinRouter)

// Serve client in production (after building)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client')
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

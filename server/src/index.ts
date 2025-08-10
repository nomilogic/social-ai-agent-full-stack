import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import oauthRouter from './routes/oauth'
import linkedinRouter from './routes/linkedin'
import socialRouter from './routes/social'
import aiRouter from './routes/ai'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

// Serve client in production (after building)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client')
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
} else {
  // In development, don't serve client files - let Vite handle it
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API Server is running', 
      clientUrl: 'http://localhost:5173',
      environment: 'development'
    })
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📱 Client should be running on http://localhost:5173`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

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

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173"],
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

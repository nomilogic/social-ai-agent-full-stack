import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
// import dotenv from 'dotenv'
import path from 'path'
import { registerRoutes } from './routes.ts'
import { log } from 'console'
import { serveStatic, setupVite } from './vite.ts'
import { initializeDatabase } from './db'

// dotenv.config() // Environment variables are handled by Replit
const app = express()
const PORT = process.env.PORT || 5000

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL || 'https://your-production-domain.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))



app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});
// Serve client in production (after building)
(async () => {
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Initialize database and start server
  async function startServer() {
    try {
      await initializeDatabase();
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`)
        if (process.env.NODE_ENV === "development") {
          console.log(`Frontend available at: http://0.0.0.0:${PORT}`)
        }
        console.log('Users table initialized successfully')
      })
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
})();
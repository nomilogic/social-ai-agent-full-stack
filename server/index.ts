import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
// import dotenv from 'dotenv'
import path from 'path'
import { registerRoutes } from './routes.ts'
import { log } from 'console'
import { serveStatic, setupVite } from './vite.ts'

// dotenv.config() // Environment variables are handled by Replit
const app = express()
const PORT = process.env.PORT || 5000

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

app.use(
  cors({
    origin: process.env.REPLIT_DEPLOYMENT ? true : ["http://localhost:5173", "http://localhost:5000", "https://*.repl.co"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)
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
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`)
});
})();
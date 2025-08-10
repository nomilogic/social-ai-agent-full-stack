const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Define target URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

console.log('🚀 Starting Replit-style proxy server...');
console.log(`📡 Frontend: ${FRONTEND_URL}`);
console.log(`⚙️  Backend: ${BACKEND_URL}`);
console.log(`🌐 Proxy running on: http://localhost:${PORT}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    frontend: FRONTEND_URL, 
    backend: BACKEND_URL,
    timestamp: new Date().toISOString()
  });
});

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // keep /api prefix
  },
  onError: (err, req, res) => {
    console.error('❌ Backend proxy error:', err.message);
    res.status(500).json({ 
      error: 'Backend service unavailable',
      message: err.message,
      target: BACKEND_URL
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 API: ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
  }
}));

// Proxy OAuth requests to backend
app.use('/oauth', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/oauth': '/oauth', // keep /oauth prefix
  },
  onError: (err, req, res) => {
    console.error('❌ OAuth proxy error:', err.message);
    res.status(500).json({ 
      error: 'OAuth service unavailable',
      message: err.message,
      target: BACKEND_URL
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔐 OAuth: ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
  }
}));

// Proxy share requests to backend (for LinkedIn compatibility)
app.use('/share', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/share': '/share', // keep /share prefix
  },
  onError: (err, req, res) => {
    console.error('❌ Share proxy error:', err.message);
    res.status(500).json({ 
      error: 'Share service unavailable',
      message: err.message,
      target: BACKEND_URL
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📤 Share: ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
  }
}));

// Proxy all other requests to frontend (React app)
app.use('/', createProxyMiddleware({
  target: FRONTEND_URL,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for HMR
  onError: (err, req, res) => {
    console.error('❌ Frontend proxy error:', err.message);
    res.status(500).json({ 
      error: 'Frontend service unavailable',
      message: err.message,
      target: FRONTEND_URL,
      suggestion: 'Make sure the frontend dev server is running on ' + FRONTEND_URL
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Only log non-asset requests to reduce noise
    if (!req.url.includes('.js') && !req.url.includes('.css') && !req.url.includes('.png') && !req.url.includes('.ico')) {
      console.log(`🎨 Frontend: ${req.method} ${req.url} -> ${FRONTEND_URL}${req.url}`);
    }
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Proxy server error:', err);
  res.status(500).json({ 
    error: 'Proxy server error',
    message: err.message,
    url: req.url,
    method: req.method
  });
});

// Start the proxy server
const server = app.listen(PORT, () => {
  console.log(`
🎉 Replit-style Proxy Server Started!
🌐 Access your app at: http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health

🔄 Routing Rules:
• /api/* → Backend (${BACKEND_URL})
• /oauth/* → Backend (${BACKEND_URL})
• /share/* → Backend (${BACKEND_URL})
• /* → Frontend (${FRONTEND_URL})

📝 Make sure both services are running:
• Frontend: npm run dev:client
• Backend: npm run dev:server
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Proxy server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Proxy server closed');
    process.exit(0);
  });
});

module.exports = app;

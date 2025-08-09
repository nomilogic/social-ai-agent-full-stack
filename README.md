# Social Agent Fullstack

An AI-powered social media content generator built with React, Express, TypeScript, and Supabase.

## Features

- 🤖 AI-powered content generation using Google Gemini
- 📱 Multi-platform social media posting (LinkedIn, Twitter, Instagram, Facebook)
- 🔐 OAuth authentication for social platforms
- 💾 Content and company data storage with Supabase
- ⚡ Real-time content preview and editing
- 🎨 Modern, responsive UI with Tailwind CSS

## Tech Stack

### Frontend (Client)
- **React 18** - User interface
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool and development server
- **Lucide React** - Icons

### Backend (Server)
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **LinkedIn API** - Social media integration
- **Supabase** - Database and authentication

### AI & External Services
- **Google Gemini AI** - Content generation
- **Supabase** - Database and user authentication
- **LinkedIn OAuth** - Social media authentication

## Project Structure

```
social-agent-fullstack/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities and API clients
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   ├── index.html         # HTML entry point
│   ├── eslint.config.js   # ESLint configuration
│   └── vite.config.ts     # Vite build configuration
├── server/                # Express backend
│   └── src/
│       ├── routes/        # API route handlers
│       │   ├── oauth.ts   # OAuth authentication routes
│       │   ├── linkedin.ts # LinkedIn API routes
│       │   ├── social.ts  # Multi-platform social routes
│       │   └── ai.ts      # AI content generation routes
│       ├── middleware/    # Express middleware
│       │   └── auth.ts    # Authentication middleware
│       ├── utils/         # Server utilities
│       │   └── index.ts   # Helper functions
│       ├── index.ts       # Main server file
│       └── supabaseClient.ts # Database client
├── supabase/              # Database migrations
│   └── migrations/
├── dist/                  # Build output
│   ├── server/           # Compiled server code
│   └── client/           # Built client assets
├── package.json          # Root package.json with all dependencies
├── tsconfig.json         # Main TypeScript configuration
├── tsconfig.server.json  # Server-specific TypeScript config
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── .env                  # Environment variables (your file)
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
└── README.md            # This documentation
```

## Configuration Management

This project uses a unified configuration approach with all major configuration files at the root level:

- **`package.json`** - Single package.json with all dependencies (client + server)
- **`tsconfig.json`** - Main TypeScript config for the entire project
- **`tsconfig.server.json`** - Server-specific compilation settings
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration
- **`.env`** - Single environment file for all services

### Benefits:
- ✅ **Simplified dependency management** - One `npm install` for everything
- ✅ **Unified TypeScript configuration** - Consistent types across client/server
- ✅ **Single environment file** - All secrets and configs in one place
- ✅ **Reduced complexity** - No nested package.json files to manage
- ✅ **Easier deployment** - Single build process

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Supabase account
- LinkedIn Developer account
- Google AI Studio account (for Gemini API)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Fill in your environment variables:
- `VITE_LINKEDIN_CLIENT_ID` - Your LinkedIn app client ID
- `VITE_LINKEDIN_CLIENT_SECRET` - Your LinkedIn app client secret
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_GEMINI_API_KEY` - Your Google Gemini API key

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Run both client and server in development mode:
```bash
npm run dev
```

This will start:
- Client dev server on http://localhost:5173
- API server on http://localhost:5000

### Building for Production

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Server Architecture

The server follows a modular architecture with organized routes, middleware, and utilities:

### Routes
- **OAuth Routes** (`/api/oauth/*`) - Handle social media authentication
- **LinkedIn Routes** (`/api/linkedin/*`) - LinkedIn-specific API operations
- **Social Routes** (`/api/social/*`) - Multi-platform social media operations
- **AI Routes** (`/api/ai/*`) - AI-powered content generation

### Middleware
- **Authentication** - Token validation and user authentication
- **Validation** - Request body and parameter validation

### Utilities
- **Platform validation** - Ensure supported social media platforms
- **Error handling** - Consistent error response formatting
- **Input sanitization** - Security and data validation

## API Endpoints

### OAuth Authentication
- `GET /api/oauth/linkedin` - Initiate LinkedIn OAuth flow
- `POST /api/oauth/linkedin/callback` - Handle OAuth callback

### LinkedIn API
- `GET /api/linkedin/me` - Get LinkedIn profile information
- `POST /api/linkedin/post` - Create LinkedIn post
- `GET /api/v2/organizationalEntityAcls` - Get LinkedIn company pages

### AI Content Generation
- `POST /api/ai/generate` - Generate platform-specific content using Gemini AI

### Social Media (Future)
- `POST /api/social/post-all` - Post to multiple platforms simultaneously
- `GET /api/social/{platform}/*` - Platform-specific operations

## Usage

1. **Authentication**: Sign up or log in using Supabase authentication
2. **Company Setup**: Create or select a company profile with social media accounts
3. **Content Input**: Enter your content requirements, topics, and platform preferences
4. **AI Generation**: Let Gemini AI generate optimized content for your selected platforms
5. **Preview & Edit**: Review and customize the generated posts
6. **Publish**: Post content to your connected social media accounts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

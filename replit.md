# Social Agent AI Fullstack

### Overview
Social Agent AI Fullstack is a comprehensive social media management platform leveraging artificial intelligence to automate content creation, scheduling, and management across multiple platforms. The project's vision is to provide an enterprise-grade solution for AI-powered social media management, offering extensive feature coverage, robust architecture, and production-ready deployment capabilities. It aims to streamline social media operations, enhance content engagement, and provide advanced analytics for optimized performance across various social media channels.

### User Preferences
No specific user preferences were provided in the original `replit.md` file.

### System Architecture
The project utilizes a client-server architecture. The frontend is a React Single Page Application (SPA) served by an Express.js backend, which also handles all API requests. PostgreSQL is used for database persistence with Drizzle ORM for type-safe database operations. The system integrates with numerous external social media APIs and AI service providers.

**Migration Status (August 2025):**
- Successfully migrated from Supabase to PostgreSQL with Drizzle ORM
- All database operations moved to server-side for enhanced security
- Client-server separation implemented with proper API boundaries
- Google Gemini AI integration active and functional

**Key Architectural Decisions:**
*   **Unified Client-Server Deployment**: The React frontend and Express API are served from the same origin on a single port (5000) in production, simplifying deployment and eliminating CORS issues.
*   **Server-Side API Architecture**: All database operations are centralized on the server-side, enhancing security and data management. Client-side interactions with the database are abstracted through server APIs.
*   **Modular Component-Based Design**: The frontend is built with React components, promoting reusability and maintainability.
*   **Scalable AI Integration**: A unified AI service supports over 15 AI models for text, image, and video generation, with dynamic model selection, fallback mechanisms, and prompt optimization.
*   **Comprehensive Media Management**: Dedicated services and components for handling various media types, including AI-powered video generation and a robust gallery system.
*   **Event-Driven Notifications**: A sophisticated notification system triggered by various events, supporting real-time updates and push notifications.
*   **Continuous AI Learning**: An AI training dashboard allows for managing training criteria, analyzing patterns, and generating insights to continuously improve AI performance.

**Technical Implementations:**
*   **Frontend**: React 18 with TypeScript, Vite for bundling, Tailwind CSS for styling, Lucide React for iconography, React Hot Toast for notifications, and Axios for API calls.
*   **Backend**: Node.js with Express.js and TypeScript, using Multer for file uploads and CORS for cross-origin requests. `tsx` and `esbuild` are used for development and production builds.
*   **Database Schema**: Core tables include `Companies`, `Posts`, `Media`, `Campaigns`, `Notifications`, and `Training_criteria`.
*   **API Structure**: Key API routes include `/api/companies`, `/api/posts`, `/api/media`, `/api/campaigns`, `/api/notifications`, `/api/schedule`, `/api/oauth-enhanced`, and `/api/ai`.
*   **UI/UX Decisions**: Professional and intuitive dashboards with multi-tab interfaces, grid and list view modes, responsive design with Tailwind CSS, and consistent iconography. Emphasis on real-time metrics, interactive elements, and clear feedback.

### External Dependencies
*   **Database & Authentication**: PostgreSQL with Drizzle ORM (Migrated from Supabase in August 2025)
*   **AI/ML Integration**:
    *   **Text Models**: OpenAI (GPT-3.5, 4, 4-Turbo, 4o), Google Gemini (Pro, 1.5 Pro), Anthropic Claude (3 Haiku, 3 Opus, 3.5 Sonnet), DeepSeek (Chat, Coder), Meta LLaMA (3.1 405B, 70B, 8B), Mistral (Large, Medium, Small), Cohere (Command R+, Command R), Perplexity (70B, 7B Online)
    *   **Image Generation**: DALL-E 2/3, Stable Diffusion variants
    *   **Video Generation**: Runway, Pika Labs
    *   **Audio Generation**: ElevenLabs Voice, MusicGen
*   **Social Media APIs**:
    *   Facebook Graph API
    *   Instagram Business API
    *   Twitter/X API v2
    *   TikTok API
    *   YouTube Data API
    *   LinkedIn API
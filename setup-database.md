
# Database Setup Instructions

## 1. Enable Replit PostgreSQL Database

1. In your Replit, click on "Database" in the left sidebar
2. Click "Create a database" 
3. Select "PostgreSQL"
4. This will automatically set up the `DATABASE_URL` environment variable

## 2. Environment Variables

Make sure your `.env` file has the `DATABASE_URL` that Replit provides:

```
DATABASE_URL=postgresql://username:password@host:port/database
```

## 3. Run the Application

After setting up the database, run:

```bash
npm run dev
```

The application will automatically create the necessary tables on first run.

## 4. Verify Database Connection

Check the console output for:
- "Users table exists or was created successfully" 
- "Database tables created successfully" (on first run)

## Troubleshooting

If you see connection errors:
1. Make sure you've created a PostgreSQL database in Replit
2. Check that DATABASE_URL is set in your environment
3. Restart the application after database setup

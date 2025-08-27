# How to Get a Free Gemini API Key

## Step 1: Visit Google AI Studio
Go to: https://aistudio.google.com/app/apikey

## Step 2: Sign in with Google
Use your Google account to sign in.

## Step 3: Create API Key
1. Click "Create API Key"
2. Select your Google Cloud project (or create a new one)
3. Click "Create API Key in New Project" if you don't have one

## Step 4: Copy the API Key
You'll get an API key that looks like: `AIzaSyC...` (starts with AIzaSyC)

## Step 5: Add to .env file
Open your `.env` file and replace:
```
VITE_GEMINI_API_KEY="REPLACE_WITH_YOUR_API_KEY"
```

With:
```
VITE_GEMINI_API_KEY="AIzaSyC_YOUR_ACTUAL_KEY_HERE"
```

## Step 6: Restart your server
Stop your development server (Ctrl+C) and restart it with `npm run dev`

## Free Tier Limits
- 15 requests per minute
- 1,500 requests per day
- Free forever!

## If you can't get an API key
The app will still work with fallback content generation, but it won't be as smart or personalized.

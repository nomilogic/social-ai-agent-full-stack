# Gemini Image Generation

This project now includes Gemini image generation capabilities using both the `@google/generative-ai` package (already installed) and support for the new `@google/genai` package.

## Features Added

### 1. API Endpoint for Gemini Image Generation
- **Endpoint**: `POST /api/ai/generate-image-gemini`
- **Model**: `gemini-2.5-flash-image-preview`
- **Returns**: Base64 image data with metadata

### 2. Standalone Script
- **Location**: `scripts/gemini-image-generation.js`
- **Purpose**: Demonstrates native Gemini image generation
- **Usage**: Saves generated images to files

## API Usage

### Generate Image via API

```javascript
// POST /api/ai/generate-image-gemini
{
  "prompt": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"
}
```

**Response:**
```javascript
{
  "success": true,
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "mimeType": "image/png",
  "prompt": "Create a picture of a nano banana dish...",
  "generatedAt": "2025-01-08T20:00:00.000Z",
  "provider": "gemini",
  "model": "gemini-2.5-flash-image-preview"
}
```

### Example Frontend Usage

```javascript
async function generateImage() {
  const response = await fetch('/api/ai/generate-image-gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Use the base64 image data
    const img = document.createElement('img');
    img.src = result.imageData;
    document.body.appendChild(img);
  }
}
```

## Standalone Script Usage

### Prerequisites

First, you'll need to install the `@google/genai` package:

```bash
npm install @google/genai
```

### Running the Script

```bash
# Run the demo script
npm run generate-image

# Or run directly
node scripts/gemini-image-generation.js
```

### Environment Setup

Make sure your `.env` file contains:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Code Examples

### Your Original Code (Enhanced)

```javascript
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.VITE_GEMINI_API_KEY
  });

  const prompt = "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image-preview",
    contents: prompt,
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }
}

main();
```

### Using the Existing @google/generative-ai Package

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [{ text: "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme" }]
  }]
});

const response = await result.response;
// Process response similar to above
```

## Error Handling

The implementation includes comprehensive error handling for:

- Missing API keys
- Quota exceeded
- Permission denied
- Invalid prompts
- Network issues

## Integration with Existing System

The Gemini image generation integrates seamlessly with your existing social AI agent system:

1. **Media Upload**: Generated images can be uploaded to your Supabase storage
2. **Social Posts**: Use generated images in social media campaigns
3. **Content Creation**: Combine with existing AI text generation for complete content

## Testing

You can test the API endpoint using curl:

```bash
curl -X POST http://localhost:5000/api/ai/generate-image-gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}'
```

## Notes

- The `gemini-2.5-flash-image-preview` model is specifically designed for image generation
- Images are returned as base64-encoded data
- The API supports both the new `@google/genai` approach and the existing `@google/generative-ai` package
- Generated images are automatically timestamped and saved with appropriate file extensions

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure `VITE_GEMINI_API_KEY` is set in your `.env` file
2. **Model Access**: Verify your API key has access to image generation models
3. **Quota Limits**: Check your Google AI Studio quota limits
4. **Package Installation**: If using the standalone script, ensure `@google/genai` is installed

### Support

- Check the Google AI Studio documentation for the latest model information
- Verify your API key permissions in the Google AI Studio console
- Monitor API usage and quotas in your Google Cloud Console

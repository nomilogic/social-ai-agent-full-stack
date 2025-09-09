// Note: This script requires the @google/genai package to be installed
// Run: npm install @google/genai
// This script demonstrates native Gemini image generation using the new @google/genai package

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function generateGeminiImage(prompt) {
  try {
    console.log('🚀 Initializing Google GenAI...');
    
    // Initialize the AI client with your API key from .env
    const ai = new GoogleGenAI({
      apiKey: process.env.VITE_GEMINI_API_KEY
    });

    if (!process.env.VITE_GEMINI_API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY not found in environment variables');
    }

    console.log('📝 Prompt:', prompt);
    console.log('🎨 Generating image with Gemini 2.5 Flash Image Preview...');

    // Generate content using the image generation model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    console.log('✅ Generation completed, processing response...');

    // Check if we have candidates in the response
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates found in response');
    }

    const candidate = response.candidates[0];
    
    if (!candidate.content || !candidate.content.parts) {
      throw new Error('No content parts found in response');
    }

    let imagesSaved = 0;

    // Process all parts of the response
    for (const part of candidate.content.parts) {
      if (part.text) {
        console.log('📄 Text response:', part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        const fileExtension = mimeType.includes('png') ? 'png' : 'jpg';
        
        console.log('🖼️  Image generated with MIME type:', mimeType);
        
        // Convert base64 to buffer
        const buffer = Buffer.from(imageData, "base64");
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `gemini-generated-${timestamp}.${fileExtension}`;
        
        // Save the image
        fs.writeFileSync(filename, buffer);
        console.log(`💾 Image saved as: ${filename}`);
        console.log(`📊 File size: ${Math.round(buffer.length / 1024)} KB`);
        
        imagesSaved++;
      }
    }

    if (imagesSaved === 0) {
      console.log('⚠️  No images were found in the response');
    } else {
      console.log(`🎉 Successfully generated and saved ${imagesSaved} image(s)!`);
    }

    return response;

  } catch (error) {
    console.error('❌ Error generating image:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('API_KEY')) {
      console.error('💡 Make sure your VITE_GEMINI_API_KEY is set in the .env file');
    } else if (error.message.includes('quota')) {
      console.error('💡 Check your Gemini API quota and billing settings');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('💡 Check if your API key has permission to use image generation');
    }
    
    throw error;
  }
}

// Main function to demonstrate the image generation
async function main() {
  try {
    console.log('🌟 Starting Gemini Image Generation Demo');
    console.log('=====================================');
    
    // Your original prompt
    const prompt = "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";
    
    // Generate the image
    await generateGeminiImage(prompt);
    
    console.log('=====================================');
    console.log('✨ Demo completed successfully!');
    
  } catch (error) {
    console.error('💥 Demo failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
export { generateGeminiImage };

// Run the demo if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('gemini-image-generation.js')) {
  main();
}

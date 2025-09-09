import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('🌟 Enhanced Gemini Image Generation');
    console.log('==================================');
    
    // Your original code structure
    const ai = new GoogleGenAI({
      apiKey: process.env.VITE_GEMINI_API_KEY
    });

    const prompt = "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

    console.log('📝 Generating image with prompt:', prompt);
    console.log('🎨 Using model: gemini-2.5-flash-image-preview');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    console.log('✅ Generation completed, processing response...');

    // Process response using your original structure
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log('📄 AI Description:', part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        // Your original filename
        fs.writeFileSync("gemini-native-image.png", buffer);
        console.log("💾 Image saved as gemini-native-image.png");
        console.log(`📊 File size: ${Math.round(buffer.length / 1024)} KB`);
        
        // Additional enhanced functionality
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const enhancedFilename = `enhanced-gemini-${timestamp}.png`;
        fs.writeFileSync(enhancedFilename, buffer);
        console.log(`💾 Enhanced copy saved as: ${enhancedFilename}`);
        
        // Save metadata
        const metadata = {
          prompt: prompt,
          model: "gemini-2.5-flash-image-preview",
          generatedAt: new Date().toISOString(),
          filenames: ["gemini-native-image.png", enhancedFilename],
          fileSizeKB: Math.round(buffer.length / 1024),
          mimeType: part.inlineData.mimeType,
          description: response.candidates[0].content.parts.find(p => p.text)?.text || "No description"
        };
        
        fs.writeFileSync(`metadata-${timestamp}.json`, JSON.stringify(metadata, null, 2));
        console.log(`📋 Metadata saved as: metadata-${timestamp}.json`);
        
        break; // Process only the first image
      }
    }
    
    console.log('==================================');
    console.log('🎉 Enhanced generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the enhanced demo
main();

// Demo script showing how to integrate Gemini image generation with social media posting
import { generateGeminiImage } from './gemini-image-generation.js';
import * as fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

async function createSocialMediaPost(prompt, platforms = ['instagram', 'facebook', 'twitter']) {
  try {
    console.log('🎯 Creating social media post with AI-generated image');
    console.log('====================================================');
    
    // Generate image using Gemini
    console.log('🖼️  Generating image...');
    const response = await generateGeminiImage(prompt);
    
    // Extract the image data
    const candidate = response.candidates[0];
    let imageData = null;
    let imageFilename = null;
    
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        imageFilename = `social-post-${timestamp}.png`;
        
        // Save the image for social media use
        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync(imageFilename, buffer);
        break;
      }
    }
    
    if (!imageData) {
      throw new Error('No image generated');
    }
    
    // Create platform-specific posts
    const posts = [];
    
    for (const platform of platforms) {
      let caption = '';
      let hashtags = [];
      
      switch (platform) {
        case 'instagram':
          caption = '✨ Indulge in our exquisite nano banana creation! Where culinary artistry meets the cosmos 🌟';
          hashtags = ['#NanoBanana', '#Finedining', '#GeminiTheme', '#CulinaryArt', '#RestaurantLife', '#Foodie'];
          break;
          
        case 'facebook':
          caption = 'Experience the extraordinary at our restaurant! Our signature nano banana dish brings together innovative culinary techniques with a stunning Gemini-inspired presentation. Book your table for an unforgettable dining experience! 🍽️✨';
          hashtags = ['#FineRestaurant', '#NanoBanana', '#CulinaryInnovation', '#DiningExperience'];
          break;
          
        case 'twitter':
          caption = 'Nano banana dish meets Gemini elegance! 🌟 Where food becomes art ✨';
          hashtags = ['#NanoBanana', '#FineFood', '#RestaurantLife'];
          break;
          
        case 'linkedin':
          caption = 'Innovation in culinary arts: Our team has crafted a unique nano banana dish that showcases the intersection of gastronomy and artistic presentation. This reflects our commitment to pushing boundaries in the hospitality industry.';
          hashtags = ['#CulinaryInnovation', '#Hospitality', '#RestaurantIndustry', '#FoodTech'];
          break;
      }
      
      posts.push({
        platform,
        caption,
        hashtags,
        imageFile: imageFilename,
        imageBase64: `data:image/png;base64,${imageData}`
      });
    }
    
    console.log('\n📱 Generated posts for platforms:');
    posts.forEach(post => {
      console.log(`\n${post.platform.toUpperCase()}:`);
      console.log(`Caption: ${post.caption}`);
      console.log(`Hashtags: ${post.hashtags.join(' ')}`);
      console.log(`Image: ${post.imageFile}`);
    });
    
    // Save post data to JSON for use by other systems
    const postData = {
      generatedAt: new Date().toISOString(),
      prompt: prompt,
      imageFile: imageFilename,
      posts: posts
    };
    
    const jsonFilename = `social-campaign-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(postData, null, 2));
    
    console.log(`\n💾 Campaign data saved to: ${jsonFilename}`);
    console.log('\n🎉 Social media campaign ready!');
    
    return postData;
    
  } catch (error) {
    console.error('❌ Error creating social media post:', error.message);
    throw error;
  }
}

// Demo function
async function runDemo() {
  try {
    const prompt = "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin'];
    
    await createSocialMediaPost(prompt, platforms);
    
  } catch (error) {
    console.error('Demo failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
export { createSocialMediaPost };

// Run demo if executed directly
if (process.argv[1] && process.argv[1].endsWith('social-media-image-demo.js')) {
  runDemo();
}

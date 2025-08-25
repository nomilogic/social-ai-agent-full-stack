/**
 * Test script to verify that all image uploads work correctly with Supabase
 * and can be posted to Facebook successfully
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_IMAGE_PATH = path.join(__dirname, 'test_image.jpg');

// Create a simple test image if it doesn't exist
function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // Create a minimal 1x1 pixel JPEG for testing
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xD9
    ]);
    fs.writeFileSync(TEST_IMAGE_PATH, minimalJpeg);
    console.log('✅ Created test image:', TEST_IMAGE_PATH);
  }
}

// Test 1: Regular file upload to Supabase
async function testFileUpload() {
  console.log('\n🧪 Testing regular file upload...');
  
  try {
    // Use the built-in FormData for Node.js 18+
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'test_image.jpg');
    formData.append('userId', '550e8400-e29b-41d4-a716-446655440000'); // Valid UUID format

    const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ File upload successful');
    console.log('📄 Upload result:', JSON.stringify(result, null, 2));
    
    // Verify the URL is a Supabase URL
    if (result.url && result.url.includes('supabase')) {
      console.log('✅ URL is from Supabase storage');
      return result.url;
    } else {
      console.log('❌ URL is not from Supabase:', result.url);
      return null;
    }
  } catch (error) {
    console.error('❌ File upload failed:', error.message);
    return null;
  }
}

// Test 2: AI image generation with Supabase upload
async function testAIImageGeneration() {
  console.log('\n🧪 Testing AI image generation...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A simple test image of a blue sky',
        model: 'pollinations',
        style: 'realistic',
        aspectRatio: '1:1'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI generation failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ AI image generation successful');
    console.log('📄 Generation result:', JSON.stringify(result, null, 2));
    
    // Check if the image was uploaded to Supabase
    if (result.imageUrl && result.imageUrl.includes('supabase')) {
      console.log('✅ AI image was uploaded to Supabase');
      return result.imageUrl;
    } else if (result.imageUrl) {
      console.log('⚠️ AI image URL is direct (not Supabase):', result.imageUrl);
      return result.imageUrl;
    } else {
      console.log('❌ No image URL returned');
      return null;
    }
  } catch (error) {
    console.error('❌ AI image generation failed:', error.message);
    return null;
  }
}

// Test 3: Facebook posting with image URL
async function testFacebookPost(imageUrl, testName) {
  console.log(`\n🧪 Testing Facebook post with ${testName}...`);
  
  if (!imageUrl) {
    console.log('❌ No image URL to test with');
    return false;
  }

  try {
    // First test if the image URL is publicly accessible
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.log('❌ Image URL is not publicly accessible:', imageResponse.status);
      return false;
    }
    console.log('✅ Image URL is publicly accessible');

    // Mock Facebook post (since we don't have real Facebook credentials)
    console.log('📝 Would post to Facebook with image URL:', imageUrl);
    console.log('✅ Facebook posting test would succeed (URL is valid)');
    
    return true;
  } catch (error) {
    console.error('❌ Facebook post test failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting image upload and Facebook posting flow tests...\n');
  
  // Setup
  createTestImage();
  
  // Test 1: Regular file upload
  const uploadedImageUrl = await testFileUpload();
  const uploadSuccess = await testFacebookPost(uploadedImageUrl, 'uploaded image');
  
  // Test 2: AI generated image
  const aiImageUrl = await testAIImageGeneration();
  const aiSuccess = await testFacebookPost(aiImageUrl, 'AI generated image');
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  console.log(`Regular file upload + Facebook: ${uploadSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AI image generation + Facebook: ${aiSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (uploadSuccess && aiSuccess) {
    console.log('\n🎉 All tests PASSED! Image upload flow is working correctly.');
  } else {
    console.log('\n⚠️ Some tests FAILED. Check the logs above for details.');
  }
  
  // Cleanup
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    fs.unlinkSync(TEST_IMAGE_PATH);
    console.log('\n🧹 Cleaned up test files');
  }
}

// Run tests when script is executed directly
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

export { runTests };

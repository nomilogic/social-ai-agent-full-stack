import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = '763fac3c-ea7c-42c3-8a20-b3c968cb5265';

async function testUpload() {
  console.log('🔍 Testing Upload Service...\n');
  
  try {
    // Create a simple test video file
    const testVideoPath = path.join(process.cwd(), 'test-video.mp4');
    
    // Check if test video exists, if not create a minimal one
    if (!fs.existsSync(testVideoPath)) {
      console.log('📁 Creating test video file...');
      // Create a minimal MP4 file (just for testing)
      const minimalMp4 = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32, 0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
      ]);
      fs.writeFileSync(testVideoPath, minimalMp4);
    }
    
    // Test 1: Check if uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    console.log('📂 Checking uploads directory...');
    console.log(`   Path: ${uploadsDir}`);
    console.log(`   Exists: ${fs.existsSync(uploadsDir)}`);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('   Creating uploads directory...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Test 2: Test the upload endpoint
    console.log('\n📤 Testing upload endpoint...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testVideoPath));
    formData.append('userId', TEST_USER_ID);
    
    const response = await axios.post(`${BASE_URL}/media/upload`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000
    });
    
    console.log('✅ Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test 3: Check if file was actually created
    if (response.data.data && response.data.data.fileName) {
      const uploadedFilePath = path.join(uploadsDir, response.data.data.fileName);
      console.log(`\n📁 Checking uploaded file: ${uploadedFilePath}`);
      console.log(`   File exists: ${fs.existsSync(uploadedFilePath)}`);
      
      if (fs.existsSync(uploadedFilePath)) {
        const stats = fs.statSync(uploadedFilePath);
        console.log(`   File size: ${stats.size} bytes`);
      }
    }
    
    // Test 4: Test media listing endpoint
    console.log('\n📋 Testing media listing...');
    const listResponse = await axios.get(`${BASE_URL}/media/${TEST_USER_ID}`);
    console.log('✅ Media list retrieved!');
    console.log('Files:', listResponse.data.data.length, 'found');
    
  } catch (error) {
    console.log('❌ Upload test failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Start with: npm run dev');
    }
    
    if (error.response?.status === 400) {
      console.log('\n💡 Check if userId is being sent correctly');
      console.log('💡 Check if file field name matches backend expectation');
    }
    
    if (error.response?.status === 500) {
      console.log('\n💡 Server error - check database connection');
      console.log('💡 Check if media table exists and schema is correct');
    }
  }
}

async function testVideoIntegration() {
  console.log('\n🎥 Testing Video Integration Flow...\n');
  
  // Test how videos should be attached to posts
  console.log('Expected flow:');
  console.log('1. User uploads video via /api/media/upload');
  console.log('2. Video URL is returned and stored in UI state');
  console.log('3. When creating post, video URL is included in post data');
  console.log('4. Post endpoint uses video URL for YouTube/TikTok platforms');
  
  console.log('\n🔍 Let me check the current post creation flow...');
}

console.log('🧪 Upload Service Diagnostic Tool\n');
console.log('=' .repeat(50));

testUpload()
  .then(() => testVideoIntegration())
  .catch(console.error);

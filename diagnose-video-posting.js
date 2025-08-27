import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'a8e5f171-45f8-4b07-938b-0ea59744b802';

async function checkOAuthConnections() {
  console.log('\n🔐 Checking OAuth Connections...\n');
  
  const platforms = ['facebook', 'linkedin', 'youtube'];
  const connections = {};
  
  for (const platform of platforms) {
    try {
      const response = await axios.get(`${BASE_URL}/${platform}/oauth_tokens?user_id=${TEST_USER_ID}`);
      connections[platform] = response.data;
      
      if (response.data.connected) {
        console.log(`✅ ${platform.toUpperCase()}: Connected`);
        if (response.data.expired) {
          console.log(`   ⚠️  Token expired: ${response.data.token.expires_at}`);
        } else {
          console.log(`   ✅ Token valid until: ${response.data.token.expires_at || 'No expiry'}`);
        }
      } else {
        console.log(`❌ ${platform.toUpperCase()}: Not connected`);
      }
    } catch (error) {
      console.log(`❌ ${platform.toUpperCase()}: Error checking connection -`, error.response?.data?.error || error.message);
      connections[platform] = { connected: false, error: error.message };
    }
  }
  
  return connections;
}

async function testVideoUpload() {
  console.log('\n📹 Testing Video Upload Functionality...\n');
  
  try {
    // Create a test video URL (we'll use a sample video)
    const testVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
    console.log('Using test video URL:', testVideoUrl);
    
    // Test if we can download the video
    try {
      const response = await axios.head(testVideoUrl);
      console.log('✅ Test video is accessible');
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('   Content-Length:', response.headers['content-length'], 'bytes');
    } catch (error) {
      console.log('❌ Test video not accessible:', error.message);
      return false;
    }
    
    // Test media upload endpoint by checking if it accepts video files
    console.log('\n📤 Testing media upload endpoint configuration...');
    
    // We can't easily test file upload without FormData in this script,
    // but we can check if the endpoint exists
    try {
      const response = await axios.get(`${BASE_URL}/media/${TEST_USER_ID}`);
      console.log('✅ Media endpoint is accessible');
      console.log('   Current media files:', response.data.data.length);
      
      if (response.data.data.length > 0) {
        console.log('   Recent uploads:');
        response.data.data.slice(0, 3).forEach((file, i) => {
          console.log(`     ${i + 1}. ${file.originalName} (${file.mimeType})`);
        });
      }
    } catch (error) {
      console.log('❌ Media endpoint error:', error.response?.data?.error || error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Video upload test failed:', error.message);
    return false;
  }
}

async function testPlatformVideoSupport(connections) {
  console.log('\n🎬 Testing Platform Video Support...\n');
  
  const testPost = {
    caption: 'Test video post from diagnostic script',
    hashtags: ['#test', '#video'],
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  };
  
  // Test Facebook video posting
  console.log('🔵 Testing Facebook Video Support:');
  if (connections.facebook?.connected && !connections.facebook?.expired) {
    try {
      const response = await axios.post(`${BASE_URL}/facebook/post`, {
        accessToken: connections.facebook.token.access_token,
        post: testPost
      });
      console.log('✅ Facebook video posting: SUCCESS');
      console.log('   Post ID:', response.data.postId);
    } catch (error) {
      console.log('❌ Facebook video posting: FAILED');
      console.log('   Error:', error.response?.data?.error || error.message);
      
      if (error.response?.data?.details) {
        console.log('   Details:', JSON.stringify(error.response.data.details, null, 2));
      }
    }
  } else {
    console.log('⏭️  Facebook video posting: SKIPPED (not connected or token expired)');
  }
  
  // Test LinkedIn video posting  
  console.log('\n🔗 Testing LinkedIn Video Support:');
  if (connections.linkedin?.connected && !connections.linkedin?.expired) {
    try {
      const response = await axios.post(`${BASE_URL}/linkedin/post`, {
        accessToken: connections.linkedin.token.access_token,
        post: testPost
      });
      console.log('✅ LinkedIn video posting: SUCCESS');
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('❌ LinkedIn video posting: FAILED');
      console.log('   Error:', error.response?.data?.error || error.message);
      
      if (error.response?.data?.details) {
        console.log('   Details:', JSON.stringify(error.response.data.details, null, 2));
      }
    }
  } else {
    console.log('⏭️  LinkedIn video posting: SKIPPED (not connected or token expired)');
  }
}

async function checkServerHealth() {
  console.log('\n🏥 Checking Server Health...\n');
  
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is healthy');
    console.log('   Status:', response.data.status);
    console.log('   Timestamp:', response.data.timestamp);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return false;
  }
  
  return true;
}

async function generateSolutions(connections) {
  console.log('\n💡 SOLUTIONS FOR YOUR VIDEO POSTING ISSUES:\n');
  console.log('=' .repeat(60));
  
  // Check OAuth connection issues
  const disconnectedPlatforms = Object.entries(connections)
    .filter(([platform, data]) => !data.connected)
    .map(([platform]) => platform);
    
  if (disconnectedPlatforms.length > 0) {
    console.log('\n🔑 OAUTH CONNECTION ISSUES:');
    disconnectedPlatforms.forEach(platform => {
      console.log(`\n   ${platform.toUpperCase()} - Not Connected:`);
      console.log(`   1. Go to your app dashboard: http://localhost:5000`);
      console.log(`   2. Navigate to Settings > Social Accounts`);
      console.log(`   3. Click "Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}"`);
      console.log(`   4. Complete the OAuth authorization flow`);
      
      if (platform === 'facebook') {
        console.log(`   5. Ensure these permissions are granted:`);
        console.log(`      - pages_manage_posts (for page posting)`);
        console.log(`      - pages_read_engagement (for analytics)`);
        console.log(`      - publish_video (for video posting)`);
      } else if (platform === 'linkedin') {
        console.log(`   5. Ensure these permissions are granted:`);
        console.log(`      - r_liteprofile (for profile access)`);
        console.log(`      - w_member_social (for posting)`);
      }
    });
  }
  
  // Check expired tokens
  const expiredPlatforms = Object.entries(connections)
    .filter(([platform, data]) => data.connected && data.expired)
    .map(([platform]) => platform);
    
  if (expiredPlatforms.length > 0) {
    console.log('\n⏰ EXPIRED TOKEN ISSUES:');
    expiredPlatforms.forEach(platform => {
      console.log(`\n   ${platform.toUpperCase()} - Token Expired:`);
      console.log(`   1. Disconnect and reconnect the account`);
      console.log(`   2. This will refresh the access token`);
    });
  }
  
  console.log('\n🎬 VIDEO-SPECIFIC SOLUTIONS:');
  console.log('\n   FACEBOOK VIDEO POSTING:');
  console.log('   1. Videos must be publicly accessible URLs');
  console.log('   2. Supported formats: MP4, WebM, MOV');
  console.log('   3. Maximum file size: 4GB');
  console.log('   4. For page posting, ensure page has video posting permissions');
  
  console.log('\n   LINKEDIN VIDEO POSTING:');
  console.log('   1. Videos must be downloaded and re-uploaded to LinkedIn');
  console.log('   2. Supported formats: MP4, WebM, MOV');
  console.log('   3. Maximum file size: 200MB for videos');
  console.log('   4. Videos may take time to process after upload');
  
  console.log('\n📱 VIDEO PREVIEW ISSUES:');
  console.log('   1. Ensure video URLs are publicly accessible');
  console.log('   2. Check CORS settings for video preview');
  console.log('   3. Add proper video preview component in frontend');
  console.log('   4. Test video URLs in browser before posting');
  
  console.log('\n🔧 IMMEDIATE NEXT STEPS:');
  console.log('   1. Connect your social media accounts first');
  console.log('   2. Test with a small video file (< 10MB)');
  console.log('   3. Verify video URL is publicly accessible');
  console.log('   4. Check server logs during posting for detailed errors');
}

async function runFullDiagnostics() {
  console.log('🔍 COMPREHENSIVE VIDEO POSTING DIAGNOSTICS');
  console.log('=' .repeat(60));
  
  // Check server health first
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not healthy. Please start the server first with: npm run dev');
    return;
  }
  
  // Check OAuth connections
  const connections = await checkOAuthConnections();
  
  // Test video upload functionality
  const videoUploadWorking = await testVideoUpload();
  
  // Test platform video support
  await testPlatformVideoSupport(connections);
  
  // Generate solutions
  await generateSolutions(connections);
  
  console.log('\n✨ Diagnostic complete! Follow the solutions above to fix your video posting issues.');
}

runFullDiagnostics().catch(console.error);

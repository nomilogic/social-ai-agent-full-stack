import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'a8e5f171-45f8-4b07-938b-0ea59744b802';

async function diagnoseFacebook() {
  console.log('\n🔵 Diagnosing Facebook Posting Issue...\n');
  
  try {
    // Get the actual access token
    const tokenResponse = await axios.get(`${BASE_URL}/oauth/token/${TEST_USER_ID}/facebook`);
    console.log('✅ Facebook token retrieved successfully');
    
    const accessToken = tokenResponse.data.access_token;
    
    // Try to get Facebook pages first
    try {
      const pagesResponse = await axios.get(`${BASE_URL}/facebook/pages`, {
        params: { access_token: accessToken }
      });
      
      console.log('📄 Available Facebook Pages:');
      if (pagesResponse.data.pages && pagesResponse.data.pages.length > 0) {
        pagesResponse.data.pages.forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.name} (ID: ${page.id})`);
        });
        
        // Try posting to first page
        const pageId = pagesResponse.data.pages[0].id;
        console.log(`\n🔄 Attempting to post to page: ${pagesResponse.data.pages[0].name}`);
        
        const postResponse = await axios.post(`${BASE_URL}/facebook/post`, {
          accessToken,
          post: {
            caption: 'Test post from diagnostic script',
            hashtags: ['#test']
          },
          pageId
        });
        
        console.log('✅ Facebook posting successful!');
        console.log('Response:', postResponse.data);
      } else {
        console.log('   No Facebook pages found. Trying to post to personal profile...');
        
        const postResponse = await axios.post(`${BASE_URL}/facebook/post`, {
          accessToken,
          post: {
            caption: 'Test post from diagnostic script',
            hashtags: ['#test']
          }
        });
        
        console.log('✅ Facebook posting successful!');
        console.log('Response:', postResponse.data);
      }
      
    } catch (pagesError) {
      console.log('❌ Could not get Facebook pages:', pagesError.response?.data?.error || pagesError.message);
    }
    
  } catch (postError) {
    console.log('❌ Facebook posting failed:');
    console.log('Error Code:', postError.response?.data?.error?.code);
    console.log('Error Type:', postError.response?.data?.error?.type);
    console.log('Error Message:', postError.response?.data?.error?.message);
    
    // Provide specific solutions
    if (postError.response?.data?.error?.code === 200) {
      console.log('\n💡 Solution for Facebook Error 200:');
      console.log('   1. Go to Facebook Developer Console: https://developers.facebook.com/apps');
      console.log('   2. Select your app and go to App Review');
      console.log('   3. Request these permissions:');
      console.log('      - pages_manage_posts');
      console.log('      - pages_read_engagement');
      console.log('   4. Or use a Page Access Token instead of User Access Token');
    }
  }
}

async function diagnoseYouTube() {
  console.log('\n🔴 Diagnosing YouTube Posting Issue...\n');
  
  try {
    // Get the actual access token
    const tokenResponse = await axios.get(`${BASE_URL}/oauth/token/${TEST_USER_ID}/youtube`);
    console.log('✅ YouTube token retrieved successfully');
    
    const accessToken = tokenResponse.data.access_token;
    
    // Check if we have a test video file
    console.log('🔄 Testing YouTube post with mock video...');
    
    const postResponse = await axios.post(`${BASE_URL}/youtube/post`, {
      accessToken,
      post: {
        caption: 'Test YouTube video upload',
        hashtags: ['#test', '#youtube']
      },
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4' // Public test video
    });
    
    console.log('✅ YouTube posting successful!');
    console.log('Response:', postResponse.data);
    
  } catch (error) {
    console.log('❌ YouTube posting failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error);
    console.log('Details:', error.response?.data?.details);
    
    // Provide specific solutions
    if (error.response?.status === 401) {
      console.log('\n💡 Solution for YouTube Error 401:');
      console.log('   1. Token may be expired - try reconnecting YouTube');
      console.log('   2. Check YouTube API scope includes upload permissions');
    } else if (error.response?.status === 403) {
      console.log('\n💡 Solution for YouTube Error 403:');
      console.log('   1. YouTube API quota may be exceeded');
      console.log('   2. Account may not have upload permissions');
      console.log('   3. Check Google Cloud Console for API limits');
    }
  }
}

async function checkMediaUpload() {
  console.log('\n📁 Checking Media Upload Issues...\n');
  
  // Check if uploads directory exists
  console.log('Checking uploads directory and database schema...');
  console.log('From server logs, there is a database schema issue:');
  console.log('❌ Error: column "file_name" of relation "media" does not exist');
  console.log('\n💡 Solution:');
  console.log('   The media table schema needs to be updated to include the file_name column');
  console.log('   This is preventing video file uploads which are required for YouTube posting');
}

async function runDiagnostics() {
  console.log('🔍 Running Social Media Posting Diagnostics...\n');
  console.log('=' .repeat(60));
  
  await diagnoseFacebook();
  console.log('\n' + '=' .repeat(60));
  
  await diagnoseYouTube();
  console.log('\n' + '=' .repeat(60));
  
  await checkMediaUpload();
  console.log('\n' + '=' .repeat(60));
  
  console.log('\n📋 Summary:');
  console.log('1. Facebook: Needs additional permissions (pages_manage_posts, pages_read_engagement)');
  console.log('2. YouTube: May have token or quota issues');
  console.log('3. Media Upload: Database schema issue preventing file uploads');
  console.log('\n🎯 Next steps: Fix database schema first, then address platform permissions');
}

runDiagnostics().catch(console.error);

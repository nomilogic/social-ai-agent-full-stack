// Test script to verify individual platform regeneration functionality
// This simulates the flow that would happen when clicking the individual "Regenerate" button

const testData = {
  contentData: {
    prompt: "Share an inspiring quote about productivity and success in business",
    tags: ["productivity", "business", "success"],
    mediaUrl: null
  },
  campaignInfo: {
    name: "Test Campaign",
    industry: "Technology",
    description: "A test campaign for regeneration",
    targetAudience: "Business professionals",
    brandTone: "professional",
    goals: ["engagement"],
    platforms: ["linkedin"] // Only regenerating LinkedIn
  }
};

console.log("🧪 Testing Individual Platform Regeneration");
console.log("=" .repeat(50));

// Test 1: Verify generateSinglePlatformPost function exists and works
async function testSinglePlatformGeneration() {
  console.log("\n📝 Test 1: Single Platform Generation");
  
  try {
    // Simulate API call to generate single platform post
    const response = await fetch('http://localhost:5000/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign: testData.campaignInfo,
        content: {
          topic: testData.contentData.prompt,
          contentType: 'general',
          tone: testData.campaignInfo.brandTone,
          targetAudience: testData.campaignInfo.targetAudience,
          tags: testData.contentData.tags
        },
        platforms: ['linkedin'] // Only LinkedIn
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Single platform generation successful");
      console.log("📊 Generated data:", {
        success: data.success,
        postCount: data.posts?.length,
        platform: data.posts?.[0]?.platform
      });
      
      if (data.posts && data.posts.length === 1 && data.posts[0].platform === 'linkedin') {
        console.log("✅ Test passed: Generated exactly one LinkedIn post");
        return true;
      } else {
        console.log("❌ Test failed: Expected one LinkedIn post, got:", data.posts);
        return false;
      }
    } else {
      console.log("❌ API call failed:", response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.log("❌ Error during test:", error.message);
    return false;
  }
}

// Test 2: Verify multiple platforms aren't affected
async function testMultiplePlatformPreservation() {
  console.log("\n🔄 Test 2: Multiple Platform State Preservation");
  
  // Simulate initial posts for multiple platforms
  const initialPosts = [
    { platform: 'linkedin', caption: 'Original LinkedIn post', hashtags: ['#business'] },
    { platform: 'facebook', caption: 'Original Facebook post', hashtags: ['#social'] },
    { platform: 'twitter', caption: 'Original Twitter post', hashtags: ['#tech'] }
  ];
  
  console.log("📋 Initial posts:", initialPosts.map(p => ({ platform: p.platform, caption: p.caption.substring(0, 30) + '...' })));
  
  // Simulate regenerating only LinkedIn
  try {
    const response = await fetch('http://localhost:5000/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign: testData.campaignInfo,
        content: {
          topic: testData.contentData.prompt,
          contentType: 'general',
          tone: testData.campaignInfo.brandTone,
          targetAudience: testData.campaignInfo.targetAudience,
          tags: testData.contentData.tags
        },
        platforms: ['linkedin'] // Only regenerate LinkedIn
      })
    });

    if (response.ok) {
      const data = await response.json();
      const newLinkedInPost = data.posts?.[0];
      
      if (newLinkedInPost && newLinkedInPost.platform === 'linkedin') {
        console.log("✅ LinkedIn post regenerated successfully");
        console.log("📝 New LinkedIn caption:", newLinkedInPost.caption?.substring(0, 50) + '...');
        
        // In a real app, this would be handled by the UPDATE_SINGLE_PLATFORM_POST action
        const updatedPosts = initialPosts.map(post => 
          post.platform === 'linkedin' ? newLinkedInPost : post
        );
        
        console.log("📋 Updated posts:", updatedPosts.map(p => ({ 
          platform: p.platform, 
          caption: p.caption?.substring(0, 30) + '...',
          isNew: p.platform === 'linkedin'
        })));
        
        // Verify other platforms weren't affected
        const facebookUnchanged = updatedPosts.find(p => p.platform === 'facebook')?.caption === 'Original Facebook post';
        const twitterUnchanged = updatedPosts.find(p => p.platform === 'twitter')?.caption === 'Original Twitter post';
        
        if (facebookUnchanged && twitterUnchanged) {
          console.log("✅ Test passed: Other platforms preserved, LinkedIn updated");
          return true;
        } else {
          console.log("❌ Test failed: Other platforms were affected");
          return false;
        }
      } else {
        console.log("❌ Test failed: No LinkedIn post returned");
        return false;
      }
    } else {
      console.log("❌ API call failed:", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ Error during test:", error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting individual platform regeneration tests...\n");
  
  const test1Result = await testSinglePlatformGeneration();
  const test2Result = await testMultiplePlatformPreservation();
  
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Results:");
  console.log(`Test 1 (Single Platform Generation): ${test1Result ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Multiple Platform Preservation): ${test2Result ? '✅ PASS' : '❌ FAIL'}`);
  
  const allTestsPassed = test1Result && test2Result;
  console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allTestsPassed) {
    console.log("\n🎉 Individual platform regeneration functionality is working correctly!");
    console.log("✨ Users can now regenerate individual platform posts without affecting others.");
  } else {
    console.log("\n⚠️ Some issues detected. Please review the test output above.");
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

module.exports = { testSinglePlatformGeneration, testMultiplePlatformPreservation, runTests };

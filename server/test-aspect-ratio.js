import http from 'http';

// Test data with different aspect ratios
const testCases = [
  { aspectRatio: '1:1', expectedWidth: 1024, expectedHeight: 1024 },
  { aspectRatio: '9:16', expectedWidth: 720, expectedHeight: 1280 },
  { aspectRatio: '16:9', expectedWidth: 1280, expectedHeight: 720 },
  { aspectRatio: '4:3', expectedWidth: 1024, expectedHeight: 768 }
];

async function testAspectRatio(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: 'test image for aspect ratio',
      aspectRatio: testCase.aspectRatio,
      style: 'realistic',
      userId: 'test-user'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/generate-image',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`Testing aspect ratio ${testCase.aspectRatio}...`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.success && response.dimensions) {
            const actualWidth = response.dimensions.width;
            const actualHeight = response.dimensions.height;
            
            console.log(`✅ ${testCase.aspectRatio}: ${actualWidth}x${actualHeight} (expected: ${testCase.expectedWidth}x${testCase.expectedHeight})`);
            
            if (actualWidth === testCase.expectedWidth && actualHeight === testCase.expectedHeight) {
              resolve({ success: true, testCase, response });
            } else {
              resolve({ success: false, testCase, response, reason: 'Dimension mismatch' });
            }
          } else {
            console.log(`❌ ${testCase.aspectRatio}: Failed -`, response.error || 'Unknown error');
            resolve({ success: false, testCase, response, reason: response.error });
          }
        } catch (error) {
          console.log(`❌ ${testCase.aspectRatio}: Parse error -`, error.message);
          console.log('Raw response:', data.substring(0, 200));
          resolve({ success: false, testCase, error: error.message, rawData: data.substring(0, 200) });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${testCase.aspectRatio}: Request error -`, error.message);
      resolve({ success: false, testCase, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Aspect Ratio Fix...\n');
  
  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testAspectRatio(testCase);
    results.push(result);
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${successful}/${total}`);
  
  if (successful === total) {
    console.log('🎉 All aspect ratio tests passed! The fix is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. The aspect ratio fix needs more work.');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.testCase.aspectRatio}: ${r.reason || r.error}`);
    });
  }
}

// Run the tests
runTests().catch(console.error);

export { testAspectRatio, runTests };

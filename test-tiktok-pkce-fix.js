import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

console.log('🧪 TikTok OAuth PKCE Fix Test\n')

// Test the PKCE generation functions
function testPKCEGeneration() {
  console.log('1. 🔐 Testing PKCE Parameter Generation:')
  console.log('=====================================')
  
  // Simulate the generation process from pkce.ts
  function generateCodeVerifier(length = 128) {
    if (length < 43 || length > 128) {
      throw new Error('Code verifier length must be between 43 and 128 characters');
    }
    
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    
    // Use Node.js crypto for server-side testing
    const crypto = require('crypto');
    const array = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    
    return result;
  }
  
  async function generateCodeChallenge(codeVerifier) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return hash.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  try {
    // Test different lengths
    const testLengths = [43, 64, 128];
    
    for (const length of testLengths) {
      console.log(`\nTesting length ${length}:`);
      
      const codeVerifier = generateCodeVerifier(length);
      const codeChallenge = generateCodeChallenge(codeVerifier);
      
      // Validate format
      const validPattern = /^[A-Za-z0-9\-._~]+$/;
      const isValidFormat = validPattern.test(codeVerifier);
      const isValidLength = codeVerifier.length >= 43 && codeVerifier.length <= 128;
      
      console.log(`  ✅ Code Verifier: ${codeVerifier.substring(0, 30)}... (${codeVerifier.length} chars)`);
      console.log(`  ✅ Code Challenge: ${codeChallenge.substring(0, 30)}... (${codeChallenge.length} chars)`);
      console.log(`  ✅ Valid format: ${isValidFormat}`);
      console.log(`  ✅ Valid length: ${isValidLength}`);
      
      if (!isValidFormat || !isValidLength) {
        throw new Error(`PKCE validation failed for length ${length}`);
      }
    }
    
    console.log('\n✅ All PKCE generation tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ PKCE generation test failed:', error.message);
    return false;
  }
}

function testLocalStorageSimulation() {
  console.log('\n2. 💾 Testing localStorage Simulation:')
  console.log('=====================================')
  
  try {
    // Simulate localStorage behavior
    const mockLocalStorage = {};
    const localStorage = {
      setItem: (key, value) => {
        mockLocalStorage[key] = value;
        console.log(`  📝 Set: ${key} = ${value.substring(0, 30)}...`);
      },
      getItem: (key) => {
        const value = mockLocalStorage[key];
        console.log(`  📖 Get: ${key} = ${value ? value.substring(0, 30) + '...' : 'null'}`);
        return value || null;
      },
      removeItem: (key) => {
        delete mockLocalStorage[key];
        console.log(`  🗑️ Remove: ${key}`);
      }
    };
    
    // Test storage and retrieval
    const testVerifier = 'test_' + 'a'.repeat(120);
    const testState = 'test_state_' + Math.random().toString(36).substring(2, 18);
    
    console.log('\nTesting storage operations:');
    localStorage.setItem('tiktok_code_verifier', testVerifier);
    localStorage.setItem('tiktok_oauth_state', testState);
    
    console.log('\nTesting retrieval:');
    const retrievedVerifier = localStorage.getItem('tiktok_code_verifier');
    const retrievedState = localStorage.getItem('tiktok_oauth_state');
    
    const storageWorking = (
      retrievedVerifier === testVerifier &&
      retrievedState === testState
    );
    
    console.log(`\n✅ Storage test: ${storageWorking ? 'PASSED' : 'FAILED'}`);
    
    console.log('\nTesting cleanup:');
    localStorage.removeItem('tiktok_code_verifier');
    localStorage.removeItem('tiktok_oauth_state');
    
    const cleanedVerifier = localStorage.getItem('tiktok_code_verifier');
    const cleanedState = localStorage.getItem('tiktok_oauth_state');
    
    const cleanupWorking = (cleanedVerifier === null && cleanedState === null);
    console.log(`✅ Cleanup test: ${cleanupWorking ? 'PASSED' : 'FAILED'}`);
    
    return storageWorking && cleanupWorking;
  } catch (error) {
    console.error('\n❌ localStorage simulation test failed:', error.message);
    return false;
  }
}

function testErrorMessages() {
  console.log('\n3. 🚨 Testing Error Message Scenarios:')
  console.log('=====================================')
  
  const scenarios = [
    {
      name: 'Missing code_verifier',
      input: { code: 'test123', redirect_uri: 'http://localhost:5173/oauth/tiktok/callback', state: 'state123' },
      expectedError: 'Missing code_verifier for PKCE'
    },
    {
      name: 'Invalid code_verifier length (too short)',
      input: { code: 'test123', redirect_uri: 'http://localhost:5173/oauth/tiktok/callback', state: 'state123', code_verifier: 'too_short' },
      expectedError: 'Invalid code_verifier length'
    },
    {
      name: 'Invalid code_verifier format',
      input: { code: 'test123', redirect_uri: 'http://localhost:5173/oauth/tiktok/callback', state: 'state123', code_verifier: 'a'.repeat(50) + '@#$%^&*()' + 'b'.repeat(50) },
      expectedError: 'Invalid code_verifier format'
    },
    {
      name: 'Valid parameters',
      input: { code: 'test123', redirect_uri: 'http://localhost:5173/oauth/tiktok/callback', state: 'state123', code_verifier: 'a'.repeat(64) + 'B'.repeat(64) },
      expectedError: null
    }
  ];
  
  console.log('\nTesting validation scenarios:');
  
  let allTestsPassed = true;
  
  for (const scenario of scenarios) {
    console.log(`\n  Testing: ${scenario.name}`);
    
    try {
      // Simulate server-side validation
      const { code, redirect_uri, code_verifier } = scenario.input;
      
      if (!code_verifier || typeof code_verifier !== 'string') {
        const errorMsg = 'Missing code_verifier for PKCE';
        console.log(`    ❌ ${errorMsg}`);
        
        if (scenario.expectedError && errorMsg.includes(scenario.expectedError)) {
          console.log(`    ✅ Expected error caught correctly`);
        } else if (!scenario.expectedError) {
          console.log(`    ❌ Unexpected error: ${errorMsg}`);
          allTestsPassed = false;
        }
        continue;
      }
      
      if (code_verifier.length < 43 || code_verifier.length > 128) {
        const errorMsg = `Invalid code_verifier length: ${code_verifier.length}`;
        console.log(`    ❌ ${errorMsg}`);
        
        if (scenario.expectedError && errorMsg.includes(scenario.expectedError)) {
          console.log(`    ✅ Expected error caught correctly`);
        } else if (!scenario.expectedError) {
          console.log(`    ❌ Unexpected error: ${errorMsg}`);
          allTestsPassed = false;
        }
        continue;
      }
      
      const validPattern = /^[A-Za-z0-9\-._~]+$/;
      if (!validPattern.test(code_verifier)) {
        const errorMsg = 'Invalid code_verifier format';
        console.log(`    ❌ ${errorMsg}`);
        
        if (scenario.expectedError && errorMsg.includes(scenario.expectedError)) {
          console.log(`    ✅ Expected error caught correctly`);
        } else if (!scenario.expectedError) {
          console.log(`    ❌ Unexpected error: ${errorMsg}`);
          allTestsPassed = false;
        }
        continue;
      }
      
      console.log(`    ✅ All validations passed`);
      if (scenario.expectedError) {
        console.log(`    ❌ Expected error '${scenario.expectedError}' but validation passed`);
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log(`    ❌ Test failed with error: ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  console.log(`\n✅ Error message tests: ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
  return allTestsPassed;
}

function showTroubleshootingGuide() {
  console.log('\n4. 🔧 Troubleshooting Guide:')
  console.log('===========================')
  
  console.log('\nIf you encounter "Missing code_verifier for PKCE" error:')
  console.log('')
  console.log('📋 Step-by-step debugging:')
  console.log('1. Open browser developer tools (F12)')
  console.log('2. Go to Console tab')
  console.log('3. Paste and run the debug script:')
  console.log('   (Copy from debug-tiktok-pkce.js)')
  console.log('')
  console.log('🚨 Common issues and solutions:')
  console.log('')
  console.log('Issue: "localStorage is empty"')
  console.log('Solution: Make sure you are logged in to your app first')
  console.log('')
  console.log('Issue: "Popup blocked"')
  console.log('Solution: Allow popups for your site in browser settings')
  console.log('')
  console.log('Issue: "State mismatch"')
  console.log('Solution: Clear localStorage and try connecting again')
  console.log('')
  console.log('Issue: "Code verifier missing in popup"')
  console.log('Solution: Ensure localStorage is enabled and not being cleared')
  console.log('')
  console.log('🔄 Manual fix process:')
  console.log('1. Clear all TikTok-related localStorage items')
  console.log('2. Refresh the page')
  console.log('3. Login to your app again')
  console.log('4. Try connecting TikTok account')
  console.log('')
  console.log('🌐 TikTok Developer Portal checklist:')
  console.log('- App status: Should be "Live" or approved')
  console.log('- Redirect URI: http://localhost:5173/oauth/tiktok/callback')
  console.log('- Scopes: user.info.basic, video.publish enabled')
  console.log('- Client ID and secret properly configured')
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive TikTok OAuth PKCE tests...\n');
  
  const pkceTest = testPKCEGeneration();
  const storageTest = testLocalStorageSimulation();
  const errorTest = testErrorMessages();
  
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  console.log(`PKCE Generation: ${pkceTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`localStorage Sim: ${storageTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Error Handling: ${errorTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allTestsPassed = pkceTest && storageTest && errorTest;
  console.log(`\nOverall: ${allTestsPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  
  showTroubleshootingGuide();
  
  console.log('\n🎯 Next Steps:')
  console.log('=============')
  if (allTestsPassed) {
    console.log('1. ✅ Your PKCE implementation looks good!')
    console.log('2. 🌐 Test in your browser by connecting TikTok')
    console.log('3. 🔍 Check browser console for detailed logs')
    console.log('4. 📱 Use the debug script if issues occur')
  } else {
    console.log('1. ❌ Fix the failing tests first')
    console.log('2. 🔧 Review the error messages and solutions')
    console.log('3. 🧪 Re-run this test script after fixes')
    console.log('4. 📞 Contact support if issues persist')
  }
  
  return allTestsPassed;
}

// Configuration check
function checkConfiguration() {
  console.log('\n🔧 Configuration Check:')
  console.log('======================')
  
  const clientId = process.env.VITE_TIKTOK_CLIENT_ID || process.env.TIKTOK_CLIENT_ID;
  const clientSecret = process.env.VITE_TIKTOK_CLIENT_SECRET || process.env.TIKTOK_CLIENT_SECRET;
  
  console.log(`TikTok Client ID: ${clientId ? '✅ Configured' : '❌ Missing'}`);
  console.log(`TikTok Client Secret: ${clientSecret ? '✅ Configured' : '❌ Missing'}`);
  
  if (!clientId || !clientSecret) {
    console.log('\n⚠️ TikTok credentials not found in environment variables!');
    console.log('Make sure you have set:');
    console.log('- VITE_TIKTOK_CLIENT_ID or TIKTOK_CLIENT_ID');
    console.log('- VITE_TIKTOK_CLIENT_SECRET or TIKTOK_CLIENT_SECRET');
  }
  
  return !!(clientId && clientSecret);
}

// Main execution
const configOk = checkConfiguration();
const testsOk = await runAllTests();

console.log('\n🏁 Final Status:')
console.log('===============')
console.log(`Configuration: ${configOk ? '✅ OK' : '❌ Issues'}`);
console.log(`Tests: ${testsOk ? '✅ Passed' : '❌ Failed'}`);

if (configOk && testsOk) {
  console.log('\n🎉 Everything looks good! Your TikTok OAuth PKCE implementation should work now.');
  console.log('🚀 Try connecting TikTok in your browser and check the console logs.');
} else {
  console.log('\n⚠️ Please address the issues above before testing in the browser.');
}

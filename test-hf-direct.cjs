// Direct test of Hugging Face API
require('dotenv').config();
const axios = require('axios');

async function testHuggingFaceAPI() {
  const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
  const model = 'stabilityai/stable-diffusion-xl-base-1.0';
  const prompt = 'a cute cat sitting on a windowsill';
  
  console.log('Testing Hugging Face API...');
  console.log('Model:', model);
  console.log('Prompt:', prompt);
  console.log('API key:', HF_API_KEY ? 'Present' : 'Missing');
  
  try {
    console.log('Making request to Hugging Face...');
    
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        inputs: prompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'image/png'
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data length:', response.data.length);
    
    if (response.data && response.data.length > 0) {
      console.log('✅ Successfully received image data from Hugging Face!');
      
      // Check if it's JSON error
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const jsonResponse = JSON.parse(Buffer.from(response.data).toString());
        console.log('JSON Response:', jsonResponse);
      } else {
        console.log('Received binary data (likely an image)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Hugging Face API:');
    console.error('Status:', error.response?.status);
    console.error('Status text:', error.response?.statusText);
    console.error('Headers:', error.response?.headers);
    
    if (error.response?.data) {
      try {
        // Try to parse error as JSON
        const errorData = Buffer.from(error.response.data).toString();
        console.error('Error data:', errorData);
      } catch (parseError) {
        console.error('Could not parse error data');
      }
    }
    
    console.error('Message:', error.message);
  }
}

testHuggingFaceAPI();

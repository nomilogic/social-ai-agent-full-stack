// Debug script to test Hugging Face API key
require('dotenv').config();

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

console.log('Hugging Face API key:', HF_API_KEY);
console.log('API key starts with hf_:', HF_API_KEY?.startsWith('hf_'));
console.log('API key length:', HF_API_KEY?.length);

// Output a message indicating whether the key is properly set
if (!HF_API_KEY || !HF_API_KEY.startsWith('hf_')) {
  console.error('⚠️ Invalid API key format. Hugging Face API keys should start with "hf_"');
} else {
  console.log('✅ API key appears to be in the correct format');
}

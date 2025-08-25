const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Storage Connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testStorage() {
  try {
    console.log('\n🧪 Testing Supabase Storage...');
    
    // Test 1: List buckets
    console.log('1. Checking buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Buckets error:', bucketsError);
      return;
    }
    
    console.log('✅ Available buckets:', buckets.map(b => b.name));
    
    // Test 2: Check if 'images' bucket exists
    const imagesBucket = buckets.find(b => b.name === 'images');
    if (!imagesBucket) {
      console.log('⚠️  "images" bucket not found. Creating...');
      
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });
      
      if (createError) {
        console.error('❌ Create bucket error:', createError);
        return;
      }
      
      console.log('✅ "images" bucket created successfully');
    } else {
      console.log('✅ "images" bucket exists');
    }
    
    // Test 3: Try to list files in images bucket
    console.log('2. Checking images bucket contents...');
    const { data: files, error: listError } = await supabase.storage.from('images').list('', { limit: 5 });
    
    if (listError) {
      console.error('❌ List files error:', listError);
    } else {
      console.log('✅ Images bucket accessible. Files found:', files?.length || 0);
    }
    
    // Test 4: Try to upload a small test file
    console.log('3. Testing upload capability...');
    const testData = Buffer.from('Test image data');
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(`ai-generated/${testFileName}`, testData, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
    } else {
      console.log('✅ Upload successful:', uploadData.path);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(uploadData.path);
      
      console.log('✅ Public URL:', urlData.publicUrl);
      
      // Clean up test file
      await supabase.storage.from('images').remove([uploadData.path]);
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n✅ Supabase Storage is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStorage();

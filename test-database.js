import { db } from './server/db.js';
import { media } from './shared/schema.js';

async function testDatabase() {
  console.log('🔍 Testing Database Connection and Media Table...\n');
  
  try {
    // Test 1: Basic database connection
    console.log('1. Testing database connection...');
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Database connected successfully');
    
    // Test 2: Check if media table exists
    console.log('\n2. Checking media table...');
    const tableCheck = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'media' 
      ORDER BY ordinal_position
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Media table exists with columns:');
      tableCheck.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ Media table does not exist!');
      console.log('\n💡 Creating media table...');
      
      // Create the media table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS media (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          file_name TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ Media table created!');
    }
    
    // Test 3: Test insert operation
    console.log('\n3. Testing insert operation...');
    const testRecord = {
      id: 'test-id-123',
      user_id: '763fac3c-ea7c-42c3-8a20-b3c968cb5265',
      file_name: 'test.mp4',
      original_name: 'test-video.mp4',
      file_path: '/uploads/test.mp4',
      mime_type: 'video/mp4',
      size: 1024,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // First, clean up any existing test record
    await db.execute(`DELETE FROM media WHERE id = 'test-id-123'`);
    
    // Try insert
    await db.insert(media).values(testRecord);
    console.log('✅ Insert operation successful');
    
    // Clean up test record
    await db.execute(`DELETE FROM media WHERE id = 'test-id-123'`);
    console.log('✅ Cleanup successful');
    
    console.log('\n🎯 Database is working correctly!');
    
  } catch (error) {
    console.log('❌ Database test failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('relation "media" does not exist')) {
      console.log('\n💡 Media table needs to be created');
      console.log('💡 Run database migration or create table manually');
    }
    
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n💡 Table exists but column names are wrong');
      console.log('💡 Check schema.ts vs actual database columns');
    }
  }
}

testDatabase().catch(console.error);

// Test script to check if profile data is being saved to database
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testProfileData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check recent profiles
    const profilesResult = await client.query(`
      SELECT 
        id, user_id, name, type, plan, 
        business_name, campaign_type, 
        created_at, updated_at 
      FROM profiles 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('\n=== Recent Profiles ===');
    if (profilesResult.rows.length === 0) {
      console.log('No profiles found in database');
    } else {
      profilesResult.rows.forEach((profile, index) => {
        console.log(`Profile ${index + 1}:`);
        console.log(`  ID: ${profile.id}`);
        console.log(`  User ID: ${profile.user_id}`);
        console.log(`  Name: ${profile.name}`);
        console.log(`  Type: ${profile.type}`);
        console.log(`  Plan: ${profile.plan}`);
        console.log(`  Business Name: ${profile.business_name}`);
        console.log(`  Campaign Type: ${profile.campaign_type}`);
        console.log(`  Created: ${profile.created_at}`);
        console.log(`  Updated: ${profile.updated_at}`);
        console.log('---');
      });
    }

    // Check recent users
    const usersResult = await client.query(`
      SELECT id, email, name, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    console.log('\n=== Recent Users ===');
    if (usersResult.rows.length === 0) {
      console.log('No users found in database');
    } else {
      usersResult.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Created: ${user.created_at}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await client.end();
  }
}

testProfileData();

// Debug profile submission
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function debugProfile() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Find the most recent user
    const usersResult = await client.query(`
      SELECT id, email, name, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (usersResult.rows.length === 0) {
      console.log('No users found');
      return;
    }

    const latestUser = usersResult.rows[0];
    console.log('\n=== Latest User ===');
    console.log(`ID: ${latestUser.id}`);
    console.log(`Email: ${latestUser.email}`);
    console.log(`Name: ${latestUser.name}`);
    console.log(`Created: ${latestUser.created_at}`);

    // Check if this user has a profile
    const profileResult = await client.query(`
      SELECT * FROM profiles WHERE user_id = $1
    `, [latestUser.id]);

    console.log('\n=== Profile Status ===');
    if (profileResult.rows.length === 0) {
      console.log('❌ No profile found for this user');
      console.log('This indicates that the profile form submission is failing');
    } else {
      console.log('✅ Profile found:');
      const profile = profileResult.rows[0];
      console.log(`  Name: ${profile.name}`);
      console.log(`  Plan: ${profile.plan}`);
      console.log(`  Type: ${profile.type}`);
      console.log(`  Campaign Type: ${profile.campaign_type}`);
      console.log(`  Created: ${profile.created_at}`);
      console.log(`  Updated: ${profile.updated_at}`);
    }

    // Check table structure
    const tableInfoResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `);

    console.log('\n=== Profiles Table Structure ===');
    tableInfoResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await client.end();
  }
}

debugProfile();

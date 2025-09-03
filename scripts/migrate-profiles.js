import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function migrateProfiles() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add campaign fields to profiles table
    const campaignFields = [
      'campaign_name TEXT',
      'campaign_type TEXT',
      'campaign_goals TEXT[]'
    ];

    // Add additional profile fields
    const profileFields = [
      'profession TEXT',
      'location TEXT',
      'website TEXT',
      'bio TEXT',
      'content_niche TEXT',
      'preferred_platforms TEXT[]',
      'brand_voice TEXT',
      'social_goals TEXT[]',
      'business_goals TEXT[]',
      'posting_frequency TEXT'
    ];

    // Add business specific fields
    const businessFields = [
      'business_name TEXT',
      'job_title TEXT',
      'campaign_size TEXT',
      'team_collaboration BOOLEAN DEFAULT FALSE',
      'custom_integrations TEXT[]',
      'monthly_budget TEXT',
      'content_volume TEXT'
    ];

    const allFields = [...campaignFields, ...profileFields, ...businessFields];

    for (const field of allFields) {
      const columnName = field.split(' ')[0];
      try {
        // Check if column exists
        const checkQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = '${columnName}'
        `;
        const checkResult = await client.query(checkQuery);
        
        if (checkResult.rows.length === 0) {
          // Add column if it doesn't exist
          const alterQuery = `ALTER TABLE profiles ADD COLUMN ${field}`;
          await client.query(alterQuery);
          console.log(`Added column: ${columnName}`);
        } else {
          console.log(`Column ${columnName} already exists`);
        }
      } catch (error) {
        console.error(`Error adding column ${columnName}:`, error.message);
      }
    }

    console.log('✅ Profile migration completed successfully!');

    // Show updated table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `;
    const result = await client.query(columnsQuery);
    
    console.log('\nProfiles table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

migrateProfiles();

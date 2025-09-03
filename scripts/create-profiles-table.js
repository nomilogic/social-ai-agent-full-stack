import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function createProfilesTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if profiles table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    `;
    const tableExists = await client.query(checkTableQuery);

    if (tableExists.rows.length > 0) {
      console.log('Profiles table already exists');
      return;
    }

    // Create profiles table based on schema
    const createTableQuery = `
      CREATE TABLE profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'individual',
        industry TEXT,
        description TEXT,
        tone TEXT,
        target_audience TEXT,
        plan TEXT NOT NULL DEFAULT 'free',
        -- Campaign fields
        campaign_name TEXT,
        campaign_type TEXT,
        campaign_goals TEXT[],
        -- Additional profile fields
        profession TEXT,
        location TEXT,
        website TEXT,
        bio TEXT,
        content_niche TEXT,
        preferred_platforms TEXT[],
        brand_voice TEXT,
        social_goals TEXT[],
        business_goals TEXT[],
        posting_frequency TEXT,
        -- Business specific fields
        business_name TEXT,
        job_title TEXT,
        campaign_size TEXT,
        team_collaboration BOOLEAN DEFAULT FALSE,
        custom_integrations TEXT[],
        monthly_budget TEXT,
        content_volume TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await client.query(createTableQuery);
    console.log('✅ Profiles table created successfully!');

    // Show table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `;
    const result = await client.query(columnsQuery);
    
    console.log('\nProfiles table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createProfilesTable();

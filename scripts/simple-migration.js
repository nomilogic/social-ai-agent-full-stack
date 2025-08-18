import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function simpleMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Step 1: Delete campaigns table
    console.log('Dropping campaigns table...');
    await client.query('DROP TABLE IF EXISTS campaigns CASCADE;');
    console.log('Campaigns table deleted');

    // Step 2: Add useful campaign fields to companies table
    console.log('Adding campaign fields to companies table...');
    
    const campaignFields = [
      'objective TEXT',
      'start_date DATE',
      'end_date DATE', 
      'budget DECIMAL(10, 2)',
      'status TEXT DEFAULT \'active\'',
      'keywords TEXT[]',
      'hashtags TEXT[]',
      'total_posts INTEGER DEFAULT 0',
      'published_posts INTEGER DEFAULT 0',
      'scheduled_posts INTEGER DEFAULT 0'
    ];

    for (const field of campaignFields) {
      const fieldName = field.split(' ')[0];
      try {
        await client.query(`ALTER TABLE companies ADD COLUMN ${field};`);
        console.log(`Added field: ${fieldName}`);
      } catch (error) {
        if (error.code === '42701') { // column already exists
          console.log(`Field ${fieldName} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    // Step 3: Rename companies table to campaigns
    console.log('Renaming companies table to campaigns...');
    await client.query('ALTER TABLE companies RENAME TO campaigns;');
    console.log('Table renamed to campaigns');

    // Step 4: Update posts table reference
    console.log('Updating posts table reference...');
    try {
      await client.query('ALTER TABLE posts RENAME COLUMN company_id TO campaign_id;');
      console.log('Updated posts.company_id to posts.campaign_id');
    } catch (error) {
      if (error.code === '42703') { // column doesn't exist
        console.log('posts.company_id column not found, skipping');
      } else {
        console.log('Posts table reference already updated or error:', error.message);
      }
    }

    console.log('✅ Migration completed successfully!');
    
    // Verify the result
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCampaigns table columns:');
    result.rows.forEach(row => console.log(`- ${row.column_name}`));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run it
simpleMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

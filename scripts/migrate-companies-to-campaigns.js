import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateCompaniesToCampaigns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First check if campaigns table already exists
    const checkCampaignsTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'campaigns';
    `);

    if (checkCampaignsTable.rows.length > 0) {
      console.log('Campaigns table already exists, checking if it has all required columns...');
      
      // Check if website column exists in campaigns table
      const checkWebsiteColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'website';
      `);
      
      if (checkWebsiteColumn.rows.length > 0) {
        console.log('Campaigns table already has all required columns.');
        return;
      }
      
      // Campaigns table exists but is missing columns, add them
      console.log('Adding missing columns to campaigns table...');
      
      const missingColumns = [
        'website TEXT',
        'industry TEXT',
        'description TEXT',
        'target_audience TEXT',
        'brand_tone TEXT DEFAULT \'professional\'',
        'goals TEXT[] DEFAULT \'{}\'',,
        'platforms TEXT[] DEFAULT \'{}\'',,
        'objective TEXT',
        'start_date DATE',
        'end_date DATE',
        'budget DECIMAL(10, 2)',
        'status TEXT DEFAULT \'active\'',
        'brand_voice TEXT',
        'keywords TEXT[]',
        'hashtags TEXT[]',
        'total_posts INTEGER DEFAULT 0',
        'published_posts INTEGER DEFAULT 0',
        'scheduled_posts INTEGER DEFAULT 0',
        'is_active BOOLEAN DEFAULT true'
      ];
      
      for (const column of missingColumns) {
        const columnName = column.split(' ')[0];
        
        // Check if column already exists
        const checkColumn = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'campaigns' 
          AND column_name = $1;
        `, [columnName]);
        
        if (checkColumn.rows.length === 0) {
          await client.query(`ALTER TABLE campaigns ADD COLUMN ${column};`);
          console.log(`Added column: ${columnName}`);
        } else {
          console.log(`Column ${columnName} already exists, skipping`);
        }
      }
      
      console.log('Campaigns table migration completed!');
      return;
    }

    // Check if companies table exists
    const checkCompaniesTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'companies';
    `);

    if (checkCompaniesTable.rows.length === 0) {
      console.log('No companies table found. Creating campaigns table from scratch...');
      
      // Create campaigns table with all fields
      await client.query(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          website TEXT,
          industry TEXT,
          description TEXT,
          target_audience TEXT,
          brand_tone TEXT DEFAULT 'professional',
          goals TEXT[] DEFAULT '{}',
          platforms TEXT[] DEFAULT '{}',
          objective TEXT,
          start_date DATE,
          end_date DATE,
          budget DECIMAL(10, 2),
          status TEXT DEFAULT 'active',
          brand_voice TEXT,
          keywords TEXT[],
          hashtags TEXT[],
          total_posts INTEGER DEFAULT 0,
          published_posts INTEGER DEFAULT 0,
          scheduled_posts INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          user_id UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('Created campaigns table from scratch');
      return;
    }

    console.log('Companies table found. Starting migration...');

    // Start transaction
    await client.query('BEGIN');

    try {
      // Step 1: Add new campaign-specific columns to companies table
      console.log('Adding new campaign-specific columns to companies table...');
      
      const newColumns = [
        'objective TEXT',
        'start_date DATE',
        'end_date DATE',
        'budget DECIMAL(10, 2)',
        'status TEXT DEFAULT \'active\'',
        'brand_voice TEXT',
        'keywords TEXT[]',
        'hashtags TEXT[]',
        'total_posts INTEGER DEFAULT 0',
        'published_posts INTEGER DEFAULT 0',
        'scheduled_posts INTEGER DEFAULT 0',
        'is_active BOOLEAN DEFAULT true'
      ];

      for (const column of newColumns) {
        const columnName = column.split(' ')[0];
        
        // Check if column already exists
        const checkColumn = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'companies' 
          AND column_name = $1;
        `, [columnName]);
        
        if (checkColumn.rows.length === 0) {
          await client.query(`ALTER TABLE companies ADD COLUMN ${column};`);
          console.log(`Added column: ${columnName}`);
        } else {
          console.log(`Column ${columnName} already exists, skipping`);
        }
      }

      // Step 2: Rename companies table to campaigns
      console.log('Renaming companies table to campaigns...');
      await client.query('ALTER TABLE companies RENAME TO campaigns;');

      // Step 3: Update posts table to reference campaigns instead of companies
      console.log('Updating posts table references...');
      
      // Check if company_id column exists in posts
      const checkCompanyIdColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'company_id';
      `);
      
      if (checkCompanyIdColumn.rows.length > 0) {
        // Rename company_id to campaign_id in posts table
        await client.query('ALTER TABLE posts RENAME COLUMN company_id TO campaign_id;');
        console.log('Renamed company_id to campaign_id in posts table');
      }

      // Step 4: Update scheduled_posts table if it has company_id
      const checkScheduledPostsCompanyId = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'scheduled_posts' 
        AND column_name = 'company_id';
      `);
      
      if (checkScheduledPostsCompanyId.rows.length > 0) {
        await client.query('ALTER TABLE scheduled_posts DROP COLUMN company_id;');
        console.log('Removed company_id from scheduled_posts table');
      }

      // Commit transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully!');

      // Verify the migration
      const verifyTable = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        ORDER BY ordinal_position;
      `);
      
      console.log('Campaigns table columns:');
      verifyTable.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type}`);
      });

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateCompaniesToCampaigns()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

export { migrateCompaniesToCampaigns };

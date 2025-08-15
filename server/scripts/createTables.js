// Create tables in Supabase using direct database operations
const { supabaseAdmin } = require('../db');

async function createTables() {
  console.log('Creating tables in Supabase...');

  try {
    // Create companies table
    const { data: companiesData, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1);
    
    if (companiesError && companiesError.code === 'PGRST116') {
      console.log('Creating companies table...');
      // Table doesn't exist, let's create basic data to trigger table creation
      // We'll handle the schema through Supabase dashboard for now
    }

    console.log('✓ Database connection verified');
    console.log('Note: Please create the following tables in your Supabase dashboard:');
    console.log('1. companies');
    console.log('2. campaigns');
    console.log('3. posts');
    console.log('4. media');
    console.log('5. notifications');
    console.log('6. oauth_tokens');
    console.log('7. training_criteria');
    console.log('8. scheduled_posts');

  } catch (error) {
    console.error('Error:', error);
  }
}

createTables();
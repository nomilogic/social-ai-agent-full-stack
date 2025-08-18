import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = "postgresql://postgres.fzdpldiqbcssaqczizjw:fultum-2@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function checkUsers() {
  try {
    // Check existing users
    const usersResult = await pool.query('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC');
    console.log('Existing users:');
    console.log(usersResult.rows);

    if (usersResult.rows.length === 0) {
      console.log('\nNo users found. Creating test user...');
      
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const insertResult = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        ['nomilogic@gmail.com', hashedPassword, 'Test User']
      );
      
      console.log('Test user created:', insertResult.rows[0]);
    } else {
      console.log('\nUsers exist in database.');
      
      // Check if business user exists
      const businessUser = usersResult.rows.find(user => user.email === 'nomilogic@gmail.com');
      if (!businessUser) {
        console.log('Creating business user nomilogic@gmail.com...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        const insertResult = await pool.query(
          'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
          ['nomilogic@gmail.com', hashedPassword, 'Business User']
        );
        console.log('Business user created:', insertResult.rows[0]);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();

import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = "postgresql://postgres.fzdpldiqbcssaqczizjw:fultum-2@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function resetPasswords() {
  try {
    console.log('Resetting passwords for existing users...');
    
    // Reset password for nomilogic@gmail.com to 'admin123'
    const hashedPassword1 = await bcrypt.hash('admin123', 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword1, 'nomilogic@gmail.com']
    );
    console.log('Password reset for nomilogic@gmail.com - use password: admin123');
    
    // Reset password for fultum-2@gmail.com to 'user123'
    const hashedPassword2 = await bcrypt.hash('user123', 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword2, 'fultum-2@gmail.com']
    );
    console.log('Password reset for fultum-2@gmail.com - use password: user123');
    
    console.log('\nPasswords reset successfully!');
    console.log('You can now login with:');
    console.log('Email: nomilogic@gmail.com, Password: admin123 (Business account)');
    console.log('Email: fultum-2@gmail.com, Password: user123 (Regular account)');
    
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await pool.end();
  }
}

resetPasswords();

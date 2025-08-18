import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

try {
  await client.connect();
  
  const result = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'campaigns' 
    ORDER BY ordinal_position;
  `);
  
  console.log('Actual campaigns table columns:');
  result.rows.forEach(row => {
    console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}

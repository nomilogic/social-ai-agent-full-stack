
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../shared/schema.js';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/social_ai';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function createBusinessAccount() {
  try {
    const hashedPassword = await bcrypt.hash('BusinessUser2024!', 10);
    
    const newUser = await db.insert(users).values({
      email: 'nomilogic@gmail.com',
      password: hashedPassword,
      name: 'Nomilogic Business',
      plan: 'business',
      role: 'user',
      subscription_status: 'active'
    }).returning();

    console.log('Business account created successfully:', newUser[0]);
  } catch (error) {
    console.error('Error creating business account:', error);
  } finally {
    await sql.end();
  }
}

createBusinessAccount();

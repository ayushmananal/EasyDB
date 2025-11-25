// Script to initialize the database with schema
import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || '10.68.96.2',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'querydb',
  user: process.env.DB_USER || 'alloydb',
  password: process.env.DB_PASSWORD || 'password',
});

async function initDatabase() {
  try {
    console.log('Connecting to AlloyDB...');
    const client = await pool.connect();
    console.log('Connected successfully!');

    // Read schema file
    const schemaSQL = fs.readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('Executing schema SQL...');
    await client.query(schemaSQL);
    
    console.log('Database initialized successfully!');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

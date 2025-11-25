import pool from './db.js';
import fs from 'fs';

async function createTable() {
  try {
    const sql = fs.readFileSync('./add-scheduled-queries-table.sql', 'utf8');
    await pool.query(sql);
    console.log('✓ scheduled_queries table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createTable();

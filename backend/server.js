import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const execAsync = promisify(exec);
const PROJECT_ID = 'easydb-477708';
const REGION = 'asia-south1';
const SERVICE_URL = process.env.SERVICE_URL || 'https://database-querying-backend-272310002087.asia-south1.run.app';

const app = express();
// Cloud Run sets PORT env variable, default to 8080 for local development
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Database initialization endpoint (for setup only)
app.post('/api/init-db', async (req, res) => {
  try {
    const schemaSQL = fs.readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    res.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Failed to initialize database', details: error.message });
  }
});

// Get list of available databases/tables
app.get('/api/databases', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ error: 'Failed to fetch databases' });
  }
});

// Query a specific table with filters
app.post('/api/query', async (req, res) => {
  try {
    const { table, filters, columns, limit, offset } = req.body;

    // Validate table name (prevent SQL injection)
    const validTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table);
    if (!validTableName) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // Build query
    let query = `SELECT `;
    
    // Select columns
    if (columns && columns.length > 0) {
      const safeColumns = columns.filter(col => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col));
      query += safeColumns.join(', ');
    } else {
      query += '*';
    }
    
    query += ` FROM ${table}`;

    // Add WHERE clause if filters provided
    const params = [];
    if (filters && Object.keys(filters).length > 0) {
      const whereClauses = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(filters)) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          // Cast to text to allow ILIKE on all column types
          whereClauses.push(`${key}::text ILIKE $${paramIndex}`);
          params.push(`%${value}%`);
          paramIndex++;
        }
      }
      
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' OR ')}`;
      }
    }

    // Add pagination
    query += ` LIMIT ${parseInt(limit) || 100} OFFSET ${parseInt(offset) || 0}`;

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM ${table}`;
    const countResult = await pool.query(countQuery);
    
    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

// Get table schema (columns and types)
app.get('/api/schema/:table', async (req, res) => {
  try {
    const { table } = req.params;
    
    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [table]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }
});

// Execute raw SQL query (SELECT only)
app.post('/api/execute-sql', async (req, res) => {
  try {
    const { sql, database, table } = req.body;
    
    if (!sql || !sql.trim()) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    // Security: Only allow SELECT statements
    const trimmedSql = sql.trim().toLowerCase();
    if (!trimmedSql.startsWith('select')) {
      return res.status(400).json({ 
        error: 'Only SELECT statements are allowed for security reasons' 
      });
    }
    
    // Check for dangerous keywords
    const dangerousKeywords = ['drop', 'delete', 'truncate', 'insert', 'update', 'alter', 'create'];
    const sqlLower = sql.toLowerCase();
    for (const keyword of dangerousKeywords) {
      if (sqlLower.includes(keyword)) {
        return res.status(400).json({ 
          error: `Query contains forbidden keyword: ${keyword.toUpperCase()}. Only SELECT queries are allowed.` 
        });
      }
    }
    
    console.log(`Executing SQL query: ${sql.substring(0, 100)}...`);
    
    // Execute the query
    const result = await pool.query(sql);
    
    console.log(`Query executed successfully. Returned ${result.rows.length} rows.`);
    
    res.json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount
    });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ 
      error: 'Failed to execute SQL query', 
      details: error.message 
    });
  }
});

// NOTE: The actual /api/schedule endpoint is implemented below (line ~393)
// This placeholder has been removed to avoid conflicts

// Send alert to Gmail
app.post('/api/alert', async (req, res) => {
  try {
    const { recipientEmail, databaseName, queryText, results, selectedColumns } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
      console.warn('Gmail credentials not configured');
      return res.status(200).json({ 
        success: true, 
        message: 'Alert feature not configured. Please set up Gmail OAuth credentials.' 
      });
    }
    
    // Set up OAuth2 client
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'http://localhost:8080/oauth2callback'
    );
    
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Build HTML table from results
    let htmlTable = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif;">';
    htmlTable += '<thead><tr style="background-color: #00d4aa; color: white;">';
    selectedColumns.forEach(col => {
      htmlTable += `<th>${col}</th>`;
    });
    htmlTable += '</tr></thead><tbody>';
    
    results.forEach(row => {
      htmlTable += '<tr>';
      selectedColumns.forEach(col => {
        htmlTable += `<td>${row[col] || ''}</td>`;
      });
      htmlTable += '</tr>';
    });
    htmlTable += '</tbody></table>';
    
    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #0a0e1a;">Hello,</h2>
        <p>These are the results of your query on <strong>${databaseName}</strong>:</p>
        ${queryText ? `<p style="background-color: #f5f5f5; padding: 12px; border-radius: 6px;"><strong>Query:</strong> ${queryText}</p>` : ''}
        <p><strong>Results (${results.length} rows):</strong></p>
        ${htmlTable}
        <br>
        <p style="color: #666; font-size: 12px;">This email was sent from EasyDB.</p>
      </div>
    `;
    
    // Create email message
    const subject = `Query Results: ${databaseName}`;
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${process.env.GMAIL_USER_EMAIL || 'noreply@easydb.com'}`,
      `To: ${recipientEmail}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      emailContent
    ];
    const message = messageParts.join('\n');
    
    // Encode message in base64
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    res.json({ 
      success: true, 
      message: `Alert sent successfully to ${recipientEmail}` 
    });
  } catch (error) {
    console.error('Error sending alert:', error);
    res.status(500).json({ 
      error: 'Failed to send alert',
      details: error.message
    });
  }
});

// Save search history
app.post('/api/search-history', async (req, res) => {
  try {
    const { 
      database_name, 
      query_text, 
      selected_columns, 
      row_start, 
      row_end, 
      results_count,
      session_id 
    } = req.body;

    const user_agent = req.headers['user-agent'];

    const result = await pool.query(`
      INSERT INTO search_history (
        database_name, query_text, selected_columns, 
        row_start, row_end, results_count, session_id, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, executed_at
    `, [
      database_name, 
      query_text || '', 
      selected_columns || [], 
      row_start, 
      row_end, 
      results_count,
      session_id,
      user_agent
    ]);

    res.json({ 
      success: true, 
      id: result.rows[0].id,
      executed_at: result.rows[0].executed_at
    });
  } catch (error) {
    console.error('Error saving search history:', error);
    res.status(500).json({ error: 'Failed to save search history' });
  }
});

// Get search history
app.get('/api/search-history', async (req, res) => {
  try {
    const { session_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        id, database_name, query_text, selected_columns, 
        row_start, row_end, results_count, executed_at
      FROM search_history
    `;
    
    const params = [];
    
    if (session_id) {
      query += ` WHERE session_id = $1`;
      params.push(session_id);
      query += ` ORDER BY executed_at DESC LIMIT $2 OFFSET $3`;
      params.push(parseInt(limit), parseInt(offset));
    } else {
      query += ` ORDER BY executed_at DESC LIMIT $1 OFFSET $2`;
      params.push(parseInt(limit), parseInt(offset));
    }

    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = session_id 
      ? `SELECT COUNT(*) FROM search_history WHERE session_id = $1`
      : `SELECT COUNT(*) FROM search_history`;
    const countParams = session_id ? [session_id] : [];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      history: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Delete search history entry
app.delete('/api/search-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM search_history WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting search history:', error);
    res.status(500).json({ error: 'Failed to delete search history' });
  }
});

// Create scheduled_queries table (one-time setup)
app.post('/api/create-scheduled-table', async (req, res) => {
  try {
    const schemaSQL = fs.readFileSync(join(__dirname, 'add-scheduled-queries-table.sql'), 'utf8');
    await pool.query(schemaSQL);
    res.json({ success: true, message: 'scheduled_queries table created successfully' });
  } catch (error) {
    console.error('Error creating scheduled_queries table:', error);
    res.status(500).json({ error: 'Failed to create table', details: error.message });
  }
});

// Schedule a query with Cloud Scheduler
app.post('/api/schedule', async (req, res) => {
  try {
    const { 
      databaseName, 
      tableName, 
      queryText, 
      filters, 
      selectedColumns, 
      rowLimit, 
      scheduledAt, 
      recipientEmail,
      frequency = 'once'
    } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    if (!scheduledAt) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }
    
    // Parse the scheduled time as IST
    // Frontend sends datetime-local value like "2025-11-23T13:21"
    // We need to treat this as IST, not UTC
    const scheduledDate = new Date(scheduledAt);
    
    // Convert to IST for validation (IST is UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const scheduledDateIST = new Date(scheduledDate.getTime() - istOffset);
    const nowIST = new Date();
    
    if (scheduledDateIST <= nowIST) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }
    
    // Generate unique job name
    const jobName = `scheduled-query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in database first
    // Store the IST-adjusted time in the database
    // First, ensure frequency column exists
    try {
      await pool.query(`
        ALTER TABLE scheduled_queries ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'once';
      `);
    } catch (err) {
      // Column might already exist, ignore
    }
    
    const result = await pool.query(`
      INSERT INTO scheduled_queries (
        scheduler_job_name, database_name, table_name, query_text, 
        filters, selected_columns, row_limit, recipient_email, scheduled_at, frequency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `, [
      jobName,
      databaseName,
      tableName,
      queryText || '',
      JSON.stringify(filters || {}),
      JSON.stringify(selectedColumns || []),
      rowLimit || 100,
      recipientEmail,
      scheduledDateIST.toISOString(),  // Store as proper UTC timestamp
      frequency
    ]);
    
    const queryId = result.rows[0].id;
    
    // Create Cloud Scheduler job automatically
    try {
      // Parse the scheduled time - frontend sends IST time
      // Extract time components directly from the input string to preserve IST values
      // Format: "2025-11-23T13:21" -> we want 13:21 IST
      const dateMatch = scheduledAt.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (!dateMatch) {
        throw new Error('Invalid datetime format');
      }
      const [, year, month, dayOfMonth, hours, minutes] = dateMatch;
      
      // Generate cron expression based on frequency
      // Cloud Scheduler will interpret times in Asia/Kolkata timezone
      let cronExpression;
      
      if (frequency === 'hourly') {
        // Run every hour at the specified minute
        cronExpression = `${parseInt(minutes)} * * * *`;
      } else if (frequency === 'daily') {
        // Run every day at the specified time
        cronExpression = `${parseInt(minutes)} ${parseInt(hours)} * * *`;
      } else if (frequency === 'monthly') {
        // Run every month on the same day at the specified time
        cronExpression = `${parseInt(minutes)} ${parseInt(hours)} ${parseInt(dayOfMonth)} * *`;
      } else {
        // 'once' - run only on the specific date and time
        cronExpression = `${parseInt(minutes)} ${parseInt(hours)} ${parseInt(dayOfMonth)} ${parseInt(month)} *`;
      }
      
      const targetUri = `${SERVICE_URL}/api/execute-scheduled/${jobName}`;
      
      // Check if job already exists
      let jobExists = false;
      try {
        await execAsync(`gcloud scheduler jobs describe ${jobName} --location=${REGION} --project=${PROJECT_ID} 2>/dev/null`);
        jobExists = true;
        console.log(`Cloud Scheduler job ${jobName} already exists`);
      } catch (err) {
        // Job doesn't exist, we'll create it
      }
      
      if (!jobExists) {
        const command = `gcloud scheduler jobs create http ${jobName} \
          --location=${REGION} \
          --schedule="${cronExpression}" \
          --time-zone="Asia/Kolkata" \
          --uri="${targetUri}" \
          --http-method=POST \
          --project=${PROJECT_ID} \
          --attempt-deadline=300s \
          --quiet`;
        
        console.log(`Creating Cloud Scheduler job: ${jobName}`);
        console.log(`Frequency: ${frequency}`);
        console.log(`Starts at (IST): ${year}-${month}-${dayOfMonth} ${hours}:${minutes}:00`);
        console.log(`Cron expression: ${cronExpression}`);
        
        await execAsync(command);
        console.log(`✓ Cloud Scheduler job created: ${jobName}`);
      }
      
      res.json({ 
        success: true, 
        message: 'Query scheduled successfully and Cloud Scheduler job created',
        id: queryId,
        scheduledAt,
        jobName
      });
    } catch (schedulerError) {
      console.error('Error creating Cloud Scheduler job:', schedulerError);
      // Still return success since the query is saved in DB
      res.json({ 
        success: true, 
        message: 'Query scheduled successfully (Cloud Scheduler job creation failed - will retry)',
        id: queryId,
        scheduledAt,
        jobName,
        warning: 'Cloud Scheduler job creation failed but query is saved'
      });
    }
  } catch (error) {
    console.error('Error scheduling query:', error);
    res.status(500).json({ error: 'Failed to schedule query', details: error.message });
  }
});

// Get all scheduled queries
app.get('/api/scheduled-queries', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        id, scheduler_job_name, database_name, table_name, query_text,
        filters, selected_columns, row_limit, recipient_email,
        scheduled_at, frequency, status, executed_at, error_message, created_at
      FROM scheduled_queries
      ORDER BY scheduled_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM scheduled_queries');
    
    res.json({
      queries: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching scheduled queries:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled queries' });
  }
});

// Delete/cancel a scheduled query
app.delete('/api/scheduled-queries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the scheduler job name before deleting
    const query = await pool.query(
      'SELECT scheduler_job_name FROM scheduled_queries WHERE id = $1',
      [id]
    );
    
    if (query.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled query not found' });
    }
    
    const jobName = query.rows[0].scheduler_job_name;
    
    // Delete from database
    await pool.query('DELETE FROM scheduled_queries WHERE id = $1', [id]);
    
    // Also delete Cloud Scheduler job if it exists
    try {
      await execAsync(`gcloud scheduler jobs delete ${jobName} --location=${REGION} --project=${PROJECT_ID} --quiet 2>/dev/null`);
      console.log(`Cloud Scheduler job ${jobName} deleted`);
    } catch (err) {
      console.log(`Cloud Scheduler job ${jobName} not found or already deleted`);
    }
    
    console.log(`Scheduled query ${id} deleted`);
    res.json({ success: true, message: 'Scheduled query cancelled' });
  } catch (error) {
    console.error('Error deleting scheduled query:', error);
    res.status(500).json({ error: 'Failed to delete scheduled query' });
  }
});

// Stop/pause a recurring scheduled query (keeps in DB but pauses Cloud Scheduler job)
app.post('/api/scheduled-queries/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the scheduler job details
    const query = await pool.query(
      'SELECT scheduler_job_name, frequency, status FROM scheduled_queries WHERE id = $1',
      [id]
    );
    
    if (query.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled query not found' });
    }
    
    const { scheduler_job_name: jobName, frequency, status } = query.rows[0];
    
    // Only allow stopping recurring queries
    if (!frequency || frequency === 'once') {
      return res.status(400).json({ error: 'Can only stop recurring queries. Use cancel for one-time queries.' });
    }
    
    // Update status to 'stopped' in database
    await pool.query(
      'UPDATE scheduled_queries SET status = $1, updated_at = NOW() WHERE id = $2',
      ['stopped', id]
    );
    
    // Pause Cloud Scheduler job
    try {
      await execAsync(`gcloud scheduler jobs pause ${jobName} --location=${REGION} --project=${PROJECT_ID} 2>/dev/null`);
      console.log(`Cloud Scheduler job ${jobName} paused`);
    } catch (err) {
      console.log(`Cloud Scheduler job ${jobName} not found or already paused`);
    }
    
    console.log(`Scheduled query ${id} stopped`);
    res.json({ success: true, message: 'Recurring query stopped successfully' });
  } catch (error) {
    console.error('Error stopping scheduled query:', error);
    res.status(500).json({ error: 'Failed to stop scheduled query' });
  }
});

// Resume a stopped recurring scheduled query
app.post('/api/scheduled-queries/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the scheduler job details
    const query = await pool.query(
      'SELECT scheduler_job_name, frequency, status FROM scheduled_queries WHERE id = $1',
      [id]
    );
    
    if (query.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled query not found' });
    }
    
    const { scheduler_job_name: jobName, frequency, status } = query.rows[0];
    
    // Only allow resuming stopped queries
    if (status !== 'stopped') {
      return res.status(400).json({ error: 'Can only resume stopped queries' });
    }
    
    // Update status to 'pending' in database
    await pool.query(
      'UPDATE scheduled_queries SET status = $1, updated_at = NOW() WHERE id = $2',
      ['pending', id]
    );
    
    // Resume Cloud Scheduler job
    try {
      await execAsync(`gcloud scheduler jobs resume ${jobName} --location=${REGION} --project=${PROJECT_ID} 2>/dev/null`);
      console.log(`Cloud Scheduler job ${jobName} resumed`);
    } catch (err) {
      console.log(`Cloud Scheduler job ${jobName} not found`);
    }
    
    console.log(`Scheduled query ${id} resumed`);
    res.json({ success: true, message: 'Recurring query resumed successfully' });
  } catch (error) {
    console.error('Error resuming scheduled query:', error);
    res.status(500).json({ error: 'Failed to resume scheduled query' });
  }
});

// Execute a scheduled query (called by Cloud Scheduler)
app.post('/api/execute-scheduled/:jobName', async (req, res) => {
  try {
    const { jobName } = req.params;
    
    // Get the scheduled query details
    const queryResult = await pool.query(
      'SELECT * FROM scheduled_queries WHERE scheduler_job_name = $1 AND status = $2',
      [jobName, 'pending']
    );
    
    if (queryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled query not found or already executed' });
    }
    
    const scheduledQuery = queryResult.rows[0];
    
    try {
      // Mark as executing
      await pool.query(
        'UPDATE scheduled_queries SET status = $1, updated_at = NOW() WHERE id = $2',
        ['executing', scheduledQuery.id]
      );
      
      // Execute the query - use SQL query if provided, otherwise build from filters
      let results;
      let displayColumns;
      
      if (scheduledQuery.query_text && scheduledQuery.query_text.trim().toLowerCase().startsWith('select')) {
        // Execute the raw SQL query stored in query_text
        console.log(`Executing scheduled SQL: ${scheduledQuery.query_text}`);
        results = await pool.query(scheduledQuery.query_text);
        displayColumns = results.rows.length > 0 ? Object.keys(results.rows[0]) : [];
      } else {
        // Legacy: Build query from filters (for backward compatibility)
        const table = scheduledQuery.table_name;
        const filters = scheduledQuery.filters;
        const selectedColumns = scheduledQuery.selected_columns;
        const rowLimit = scheduledQuery.row_limit;
        
        let sqlQuery = 'SELECT ';
        if (selectedColumns && selectedColumns.length > 0) {
          sqlQuery += selectedColumns.join(', ');
        } else {
          sqlQuery += '*';
        }
        sqlQuery += ` FROM ${table}`;
        
        const params = [];
        if (filters && Object.keys(filters).length > 0) {
          const whereClauses = [];
          let paramIndex = 1;
          for (const [key, value] of Object.entries(filters)) {
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
              whereClauses.push(`${key}::text ILIKE $${paramIndex}`);
              params.push(`%${value}%`);
              paramIndex++;
            }
          }
          if (whereClauses.length > 0) {
            sqlQuery += ` WHERE ${whereClauses.join(' OR ')}`;
          }
        }
        
        sqlQuery += ` LIMIT ${rowLimit}`;
        results = await pool.query(sqlQuery, params);
        displayColumns = selectedColumns && selectedColumns.length > 0 ? selectedColumns : Object.keys(results.rows[0] || {});
      }
      
      // Send email with results
      const OAuth2 = google.auth.OAuth2;
      const oauth2Client = new OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'http://localhost:8080/oauth2callback'
      );
      
      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Build HTML table
      let htmlTable = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif;">';
      htmlTable += '<thead><tr style="background-color: #00d4aa; color: white;">';
      displayColumns.forEach(col => {
        htmlTable += `<th>${col}</th>`;
      });
      htmlTable += '</tr></thead><tbody>';
      
      results.rows.forEach(row => {
        htmlTable += '<tr>';
        displayColumns.forEach(col => {
          htmlTable += `<td>${row[col] || ''}</td>`;
        });
        htmlTable += '</tr>';
      });
      htmlTable += '</tbody></table>';
      
      // Create email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #0a0e1a;">Scheduled Query Results</h2>
          <p>Your scheduled query on <strong>${scheduledQuery.database_name}</strong> has been executed.</p>
          ${scheduledQuery.query_text ? `<p style="background-color: #f5f5f5; padding: 12px; border-radius: 6px;"><strong>Query:</strong> ${scheduledQuery.query_text}</p>` : ''}
          <p><strong>Results (${results.rows.length} rows):</strong></p>
          ${htmlTable}
          <br>
          <p style="color: #666; font-size: 12px;">This email was sent from EasyDB at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.</p>
        </div>
      `;
      
      // Create and send email
      const subject = `Scheduled Query Results: ${scheduledQuery.database_name}`;
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: ${process.env.GMAIL_USER_EMAIL}`,
        `To: ${scheduledQuery.recipient_email}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        emailContent
      ];
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage }
      });
      
      // For recurring queries (hourly, daily, monthly), keep status as pending so they run again
      // For one-time queries (once), mark as completed
      const isRecurring = scheduledQuery.frequency && scheduledQuery.frequency !== 'once';
      const newStatus = isRecurring ? 'pending' : 'completed';
      
      await pool.query(
        'UPDATE scheduled_queries SET status = $1, executed_at = NOW(), updated_at = NOW() WHERE id = $2',
        [newStatus, scheduledQuery.id]
      );
      
      console.log(`Scheduled query ${scheduledQuery.id} executed successfully, email sent to ${scheduledQuery.recipient_email}`);
      
      res.json({ 
        success: true, 
        message: 'Query executed and email sent',
        results_count: results.rows.length
      });
    } catch (executionError) {
      // Mark as failed
      await pool.query(
        'UPDATE scheduled_queries SET status = $1, error_message = $2, executed_at = NOW(), updated_at = NOW() WHERE id = $3',
        ['failed', executionError.message, scheduledQuery.id]
      );
      throw executionError;
    }
  } catch (error) {
    console.error('Error executing scheduled query:', error);
    res.status(500).json({ error: 'Failed to execute scheduled query', details: error.message });
  }
});

// Create dataset tables (for migration)
app.post('/api/create-dataset-tables', async (req, res) => {
  try {
    const schemaSQL = fs.readFileSync(join(__dirname, 'create-dataset-tables.sql'), 'utf8');
    await pool.query(schemaSQL);
    res.json({ success: true, message: 'Dataset tables created successfully' });
  } catch (error) {
    console.error('Error creating dataset tables:', error);
    res.status(500).json({ error: 'Failed to create dataset tables', details: error.message });
  }
});

// Import dataset CSV files (one-time migration endpoint)
app.post('/api/import-datasets', async (req, res) => {
  try {
    console.log('Starting dataset import...');
    const results = { tesla: 0, housing: 0, israelPalestine: 0, errors: [] };
    
    // Import Tesla data
    try {
      const teslaCSV = fs.readFileSync(join(__dirname, 'public/data/tesla.csv'), 'utf8');
      const teslaLines = teslaCSV.split('\n').filter(line => line.trim());
      const teslaHeaders = teslaLines[0].split(',');
      
      for (let i = 1; i < teslaLines.length; i++) {
        const values = teslaLines[i].split(',');
        if (values.length < 12) continue;
        
        await pool.query(`
          INSERT INTO tesla_deliveries (
            year, month, region, model, estimated_deliveries, 
            production_units, avg_price_usd, battery_capacity_kwh, 
            range_km, co2_saved_tons, source_type, charging_stations
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          parseInt(values[0]) || null,
          parseInt(values[1]) || null,
          values[2],
          values[3],
          parseInt(values[4]) || null,
          parseInt(values[5]) || null,
          parseFloat(values[6]) || null,
          parseInt(values[7]) || null,
          parseInt(values[8]) || null,
          parseFloat(values[9]) || null,
          values[10],
          parseInt(values[11]) || null
        ]);
        results.tesla++;
      }
      console.log(`Tesla: ${results.tesla} rows imported`);
    } catch (error) {
      results.errors.push(`Tesla import error: ${error.message}`);
    }
    
    // Import Housing data
    try {
      const housingCSV = fs.readFileSync(join(__dirname, 'public/data/housing.csv'), 'utf8');
      const housingLines = housingCSV.split('\n').filter(line => line.trim());
      
      for (let i = 1; i < housingLines.length; i++) {
        const values = housingLines[i].split(',');
        if (values.length < 13) continue;
        
        await pool.query(`
          INSERT INTO housing_prices (
            price, area, bedrooms, bathrooms, stories, 
            mainroad, guestroom, basement, hotwaterheating, 
            airconditioning, parking, prefarea, furnishingstatus
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          parseInt(values[0]) || null,
          parseInt(values[1]) || null,
          parseInt(values[2]) || null,
          parseInt(values[3]) || null,
          parseInt(values[4]) || null,
          values[5],
          values[6],
          values[7],
          values[8],
          values[9],
          parseInt(values[10]) || null,
          values[11],
          values[12]
        ]);
        results.housing++;
      }
      console.log(`Housing: ${results.housing} rows imported`);
    } catch (error) {
      results.errors.push(`Housing import error: ${error.message}`);
    }
    
    // Import Israel-Palestine data
    try {
      const israelCSV = fs.readFileSync(join(__dirname, 'public/data/israel-palestine.csv'), 'utf8');
      const israelLines = israelCSV.split('\n').filter(line => line.trim());
      
      for (let i = 1; i < israelLines.length; i++) {
        const values = israelLines[i].split(',');
        if (values.length < 24) continue;
        
        await pool.query(`
          INSERT INTO israel_palestine_trade (
            country_name_israel, country_iso3, year, indicator_name, 
            indicator_code, value_finally_israel, id_palestine_numbers, 
            country, iso3, latitude, longitude, centroid, role, 
            displacement_type, qualifier, figure, displacement_date, 
            displacement_start_date, displacement_end_date, year_displacement,
            event_id, event_name, event_start_date, event_end_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        `, [
          values[0], values[1], parseInt(values[2]) || null, values[3],
          values[4], values[5], parseInt(values[6]) || null, values[7],
          values[8], values[9], values[10], values[11], values[12],
          values[13], values[14], values[15], values[16], values[17],
          values[18], parseInt(values[19]) || null, parseInt(values[20]) || null,
          values[21], values[22], values[23]
        ]);
        results.israelPalestine++;
      }
      console.log(`Israel-Palestine: ${results.israelPalestine} rows imported`);
    } catch (error) {
      results.errors.push(`Israel-Palestine import error: ${error.message}`);
    }
    
    res.json({
      success: results.errors.length === 0,
      message: 'Dataset import completed',
      results: results
    });
  } catch (error) {
    console.error('Error importing datasets:', error);
    res.status(500).json({ error: 'Failed to import datasets', details: error.message });
  }
});

// Fix recurring queries that were marked as completed (one-time fix endpoint)
app.post('/api/fix-recurring-queries', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE scheduled_queries 
      SET status = 'pending', updated_at = NOW() 
      WHERE frequency IN ('hourly', 'daily', 'monthly') 
        AND status IN ('completed', 'failed')
      RETURNING id, database_name, frequency;
    `);
    
    console.log(`Fixed ${result.rows.length} recurring queries`);
    res.json({ 
      success: true, 
      message: `Fixed ${result.rows.length} recurring queries`,
      fixed: result.rows
    });
  } catch (error) {
    console.error('Error fixing recurring queries:', error);
    res.status(500).json({ error: 'Failed to fix recurring queries', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

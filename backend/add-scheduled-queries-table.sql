-- Create scheduled_queries table for storing scheduled query jobs
CREATE TABLE IF NOT EXISTS scheduled_queries (
  id SERIAL PRIMARY KEY,
  scheduler_job_name VARCHAR(255) UNIQUE NOT NULL,
  database_name VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  query_text TEXT,
  filters JSONB,
  selected_columns JSONB,
  row_limit INTEGER DEFAULT 100,
  recipient_email VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  executed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduled_queries_status ON scheduled_queries(status);

-- Create index on scheduled_at for filtering
CREATE INDEX IF NOT EXISTS idx_scheduled_queries_scheduled_at ON scheduled_queries(scheduled_at);

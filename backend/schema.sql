-- Database schema for Database Querying Application
-- This file contains the SQL to initialize your AlloyDB database

-- Create search_history table to store user query history
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    database_name VARCHAR(255) NOT NULL,
    query_text TEXT,
    selected_columns TEXT[],
    row_start INTEGER,
    row_end INTEGER,
    results_count INTEGER,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX idx_search_history_executed_at ON search_history(executed_at DESC);
CREATE INDEX idx_search_history_session ON search_history(session_id);

-- Add comments for documentation
COMMENT ON TABLE search_history IS 'Stores history of all database queries executed by users';
COMMENT ON COLUMN search_history.database_name IS 'Name of the database/table that was queried';
COMMENT ON COLUMN search_history.query_text IS 'The filter text used in the search';
COMMENT ON COLUMN search_history.selected_columns IS 'Array of column names that were selected';
COMMENT ON COLUMN search_history.results_count IS 'Number of results returned by the query';
COMMENT ON COLUMN search_history.session_id IS 'Browser session identifier for tracking user sessions';

-- Sample data tables (optional - for testing)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email, status) VALUES
    ('John Doe', 'john@example.com', 'active'),
    ('Jane Smith', 'jane@example.com', 'inactive'),
    ('Bob Johnson', 'bob@example.com', 'active'),
    ('Alice Williams', 'alice@example.com', 'active'),
    ('Charlie Brown', 'charlie@example.com', 'pending')
ON CONFLICT DO NOTHING;

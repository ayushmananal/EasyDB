# Database Querying Backend

REST API backend for the Database Querying application. Connects to AlloyDB/PostgreSQL and provides endpoints for querying databases.

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```
DB_USER=alloydb
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=querydb
PORT=3001
NODE_ENV=development
```

## Installation

```bash
npm install
```

## Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status

### Get Available Tables
- **GET** `/api/databases`
- Returns list of all tables in the database

### Query Table
- **POST** `/api/query`
- Body:
  ```json
  {
    "table": "table_name",
    "filters": { "column": "value" },
    "columns": ["col1", "col2"],
    "limit": 100,
    "offset": 0
  }
  ```
- Returns paginated query results

### Get Table Schema
- **GET** `/api/schema/:table`
- Returns column information for the specified table

### Schedule Query
- **POST** `/api/schedule`
- Body:
  ```json
  {
    "query": "SELECT * FROM table",
    "scheduledTime": "2024-01-01T10:00:00",
    "email": "user@example.com"
  }
  ```
- Schedules a query to run at a specific time (placeholder)

### Send Alert
- **POST** `/api/alert`
- Body:
  ```json
  {
    "query": "SELECT * FROM table",
    "results": [],
    "email": "user@example.com"
  }
  ```
- Sends query results via Gmail (placeholder)

## Database Setup

Before running the backend, ensure you have:

1. AlloyDB or PostgreSQL running
2. Database created: `querydb`
3. User created with credentials:
   - Username: `alloydb`
   - Password: `password`

### Sample SQL to Create Test Tables

```sql
-- Create a sample table for testing
CREATE TABLE users (
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
  ('Bob Johnson', 'bob@example.com', 'active');
```

## Dependencies

- **express**: Web framework
- **pg**: PostgreSQL client
- **cors**: Enable CORS
- **dotenv**: Environment variable management

## Security Notes

- SQL injection protection is implemented via parameterized queries
- Table and column names are validated with regex
- Always use environment variables for credentials
- Never commit `.env` file to version control

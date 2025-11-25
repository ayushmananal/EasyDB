# EasyDB - Database Query & Email Automation Platform

**EasyDB** is a full-stack web application for executing SQL queries, managing multiple databases, and automating email alerts with scheduled/recurring queries.

🔗 **Live App:** [https://easydb-477708.web.app](https://easydb-477708.web.app)

## Features

- **SQL Query Editor** - Execute SELECT queries with real-time results  
- **Multiple Databases** - Switch between different database connections  
- **Email Alerts** - Send query results via Gmail instantly  
- **Scheduled Queries** - One-time or recurring (hourly/daily/monthly) email delivery  
- **Search History** - View and manage all past queries  
- **CSV Export** - Download query results as CSV files  
- **Stop/Resume** - Control recurring scheduled queries  
- **IST Timezone** - All timestamps displayed in Indian Standard Time  

## Tech Stack

### Frontend
- **React 18** + **Vite 5** - Modern component-based UI
- **Firebase Hosting** - Static site deployment
- **Custom CSS** - Dark theme with color palette: `#151B54` (background), `#82CAFF` (foreground)

### Backend
- **Node.js** + **Express** - REST API server
- **Google Cloud Run** - Serverless deployment
- **PostgreSQL** (AlloyDB) - Production database
- **Google Cloud Scheduler** - Cron jobs for recurring queries
- **Gmail API** - OAuth2-based email delivery

## Project Structure

```
├── src/                      # Frontend React code
│   ├── App.jsx              # Main application component
│   ├── components/          # Modular UI components
│   │   ├── TabNavigation.jsx
│   │   ├── DashboardView.jsx
│   │   ├── SearchHistoryView.jsx
│   │   ├── ScheduledQueriesView.jsx
│   │   └── AboutView.jsx
│   ├── api.js               # Backend API client
│   └── styles.css           # Global styles
├── backend/                 # Node.js backend
│   ├── server.js            # Express server with all endpoints
│   ├── get-gmail-token.js   # OAuth token generation script
├── index.html               # Entry HTML file
├── vite.config.js           # Vite configuration
└── firebase.json            # Firebase Hosting config
```

## Setup & Development

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud CLI (`gcloud`)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Setup

```bash
cd backend
npm install

# Create .env file with:
# - Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
# - Gmail OAuth credentials (see backend/GMAIL-SETUP.md)

# Run locally
node server.js
```

## Deployment

### Frontend (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

### Backend (Cloud Run)

```bash
cd backend
gcloud run deploy database-querying-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "DB_HOST=<host>,DB_USER=<user>,DB_PASSWORD=<password>,..."
```

## Gmail API Setup

See [backend/GMAIL-SETUP.md](backend/GMAIL-SETUP.md) for detailed instructions on:
1. Enabling Gmail API
2. Configuring OAuth consent screen
3. Creating OAuth 2.0 credentials
4. Generating refresh token
5. Setting Cloud Run environment variables

## API Endpoints

- `GET /api/databases` - List available databases
- `POST /api/execute-sql` - Execute SELECT query
- `GET /api/schema/:table` - Get table columns
- `POST /api/alert` - Send email with query results
- `POST /api/schedule` - Schedule query for email delivery
- `GET /api/scheduled-queries` - List scheduled queries
- `DELETE /api/scheduled-queries/:id` - Cancel scheduled query
- `POST /api/scheduled-queries/:id/stop` - Stop recurring query
- `POST /api/scheduled-queries/:id/resume` - Resume stopped query
- `GET /api/search-history` - Get query history
- `DELETE /api/search-history/:id` - Delete history entry

## Architecture

### Query Execution Flow
1. User enters SQL query in Dashboard
2. Frontend sends query to `POST /api/execute-sql`
3. Backend validates query (SELECT only, no dangerous keywords)
4. Query executes on AlloyDB/PostgreSQL
5. Results returned to frontend and saved to `search_history` table

### Email Alert Flow
1. User clicks "Send alert to Gmail" with email address
2. Frontend sends query results to `POST /api/alert`
3. Backend uses Gmail API with OAuth2 to send HTML email
4. Email contains formatted table with query results

### Scheduled Query Flow
1. User schedules query with email, datetime, and frequency
2. Frontend sends to `POST /api/schedule`
3. Backend:
   - Saves to `scheduled_queries` table
   - Creates Cloud Scheduler job with cron expression
   - Sets job to call `POST /api/execute-scheduled/:jobName`
4. Cloud Scheduler triggers job at scheduled time
5. Backend executes query and sends email
6. For recurring queries, status stays 'pending' for next run

## Database Schema

### `search_history`
- `id`, `database_name`, `query_text`, `selected_columns`, `row_start`, `row_end`, `results_count`, `created_at`, `session_id`, `user_agent`

### `scheduled_queries`
- `id`, `database_name`, `table_name`, `query_text`, `filters`, `selected_columns`, `row_limit`, `recipient_email`, `scheduled_at`, `frequency`, `status`, `scheduler_job_name`, `executed_at`, `error_message`, `created_at`, `updated_at`

## Environment Variables

### Backend (Cloud Run)
```bash
DB_HOST=<alloydb-ip>
DB_USER=postgres
DB_PASSWORD=<password>
DB_NAME=postgres
DB_PORT=5432
NODE_ENV=production
GMAIL_CLIENT_ID=<client-id>.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-<secret>
GMAIL_REFRESH_TOKEN=1//<token>
GMAIL_USER_EMAIL=<your-email>@gmail.com
```

## Credits

**Created by:** Ayushman Anal  
**Version:** 1.0.0  
**Last Updated:** November 2025

## License

MIT License - feel free to use this project for your own purposes.

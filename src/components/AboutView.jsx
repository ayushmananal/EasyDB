import React from 'react';

/**
 * About View - Project information and credits
 */
export default function AboutView() {
  return (
    <>
      <h1 className="page-heading">About EasyDB</h1>
      <section className="card full">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>What is EasyDB?</h2>
          <p style={{ lineHeight: 1.6, marginBottom: 24, color: 'var(--fg)' }}>
            EasyDB is a powerful database querying and management tool designed to simplify data exploration and analysis. 
            It provides an intuitive interface for executing SQL queries, scheduling automated reports, and managing your database operations efficiently.
          </p>

          <h3 style={{ color: 'var(--accent)', marginTop: 32 }}>Key Features</h3>
          <ul style={{ lineHeight: 1.8, color: 'var(--fg)', marginBottom: 24 }}>
            <li><strong>SQL Query Editor:</strong> Write and execute custom SQL queries with real-time results</li>
            <li><strong>Multiple Databases:</strong> Access and query multiple database tables including Tesla delivery data, housing prices, and trade statistics</li>
            <li><strong>Email Alerts:</strong> Send instant query results via email to any recipient</li>
            <li><strong>Scheduled Queries:</strong> Automate query execution with flexible scheduling options (one-time, hourly, daily, or monthly)</li>
            <li><strong>Search History:</strong> Track and revisit your past queries with detailed execution history</li>
            <li><strong>CSV Export:</strong> Download query results as CSV files for further analysis</li>
            <li><strong>IST Timezone:</strong> All times displayed and scheduled in Indian Standard Time (IST)</li>
          </ul>

          <h3 style={{ color: 'var(--accent)', marginTop: 32 }}>Technology Stack</h3>
          <ul style={{ lineHeight: 1.8, color: 'var(--fg)', marginBottom: 24 }}>
            <li><strong>Frontend:</strong> React 18 with Vite, deployed on Firebase Hosting</li>
            <li><strong>Backend:</strong> Node.js/Express on Google Cloud Run</li>
            <li><strong>Database:</strong> PostgreSQL on Google Cloud AlloyDB</li>
            <li><strong>Scheduler:</strong> Google Cloud Scheduler for automated query execution</li>
            <li><strong>Email:</strong> Gmail API integration for sending alerts and reports</li>
          </ul>

          <h3 style={{ color: 'var(--accent)', marginTop: 32 }}>Project Information</h3>
          <div style={{ 
            padding: 20, 
            background: 'var(--panel)', 
            border: '1px solid var(--panel-border)', 
            borderRadius: 8,
            marginTop: 16
          }}>
            <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--fg)' }}>
              <strong style={{ color: 'var(--accent)' }}>Created by:</strong> Ayushman Anal
            </p>
            <p style={{ margin: '12px 0 0 0', lineHeight: 1.6, color: 'var(--fg)' }}>
              <strong style={{ color: 'var(--accent)' }}>Version:</strong> 1.0.0
            </p>
            <p style={{ margin: '12px 0 0 0', lineHeight: 1.6, color: 'var(--fg)' }}>
              <strong style={{ color: 'var(--accent)' }}>Last Updated:</strong> November 2025
            </p>
          </div>

          <div style={{ 
            marginTop: 32, 
            padding: 16, 
            background: 'var(--bg-subtle)', 
            borderRadius: 8,
            borderLeft: '4px solid var(--accent)'
          }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-muted)', fontStyle: 'italic' }}>
              EasyDB is designed to make database operations accessible and efficient for everyone, from data analysts to developers.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

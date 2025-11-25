import React from 'react';

// Helper function to format dates in IST
function formatDateIST(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Scheduled Queries View - Display and manage scheduled query executions
 */
export default function ScheduledQueriesView({
  scheduledLoading,
  scheduledQueries,
  filteredScheduledQueries,
  scheduledFilter,
  onFilterChange,
  onCancelQuery,
  onStopQuery,
  onResumeQuery
}) {
  return (
    <>
      <h1 className="page-heading">Scheduled Queries</h1>
      <section className="card full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Your Scheduled Queries</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['upcoming', 'completed', 'all'].map(filter => (
              <button 
                key={filter}
                className={scheduledFilter === filter ? 'primary' : 'ghost'} 
                onClick={() => onFilterChange(filter)}
                style={{ padding: '6px 12px', fontSize: '14px' }}
              >
                {filter === 'upcoming' ? 'Upcoming' :
                 filter === 'completed' ? 'Completed' : 'All Queries'}
              </button>
            ))}
          </div>
        </div>
        
        {scheduledLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg-muted)' }}>
            Loading scheduled queries...
          </div>
        ) : filteredScheduledQueries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg-muted)' }}>
            {scheduledQueries.length === 0 
              ? 'No scheduled queries yet. Schedule a query from the Dashboard to see it here.'
              : `No ${scheduledFilter === 'upcoming' ? 'upcoming' : scheduledFilter === 'completed' ? 'completed' : ''} queries found.`}
          </div>
        ) : (
          <div className="history-list">
            {filteredScheduledQueries.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-header">
                  <div>
                    <span className="history-db">{item.database_name}</span>
                    <span className="history-time">
                      Scheduled: {formatDateIST(item.scheduled_at)} IST
                    </span>
                    <span className={`status-badge ${item.status}`} style={{ marginLeft: 12 }}>
                      {item.status}
                    </span>
                  </div>
                  <div className="history-actions">
                    {/* Show Stop button for recurring queries that are pending or executing */}
                    {item.frequency && item.frequency !== 'once' && 
                     (item.status === 'pending' || item.status === 'executing') && (
                      <button 
                        className="ghost"
                        onClick={() => onStopQuery(item.id)}
                        style={{ marginRight: '8px' }}
                      >
                        Stop
                      </button>
                    )}
                    
                    {/* Show Resume button for recurring queries that are stopped */}
                    {item.frequency && item.frequency !== 'once' && 
                     item.status === 'stopped' && (
                      <button 
                        className="primary"
                        onClick={() => onResumeQuery(item.id)}
                        style={{ marginRight: '8px' }}
                      >
                        Resume
                      </button>
                    )}
                    
                    <button 
                      className="ghost warn"
                      onClick={() => onCancelQuery(item.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="history-details">
                  <div><strong>Email:</strong> {item.recipient_email}</div>
                  {item.frequency && (
                    <div>
                      <strong>Frequency:</strong>{' '}
                      {item.frequency === 'once' ? 'One-time' :
                       item.frequency === 'hourly' ? 'Hourly' :
                       item.frequency === 'daily' ? 'Daily' :
                       item.frequency === 'monthly' ? 'Monthly' : item.frequency}
                    </div>
                  )}
                  {item.query_text && (
                    <div><strong>Query:</strong> {item.query_text}</div>
                  )}
                  <div><strong>Row limit:</strong> {item.row_limit}</div>
                  {item.selected_columns && item.selected_columns.length > 0 && (
                    <div><strong>Columns:</strong> {item.selected_columns.join(', ')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

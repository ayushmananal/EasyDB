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
 * Search History View - Display and manage past query executions
 */
export default function SearchHistoryView({
  historyLoading,
  searchHistory,
  filteredSearchHistory,
  historyFilter,
  onFilterChange,
  onLoadSearch,
  onDeleteHistory
}) {
  return (
    <>
      <h1 className="page-heading">Search History</h1>
      <section className="card full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Your Recent Searches</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['last24h', 'last7d', 'last30d', 'all'].map(filter => (
              <button 
                key={filter}
                className={historyFilter === filter ? 'primary' : 'ghost'} 
                onClick={() => onFilterChange(filter)}
                style={{ padding: '6px 12px', fontSize: '14px' }}
              >
                {filter === 'last24h' ? 'Last 24 Hours' : 
                 filter === 'last7d' ? 'Last 7 Days' :
                 filter === 'last30d' ? 'Last 1 Month' : 'All History'}
              </button>
            ))}
          </div>
        </div>
        
        {historyLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg-muted)' }}>
            Loading history...
          </div>
        ) : filteredSearchHistory.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg-muted)' }}>
            {searchHistory.length === 0 
              ? 'No search history yet. Run a query to start tracking your searches.'
              : 'No searches found in the selected time period.'}
          </div>
        ) : (
          <div className="history-list">
            {filteredSearchHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-header">
                  <div>
                    <span className="history-db">{item.database_name}</span>
                    <span className="history-time">
                      {formatDateIST(item.executed_at)} IST
                    </span>
                  </div>
                  <div className="history-actions">
                    <button 
                      className="ghost"
                      onClick={() => onLoadSearch(item)}
                    >
                      Load
                    </button>
                    <button 
                      className="ghost warn"
                      onClick={() => onDeleteHistory(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="history-details">
                  {item.query_text && (
                    <div><strong>Query:</strong> {item.query_text}</div>
                  )}
                  <div>
                    <strong>Rows:</strong> {item.row_start} - {item.row_end} | 
                    <strong> Results:</strong> {item.results_count}
                  </div>
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

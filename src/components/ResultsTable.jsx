import React from 'react';

/**
 * Results table component - displays query results
 */
export default function ResultsTable({ 
  visible, 
  selectedCols, 
  selectedDB, 
  loading, 
  error, 
  dataLength 
}) {
  if (!visible) return null;

  return (
    <section className="card full" style={{ marginTop: 24 }}>
      <h3 className="section-title">
        Results in {selectedDB} ({visible.length} row{visible.length !== 1 ? 's' : ''})
      </h3>
      
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--fg-muted)' }}>
          Loading data...
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#f59e0b' }}>
          Error: {error}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {selectedCols.map(c => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.length > 0 ? (
                  visible.map((row, idx) => (
                    <tr key={idx}>
                      {selectedCols.map(c => <td key={c}>{String(row[c] || '')}</td>)}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={selectedCols.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--fg-muted)' }}>
                      No results found. Try adjusting your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="footer">
            Total rows in database: {dataLength} | Filtered results: {visible.length}
          </div>
        </>
      )}
    </section>
  );
}

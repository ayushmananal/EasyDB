import React from 'react';

/**
 * Column display component - shows available columns in the table
 */
export default function ColumnDisplay({ columns, tableName }) {
  return (
    <section className="card wide">
      <h3 className="section-title">Columns Present in the Table: {tableName}</h3>
      <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', marginTop: '12px' }}>
        {columns.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {columns.map(col => (
              <span 
                key={col} 
                style={{ 
                  padding: '6px 12px', 
                  background: 'var(--panel)', 
                  border: '1px solid var(--panel-border)', 
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  color: 'var(--accent)'
                }}
              >
                {col}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--fg-muted)', fontStyle: 'italic' }}>
            No columns available. Run a query to see columns.
          </div>
        )}
      </div>
    </section>
  );
}

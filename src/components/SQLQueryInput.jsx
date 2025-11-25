import React from 'react';

/**
 * SQL Query input component - textarea for entering SQL queries
 */
export default function SQLQueryInput({ sqlQuery, onChange, tableName, disabled }) {
  return (
    <section className="card full">
      <h3 className="section-title">Enter SQL Query</h3>
      <label htmlFor="sqlQuery">Write your SQL query (SELECT statements only)</label>
      <textarea 
        id="sqlQuery"
        value={sqlQuery}
        onChange={onChange}
        placeholder={`Example:\nSELECT * FROM ${tableName} WHERE year > 2020 LIMIT 100;\n\nSELECT column1, column2 FROM ${tableName} WHERE column1 = 'value';`}
        disabled={disabled}
        style={{ 
          minHeight: '120px', 
          fontFamily: 'monospace', 
          fontSize: '14px',
          resize: 'vertical'
        }}
      />
      <div style={{ marginTop: 12, fontSize: '13px', color: 'var(--fg-muted)' }}>
        <strong>Current table:</strong> {tableName}
      </div>
    </section>
  );
}

import React from 'react';

/**
 * Database selector component - displays current database and browse button
 */
export default function DatabaseSelector({ selectedDB, onBrowseClick }) {
  return (
    <section className="card">
      <h3 className="section-title">Select Database</h3>
      <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: '12px' }}>
        <strong style={{ color: 'var(--accent)' }}>Current Database:</strong>
        <div style={{ marginTop: '8px', fontSize: '16px', color: 'var(--fg)' }}>
          {selectedDB}
        </div>
      </div>
      <div className="controls">
        <button className="primary" onClick={onBrowseClick}>
          Browse Databases
        </button>
      </div>
    </section>
  );
}

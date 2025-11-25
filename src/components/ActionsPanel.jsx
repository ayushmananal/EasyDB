import React from 'react';

/**
 * Actions panel component - contains Run Query and Schedule Query sections
 */
export default function ActionsPanel({
  onRunQuery,
  onExportCSV,
  onSendAlert,
  onScheduleQuery,
  alertEmail,
  onAlertEmailChange,
  scheduleAt,
  onScheduleAtChange
}) {
  return (
    <section className="card full">
      <h3 className="section-title">Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
        
        {/* Run Query Section */}
        <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--fg)' }}>Run Query</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="primary" onClick={onRunQuery} style={{ width: '100%' }}>
              Run Query
            </button>
            <button onClick={onExportCSV} style={{ width: '100%' }}>
              Export Result to CSV
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="email" 
                placeholder="Email for instant alert..."
                value={alertEmail} 
                onChange={onAlertEmailChange}
                style={{ flex: 1, padding: '8px' }}
              />
              <button onClick={onSendAlert} style={{ whiteSpace: 'nowrap' }}>
                Send Alert
              </button>
            </div>
          </div>
        </div>
        
        {/* Schedule Query Section */}
        <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-subtle)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--fg)' }}>Schedule Query</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="datetime-local" 
              value={scheduleAt} 
              onChange={onScheduleAtChange} 
              style={{ width: '100%', padding: '8px' }} 
            />
            <button 
              onClick={onScheduleQuery} 
              style={{ width: '100%', borderColor: 'var(--accent)', background: 'rgba(0, 212, 170, 0.15)' }}
            >
              Schedule Query
            </button>
          </div>
        </div>
        
      </div>
    </section>
  );
}

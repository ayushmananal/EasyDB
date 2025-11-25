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
 * Schedule email modal - asks for recipient email and frequency when scheduling a query
 */
export default function ScheduleEmailModal({
  show, 
  onClose, 
  onConfirm, 
  email, 
  onEmailChange,
  frequency,
  onFrequencyChange,
  scheduledAt 
}) {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Schedule Query</h2>
        <p style={{ marginBottom: 16, color: 'var(--fg-muted)' }}>
          Configure when and how often the query results should be sent.
        </p>
        
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="scheduleEmail" style={{ display: 'block', marginBottom: 8 }}>
            Recipient Email Address
          </label>
          <input 
            id="scheduleEmail"
            type="email" 
            placeholder="Enter email address..."
            value={email} 
            onChange={onEmailChange}
            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            autoFocus
          />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="frequency" style={{ display: 'block', marginBottom: 8 }}>
            Frequency
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={onFrequencyChange}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '14px',
              background: 'var(--bg)',
              color: 'var(--fg)',
              border: '1px solid var(--panel-border)',
              borderRadius: '4px'
            }}
          >
            <option value="once">Once (one-time schedule)</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: 'var(--panel)', 
          border: '1px solid var(--panel-border)', 
          borderRadius: 6, 
          fontSize: 14, 
          color: 'var(--fg)' 
        }}>
          <strong style={{ color: 'var(--accent)' }}>
            {frequency === 'once' ? 'Scheduled for:' : 
             frequency === 'hourly' ? 'Starts at (runs every hour):' :
             frequency === 'daily' ? 'Starts at (runs daily):' :
             frequency === 'monthly' ? 'Starts at (runs monthly):' : 'Scheduled for:'}
          </strong>{' '}
          {scheduledAt ? `${formatDateIST(scheduledAt)} IST` : 'Not set'}
        </div>
        
        <div className="controls" style={{ justifyContent: 'flex-end', gap: 12 }}>
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={onConfirm}>
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

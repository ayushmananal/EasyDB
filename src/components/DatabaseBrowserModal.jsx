import React from 'react';

/**
 * Database browser modal - shows list of available databases
 */
export default function DatabaseBrowserModal({ show, onClose, databases, onSelectDatabase }) {
  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Available Databases</h2>
        <ul>
          {databases.map(db => (
            <li key={db} style={{ margin: '8px 0' }}>
              <button 
                className="ghost" 
                onClick={() => {
                  onSelectDatabase(db);
                  onClose();
                }}
              >
                {db}
              </button>
            </li>
          ))}
        </ul>
        <div className="controls" style={{ justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

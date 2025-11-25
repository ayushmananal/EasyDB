import React from 'react';

/**
 * Tab Navigation - Top navigation bar for switching between views
 */
export default function TabNavigation({ activeTab, onTabChange, onHistoryTab, onScheduledTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', onClick: () => onTabChange('dashboard') },
    { id: 'history', label: 'Search History', onClick: () => onHistoryTab() },
    { id: 'scheduled', label: 'Scheduled Queries', onClick: () => onScheduledTab() },
    { id: 'about', label: 'About', onClick: () => onTabChange('about') }
  ];

  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={tab.onClick}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

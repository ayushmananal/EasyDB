import React, { useMemo, useState, useEffect } from 'react';
import { 
  saveSearchHistory, 
  getSearchHistory, 
  deleteSearchHistory,
  scheduleQuery as apiScheduleQuery, 
  getScheduledQueries, 
  deleteScheduledQuery,
  stopScheduledQuery,
  resumeScheduledQuery
} from './api';
import { DATABASES, TABLE_NAMES } from './constants/databases';
import { downloadCSV } from './utils/csvExport';
import { useHistoryFilter, useScheduledFilter } from './hooks/useFilters';

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

// Components
import TabNavigation from './components/TabNavigation';
import DashboardView from './components/DashboardView';
import SearchHistoryView from './components/SearchHistoryView';
import ScheduledQueriesView from './components/ScheduledQueriesView';
import AboutView from './components/AboutView';
import ScheduleEmailModal from './components/ScheduleEmailModal';
import DatabaseBrowserModal from './components/DatabaseBrowserModal';

export default function App() {
  // Database state
  const [selectedDB, setSelectedDB] = useState("Tesla's Delivery Data");
  const [data, setData] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  
  // Query state
  const [sqlQuery, setSqlQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Modal state
  const [showDBs, setShowDBs] = useState(false);
  const [showScheduleEmailModal, setShowScheduleEmailModal] = useState(false);
  
  // Actions state
  const [alertEmail, setAlertEmail] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('once');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchHistory, setSearchHistory] = useState([]);
  const [scheduledQueries, setScheduledQueries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  
  // Filter state
  const [historyFilter, setHistoryFilter] = useState('all');
  const [scheduledFilter, setScheduledFilter] = useState('all');
  
  // Get filtered data
  const filteredSearchHistory = useHistoryFilter(searchHistory, historyFilter);
  const filteredScheduledQueries = useScheduledFilter(scheduledQueries, scheduledFilter);
  
  // Available columns
  const COLUMNS = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);
  
  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, [selectedDB]);
  
  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);
      const tableName = TABLE_NAMES[selectedDB];
      
      // Load initial 100 rows
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `SELECT * FROM ${tableName} LIMIT 100`,
          database: selectedDB,
          table: tableName
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        setData(result.data || []);
        if (result.data && result.data.length > 0) {
          const cols = Object.keys(result.data[0]);
          setSelectedCols(cols.slice(0, Math.min(5, cols.length)));
        }
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }
  
  // Run query
  async function runQuery() {
    if (!sqlQuery.trim()) {
      return alert('Please enter a SQL query');
    }
    
    try {
      setLoading(true);
      const tableName = TABLE_NAMES[selectedDB];
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: sqlQuery,
          database: selectedDB,
          table: tableName
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Query failed');
      }
      
      setData(result.data || []);
      setShowResults(true);
      
      if (result.data && result.data.length > 0) {
        setSelectedCols(Object.keys(result.data[0]));
      }
      
      await saveSearchHistory({
        database_name: selectedDB,
        query_text: sqlQuery,
        selected_columns: result.data && result.data.length > 0 ? Object.keys(result.data[0]) : [],
        row_start: 1,
        row_end: result.data ? result.data.length : 0,
        results_count: result.data ? result.data.length : 0
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      alert('Query failed: ' + err.message);
    }
  }
  
  // Export CSV
  function exportCSV() {
    downloadCSV(data, selectedCols, `${selectedDB}_results.csv`);
  }
  
  // Send alert
  async function sendAlert() {
    if (!showResults || data.length === 0) {
      return alert('Please run a query first to generate results');
    }
    
    if (!alertEmail) {
      return alert('Please enter an email address');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(alertEmail)) {
      return alert('Please enter a valid email address');
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: alertEmail,
          databaseName: selectedDB,
          queryText: sqlQuery,
          results: data,
          selectedColumns: selectedCols
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        setAlertEmail('');
      } else {
        alert('Failed to send alert: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert. Please try again.');
    }
  }
  
  // Open schedule modal
  function openScheduleEmailModal() {
    if (!scheduleAt) return alert('Pick a date & time to schedule your query');
    const when = new Date(scheduleAt);
    const now = new Date();
    const diffHrs = (when - now) / 36e5;
    if (diffHrs < 0) {
      return alert('Scheduled time must be in the future');
    }
    if (diffHrs > 168) {
      return alert('Please schedule within the next 7 days');
    }
    setShowScheduleEmailModal(true);
  }
  
  // Schedule query
  async function scheduleQueryWithEmail() {
    if (!scheduleEmail) {
      return alert('Please enter an email address for receiving results');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(scheduleEmail)) {
      return alert('Please enter a valid email address');
    }
    
    try {
      await apiScheduleQuery({
        databaseName: selectedDB,
        tableName: TABLE_NAMES[selectedDB],
        queryText: sqlQuery,
        sqlQuery: sqlQuery,
        selectedColumns: selectedCols,
        rowLimit: 100,
        scheduledAt: scheduleAt,
        recipientEmail: scheduleEmail,
        frequency: scheduleFrequency
      });
      
      const frequencyText = scheduleFrequency === 'once' ? '' : 
        scheduleFrequency === 'hourly' ? ' (runs every hour)' :
        scheduleFrequency === 'daily' ? ' (runs daily)' :
        scheduleFrequency === 'monthly' ? ' (runs monthly)' : '';
      
      alert(`Query scheduled successfully for ${formatDateIST(scheduleAt)} IST${frequencyText}. Results will be sent to ${scheduleEmail}`);
      setShowScheduleEmailModal(false);
      setScheduleEmail('');
      setScheduleAt('');
      setScheduleFrequency('once');
      
      if (activeTab === 'scheduled') {
        loadScheduledQueries();
      }
    } catch (error) {
      alert('Failed to schedule query: ' + error.message);
    }
  }
  
  // Load search history
  async function loadSearchHistory() {
    setHistoryLoading(true);
    const result = await getSearchHistory(50, 0);
    setSearchHistory(result.history || []);
    setHistoryLoading(false);
  }
  
  // Load scheduled queries
  async function loadScheduledQueries() {
    setScheduledLoading(true);
    const result = await getScheduledQueries(50, 0);
    setScheduledQueries(result.queries || []);
    setScheduledLoading(false);
  }
  
  // Load history search
  function loadHistorySearch(historyItem) {
    setSelectedDB(historyItem.database_name);
    setSqlQuery(historyItem.query_text || '');
    setSelectedCols(historyItem.selected_columns || []);
    setActiveTab('dashboard');
  }
  
  // Delete history
  async function deleteHistory(id) {
    try {
      await deleteSearchHistory(id);
      setSearchHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert('Failed to delete history entry');
    }
  }
  
  // Cancel scheduled query
  async function cancelScheduledQuery(id) {
    try {
      await deleteScheduledQuery(id);
      setScheduledQueries(prev => prev.filter(item => item.id !== id));
      alert('Scheduled query cancelled successfully');
    } catch (error) {
      alert('Failed to cancel scheduled query');
    }
  }
  
  // Stop recurring scheduled query
  async function handleStopQuery(id) {
    try {
      await stopScheduledQuery(id);
      // Update the query status in local state
      setScheduledQueries(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'stopped' } : item
      ));
      alert('Recurring query stopped successfully');
    } catch (error) {
      alert('Failed to stop query: ' + error.message);
    }
  }
  
  // Resume stopped scheduled query
  async function handleResumeQuery(id) {
    try {
      await resumeScheduledQuery(id);
      // Update the query status in local state
      setScheduledQueries(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'pending' } : item
      ));
      alert('Recurring query resumed successfully');
    } catch (error) {
      alert('Failed to resume query: ' + error.message);
    }
  }

  // Handler functions for tab navigation
  const handleHistoryTab = () => {
    setActiveTab('history');
    loadSearchHistory();
  };

  const handleScheduledTab = () => {
    setActiveTab('scheduled');
    loadScheduledQueries();
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="brand"><strong>EasyDB</strong></div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHistoryTab={handleHistoryTab}
        onScheduledTab={handleScheduledTab}
      />

      {/* Dashboard View */}
      {activeTab === 'dashboard' && (
        <DashboardView
          selectedDB={selectedDB}
          onBrowseClick={() => setShowDBs(true)}
          columns={COLUMNS}
          tableName={TABLE_NAMES[selectedDB]}
          sqlQuery={sqlQuery}
          onSqlQueryChange={(e) => setSqlQuery(e.target.value)}
          loading={loading}
          onRunQuery={runQuery}
          onExportCSV={exportCSV}
          onSendAlert={sendAlert}
          onScheduleQuery={openScheduleEmailModal}
          alertEmail={alertEmail}
          onAlertEmailChange={(e) => setAlertEmail(e.target.value)}
          scheduleAt={scheduleAt}
          onScheduleAtChange={(e) => setScheduleAt(e.target.value)}
          showResults={showResults}
          data={data}
          selectedCols={selectedCols}
          error={error}
          dataLength={data.length}
        />
      )}

      {/* Search History View */}
      {activeTab === 'history' && (
        <SearchHistoryView
          historyLoading={historyLoading}
          searchHistory={searchHistory}
          filteredSearchHistory={filteredSearchHistory}
          historyFilter={historyFilter}
          onFilterChange={setHistoryFilter}
          onLoadSearch={loadHistorySearch}
          onDeleteHistory={deleteHistory}
        />
      )}

      {/* Scheduled Queries View */}
      {activeTab === 'scheduled' && (
        <ScheduledQueriesView
          scheduledLoading={scheduledLoading}
          scheduledQueries={scheduledQueries}
          filteredScheduledQueries={filteredScheduledQueries}
          scheduledFilter={scheduledFilter}
          onFilterChange={setScheduledFilter}
          onCancelQuery={cancelScheduledQuery}
          onStopQuery={handleStopQuery}
          onResumeQuery={handleResumeQuery}
        />
      )}

      {/* About View */}
      {activeTab === 'about' && <AboutView />}

      {/* Modals */}
      <DatabaseBrowserModal
        show={showDBs}
        onClose={() => setShowDBs(false)}
        databases={DATABASES}
        onSelectDatabase={setSelectedDB}
      />
      
      <ScheduleEmailModal 
        show={showScheduleEmailModal}
        onClose={() => {
          setShowScheduleEmailModal(false);
          setScheduleEmail('');
          setScheduleFrequency('once');
        }}
        onConfirm={scheduleQueryWithEmail}
        email={scheduleEmail}
        onEmailChange={(e) => setScheduleEmail(e.target.value)}
        frequency={scheduleFrequency}
        onFrequencyChange={(e) => setScheduleFrequency(e.target.value)}
        scheduledAt={scheduleAt}
      />
    </div>
  );
}

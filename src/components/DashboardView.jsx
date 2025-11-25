import React from 'react';
import DatabaseSelector from './DatabaseSelector';
import ColumnDisplay from './ColumnDisplay';
import SQLQueryInput from './SQLQueryInput';
import ActionsPanel from './ActionsPanel';
import ResultsTable from './ResultsTable';

/**
 * Dashboard View - Main query interface
 */
export default function DashboardView({
  selectedDB,
  onBrowseClick,
  columns,
  tableName,
  sqlQuery,
  onSqlQueryChange,
  loading,
  onRunQuery,
  onExportCSV,
  onSendAlert,
  onScheduleQuery,
  alertEmail,
  onAlertEmailChange,
  scheduleAt,
  onScheduleAtChange,
  showResults,
  data,
  selectedCols,
  error,
  dataLength
}) {
  return (
    <>
      <h1 className="page-heading">Dashboard</h1>
      <div className="grid">
        <DatabaseSelector 
          selectedDB={selectedDB}
          onBrowseClick={onBrowseClick}
        />
        
        <ColumnDisplay 
          columns={columns}
          tableName={tableName}
        />
        
        <SQLQueryInput 
          sqlQuery={sqlQuery}
          onChange={onSqlQueryChange}
          tableName={tableName}
          disabled={loading}
        />
        
        <ActionsPanel 
          onRunQuery={onRunQuery}
          onExportCSV={onExportCSV}
          onSendAlert={onSendAlert}
          onScheduleQuery={onScheduleQuery}
          alertEmail={alertEmail}
          onAlertEmailChange={onAlertEmailChange}
          scheduleAt={scheduleAt}
          onScheduleAtChange={onScheduleAtChange}
        />
      </div>
      
      {showResults && (
        <ResultsTable 
          visible={data}
          selectedCols={selectedCols}
          selectedDB={selectedDB}
          loading={loading}
          error={error}
          dataLength={dataLength}
        />
      )}
    </>
  );
}

/**
 * Convert data rows to CSV format
 * @param {Array} rows - Array of data objects
 * @param {Array} cols - Array of column names to include
 * @returns {string} CSV formatted string
 */
export function toCSV(rows, cols) {
  const header = cols.join(',');
  const body = rows
    .map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','))
    .join('\n');
  return header + '\n' + body;
}

/**
 * Download CSV file
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column names
 * @param {string} filename - Name for the downloaded file
 */
export function downloadCSV(data, columns, filename) {
  const csv = toCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

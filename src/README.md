# Frontend Code Structure

This document explains the organized structure of the EasyDB frontend codebase.

## 📁 Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ActionsPanel.jsx        # Run & Schedule actions section
│   ├── ColumnDisplay.jsx       # Shows available table columns
│   ├── DatabaseBrowserModal.jsx # Modal for selecting databases
│   ├── DatabaseSelector.jsx    # Current database display
│   ├── ResultsTable.jsx        # Query results table
│   ├── ScheduleEmailModal.jsx  # Schedule query email modal
│   └── SQLQueryInput.jsx       # SQL query textarea input
│
├── constants/           # Application constants
│   └── databases.js     # Database names and table mappings
│
├── hooks/              # Custom React hooks
│   └── useFilters.js   # Filtering logic for history/scheduled queries
│
├── utils/              # Utility functions
│   └── csvExport.js    # CSV export functionality
│
├── api.js              # API client functions
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── styles.css          # Global styles

```

---

## 🧩 Components

### **ActionsPanel.jsx**
**Purpose:** Contains Run Query and Schedule Query sections side-by-side

**Props:**
- `onRunQuery` - Handler for running queries
- `onExportCSV` - Handler for CSV export
- `onSendAlert` - Handler for sending email alerts
- `onScheduleQuery` - Handler for scheduling queries
- `alertEmail`, `onAlertEmailChange` - Email input for alerts
- `scheduleAt`, `onScheduleAtChange` - Schedule datetime input

**Usage:**
```jsx
<ActionsPanel 
  onRunQuery={runQuery}
  onExportCSV={exportCSV}
  alertEmail={email}
  onAlertEmailChange={(e) => setEmail(e.target.value)}
/>
```

---

### **ColumnDisplay.jsx**
**Purpose:** Displays all available columns in the selected table

**Props:**
- `columns` - Array of column names
- `tableName` - Name of the current table

**Features:**
- Shows columns as styled badges
- Monospace font for better readability
- Empty state message when no columns available

---

### **DatabaseBrowserModal.jsx**
**Purpose:** Modal for browsing and selecting databases

**Props:**
- `show` - Boolean to show/hide modal
- `onClose` - Handler to close modal
- `databases` - Array of database names
- `onSelectDatabase` - Handler when a database is selected

---

### **DatabaseSelector.jsx**
**Purpose:** Shows current database and browse button

**Props:**
- `selectedDB` - Currently selected database name
- `onBrowseClick` - Handler for browse button click

---

### **ResultsTable.jsx**
**Purpose:** Displays query results in a table format

**Props:**
- `visible` - Array of data rows to display
- `selectedCols` - Array of column names to show
- `selectedDB` - Database name for header
- `loading` - Boolean loading state
- `error` - Error message string
- `dataLength` - Total number of rows

**Features:**
- Loading state
- Error state
- Empty state
- Responsive table with scroll

---

### **ScheduleEmailModal.jsx**
**Purpose:** Modal to collect recipient email for scheduled queries

**Props:**
- `show` - Boolean to show/hide modal
- `onClose` - Handler to close modal
- `onConfirm` - Handler to confirm scheduling
- `email`, `onEmailChange` - Email input state
- `scheduledAt` - Scheduled datetime string

---

### **SQLQueryInput.jsx**
**Purpose:** Textarea for entering SQL queries

**Props:**
- `sqlQuery` - Current query text
- `onChange` - Handler for text changes
- `tableName` - Current table name (for placeholder examples)
- `disabled` - Boolean disabled state

**Features:**
- Monospace font
- Example queries in placeholder
- Shows current table name
- Resizable textarea

---

## 🎣 Custom Hooks

### **useFilters.js**

#### `useHistoryFilter(searchHistory, historyFilter)`
Filters search history by time period

**Parameters:**
- `searchHistory` - Array of history items
- `historyFilter` - Filter value: `'last24h'`, `'last7d'`, `'last30d'`, `'all'`

**Returns:** Filtered array

**Usage:**
```jsx
const filteredHistory = useHistoryFilter(searchHistory, 'last24h');
```

#### `useScheduledFilter(scheduledQueries, scheduledFilter)`
Filters scheduled queries by status

**Parameters:**
- `scheduledQueries` - Array of scheduled query items
- `scheduledFilter` - Filter value: `'upcoming'`, `'completed'`, `'all'`

**Returns:** Filtered array

**Usage:**
```jsx
const filteredQueries = useScheduledFilter(scheduledQueries, 'upcoming');
```

---

## 🔧 Utility Functions

### **csvExport.js**

#### `toCSV(rows, cols)`
Converts data rows to CSV format

**Parameters:**
- `rows` - Array of data objects
- `cols` - Array of column names to include

**Returns:** CSV formatted string

#### `downloadCSV(data, columns, filename)`
Downloads data as CSV file

**Parameters:**
- `data` - Array of data objects
- `columns` - Array of column names
- `filename` - Name for downloaded file

**Usage:**
```jsx
downloadCSV(data, ['id', 'name'], 'results.csv');
```

---

## 📊 Constants

### **databases.js**

#### `DATABASES`
Array of display names for available databases

```javascript
["Tesla's Delivery Data", "Housing Prices Data", "Israel-Palestine Trade"]
```

#### `TABLE_NAMES`
Mapping of display names to actual table names

```javascript
{
  "Tesla's Delivery Data": 'tesla_deliveries',
  "Housing Prices Data": 'housing_prices',
  "Israel-Palestine Trade": 'israel_palestine_trade'
}
```

---

## 📝 Main Application (App.jsx)

The main `App.jsx` orchestrates all components and manages application state:

### **State Management**

#### Database State
- `selectedDB` - Currently selected database
- `data` - Query result data
- `selectedCols` - Columns to display in results

#### Query State
- `sqlQuery` - SQL query text
- `loading` - Loading indicator
- `error` - Error message
- `showResults` - Whether to show results table

#### Modal State
- `showDBs` - Database browser modal visibility
- `showScheduleEmailModal` - Schedule email modal visibility

#### Actions State
- `alertEmail` - Email for instant alerts
- `scheduleAt` - Scheduled datetime
- `scheduleEmail` - Email for scheduled queries

#### Tab State
- `activeTab` - Current active tab: `'dashboard'`, `'history'`, `'scheduled'`
- `searchHistory` - Array of search history items
- `scheduledQueries` - Array of scheduled queries
- `historyFilter` - History filter selection
- `scheduledFilter` - Scheduled queries filter selection

### **Key Functions**

- `loadInitialData()` - Loads initial 100 rows when database changes
- `runQuery()` - Executes SQL query
- `exportCSV()` - Exports results to CSV
- `sendAlert()` - Sends email alert with results
- `scheduleQueryWithEmail()` - Schedules query for future execution
- `loadSearchHistory()` - Fetches search history
- `loadScheduledQueries()` - Fetches scheduled queries

---

## 🎨 Styling

All styles are in `styles.css` with CSS custom properties for theming:

```css
--bg: Background color
--fg: Foreground (text) color  
--panel: Panel background
--accent: Accent color (teal)
--border: Border color
```

---

## 🚀 Adding New Components

1. **Create component file** in `src/components/`
2. **Export default function** with clear prop types
3. **Add JSDoc comments** for props
4. **Import in App.jsx** and use

Example:
```jsx
// src/components/NewComponent.jsx
import React from 'react';

/**
 * Description of component
 * @param {object} props - Component props
 */
export default function NewComponent({ prop1, prop2 }) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

---

## 📦 File Organization Benefits

### **Before (Old App.jsx):**
- ❌ 762 lines in one file
- ❌ Hard to find specific functionality
- ❌ Difficult to test individual components
- ❌ Coupling between UI and logic

### **After (Modular Structure):**
- ✅ Clear separation of concerns
- ✅ Reusable components
- ✅ Easy to locate and modify code
- ✅ Better for collaboration
- ✅ Easier to test
- ✅ Improved maintainability

---

## 🔍 Finding Code

### "Where is the database selector?"
→ `src/components/DatabaseSelector.jsx`

### "Where is the SQL input?"
→ `src/components/SQLQueryInput.jsx`

### "Where are the filter constants?"
→ `src/constants/databases.js`

### "Where is the CSV export logic?"
→ `src/utils/csvExport.js`

### "Where is the filtering logic?"
→ `src/hooks/useFilters.js`

---

## 📚 Best Practices

1. **Keep components small** - Each component should have one clear purpose
2. **Use prop types** - Document props with JSDoc comments
3. **Extract logic** - Move complex logic to hooks or utils
4. **Constants in separate files** - Don't hardcode values in components
5. **Consistent naming** - Use clear, descriptive names
6. **Comment complex code** - Explain "why", not "what"

---

**Last Updated:** November 20, 2025  
**Structure Version:** 2.0 (Modular)

// API service for communicating with the backend

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Log the API URL for debugging
console.log('API_URL configured as:', API_URL);

// Get or create session ID
function getSessionId() {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

// Save search history to backend
export async function saveSearchHistory(searchData) {
  try {
    const response = await fetch(`${API_URL}/api/search-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...searchData,
        session_id: getSessionId()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save search history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving search history:', error);
    // Don't throw - we don't want search history failures to break the app
    return null;
  }
}

// Get search history from backend
export async function getSearchHistory(limit = 50, offset = 0) {
  try {
    // Fetch all history (not filtered by session)
    const response = await fetch(
      `${API_URL}/api/search-history?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch search history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching search history:', error);
    return { history: [], total: 0, limit, offset };
  }
}

// Delete a search history entry
export async function deleteSearchHistory(id) {
  try {
    const response = await fetch(`${API_URL}/api/search-history/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete search history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting search history:', error);
    throw error;
  }
}

// Send email alert
export async function sendEmailAlert(data) {
  try {
    const response = await fetch(`${API_URL}/api/alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send alert');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending alert:', error);
    throw error;
  }
}

// Schedule a query
export async function scheduleQuery(data) {
  try {
    const response = await fetch(`${API_URL}/api/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to schedule query');
    }

    return await response.json();
  } catch (error) {
    console.error('Error scheduling query:', error);
    throw error;
  }
}

// Get scheduled queries
export async function getScheduledQueries(limit = 50, offset = 0) {
  try {
    const response = await fetch(
      `${API_URL}/api/scheduled-queries?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch scheduled queries');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduled queries:', error);
    return { queries: [], total: 0, limit, offset };
  }
}

// Delete a scheduled query
export async function deleteScheduledQuery(id) {
  try {
    const response = await fetch(`${API_URL}/api/scheduled-queries/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete scheduled query');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting scheduled query:', error);
    throw error;
  }
}

// Stop a recurring scheduled query
export async function stopScheduledQuery(id) {
  try {
    const response = await fetch(`${API_URL}/api/scheduled-queries/${id}/stop`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to stop scheduled query');
    }

    return await response.json();
  } catch (error) {
    console.error('Error stopping scheduled query:', error);
    throw error;
  }
}

// Resume a stopped scheduled query
export async function resumeScheduledQuery(id) {
  try {
    const response = await fetch(`${API_URL}/api/scheduled-queries/${id}/resume`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to resume scheduled query');
    }

    return await response.json();
  } catch (error) {
    console.error('Error resuming scheduled query:', error);
    throw error;
  }
}

// Health check
export async function healthCheck() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Get available databases/tables
export async function getDatabases() {
  try {
    const response = await fetch(`${API_URL}/api/databases`);
    if (!response.ok) {
      throw new Error('Failed to fetch databases');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching databases:', error);
    throw error;
  }
}

// Get table schema
export async function getTableSchema(tableName) {
  try {
    const response = await fetch(`${API_URL}/api/schema/${tableName}`);
    if (!response.ok) {
      throw new Error('Failed to fetch table schema');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching table schema:', error);
    throw error;
  }
}

// Query a table
export async function queryTable({ table, filters = {}, columns = [], limit = 100, offset = 0 }) {
  try {
    console.log('Querying table:', { table, filters, columns, limit, offset });
    console.log('Sending request to:', `${API_URL}/api/query`);
    
    const response = await fetch(`${API_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, filters, columns, limit, offset }),
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API error:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to query table`);
    }
    
    const data = await response.json();
    console.log('Query successful, received', data.data?.length, 'rows');
    return data;
  } catch (error) {
    console.error('Error querying table:', error);
    throw error;
  }
}

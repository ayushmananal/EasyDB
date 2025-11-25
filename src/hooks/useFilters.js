import { useMemo } from 'react';

/**
 * Filter search history by time period
 */
export function useHistoryFilter(searchHistory, historyFilter) {
  return useMemo(() => {
    if (historyFilter === 'all') return searchHistory;
    
    const now = new Date();
    return searchHistory.filter(item => {
      const executedAt = new Date(item.executed_at);
      const diffHours = (now - executedAt) / (1000 * 60 * 60);
      
      switch (historyFilter) {
        case 'last24h':
          return diffHours <= 24;
        case 'last7d':
          return diffHours <= 168; // 7 days
        case 'last30d':
          return diffHours <= 720; // 30 days
        default:
          return true;
      }
    });
  }, [searchHistory, historyFilter]);
}

/**
 * Filter scheduled queries by status
 */
export function useScheduledFilter(scheduledQueries, scheduledFilter) {
  return useMemo(() => {
    if (scheduledFilter === 'all') return scheduledQueries;
    
    const now = new Date();
    return scheduledQueries.filter(item => {
      const scheduledAt = new Date(item.scheduled_at);
      
      switch (scheduledFilter) {
        case 'completed':
          return item.status === 'completed' || item.status === 'failed';
        case 'upcoming':
          return item.status === 'pending' && scheduledAt > now;
        default:
          return true;
      }
    });
  }, [scheduledQueries, scheduledFilter]);
}

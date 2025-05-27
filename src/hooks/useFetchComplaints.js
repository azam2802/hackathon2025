import { useEffect } from 'react';
import { useComplaintsDataStore } from '../Store/store';

export const useFetchComplaints = (forceRefresh = false) => {
    const { complaints, stats, loading, error, fetchComplaints } = useComplaintsDataStore();
    
    useEffect(() => {
        // Only fetch if data is stale or force refresh is requested
        fetchComplaints(forceRefresh);
    }, [fetchComplaints, forceRefresh]);

    return { complaints, stats, loading, error, refreshData: () => fetchComplaints(true) };
};
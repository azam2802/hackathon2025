import { useEffect } from 'react';
import { useAnalyticsStore } from '../Store/store';

export const useFetchAnalytics = (forceRefresh = false) => {
    const { 
        analytics, 
        loading, 
        error, 
        fetchAnalytics, 
        selectedRegion, 
        selectedPeriod,
        setSelectedRegion,
        setSelectedPeriod
    } = useAnalyticsStore();
    
    useEffect(() => {
        // Only fetch if data is stale or force refresh is requested
        fetchAnalytics(forceRefresh);
    }, [fetchAnalytics, forceRefresh]);

    return { 
        ...analytics, 
        loading, 
        error, 
        selectedRegion, 
        selectedPeriod,
        setSelectedRegion,
        setSelectedPeriod,
        refreshData: () => fetchAnalytics(true) 
    };
};
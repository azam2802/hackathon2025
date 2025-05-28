import { create } from 'zustand';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import agencyData from '../Assets/agency.json';

// Функция для парсинга даты из форматов dd-MM-YYYY и dd.MM.YYYY HH:mm
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Проверяем формат dd-MM-YYYY
    if (dateString.includes('-')) {
      const [day, month, year] = dateString.split('-').map(num => parseInt(num, 10));
      return new Date(year, month - 1, day);
    }
    
    // Проверяем формат dd.MM.YYYY HH:mm
    if (dateString.includes('.')) {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('.').map(num => parseInt(num, 10));
      
      if (timePart) {
        const [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day, hours, minutes);
      }
      
      return new Date(year, month - 1, day);
    }
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
  }
  
  return null;
};

// Функция для расчета разницы в днях между двумя датами
const getDaysDifference = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays;
};

// Функция для получения месяца по дате
const getMonthName = (date) => {
  if (!date) return '';
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return months[date.getMonth()];
};

// Функция для группировки данных по месяцам
const groupByMonth = (reports) => {
  const groupedData = {};
  
  reports.forEach(report => {
    const date = parseDate(report.created_at);
    if (!date) return;
    
    const monthYear = `${getMonthName(date)} ${date.getFullYear()}`;
    
    if (!groupedData[monthYear]) {
      groupedData[monthYear] = {
        count: 0,
        byAgency: {}
      };
    }
    
    groupedData[monthYear].count += 1;
    
    if (report.agency) {
      if (!groupedData[monthYear].byAgency[report.agency]) {
        groupedData[monthYear].byAgency[report.agency] = 0;
      }
      groupedData[monthYear].byAgency[report.agency] += 1;
    }
  });
  
  return groupedData;
};

// Create analytics store with Zustand
export const useAnalyticsStore = create((set, get) => ({
  // Initial state
  analytics: {
    reportsCount: 0,
    resolvedCount: 0,
    avgResolutionTime: null,
    problemServices: 0,
    problemServicesList: [],
    agencyDistribution: {},      // Распределение обращений по ведомствам
    serviceTypeDistribution: {}, // Распределение по типам услуг
    monthlyReports: {},           // Данные по месяцам для графика динамики
    regionAnalytics: {}          // Аналитика по регионам
  },
  loading: false,
  error: null,
  lastFetched: null,
  selectedRegion: 'all', // Default value for region filter
  selectedPeriod: 'all', // Default value for period filter (all, 7d, 30d, 90d, 1y)
  
  // Method to check if we need to refresh data
  shouldRefreshData: () => {
    const { lastFetched } = get();
    
    // If no data has been fetched yet
    if (!lastFetched) return true;
    
    // Refresh data if it's been more than 5 minutes since last fetch
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastFetched > fiveMinutes;
  },
  
  // Set selected region
  setSelectedRegion: (region) => {
    set({ selectedRegion: region });
    // Force refresh analytics when region changes
    get().fetchAnalytics(true);
  },

  // Set selected period
  setSelectedPeriod: (period) => {
    set({ selectedPeriod: period });
    // Force refresh analytics when period changes
    get().fetchAnalytics(true);
  },

  // Helper function to filter reports by period
  filterReportsByPeriod: (reports, period) => {
    if (!period || period === 'all') return reports;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case '90d':
        startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      case '1y':
        startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        break;
      default:
        return reports;
    }
    
    return reports.filter(report => {
      const reportDate = parseDate(report.created_at);
      return reportDate && reportDate >= startDate;
    });
  },
  
  // Action to fetch analytics
  fetchAnalytics: async (forceRefresh = false) => {
    const store = get();
    const { selectedRegion, selectedPeriod } = store;
    
    // Skip fetching if data was recently fetched, unless forceRefresh is true
    if (!forceRefresh && !store.shouldRefreshData()) {
      return;
    }
    
    // If we're already loading, don't start another fetch
    if (store.loading) return;
    
    set({ loading: true });
    try {
      // Get all reports with region filter only (we'll apply period filter locally)
      let reportsQuery = collection(db, 'reports');
      
      // Apply region filter if a specific region is selected
      if (selectedRegion && selectedRegion !== 'all') {
        reportsQuery = query(reportsQuery, where('region', '==', selectedRegion));
      }
      
      const allReportsSnapshot = await getDocs(reportsQuery);
      
      // Collect all reports for processing
      const allReports = [];
      allReportsSnapshot.forEach(doc => {
        const data = doc.data();
        allReports.push(data);
      });
      
      // Apply period filter to all reports to get final filtered dataset
      const filteredReports = store.filterReportsByPeriod(allReports, selectedPeriod);
      
      // Calculate counts from filtered reports for consistency
      const reportsCount = filteredReports.length;
      const resolvedCount = filteredReports.filter(report => report.status === 'resolved').length;
      
      // Initialize variables for calculations
      let totalResolutionDays = 0;
      let resolvedReportsWithDates = 0;
      
      // Count reports by service and agency
      const serviceCountMap = {};
      const agencyCountMap = {};
      
      filteredReports.forEach(data => {
        
        // Count by service
        const service = data.service;
        if (service) {
          serviceCountMap[service] = (serviceCountMap[service] || 0) + 1;
        }
        
        // Count by agency
        const agency = data.agency;
        if (agency) {
          agencyCountMap[agency] = (agencyCountMap[agency] || 0) + 1;
        }
        
        // Calculate resolution time if resolved
        if (data.status === 'resolved' && data.created_at && data.resolved_at) {
          const createdDate = parseDate(data.created_at);
          const resolvedDate = parseDate(data.resolved_at);
          
          if (createdDate && resolvedDate) {
            const daysDifference = getDaysDifference(createdDate, resolvedDate);
            console.log(`Report ${data.id || 'unknown'}: created ${data.created_at}, resolved ${data.resolved_at}, days: ${daysDifference}`);
            if (daysDifference !== null && daysDifference >= 0) {
              totalResolutionDays += daysDifference;
              resolvedReportsWithDates++;
            } else if (daysDifference !== null) {
              console.warn(`Negative resolution time: ${daysDifference} days for report created on ${data.created_at} and resolved on ${data.resolved_at}`);
            }
          } else {
            console.warn(`Could not parse dates: ${data.created_at} or ${data.resolved_at}`);
          }
        }
      });
      
      // Calculate average resolution time
      console.log(`Total resolution days: ${totalResolutionDays}, Reports with dates: ${resolvedReportsWithDates}`);
      const avgResolutionTime = resolvedReportsWithDates > 0 
        ? +(totalResolutionDays / resolvedReportsWithDates).toFixed(1) 
        : null; // Use null instead of 0 to differentiate between no data and 0 days
      console.log(`Calculated average resolution time: ${avgResolutionTime} days`)
      
      // Group reports by month for trend chart
      const monthlyReports = groupByMonth(filteredReports);
      
      // Find problem services (more than 30 reports)
      const problemServicesList = Object.entries(serviceCountMap)
        .filter(([, count]) => count > 30)
        .map(([service, count]) => {
          // Find agency for this service
          const serviceInfo = agencyData.find(item => item.service === service);
          const agency = serviceInfo ? serviceInfo.agency : 'Неизвестно';
          
          return {
            service,
            count,
            agency
          };
        })
        .sort((a, b) => b.count - a.count); // Sort by count (desc)
      
      const problemServices = problemServicesList.length;
      
      // Prepare agency distribution data for chart
      const agencyDistribution = Object.entries(agencyCountMap)
        .sort((a, b) => b[1] - a[1])
        .reduce((acc, [agency, count]) => {
          acc[agency] = count;
          return acc;
        }, {});
      
      // Prepare service type distribution data for chart
      const serviceTypeDistribution = Object.entries(serviceCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Take top 10 services
        .reduce((acc, [service, count]) => {
          acc[service] = count;
          return acc;
        }, {});
      
      // --- REGION ANALYTICS ---
      // Group reports by region
      const regionAnalytics = {};
      allReports.forEach(data => {
        const region = data.region || 'Неизвестно';
        if (!regionAnalytics[region]) {
          regionAnalytics[region] = {
            reportsCount: 0,
            resolvedCount: 0,
            avgResolutionTime: 0,
            overdueCount: 0,
            problemServices: 0,
            problemServicesList: [],
          };
        }
        regionAnalytics[region].reportsCount++;
        if (data.status === 'resolved') {
          regionAnalytics[region].resolvedCount++;
          if (data.created_at && data.resolved_at) {
            const createdDate = parseDate(data.created_at);
            const resolvedDate = parseDate(data.resolved_at);
            if (createdDate && resolvedDate) {
              const daysDifference = getDaysDifference(createdDate, resolvedDate);
              if (daysDifference !== null && daysDifference >= 0) {
                regionAnalytics[region].avgResolutionTime += daysDifference;
              }
            }
          }
        }
        // Overdue: status is not resolved and deadline passed
        if (data.status !== 'resolved' && data.deadline) {
          const deadlineDate = parseDate(data.deadline);
          if (deadlineDate && deadlineDate < new Date()) {
            regionAnalytics[region].overdueCount++;
          }
        }
      });
      // Finalize avgResolutionTime and problemServices for each region
      Object.keys(regionAnalytics).forEach(region => {
        const reg = regionAnalytics[region];
        reg.avgResolutionTime = reg.resolvedCount > 0 ? +(reg.avgResolutionTime / reg.resolvedCount).toFixed(1) : 0;
        // Problem services for region
        const serviceCountMap = {};
        allReports.filter(r => (r.region || 'Неизвестно') === region).forEach(r => {
          if (r.service) serviceCountMap[r.service] = (serviceCountMap[r.service] || 0) + 1;
        });
        reg.problemServicesList = Object.entries(serviceCountMap)
          .filter(([, count]) => count > 30)
          .map(([service, count]) => {
            const serviceInfo = agencyData.find(item => item.service === service);
            const agency = serviceInfo ? serviceInfo.agency : 'Неизвестно';
            return { service, count, agency };
          })
          .sort((a, b) => b.count - a.count);
        reg.problemServices = reg.problemServicesList.length;
      });
      
      set({ 
        analytics: {
          reportsCount,
          resolvedCount,
          avgResolutionTime,
          problemServices,
          problemServicesList,
          agencyDistribution,
          serviceTypeDistribution,
          monthlyReports,
          regionAnalytics // <-- add this
        },
        loading: false,
        error: null,
        lastFetched: Date.now()
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      set({ error: error.message, loading: false });
    }
  },
  
  // Reset state
  resetAnalytics: () => set({
    analytics: {
      reportsCount: 0,
      resolvedCount: 0,
      avgResolutionTime: null,
      problemServices: 0,
      problemServicesList: [],
      agencyDistribution: {},
      serviceTypeDistribution: {},
      monthlyReports: {},
      regionAnalytics: {}
    },
    loading: false,
    error: null,
    lastFetched: null
  })
}));

import { create } from 'zustand';
import { collection, getCountFromServer, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import agencyData from '../Assets/agency.json';

// Функция для парсинга даты из форматов dd-MM-YYYY и dd.MM.YYYY HH:mm
const parseDate = (dateString) => {
  if (!dateString) return null;
  
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
    avgResolutionTime: 0,
    problemServices: 0,
    problemServicesList: [],
    agencyDistribution: {},      // Распределение обращений по ведомствам
    serviceTypeDistribution: {}, // Распределение по типам услуг
    monthlyReports: {}           // Данные по месяцам для графика динамики
  },
  loading: false,
  error: null,
  lastFetched: null,
  
  // Method to check if we need to refresh data
  shouldRefreshData: () => {
    const { lastFetched } = get();
    
    // If no data has been fetched yet
    if (!lastFetched) return true;
    
    // Refresh data if it's been more than 5 minutes since last fetch
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastFetched > fiveMinutes;
  },
  
  // Action to fetch analytics
  fetchAnalytics: async (forceRefresh = false) => {
    const store = get();
    
    // Skip fetching if data was recently fetched, unless forceRefresh is true
    if (!forceRefresh && !store.shouldRefreshData()) {
      return;
    }
    
    // If we're already loading, don't start another fetch
    if (store.loading) return;
    
    set({ loading: true });
    try {
      // Get reports count
      const reportsCollection = collection(db, 'reports');
      const reportsSnapshot = await getCountFromServer(reportsCollection);
      const reportsCount = reportsSnapshot.data().count;
      
      // Get resolved reports count
      const resolvedReportsQuery = query(
        collection(db, 'reports'), 
        where('status', '==', 'resolved')
      );
      const resolvedSnapshot = await getCountFromServer(resolvedReportsQuery);
      const resolvedCount = resolvedSnapshot.data().count;
      
      // Get all reports to calculate problem services and resolution time
      const allReportsSnapshot = await getDocs(reportsCollection);
      
      // Calculate average resolution time
      let totalResolutionDays = 0;
      let resolvedReportsWithDates = 0;
      
      // Count reports by service and agency
      const serviceCountMap = {};
      const agencyCountMap = {};
      
      // Collect all reports for processing
      const allReports = [];
      
      allReportsSnapshot.forEach(doc => {
        const data = doc.data();
        allReports.push(data);
        
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
            if (daysDifference !== null && daysDifference >= 0) {
              totalResolutionDays += daysDifference;
              resolvedReportsWithDates++;
            }
          }
        }
      });
      
      // Calculate average resolution time
      const avgResolutionTime = resolvedReportsWithDates > 0 
        ? +(totalResolutionDays / resolvedReportsWithDates).toFixed(1) 
        : 0;
      
      // Group reports by month for trend chart
      const monthlyReports = groupByMonth(allReports);
      
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
      
      set({ 
        analytics: {
          reportsCount,
          resolvedCount,
          avgResolutionTime,
          problemServices,
          problemServicesList,
          agencyDistribution,
          serviceTypeDistribution,
          monthlyReports
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
      avgResolutionTime: 0,
      problemServices: 0,
      problemServicesList: [],
      agencyDistribution: {},
      serviceTypeDistribution: {},
      monthlyReports: {}
    },
    loading: false,
    error: null,
    lastFetched: null
  })
}));


export const useComplaintsDataStore = create((set, get) => ({
  complaints: [],
  stats: {
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0
  },
  loading: false,
  error: null,
  lastFetched: null,
  shouldRefreshData: () => {
    const { lastFetched } = get();
    if (!lastFetched) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastFetched > fiveMinutes;
  },
  fetchComplaints: async (forceRefresh = false) => {
    const store = get();
    
    if (!forceRefresh && !store.shouldRefreshData()) {
      return;
    }
    
    if (store.loading) return;
    
    set({ loading: true });
    try {
      const complaintsCollection = collection(db, 'reports');
      
      // Получаем все обращения, отсортированные по дате создания
      const allComplaintsQuery = query(
        complaintsCollection,
        orderBy('created_at', 'desc')
      );
      const allComplaintsSnapshot = await getDocs(allComplaintsQuery);
      
      // Получаем обращения по статусам для статистики
      const newComplaintsQuery = query(
        complaintsCollection,
        where('status', '==', 'new')
      );
      const inProgressComplaintsQuery = query(
        complaintsCollection,
        where('status', '==', 'in-progress')
      );
      const resolvedComplaintsQuery = query(
        complaintsCollection,
        where('status', '==', 'resolved')
      );
      const [newSnapshot, inProgressSnapshot, resolvedSnapshot] = await Promise.all([
        getDocs(newComplaintsQuery),
        getDocs(inProgressComplaintsQuery),
        getDocs(resolvedComplaintsQuery)
      ]);
      
      // Форматируем данные обращений для таблицы
      const complaints = allComplaintsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Убедимся, что поля для таблицы присутствуют
        title: doc.data().title || 'Нет заголовка',
        service: doc.data().service || 'Неизвестная услуга',
        date: doc.data().created_at || 'Неизвестная дата',
        priority: doc.data().priority || 'medium',
        status: doc.data().status || 'new'
      }));
      
      // Обновляем статистику
      const stats = {
        total: allComplaintsSnapshot.size,
        new: newSnapshot.size,
        inProgress: inProgressSnapshot.size,
        resolved: resolvedSnapshot.size
      };
      
      set({
        complaints,
        stats,
        loading: false,
        error: null,
        lastFetched: Date.now()
      });
    } catch (error) {
      console.error("Error fetching complaints:", error);
      set({ error: error.message, loading: false });
    }
  },
  resetComplaints: () => set({
    complaints: [],
    stats: {
      total: 0,
      new: 0,
      inProgress: 0,
      resolved: 0
    },
    loading: false,
    error: null,
    lastFetched: null
  })
}));


import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAnalyticsStore } from '../Store/store';

// Функция для парсинга даты из разных форматов
const parseDate = (dateString) => {
    if (!dateString) return null;
    
    let parsedDate;
    
    // Проверяем формат даты "dd.MM.YYYY HH:mm"
    if (dateString.includes('.')) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.').map(num => parseInt(num, 10));
        
        if (timePart) {
            const [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10));
            parsedDate = new Date(year, month - 1, day, hours, minutes);
        } else {
            parsedDate = new Date(year, month - 1, day);
        }
    } 
    // Проверяем формат даты "dd-MM-YYYY" или "YYYY-MM-DD"
    else if (dateString.includes('-')) {
        // Проверяем, не является ли это ISO форматом (YYYY-MM-DD)
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // Если первая часть - год (4 цифры)
            if (parts[0].length === 4) {
                // ISO формат (YYYY-MM-DD)
                const [year, month, day] = parts.map(num => parseInt(num, 10));
                parsedDate = new Date(year, month - 1, day);
            } else {
                // Наш формат (DD-MM-YYYY)
                const [day, month, year] = parts.map(num => parseInt(num, 10));
                parsedDate = new Date(year, month - 1, day);
            }
        }
    }
    // Пробуем стандартный парсинг для ISO и других форматов
    else {
        parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
            return null;
        }
    }
    
    // Проверяем валидность даты
    if (!parsedDate || isNaN(parsedDate.getTime())) {
        return null;
    }
    
    return parsedDate;
};

export const useFetchComplaints = () => {
    // Get selected region from analytics store
    const { selectedRegion } = useAnalyticsStore();
    
    const [allComplaints, setAllComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [displayedComplaints, setDisplayedComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0,
        overdue: 0,
        overdueList: []
    });
    
    // Клиентская пагинация и фильтрация
    const [filters, setFilters] = useState({
        status: '',
        agency: '',
        importance: '',
        searchTerm: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10; // Количество элементов на странице
    
    // Кэширование данных
    const [cachedComplaints, setCachedComplaints] = useState({});
    const [cachedTimestamp, setCachedTimestamp] = useState({});
    
    // Функция для проверки актуальности кэша
    const isCacheValid = useCallback((cacheKey) => {
        if (!cachedTimestamp[cacheKey]) return false;
        
        const fiveMinutes = 5 * 60 * 1000; // 5 минут в миллисекундах
        return (Date.now() - cachedTimestamp[cacheKey]) < fiveMinutes;
    }, [cachedTimestamp]);
    
    // Создание ключа для кэша на основе региона
    const getCacheKey = (region) => {
        return `all_complaints_${region || 'all'}`;
    };
    
    // Функция для подсчета статистики
    const calculateStats = (data) => {
        const total = data.length;
        
        // Получаем сегодняшнюю дату (начало дня)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Получаем дату месяц назад
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        
        // Считаем новые обращения (созданные сегодня)
        const newComplaints = data.filter(item => {
            if (!item.created_at) return false;
            
            // Парсим дату создания
            const createdDate = parseDate(item.created_at);
            if (!createdDate) return false;
            
            // Сравниваем с сегодняшней датой
            return createdDate >= today;
        }).length;
        
        // Считаем обращения в работе
        const inProgress = data.filter(item => item.status === 'pending').length;
        
        // Считаем решенные обращения
        const resolved = data.filter(item => item.status === 'resolved').length;
        
        // Считаем обращения, которые не обработаны более месяца
        const overdueComplaints = data.filter(item => {
            if (!item.created_at || item.status === 'resolved' || item.status === 'cancelled') return false;
            
            // Парсим дату создания
            const createdDate = parseDate(item.created_at);
            if (!createdDate) return false;
            
            // Сравниваем с датой месяц назад
            return createdDate <= monthAgo;
        });
        
        setStats({
            total,
            new: newComplaints,
            inProgress,
            resolved,
            overdue: overdueComplaints.length,
            overdueList: overdueComplaints
        });
    };
    
    // Основная функция для получения всех обращений
    const fetchAllComplaints = useCallback(async (skipCache = false) => {
        try {
            const cacheKey = getCacheKey(selectedRegion);
            
            // Проверяем кэш, если не нужно принудительно обновлять
            if (!skipCache && isCacheValid(cacheKey) && cachedComplaints[cacheKey]) {
                // Используем кэшированные данные
                setAllComplaints(cachedComplaints[cacheKey]);
                calculateStats(cachedComplaints[cacheKey]);
                return;
            }
            
            setLoading(true);
            
            // Строим запрос с учетом только региона
            let complaintsQuery = collection(db, 'reports');
            let queryConstraints = [];
            
            // Добавляем фильтр региона, если выбран конкретный регион
            if (selectedRegion && selectedRegion !== 'all') {
                queryConstraints.push(where('region', '==', selectedRegion));
            }
            
            // Добавляем сортировку по дате (сначала новые)
            queryConstraints.push(orderBy('created_at', 'desc'));
            
            // Формируем итоговый запрос
            const finalQuery = query(complaintsQuery, ...queryConstraints);
            
            // Выполняем запрос
            const querySnapshot = await getDocs(finalQuery);
            
            // Обрабатываем результаты
            const fetchedComplaints = [];
            
            querySnapshot.forEach((doc) => {
                fetchedComplaints.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Кэшируем полученные данные
            setCachedComplaints(prev => ({
                ...prev,
                [cacheKey]: fetchedComplaints
            }));
            
            setCachedTimestamp(prev => ({
                ...prev,
                [cacheKey]: Date.now()
            }));
            
            // Обновляем состояние с полученными данными
            setAllComplaints(fetchedComplaints);
            
            // Обновляем статистику
            calculateStats(fetchedComplaints);
            
            setError(null);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedRegion, cachedComplaints, isCacheValid]);
    
    // Применение фильтров к полученным данным
    const applyFilters = useCallback(() => {
        if (allComplaints.length === 0) return;
        
        let filtered = [...allComplaints];
        
        // Применяем фильтр по статусу
        if (filters.status) {
            filtered = filtered.filter(item => item.status === filters.status);
        }
        
        // Применяем фильтр по ведомству
        if (filters.agency) {
            filtered = filtered.filter(item => item.agency === filters.agency);
        }
        
        // Применяем фильтр по важности
        if (filters.importance) {
            filtered = filtered.filter(item => item.importance === filters.importance);
        }
        
        // Применяем поиск
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            
            // Проверяем, является ли поисковый запрос датой
            const isDateSearch = searchLower.match(/^\d{1,2}[.-]\d{1,2}[.-]\d{4}$/) || 
                                searchLower.match(/^\d{1,2}[.-]\d{1,2}[.-]\d{2}$/);
            
            const searchDate = isDateSearch ? parseDate(searchLower) : null;
            
            filtered = filtered.filter(complaint => {
                // Если это поиск по дате
                if (searchDate && complaint.created_at) {
                    const complaintDate = parseDate(complaint.created_at);
                    if (complaintDate) {
                        // Сравниваем только день, месяц и год
                        return complaintDate.getDate() === searchDate.getDate() &&
                               complaintDate.getMonth() === searchDate.getMonth() &&
                               complaintDate.getFullYear() === searchDate.getFullYear();
                    }
                }
                
                // Поиск по тексту обращения
                if (complaint.report_text && complaint.report_text.toLowerCase().includes(searchLower)) {
                    return true;
                }
                
                // Поиск по услуге
                if (complaint.service && complaint.service.toLowerCase().includes(searchLower)) {
                    return true;
                }
                
                // Поиск по контактной информации
                if (complaint.contact_info && complaint.contact_info.toLowerCase().includes(searchLower)) {
                    return true;
                }
                
                // Поиск по ID
                if (complaint.id && complaint.id.toLowerCase().includes(searchLower)) {
                    return true;
                }
                
                // Поиск по адресу
                if (complaint.address && complaint.address.toLowerCase().includes(searchLower)) {
                    return true;
                }
                
                // Поиск по региону
                if (complaint.region && complaint.region.toLowerCase().includes(searchLower)) {
                    return true;
                }
                
                // Поиск по городу
                if (complaint.city && complaint.city.toLowerCase().includes(searchLower)) {
                    return true;
                }
                
                return false;
            });
        }
        
        // Обновляем отфильтрованные данные
        setFilteredComplaints(filtered);
        
        // Рассчитываем общее количество страниц
        const totalPageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        setTotalPages(totalPageCount || 1);
        
        // Если текущая страница больше общего количества страниц, сбрасываем на первую
        if (currentPage > totalPageCount) {
            setCurrentPage(1);
        }
    }, [allComplaints, filters, currentPage]);
    
    // Применение пагинации к отфильтрованным данным
    const applyPagination = useCallback(() => {
        if (filteredComplaints.length === 0) {
            setDisplayedComplaints([]);
            return;
        }
        
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        
        // Получаем данные для текущей страницы
        const paginatedData = filteredComplaints.slice(startIndex, endIndex);
        setDisplayedComplaints(paginatedData);
    }, [filteredComplaints, currentPage]);
    
    // Обработчик изменения фильтров
    const handleFilterChange = useCallback((newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }));
        
        // Сбрасываем пагинацию на первую страницу при изменении фильтров
        setCurrentPage(1);
    }, []);
    
    // Пагинация
    const nextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    }, [currentPage, totalPages]);
    
    const prevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage]);
    
    const goToPage = useCallback((page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    }, [currentPage, totalPages]);
    
    // Загружаем данные при монтировании компонента
    useEffect(() => {
        fetchAllComplaints();
    }, [fetchAllComplaints, selectedRegion]);
    
    // Применяем фильтры при изменении данных или фильтров
    useEffect(() => {
        applyFilters();
    }, [applyFilters, allComplaints, filters]);
    
    // Применяем пагинацию при изменении отфильтрованных данных или страницы
    useEffect(() => {
        applyPagination();
    }, [applyPagination, filteredComplaints, currentPage]);
    
    return {
        complaints: displayedComplaints,
        loading,
        error,
        stats,
        filters,
        currentPage,
        totalPages,
        handleFilterChange,
        nextPage,
        prevPage,
        goToPage,
        refreshData: () => fetchAllComplaints(true) // Принудительное обновление с пропуском кэша
    };
}; 
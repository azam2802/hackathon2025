import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';

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
    // Проверяем формат даты "dd-MM-YYYY"
    else if (dateString.includes('-')) {
        const [day, month, year] = dateString.split('-').map(num => parseInt(num, 10));
        parsedDate = new Date(year, month - 1, day);
    }
    else {
        return null;
    }
    
    return parsedDate;
};

export const useFetchComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0
    });
    
    // Пагинация и фильтрация
    const [lastVisible, setLastVisible] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        agency: '',
        importance: '',
        searchTerm: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    
    // Кэширование данных
    const [cachedComplaints, setCachedComplaints] = useState({});
    const [cachedTimestamp, setCachedTimestamp] = useState({});
    
    // Функция для проверки актуальности кэша
    const isCacheValid = (cacheKey) => {
        if (!cachedTimestamp[cacheKey]) return false;
        
        const fiveMinutes = 5 * 60 * 1000; // 5 минут в миллисекундах
        return (Date.now() - cachedTimestamp[cacheKey]) < fiveMinutes;
    };
    
    // Создание ключа для кэша на основе фильтров и страницы
    const getCacheKey = (filters, page) => {
        return `${filters.status || 'all'}_${filters.agency || 'all'}_${filters.importance || 'all'}_${filters.searchTerm || 'none'}_page${page}`;
    };
    
    // Функция для подсчета статистики
    const calculateStats = (data) => {
        const total = data.length;
        
        // Получаем сегодняшнюю дату (начало дня)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Считаем новые обращения (созданные сегодня)
        const newComplaints = data.filter(item => {
            if (!item.created_at) return false;
            
            // Парсим дату создания
            const createdDate = parseDate(item.created_at);
            if (!createdDate) return false;
            
            // Сравниваем с сегодняшней датой
            return createdDate >= today;
        }).length;
        
        const inProgress = data.filter(item => item.status === 'pending').length;
        const resolved = data.filter(item => item.status === 'resolved').length;
        
        setStats({
            total,
            new: newComplaints,
            inProgress,
            resolved
        });
    };
    
    // Основная функция для получения обращений
    const fetchComplaints = useCallback(async (resetPagination = false, skipCache = false) => {
        try {
            // Если сбрасываем пагинацию, то начинаем с первой страницы
            const targetPage = resetPagination ? 1 : currentPage;
            
            // Проверяем кэш, если не нужно принудительно обновлять
            const cacheKey = getCacheKey(filters, targetPage);
            if (!skipCache && isCacheValid(cacheKey) && cachedComplaints[cacheKey]) {
                // Используем кэшированные данные
                if (resetPagination) {
                    setComplaints(cachedComplaints[cacheKey]);
                } else {
                    setComplaints(prev => [...prev, ...cachedComplaints[cacheKey]]);
                }
                
                // Обновляем пагинацию, если нужно
                if (resetPagination) {
                    setCurrentPage(1);
                    setLastVisible(null);
                }
                
                return;
            }
            
            setLoading(true);
            
            // Если сбрасываем пагинацию, то начинаем с первой страницы
            if (resetPagination) {
                setLastVisible(null);
                setCurrentPage(1);
            }
            
            // Строим запрос с учетом фильтров
            let complaintsQuery = collection(db, 'reports');
            let queryConstraints = [];
            
            // Добавляем фильтры, если они заданы
            if (filters.status) {
                queryConstraints.push(where('status', '==', filters.status));
            }
            
            if (filters.agency) {
                queryConstraints.push(where('agency', '==', filters.agency));
            }
            
            if (filters.importance) {
                queryConstraints.push(where('importance', '==', filters.importance));
            }
            
            // Добавляем сортировку по дате (сначала новые)
            queryConstraints.push(orderBy('created_at', 'desc'));
            
            // Учитываем пагинацию
            if (lastVisible && !resetPagination) {
                queryConstraints.push(startAfter(lastVisible));
            }
            
            // Ограничиваем количество результатов
            queryConstraints.push(limit(itemsPerPage));
            
            // Формируем итоговый запрос
            const finalQuery = query(complaintsQuery, ...queryConstraints);
            
            // Сначала получаем общее количество документов для пагинации
            if (resetPagination) {
                // Для подсчета общего количества документов исключаем limit и startAfter
                const countQuery = query(
                    complaintsQuery, 
                    ...queryConstraints.filter(constraint => 
                        !constraint.toString().includes('limit') && 
                        !constraint.toString().includes('startAfter')
                    )
                );
                
                const countSnapshot = await getCountFromServer(countQuery);
                const totalCount = countSnapshot.data().count;
                setTotalPages(Math.ceil(totalCount / itemsPerPage) || 1);
            }
            
            // Выполняем запрос
            const querySnapshot = await getDocs(finalQuery);
            
            // Если запрос пустой и это не первая страница, пробуем вернуться на предыдущую
            if (querySnapshot.empty && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
                setLastVisible(null);
                return;
            }
            
            // Обрабатываем результаты
            const fetchedComplaints = [];
            
            querySnapshot.forEach((doc) => {
                fetchedComplaints.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Запоминаем последний видимый документ для пагинации
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc || null);
            
            // Кэшируем полученные данные
            setCachedComplaints(prev => ({
                ...prev,
                [cacheKey]: fetchedComplaints
            }));
            
            setCachedTimestamp(prev => ({
                ...prev,
                [cacheKey]: Date.now()
            }));
            
            // Если это новый запрос (не пагинация), обновляем полностью
            // Иначе добавляем к существующим
            if (resetPagination) {
                setComplaints(fetchedComplaints);
            } else {
                setComplaints(prev => [...prev, ...fetchedComplaints]);
            }
            
            // Поисковая фильтрация на клиенте, если указан searchTerm
            if (filters.searchTerm && fetchedComplaints.length > 0) {
                const searchLower = filters.searchTerm.toLowerCase();
                
                // Проверяем, является ли поисковый запрос датой
                const isDateSearch = searchLower.match(/^\d{1,2}[.-]\d{1,2}[.-]\d{4}$/) || 
                                    searchLower.match(/^\d{1,2}[.-]\d{1,2}[.-]\d{2}$/);
                
                const searchDate = isDateSearch ? parseDate(searchLower) : null;
                
                const filteredComplaints = fetchedComplaints.filter(complaint => {
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
                
                if (resetPagination) {
                    setComplaints(filteredComplaints);
                } else {
                    setComplaints(prev => {
                        // Убираем возможные дубликаты
                        const existingIds = new Set(prev.map(c => c.id));
                        const newItems = filteredComplaints.filter(c => !existingIds.has(c.id));
                        return [...prev, ...newItems];
                    });
                }
            }
            
            // Обновляем статистику (отдельный запрос для полной статистики)
            // Делаем только при полной перезагрузке для оптимизации
            if (resetPagination) {
                const statsQuery = collection(db, 'reports');
                const statsSnapshot = await getDocs(statsQuery);
                const allComplaints = [];
                
                statsSnapshot.forEach((doc) => {
                    allComplaints.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                calculateStats(allComplaints);
            }
            
            setError(null);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, lastVisible, currentPage, cachedComplaints, cachedTimestamp]);
    
    // Обработчик изменения фильтров
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }));
    };
    
    // Пагинация
    const nextPage = () => {
        setCurrentPage(prev => prev + 1);
    };
    
    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
            setLastVisible(null); // Сбрасываем для повторного запроса
        }
    };
    
    const goToPage = (page) => {
        if (page !== currentPage) {
            setCurrentPage(page);
            setLastVisible(null); // Сбрасываем для повторного запроса
        }
    };
    
    // Загружаем данные при монтировании или изменении фильтров
    useEffect(() => {
        fetchComplaints(true);
    }, [filters]);
    
    // Загружаем данные при пагинации
    useEffect(() => {
        // Если не первая страница и нет lastVisible, значит мы переходим
        // на страницу, которую еще не загружали
        if (currentPage > 1 && !lastVisible) {
            fetchComplaints(false);
        }
    }, [currentPage, lastVisible, fetchComplaints]);
    
    return {
        complaints,
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
        refreshData: () => fetchComplaints(true, true) // Принудительное обновление с пропуском кэша
    };
}; 
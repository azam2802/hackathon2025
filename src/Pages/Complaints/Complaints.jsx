import React, { useState, useCallback, useEffect } from 'react'
import './Complaints.scss'
import { useFetchComplaints } from '../../Hooks/useFetchComplaints';
import ComplaintModal from '../../Components/ComplaintModal/ComplaintModal';
import { useLocation, useSearchParams } from 'react-router-dom';

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

// Функция для форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Проверяем формат даты и извлекаем только дату
  if (dateString.includes('.')) {
    // Формат dd.MM.YYYY HH:mm
    const [datePart] = dateString.split(' ');
    return datePart;
  } else if (dateString.includes('-')) {
    // Формат dd-MM-YYYY
    return dateString;
  }
  
  return dateString;
};

// Функция для расчета количества прошедших дней
const calculateDaysPassed = (dateString) => {
  if (!dateString) return 0;
  
  // Парсим дату создания с использованием функции parseDate
  const createdDate = parseDate(dateString);
  if (!createdDate) return 0;
  
  const today = new Date();
  return Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
};

const Complaints = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
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
    refreshData
  } = useFetchComplaints();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localComplaints, setLocalComplaints] = useState([]);
  const [showOverdue, setShowOverdue] = useState(false);
  
  // Получение ID из URL параметров для автоматического открытия модального окна
  useEffect(() => {
    const complaintId = searchParams.get('id');
    if (complaintId && complaints.length > 0) {
      const complaint = complaints.find(c => c.id === complaintId);
      if (complaint) {
        setSelectedComplaint(complaint);
        setIsModalOpen(true);
        
        // Очищаем параметр из URL
        searchParams.delete('id');
        setSearchParams(searchParams);
      }
    }
    
    // Проверяем, нужно ли показать просроченные обращения
    if (location.state?.filter === 'overdue') {
      setShowOverdue(true);
      // Сбрасываем состояние после применения фильтра
      location.state = undefined;
    }
  }, [complaints, searchParams, location.state]);
  
  // Эффект для фильтрации просроченных обращений
  useEffect(() => {
    if (showOverdue) {
      setLocalComplaints(stats.overdueList || []);
    } else {
      setLocalComplaints([]);
    }
  }, [showOverdue, stats.overdueList]);

  // Используем useCallback для оптимизации
  const updateLocalComplaints = useCallback((updatedComplaint) => {
    setLocalComplaints(prev => {
      // Если локальных обращений еще нет, используем основные
      if (prev.length === 0 && !showOverdue) {
        const updated = complaints.map(c => 
          c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c
        );
        return updated;
      } else {
        // Иначе обновляем существующие локальные обращения
        return prev.map(c => 
          c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c
        );
      }
    });
  }, [complaints, showOverdue]);
  
  // Используем локальные обращения, если они есть, иначе используем обращения из хука
  const displayedComplaints = localComplaints.length > 0 || showOverdue ? localComplaints : complaints;
  
  // Функция для определения приоритета
  const getPriorityClass = (importance) => {
    switch(importance) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };
  
  // Функция для получения текста приоритета
  const getPriorityText = (importance) => {
    switch(importance) {
      case 'critical':
        return 'Критический';
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return 'Средний';
    }
  };
  
  // Функция для определения статуса
  const getStatusClass = (status) => {
    switch(status) {
      case 'resolved':
        return 'normal';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'new':
        return 'info';
      default:
        return 'info';
    }
  };
  
  // Функция для получения текста статуса
  const getStatusText = (status) => {
    switch(status) {
      case 'resolved':
        return 'Решено';
      case 'pending':
        return 'В работе';
      case 'cancelled':
        return 'Отменено';
      default:
        return 'Новое';
    }
  };
  
  // Обработчик изменения поиска
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    
    // Если строка поиска пуста, сбрасываем поиск
    if (!e.target.value.trim()) {
      handleFilterChange({ searchTerm: '' });
      return;
    }
    
    // Устанавливаем таймаут для предотвращения слишком частых запросов
    const timer = setTimeout(() => {
      handleFilterChange({ searchTerm: e.target.value.trim() });
    }, 500);
    
    return () => clearTimeout(timer);
  };
  
  // Обработчик изменения фильтра статуса
  const handleStatusChange = (e) => {
    const value = e.target.value === 'all' ? '' : e.target.value;
    handleFilterChange({ status: value });
    setShowOverdue(false);
  };
  
  // Обработчик изменения фильтра ведомства
  const handleAgencyChange = (e) => {
    const value = e.target.value === 'all' ? '' : e.target.value;
    handleFilterChange({ agency: value });
    setShowOverdue(false);
  };
  
  // Обработчик изменения фильтра приоритета
  const handleImportanceChange = (e) => {
    const value = e.target.value === 'all' ? '' : e.target.value;
    handleFilterChange({ importance: value });
    setShowOverdue(false);
  };
  
  // Обработчик для просроченных обращений
  const handleOverdueFilter = () => {
    setShowOverdue(!showOverdue);
    if (showOverdue) {
      // Сбрасываем все фильтры
      handleFilterChange({ status: '', agency: '', importance: '', searchTerm: '' });
    }
  };
  
  // Генерируем номера страниц для пагинации
  const renderPagination = () => {
    const pageNumbers = [];
    
    // Если меньше 6 страниц, показываем все
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Иначе показываем текущую, первую, последнюю и несколько рядом с текущей
      pageNumbers.push(1);
      
      if (currentPage > 3) {
        pageNumbers.push('...');
      }
      
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pageNumbers.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pageNumbers.push('...');
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Функция для открытия модального окна
  const openComplaintModal = (complaint) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };
  
  // Функция для закрытия модального окна
  const closeComplaintModal = () => {
    setIsModalOpen(false);
    // Небольшая задержка перед сбросом выбранного обращения, чтобы анимация закрытия отработала
    setTimeout(() => {
      setSelectedComplaint(null);
    }, 300);
  };
  
  // Функция обработки обновления обращения
  const handleComplaintUpdate = (updatedData) => {
    // Обновляем локальное состояние для мгновенного отображения изменений
    if (selectedComplaint) {
      const updatedComplaint = {
        ...selectedComplaint,
        ...updatedData
      };
      updateLocalComplaints(updatedComplaint);
      
      // Если обращение было решено или отменено, удаляем его из списка просроченных
      if (showOverdue && (updatedData.status === 'resolved' || updatedData.status === 'cancelled')) {
        setLocalComplaints(prev => prev.filter(c => c.id !== selectedComplaint.id));
      }
    }
    
    // Затем обновляем данные с сервера для синхронизации
    refreshData();
  };

  return (
    <div className="complaints-page fade-in">
      <div className="page-title" data-aos="fade-down">
        <h1>Анализ обращений граждан</h1>
        <div className="actions">
          <button className="btn btn-outline">Экспорт</button>
          <button 
            className={`btn btn-refresh ${loading ? 'loading' : ''}`}
            onClick={refreshData}
            disabled={loading}
          >
            {loading ? 'Обновление...' : 'Обновить данные'}
          </button>
        </div>
      </div>
      
      <div className="filters-bar" data-aos="fade-up" data-aos-delay="100">
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Поиск по обращениям..." 
            value={searchTerm}
            onChange={handleSearch}
            disabled={showOverdue}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-dropdown">
            <select 
              value={filters.status || ''} 
              onChange={handleStatusChange}
              disabled={showOverdue}
            >
              <option value="" disabled>Статус</option>
              <option value="all">Все статусы</option>
              <option value="pending">В работе</option>
              <option value="resolved">Решенные</option>
              <option value="cancelled">Отмененные</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select 
              value={filters.agency || ''} 
              onChange={handleAgencyChange}
              disabled={showOverdue}
            >
              <option value="" disabled>Ведомство</option>
              <option value="">Все</option>
              <option value="Мэрия">Мэрия</option>
              <option value="Министерство внутренних дел">Министерство внутренних дел</option>
              <option value="Министерство чрезвычайных ситуаций">Министерство чрезвычайных ситуаций</option>
              <option value="Министерство иностранных дел">Министерство иностранных дел</option>
              <option value="Министерство юстиции">Министерство юстиции</option>
              <option value="Министерство обороны">Министерство обороны</option>
              <option value="Министерство финансов">Министерство финансов</option>
              <option value="Министерство сельского хозяйства">Министерство сельского хозяйства</option>
              <option value="Министерство транспорта">Министерство транспорта</option>
              <option value="Министерство образования и науки">Министерство образования и науки</option>
              <option value="Министерство экономики и коммерции">Министерство экономики и коммерции</option>
              <option value="Министерство цифрового развития">Министерство цифрового развития</option>
              <option value="Министерство труда">Министерство труда</option>
              <option value="Министерство здравоохранения">Министерство здравоохранения</option>
              <option value="Министерство энергетики">Министерство энергетики</option>
              <option value="Министерство культуры">Министерство культуры</option>
              <option value="Министерство природных ресурсов">Министерство природных ресурсов</option>
              <option value="Министерство архитектуры">Министерство архитектуры</option>
              <option value="Государственный комитет национальной безопасности">Государственный комитет национальной безопасности</option>
              <option value="Социальный фонд Кыргызской Республики">Социальный фонд Кыргызской Республики</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select 
              value={filters.importance || ''} 
              onChange={handleImportanceChange}
              disabled={showOverdue}
            >
              <option value="" disabled>Приоритет</option>
              <option value="all">Все</option>
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          
          <button 
            className={`btn btn-filter-overdue ${showOverdue ? 'active' : ''}`}
            onClick={handleOverdueFilter}
          >
            Просроченные ({stats.overdue})
          </button>
        </div>
      </div>
      
      <div className="complaints-stats">
        <div className="stat-item" data-aos="flip-up" data-aos-delay="200">
          <span className="stat-value">{stats.total.toLocaleString()}</span>
          <span className="stat-label">Всего</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="300">
          <span className="stat-value">{stats.new.toLocaleString()}</span>
          <span className="stat-label">Новые</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="400">
          <span className="stat-value">{stats.inProgress.toLocaleString()}</span>
          <span className="stat-label">В работе</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="500">
          <span className="stat-value">{stats.resolved.toLocaleString()}</span>
          <span className="stat-label">Решенные</span>
        </div>
        <div className="stat-item overdue-stat" data-aos="flip-up" data-aos-delay="600">
          <span className={`stat-value ${stats.overdue > 0 ? 'alert-value' : ''}`}>
            {stats.overdue.toLocaleString()}
          </span>
          <span className="stat-label">Просроченные</span>
        </div>
      </div>
      
      {error && (
        <div className="error-message" data-aos="fade-in">
          Ошибка при загрузке данных: {error}
        </div>
      )}
      
      {loading && complaints.length === 0 ? (
        <div className="loading-indicator">Загрузка данных...</div>
      ) : (
        <div className="complaint-list" data-aos="fade-up" data-aos-delay="300">
          {displayedComplaints.length > 0 ? (
            <table className={`data-table ${showOverdue ? 'alert-table' : ''}`}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Обращение</th>
                  <th>Услуга</th>
                  <th>Дата</th>
                  {showOverdue && <th>Дней просрочки</th>}
                  <th>Приоритет</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {displayedComplaints.map((complaint, index) => {
                  const daysPassed = showOverdue ? calculateDaysPassed(complaint.created_at) : null;
                  
                  return (
                    <tr key={complaint.id} data-aos="fade-right" data-aos-delay={100 + (index * 50)}>
                      <td>#{complaint.id.substring(0, 5)}</td>
                      <td>{complaint.report_text?.substring(0, 40)}{complaint.report_text?.length > 40 ? '...' : ''}</td>
                      <td>{complaint.service}</td>
                      <td>{formatDate(complaint.created_at)}</td>
                      {showOverdue && <td className="days-overdue">{daysPassed} дн.</td>}
                      <td>
                        <span className={`priority ${getPriorityClass(complaint.importance)}`}>
                          {getPriorityText(complaint.importance)}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${getStatusClass(complaint.status)}`}>
                          {getStatusText(complaint.status)}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-sm"
                            onClick={() => openComplaintModal(complaint)}
                          >
                            Просмотр
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="no-data-message">
              Нет обращений, соответствующих заданным критериям
            </div>
          )}
        </div>
      )}
      
      {!showOverdue && complaints.length > 0 && (
        <div className="pagination" data-aos="fade-up" data-aos-delay="600">
          <button 
            className="btn btn-sm btn-outline" 
            onClick={prevPage}
            disabled={currentPage === 1 || loading}
          >
            Назад
          </button>
          <div className="page-numbers">
            {renderPagination().map((page, index) => (
              typeof page === 'number' ? (
                <button 
                  key={index}
                  className={`btn btn-sm btn-outline ${currentPage === page ? 'active' : ''}`}
                  onClick={() => goToPage(page)}
                  disabled={loading}
                >
                  {page}
                </button>
              ) : (
                <span key={index}>...</span>
              )
            ))}
          </div>
          <button 
            className="btn btn-sm btn-outline" 
            onClick={nextPage}
            disabled={complaints.length < 10 || loading}
          >
            Вперед
          </button>
        </div>
      )}
      
      {/* Модальное окно для просмотра обращения */}
      <ComplaintModal 
        complaint={selectedComplaint}
        isOpen={isModalOpen}
        onClose={closeComplaintModal}
        onUpdate={handleComplaintUpdate}
      />
    </div>
  )
}

export default Complaints 
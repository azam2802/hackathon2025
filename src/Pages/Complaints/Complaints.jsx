import React, { useState, useCallback } from 'react'
import './Complaints.scss'
import { useFetchComplaints } from '../../Hooks/useFetchComplaints';
import ComplaintModal from '../../Components/ComplaintModal/ComplaintModal';

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

const Complaints = () => {
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

  // Используем useCallback для оптимизации
  const updateLocalComplaints = useCallback((updatedComplaint) => {
    setLocalComplaints(prev => {
      // Если локальных обращений еще нет, используем основные
      if (prev.length === 0) {
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
  }, [complaints]);
  
  // Используем локальные обращения, если они есть, иначе используем обращения из хука
  const displayedComplaints = localComplaints.length > 0 ? localComplaints : complaints;
  
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
  };
  
  // Обработчик изменения фильтра ведомства
  const handleAgencyChange = (e) => {
    const value = e.target.value === 'all' ? '' : e.target.value;
    handleFilterChange({ agency: value });
  };
  
  // Обработчик изменения фильтра приоритета
  const handleImportanceChange = (e) => {
    const value = e.target.value === 'all' ? '' : e.target.value;
    handleFilterChange({ importance: value });
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
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-dropdown">
            <select 
              value={filters.status || ''} 
              onChange={handleStatusChange}
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
            >
              <option value="" disabled>Приоритет</option>
              <option value="all">Все</option>
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Обращение</th>
                  <th>Услуга</th>
                  <th>Дата</th>
                  <th>Приоритет</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {displayedComplaints.map((complaint, index) => (
                  <tr key={complaint.id} data-aos="fade-right" data-aos-delay={100 + (index * 50)}>
                    <td>#{complaint.id.substring(0, 5)}</td>
                    <td>{complaint.report_text?.substring(0, 40)}{complaint.report_text?.length > 40 ? '...' : ''}</td>
                    <td>{complaint.service}</td>
                    <td>{formatDate(complaint.created_at)}</td>
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
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data-message">
              Нет обращений, соответствующих заданным критериям
            </div>
          )}
        </div>
      )}
      
      {complaints.length > 0 && (
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
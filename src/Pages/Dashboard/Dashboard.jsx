import React from 'react'
import './Dashboard.scss'
import { useFetchAnalytics } from '../../Hooks/useFetchAnalytics';
import { useFetchComplaints } from '../../Hooks/useFetchComplaints';
import AgencyChart from '../../Components/Charts/AgencyChart';
import ServiceTypeChart from '../../Components/Charts/ServiceTypeChart';
import { useNavigate } from 'react-router-dom';

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

// Функция для правильного склонения слова "день"
const formatDays = (days) => {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${days} дней`;
  }
  
  if (lastDigit === 1) {
    return `${days} день`;
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${days} дня`;
  }
  
  return `${days} дней`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    reportsCount, 
    resolvedCount, 
    avgResolutionTime, 
    problemServices, 
    problemServicesList, 
    serviceTypeDistribution,
    monthlyReports,
    loading: analyticsLoading, 
    error: analyticsError, 
    refreshData: refreshAnalytics 
  } = useFetchAnalytics();
  
  const {
    stats,
    loading: complaintsLoading,
    error: complaintsError,
    refreshData: refreshComplaints
  } = useFetchComplaints();
  
  const loading = analyticsLoading || complaintsLoading;
  const error = analyticsError || complaintsError;
  
  const refreshData = () => {
    refreshAnalytics();
    refreshComplaints();
  };
  
  const navigateToComplaints = (filter) => {
    // Перенаправляем на страницу Complaints с нужным фильтром
    navigate('/complaints', { state: { filter } });
  };

  return (
    <div className="dashboard-page fade-in">
      <div className="page-title" data-aos="fade-down">
        <h1>Дашборд анализа обращений граждан</h1>
        <div className="actions">
          <button className="btn btn-primary">Сформировать отчет</button>
          <button className="btn btn-outline">Экспорт данных</button>
          <button 
            className="btn btn-refresh" 
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
          <input type="text" placeholder="Поиск по услугам и обращениям..." />
        </div>
        
        <div className="filter-controls">
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>Период</option>
              <option value="7d">Последние 7 дней</option>
              <option value="30d">Последние 30 дней</option>
              <option value="90d">Последние 90 дней</option>
              <option value="1y">Год</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>Регион</option>
              <option value="all">Все регионы</option>
              <option value="msk">Москва</option>
              <option value="spb">Санкт-Петербург</option>
              <option value="nsk">Новосибирск</option>
              <option value="ekb">Екатеринбург</option>
            </select>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error-message" data-aos="fade-in">
          Ошибка при загрузке данных: {error}
        </div>
      )}
      
      <div className="dashboard-cards">
        <div className="card" data-aos="zoom-in" data-aos-delay="200">
          <div className="card-title">Всего обращений</div>
          <div className="card-value">{loading ? 'Загрузка...' : reportsCount.toLocaleString()}</div>
        </div>
        
        <div className="card" data-aos="zoom-in" data-aos-delay="300">
          <div className="card-title">Решенные обращения</div>
          <div className="card-value">{loading ? 'Загрузка...' : resolvedCount.toLocaleString()}</div>
        </div>
        
        <div className="card" data-aos="zoom-in" data-aos-delay="400">
          <div className="card-title">Среднее время решения</div>
          <div className="card-value">
            {loading ? 'Загрузка...' : avgResolutionTime === 0 
              ? 'Нет данных' 
              : formatDays(avgResolutionTime)
            }
          </div>
        </div>
        
        <div className="card overdue-card" data-aos="zoom-in" data-aos-delay="500" onClick={() => navigateToComplaints('overdue')}>
          <div className="card-title">Просроченные обращения</div>
          <div className="card-value">
            {loading ? 'Загрузка...' : (
              <span className={stats.overdue > 0 ? 'alert-value' : ''}>{stats.overdue}</span>
            )}
          </div>
          {stats.overdue > 0 && <div className="card-badge">Требует внимания</div>}
        </div>
        
        <div className="card problem-card" data-aos="zoom-in" data-aos-delay="600">
          <div className="card-title">Проблемные услуги</div>
          <div className="card-value">{loading ? 'Загрузка...' : problemServices}</div>
        </div>
      </div>
      
      {stats.overdue > 0 && (
        <div className="dashboard-section" data-aos="fade-up" data-aos-delay="300">
          <h2 className="section-title">Просроченные обращения</h2>
          <div className="section-subtitle">
            Обращения, которые находятся в обработке более месяца
          </div>
          
          <table className="data-table alert-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Обращение</th>
                <th>Дата создания</th>
                <th>Срок</th>
                <th>Услуга</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {stats.overdueList.slice(0, 5).map((complaint, index) => {
                // Рассчитываем, сколько дней прошло с момента создания
                let daysPassed = 0;
                if (complaint.created_at) {
                  const createdDate = parseDate(complaint.created_at);
                  if (createdDate) {
                    const today = new Date();
                    daysPassed = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
                  }
                }
                
                return (
                  <tr key={complaint.id} data-aos="fade-up" data-aos-delay={100 + (index * 100)}>
                    <td>#{complaint.id.substring(0, 5)}</td>
                    <td>{complaint.report_text?.substring(0, 40)}{complaint.report_text?.length > 40 ? '...' : ''}</td>
                    <td>{complaint.created_at}</td>
                    <td className="days-overdue">{formatDays(daysPassed)}</td>
                    <td>{complaint.service}</td>
                    <td>
                      <button className="btn btn-sm btn-warning" onClick={() => navigate(`/complaints?id=${complaint.id}`)}>
                        Обработать
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {stats.overdue > 5 && (
            <div className="view-all-link">
              <button 
                className="btn btn-outline" 
                onClick={() => navigateToComplaints('overdue')}
              >
                Показать все ({stats.overdue})
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="charts-container">
        <div className="chart-card" data-aos="fade-right" data-aos-delay="300">
          <div className="chart-title">
            <span>Динамика обращений по ведомствам</span>
          </div>
          <AgencyChart monthlyReports={monthlyReports} loading={loading} />
        </div>
        
        <div className="chart-card" data-aos="fade-left" data-aos-delay="400">
          <div className="chart-title">
            <span>Распределение по типам услуг</span>
          </div>
          <ServiceTypeChart serviceTypeDistribution={serviceTypeDistribution} loading={loading} />
        </div>
      </div>
      
      <div className="dashboard-section" data-aos="fade-up" data-aos-delay="500">
        <h2 className="section-title">Проблемные услуги</h2>
        <div className="section-subtitle">
          Услуги с более чем 30 обращениями, отсортированные по убыванию
        </div>
        
        {loading ? (
          <div className="loading-indicator">Загрузка данных...</div>
        ) : problemServicesList && problemServicesList.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Название услуги</th>
                <th>Ведомство</th>
                <th>Количество обращений</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {problemServicesList.map((item, index) => (
                <tr key={index} data-aos="fade-up" data-aos-delay={100 + (index * 100)}>
                  <td>{item.service}</td>
                  <td>{item.agency}</td>
                  <td>{item.count}</td>
                  <td>
                    <span className={`status ${item.count > 100 ? 'critical' : item.count > 50 ? 'warning' : 'normal'}`}>
                      {item.count > 100 ? 'Критический' : item.count > 50 ? 'Требует внимания' : 'Нормальный'}
                    </span>
                  </td>
                  <td><button className="btn btn-sm">Детали</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data-message">Нет проблемных услуг для отображения</div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 
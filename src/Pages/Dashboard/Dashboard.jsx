import React from 'react'
import './Dashboard.scss'
import { useFetchAnalytics } from '../../Hooks/useFetchAnalytics';
import AgencyChart from '../../Components/Charts/AgencyChart';
import ServiceTypeChart from '../../Components/Charts/ServiceTypeChart';

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
  const { 
    reportsCount, 
    resolvedCount, 
    avgResolutionTime, 
    problemServices, 
    problemServicesList, 
    serviceTypeDistribution,
    monthlyReports,
    loading, 
    error, 
    refreshData 
  } = useFetchAnalytics();

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
        
        <div className="card" data-aos="zoom-in" data-aos-delay="500">
          <div className="card-title">Проблемные услуги</div>
          <div className="card-value">{loading ? 'Загрузка...' : problemServices}</div>
        </div>
      </div>
      
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
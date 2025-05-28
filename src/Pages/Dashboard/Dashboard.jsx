import React from 'react'
import './Dashboard.scss'
import { useFetchAnalytics } from '../../Hooks/useFetchAnalytics';
import { useFetchComplaints } from '../../Hooks/useFetchComplaints';
import AgencyChart from '../../Components/Charts/AgencyChart';
import ServiceTypeChart from '../../Components/Charts/ServiceTypeChart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
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
    return `${days} ${t("complaints.days")}`;
  };
  
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
        <h1>{t('dashboard.title')}</h1>
        <div className="actions">
          <button className="btn btn-primary">{t('dashboard.generateReport')}</button>
          <button className="btn btn-outline">{t('dashboard.exportData')}</button>
          <button 
            className="btn btn-refresh" 
            onClick={refreshData} 
            disabled={loading}
          >
            {loading ? t('dashboard.updating') : t('dashboard.refreshData')}
          </button>
        </div>
      </div>
      
      <div className="filters-bar" data-aos="fade-up" data-aos-delay="100">
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder={t('dashboard.searchPlaceholder')} />
        </div>
        
        <div className="filter-controls">
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>{t('dashboard.period')}</option>
              <option value="7d">{t('dashboard.last7Days')}</option>
              <option value="30d">{t('dashboard.last30Days')}</option>
              <option value="90d">{t('dashboard.last90Days')}</option>
              <option value="1y">{t('dashboard.year')}</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>{t('dashboard.region')}</option>
              <option value="all">{t('dashboard.allRegions')}</option>
              <option value="msk">{t('dashboard.moscow')}</option>
              <option value="spb">{t('dashboard.saintPetersburg')}</option>
              <option value="nsk">{t('dashboard.novosibirsk')}</option>
              <option value="ekb">{t('dashboard.ekaterinburg')}</option>
            </select>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error-message" data-aos="fade-in">
          {t('dashboard.loadError')}: {error}
        </div>
      )}
      
      <div className="dashboard-cards">
        <div className="card" data-aos="zoom-in" data-aos-delay="200">
          <div className="card-title">{t('dashboard.totalComplaints')}</div>
          <div className="card-value">{loading ? t('dashboard.loading') : reportsCount.toLocaleString()}</div>
        </div>
        
        <div className="card" data-aos="zoom-in" data-aos-delay="300">
          <div className="card-title">{t('dashboard.resolvedComplaints')}</div>
          <div className="card-value">{loading ? t('dashboard.loading') : resolvedCount.toLocaleString()}</div>
        </div>
        
        <div className="card" data-aos="zoom-in" data-aos-delay="400">
          <div className="card-title">{t('dashboard.averageResolutionTime')}</div>
          <div className="card-value">
            {loading ? t('dashboard.loading') : avgResolutionTime === 0 
              ? t('dashboard.noData') 
              : formatDays(avgResolutionTime)
            }
          </div>
        </div>
        
        <div className="card overdue-card" data-aos="zoom-in" data-aos-delay="500" onClick={() => navigateToComplaints('overdue')}>
          <div className="card-title">{t('dashboard.overdueComplaints')}</div>
          <div className="card-value">
            {loading ? t('dashboard.loading') : (
              <span className={stats.overdue > 0 ? 'alert-value' : ''}>{stats.overdue}</span>
            )}
          </div>
          {stats.overdue > 0 && <div className="card-badge">{t('dashboard.requiresAttention')}</div>}
        </div>
        
        <div className="card problem-card" data-aos="zoom-in" data-aos-delay="600">
          <div className="card-title">{t('dashboard.problemServices')}</div>
          <div className="card-value">{loading ? t('dashboard.loading') : problemServices}</div>
        </div>
      </div>
      
      {stats.overdue > 0 && (
        <div className="dashboard-section" data-aos="fade-up" data-aos-delay="300">
          <h2 className="section-title">{t('dashboard.overdueComplaints')}</h2>
          <div className="section-subtitle">
            {t('dashboard.overdueDescription')}
          </div>
          
          <table className="data-table alert-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('complaints.complaint')}</th>
                <th>{t('dashboard.creationDate')}</th>
                <th>{t('dashboard.timeframe')}</th>
                <th>{t('complaints.service')}</th>
                <th>{t('complaints.actions')}</th>
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
                        {t('dashboard.process')}
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
                {t('dashboard.showAll')} ({stats.overdue})
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="charts-container">
        <div className="chart-card" data-aos="fade-right" data-aos-delay="300">
          <div className="chart-title">
            <span>{t('dashboard.complaintsByAgency')}</span>
          </div>
          <AgencyChart monthlyReports={monthlyReports} loading={loading} />
        </div>
        
        <div className="chart-card" data-aos="fade-left" data-aos-delay="400">
          <div className="chart-title">
            <span>{t('dashboard.serviceTypeDistribution')}</span>
          </div>
          <ServiceTypeChart serviceTypeDistribution={serviceTypeDistribution} loading={loading} />
        </div>
      </div>
      
      <div className="dashboard-section" data-aos="fade-up" data-aos-delay="500">
        <h2 className="section-title">{t('dashboard.problemServices')}</h2>
        <div className="section-subtitle">
          {t('dashboard.problemServicesDescription')}
        </div>
        
        {loading ? (
          <div className="loading-indicator">{t('dashboard.loading')}</div>
        ) : problemServicesList && problemServicesList.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('dashboard.serviceName')}</th>
                <th>{t('dashboard.agency')}</th>
                <th>{t('dashboard.complaintsCount')}</th>
                <th>{t('dashboard.status')}</th>
                <th>{t('dashboard.actions')}</th>
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
                      {item.count > 100 ? t('dashboard.critical') : item.count > 50 ? t('dashboard.requiresAttention') : t('dashboard.normal')}
                    </span>
                  </td>
                  <td><button className="btn btn-sm">{t('dashboard.details')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data-message">{t('dashboard.noProblemServices')}</div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 
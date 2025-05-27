import React from 'react'
import './Dashboard.scss'

const Dashboard = () => {
  return (
    <div className="dashboard-page fade-in">
      <div className="page-title" data-aos="fade-down">
        <h1>Дашборд анализа обращений граждан</h1>
        <div className="actions">
          <button className="btn btn-primary">Сформировать отчет</button>
          <button className="btn btn-outline">Экспорт данных</button>
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
      
      <div className="dashboard-cards">
        <div className="card" data-aos="zoom-in" data-aos-delay="200">
          <div className="card-title">Всего обращений</div>
          <div className="card-value">24,582</div>
          <div className="card-trend positive">
            +12.5% с прошлого месяца
          </div>
        </div>
        
        <div className="card" data-aos="zoom-in" data-aos-delay="300">
          <div className="card-title">Решенные обращения</div>
          <div className="card-value">18,429</div>
          <div className="card-trend positive">
            +8.2% с прошлого месяца
          </div>
        </div>
        
        <div className="card" data-aos="zoom-in" data-aos-delay="400">
          <div className="card-title">Среднее время решения</div>
          <div className="card-value">4.2 дня</div>
          <div className="card-trend negative">
            +0.5 дня с прошлого месяца
          </div>
        </div>
        
        <div className="card" data-aos="zoom-in" data-aos-delay="500">
          <div className="card-title">Проблемные услуги</div>
          <div className="card-value">17</div>
          <div className="card-trend negative">
            +3 с прошлого месяца
          </div>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-card" data-aos="fade-right" data-aos-delay="300">
          <div className="chart-title">
            <span>Динамика обращений по категориям</span>
            <div className="chart-filters">
              <button className="btn btn-sm btn-outline active">Все</button>
              <button className="btn btn-sm btn-outline">Топ 5</button>
            </div>
          </div>
          <div className="chart-placeholder" style={{ height: '300px' }}>
            График динамики обращений
          </div>
        </div>
        
        <div className="chart-card" data-aos="fade-left" data-aos-delay="400">
          <div className="chart-title">
            <span>Распределение по типам услуг</span>
            <div className="chart-filters">
              <button className="btn btn-sm btn-outline active">Все</button>
              <button className="btn btn-sm btn-outline">Проблемные</button>
            </div>
          </div>
          <div className="chart-placeholder" style={{ height: '300px' }}>
            Круговая диаграмма типов услуг
          </div>
        </div>
      </div>
      
      <div className="dashboard-section" data-aos="fade-up" data-aos-delay="500">
        <h2 className="section-title">Проблемные услуги</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Название услуги</th>
              <th>Обращений</th>
              <th>Ср. время решения</th>
              <th>Удовлетворенность</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr data-aos="fade-up" data-aos-delay="100">
              <td>Регистрация прав собственности</td>
              <td>1,245</td>
              <td>7.2 дня</td>
              <td>42%</td>
              <td><span className="status critical">Критический</span></td>
              <td><button className="btn btn-sm">Детали</button></td>
            </tr>
            <tr data-aos="fade-up" data-aos-delay="200">
              <td>Получение загранпаспорта</td>
              <td>982</td>
              <td>6.5 дня</td>
              <td>53%</td>
              <td><span className="status warning">Требует внимания</span></td>
              <td><button className="btn btn-sm">Детали</button></td>
            </tr>
            <tr data-aos="fade-up" data-aos-delay="300">
              <td>Запись в детский сад</td>
              <td>876</td>
              <td>5.8 дня</td>
              <td>61%</td>
              <td><span className="status warning">Требует внимания</span></td>
              <td><button className="btn btn-sm">Детали</button></td>
            </tr>
            <tr data-aos="fade-up" data-aos-delay="400">
              <td>Оформление пособий</td>
              <td>754</td>
              <td>4.3 дня</td>
              <td>65%</td>
              <td><span className="status warning">Требует внимания</span></td>
              <td><button className="btn btn-sm">Детали</button></td>
            </tr>
            <tr data-aos="fade-up" data-aos-delay="500">
              <td>Регистрация транспортного средства</td>
              <td>612</td>
              <td>3.9 дня</td>
              <td>70%</td>
              <td><span className="status normal">Нормальный</span></td>
              <td><button className="btn btn-sm">Детали</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard 
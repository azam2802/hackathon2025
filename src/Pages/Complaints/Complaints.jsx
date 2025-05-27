import React from 'react'
import './Complaints.scss'
import { useFetchComplaints } from '../../Hooks/useFetchComplaints'

const Complaints = () => {
  const { loading, error, complaints, stats, refreshData } = useFetchComplaints();

  if (loading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error">Ошибка при загрузке данных: {error}</div>;
  }

  return (
    <div className="complaints-page fade-in">
      <div className="page-title" data-aos="fade-down">
        <h1>Анализ обращений граждан</h1>
        <div className="actions">
          <button className="btn btn-primary">Добавить обращение</button>
          <button className="btn btn-outline" onClick={refreshData}>Обновить данные</button>
        </div>
      </div>
      
      <div className="filters-bar" data-aos="fade-up" data-aos-delay="100">
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Поиск по обращениям..." />
        </div>
        
        <div className="filter-controls">
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>Статус</option>
              <option value="all">Все статусы</option>
              <option value="new">Новые</option>
              <option value="in-progress">В работе</option>
              <option value="resolved">Решенные</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>Услуга</option>
              <option value="all">Все услуги</option>
              {complaints.map(complaint => (
                <option key={complaint.service} value={complaint.service}>
                  {complaint.service}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>Приоритет</option>
              <option value="all">Все</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="complaints-stats">
        <div className="stat-item" data-aos="flip-up" data-aos-delay="200">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Всего</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="300">
          <span className="stat-value">{stats.new}</span>
          <span className="stat-label">Новые</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="400">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">В работе</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="500">
          <span className="stat-value">{stats.resolved}</span>
          <span className="stat-label">Решенные</span>
        </div>
      </div>
      
      <div className="complaint-list" data-aos="fade-up" data-aos-delay="300">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Тема обращения</th>
              <th>Услуга</th>
              <th>Дата</th>
              <th>Приоритет</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint, index) => (
              <tr key={complaint.id} data-aos="fade-right" data-aos-delay={100 * (index + 1)}>
                <td>#{complaint.id}</td>
                <td>{complaint.title}</td>
                <td>{complaint.service}</td>
                <td>{complaint.date}</td>
                <td><span className={`priority ${complaint.priority}`}>{complaint.priority}</span></td>
                <td><span className={`status ${complaint.status}`}>{complaint.status}</span></td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-sm">Просмотр</button>
                    <button className="btn btn-sm">Анализ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="pagination" data-aos="fade-up" data-aos-delay="600">
        <button className="btn btn-sm btn-outline">Назад</button>
        <div className="page-numbers">
          <button className="btn btn-sm btn-outline active">1</button>
          <button className="btn btn-sm btn-outline">2</button>
          <button className="btn btn-sm btn-outline">3</button>
          <span>...</span>
          <button className="btn btn-sm btn-outline">10</button>
        </div>
        <button className="btn btn-sm btn-outline">Вперед</button>
      </div>
    </div>
  )
}

export default Complaints 
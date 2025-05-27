import React from 'react'
import './Complaints.scss'

const Complaints = () => {
  return (
    <div className="complaints-page fade-in">
      <div className="page-title" data-aos="fade-down">
        <h1>Анализ обращений граждан</h1>
        <div className="actions">
          <button className="btn btn-primary">Добавить обращение</button>
          <button className="btn btn-outline">Экспорт</button>
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
              <option value="cancelled">Отмененные</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select defaultValue="">
              <option value="" disabled>Услуга</option>
              <option value="all">Все услуги</option>
              <option value="registration">Регистрация прав</option>
              <option value="passport">Загранпаспорт</option>
              <option value="kindergarten">Детский сад</option>
              <option value="benefits">Пособия</option>
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
          <span className="stat-value">1,245</span>
          <span className="stat-label">Всего</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="300">
          <span className="stat-value">328</span>
          <span className="stat-label">Новые</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="400">
          <span className="stat-value">527</span>
          <span className="stat-label">В работе</span>
        </div>
        <div className="stat-item" data-aos="flip-up" data-aos-delay="500">
          <span className="stat-value">390</span>
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
            <tr data-aos="fade-right" data-aos-delay="100">
              <td>#12458</td>
              <td>Долгое ожидание загранпаспорта</td>
              <td>Получение загранпаспорта</td>
              <td>15.05.2023</td>
              <td><span className="priority high">Высокий</span></td>
              <td><span className="status warning">В работе</span></td>
              <td>
                <div className="actions-cell">
                  <button className="btn btn-sm">Просмотр</button>
                  <button className="btn btn-sm">Анализ</button>
                </div>
              </td>
            </tr>
            <tr data-aos="fade-right" data-aos-delay="200">
              <td>#12457</td>
              <td>Ошибка в документах при регистрации</td>
              <td>Регистрация прав собственности</td>
              <td>14.05.2023</td>
              <td><span className="priority critical">Критический</span></td>
              <td><span className="status warning">В работе</span></td>
              <td>
                <div className="actions-cell">
                  <button className="btn btn-sm">Просмотр</button>
                  <button className="btn btn-sm">Анализ</button>
                </div>
              </td>
            </tr>
            <tr data-aos="fade-right" data-aos-delay="300">
              <td>#12456</td>
              <td>Некорректная информация о пособиях</td>
              <td>Оформление пособий</td>
              <td>14.05.2023</td>
              <td><span className="priority medium">Средний</span></td>
              <td><span className="status warning">В работе</span></td>
              <td>
                <div className="actions-cell">
                  <button className="btn btn-sm">Просмотр</button>
                  <button className="btn btn-sm">Анализ</button>
                </div>
              </td>
            </tr>
            <tr data-aos="fade-right" data-aos-delay="400">
              <td>#12455</td>
              <td>Проблема с записью в детский сад</td>
              <td>Запись в детский сад</td>
              <td>13.05.2023</td>
              <td><span className="priority medium">Средний</span></td>
              <td><span className="status normal">Решено</span></td>
              <td>
                <div className="actions-cell">
                  <button className="btn btn-sm">Просмотр</button>
                  <button className="btn btn-sm">Анализ</button>
                </div>
              </td>
            </tr>
            <tr data-aos="fade-right" data-aos-delay="500">
              <td>#12454</td>
              <td>Отказ в регистрации автомобиля</td>
              <td>Регистрация транспортного средства</td>
              <td>12.05.2023</td>
              <td><span className="priority high">Высокий</span></td>
              <td><span className="status normal">Решено</span></td>
              <td>
                <div className="actions-cell">
                  <button className="btn btn-sm">Просмотр</button>
                  <button className="btn btn-sm">Анализ</button>
                </div>
              </td>
            </tr>
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
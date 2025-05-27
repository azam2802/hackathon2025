import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero секция */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="main-title" data-aos="fade-up">
            Система анализа обращений граждан
          </h1>
          <p className="subtitle" data-aos="fade-up" data-aos-delay="100">
            Инновационное решение для мониторинга и анализа обращений граждан
          </p>
          <div className="cta-buttons" data-aos="fade-up" data-aos-delay="200">
            <Link to="/dashboard" className="btn btn-primary">Перейти к аналитике</Link>
            <button className="btn btn-outline">Узнать больше</button>
          </div>
        </div>
        <div className="hero-image" data-aos="zoom-in" data-aos-delay="300">
          <img src="/images/dashboard-preview.png" alt="Dashboard Preview" />
        </div>
      </section>

      {/* Секция преимуществ */}
      <section className="features-section">
        <h2 className="section-title" data-aos="fade-up">Ключевые преимущества</h2>
        <div className="features-grid">
          <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
            <div className="feature-icon">📊</div>
            <h3>Аналитика в реальном времени</h3>
            <p>Мгновенный доступ к актуальной статистике и трендам</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
            <div className="feature-icon">🗺️</div>
            <h3>Географическая визуализация</h3>
            <p>Интерактивная карта с распределением обращений по регионам</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="300">
            <div className="feature-icon">📈</div>
            <h3>Прогнозирование трендов</h3>
            <p>AI-анализ для предсказания будущих обращений</p>
          </div>
          <div className="feature-card" data-aos="fade-up" data-aos-delay="400">
            <div className="feature-icon">⚡</div>
            <h3>Быстрый отклик</h3>
            <p>Мгновенное реагирование на критические обращения</p>
          </div>
        </div>
      </section>

      {/* Секция статистики */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item" data-aos="fade-up">
            <div className="stat-number">24,582</div>
            <div className="stat-label">Обращений обработано</div>
          </div>
          <div className="stat-item" data-aos="fade-up" data-aos-delay="100">
            <div className="stat-number">98%</div>
            <div className="stat-label">Удовлетворенность</div>
          </div>
          <div className="stat-item" data-aos="fade-up" data-aos-delay="200">
            <div className="stat-number">4.2</div>
            <div className="stat-label">Среднее время решения (дни)</div>
          </div>
        </div>
      </section>

      {/* Секция призыва к действию */}
      <section className="cta-section">
        <div className="cta-content" data-aos="fade-up">
          <h2>Готовы начать?</h2>
          <p>Присоединяйтесь к нам и улучшите качество обслуживания граждан</p>
          <Link to="/dashboard" className="btn btn-primary">Начать сейчас</Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 
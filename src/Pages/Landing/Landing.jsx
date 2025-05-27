import React from 'react';
import './Landing.scss';

const Landing = () => {
  return (
    <div className="landing-root">
      {/* Верхнее меню */}
      <header className="landing-header">
        <div className="logo-block">
          <img src="/logo-gov.svg" alt="ГосАналитика" className="logo-img" />
          <span className="logo-text">ГосАналитика</span>
        </div>
        <nav className="landing-nav">
          <a href="#about">О сервисе</a>
          <a href="#features">Преимущества</a>
          <a href="/login" className="login-link">Войти</a>
        </nav>
      </header>

      {/* Hero секция */}
      <section className="landing-hero">
        <div className="hero-left">
          <h1>
            Public Pulse <br />
            <span className="accent">голос граждан, видимый каждому</span>
          </h1>
          <p className="hero-subtitle">
Платформа для выявления неэффективных госуслуг через анализ жалоб и обращений.          </p>
          <div className="hero-actions">
            <a href="/complaints" className="btn btn-primary">Оставить жалобу</a>
            <a href="#about" className="btn btn-outline">Узнать больше</a>
          </div>
        </div>
        <div className="hero-right">
          {/* Временная иллюстрация, можно заменить на SVG или PNG */}
          <img src="/illustration-complaint.svg" alt="Иллюстрация подачи жалобы" className="hero-illustration" />
        </div>
      </section>

      {/* Преимущества */}
      <section className="landing-features" id="features">
        <h2>Почему выбирают нас?</h2>
        <div className="features-list">
          <div className="feature-card">
            <div className="feature-icon">🕵️‍♂️</div>
            <div className="feature-title">Анонимность</div>
            <div className="feature-desc">Ваши данные защищены, вы можете подать жалобу анонимно.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Быстрая обработка</div>
            <div className="feature-desc">Жалобы оперативно поступают в соответствующие органы.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔎</div>
            <div className="feature-title">Прозрачность</div>
            <div className="feature-desc">Вы всегда можете отследить статус своего обращения.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <div className="feature-title">Доступность</div>
            <div className="feature-desc">Подавайте жалобы с любого устройства — быстро и удобно.</div>
          </div>
        </div>
      </section>

      {/* О сервисе */}
      <section className="landing-about" id="about">
        <div className="about-content">
          <h2>О сервисе</h2>
          <p>
            ГосАналитика — это современная платформа для подачи, отслеживания и анализа обращений граждан. Мы делаем процесс коммуникации между гражданами и государством проще, прозрачнее и эффективнее.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing; 
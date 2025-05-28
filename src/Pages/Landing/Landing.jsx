import React from 'react';
import './Landing.scss';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../Components/LanguageSwitcher/LanguageSwitcher';

const Landing = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-root">
      {/* Верхнее меню */}
      <header className="landing-header">
        <div className="logo-block">
          <img src="/logo-gov.svg" alt="Public Pulse" className="logo-img" />
          <span className="logo-text">Public Pulse</span>
        </div>
        <nav className="landing-nav">
          <a href="#about">{t('landing.menuAbout')}</a>
          <a href="#features">{t('landing.menuFeatures')}</a>
          <a href="/login" className="login-link">{t('landing.menuLogin')}</a>
          <div className="language-switcher-landing">
            <LanguageSwitcher />
          </div>
        </nav>
      </header>

      {/* Hero секция */}
      <section className="landing-hero">
        <div className="hero-left">
          <h1>
            {t('landing.heroTitle')} <br />
            <span className="accent">{t('landing.heroSubtitle')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('landing.heroDescription')}
          </p>
          <div className="hero-actions">
            <a href="/complaints" className="btn btn-primary">{t('landing.heroButtonComplaint')}</a>
            <a href="#about" className="btn btn-outline">{t('landing.heroButtonLearnMore')}</a>
          </div>
        </div>
        <div className="hero-right">
          {/* Временная иллюстрация, можно заменить на SVG или PNG */}
          <img src="/illustration-complaint.svg" alt={t('landing.heroTitle')} className="hero-illustration" />
        </div>
      </section>

      {/* Преимущества */}
      <section className="landing-features" id="features">
        <h2>{t('landing.featuresTitle')}</h2>
        <div className="features-list">
          <div className="feature-card">
            <div className="feature-icon">🕵️‍♂️</div>
            <div className="feature-title">{t('landing.featureAnonymity')}</div>
            <div className="feature-desc">{t('landing.featureAnonymityDesc')}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">{t('landing.featureSpeed')}</div>
            <div className="feature-desc">{t('landing.featureSpeedDesc')}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔎</div>
            <div className="feature-title">{t('landing.featureTransparency')}</div>
            <div className="feature-desc">{t('landing.featureTransparencyDesc')}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <div className="feature-title">{t('landing.featureAccessibility')}</div>
            <div className="feature-desc">{t('landing.featureAccessibilityDesc')}</div>
          </div>
        </div>
      </section>

      {/* О сервисе */}
      <section className="landing-about" id="about">
        <div className="about-content">
          <h2>{t('landing.aboutTitle')}</h2>
          <p>
            {t('landing.aboutDescription')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing; 
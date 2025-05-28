import React from 'react';
import './Landing.scss';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../Components/LanguageSwitcher/LanguageSwitcher';
import PhoneDemo from '../../Assets/landing-demo.png';
import KgEmblem from '../../Assets/emblem.png';
import { Link } from 'react-router-dom';

const Landing = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="header-container">
          <div className="logo-block">
            <img src="/logo-gov.svg" alt="Public Pulse" className="logo-img" />
            <div className="logo-text-container">
              <span className="logo-text">Public Pulse</span>
              <span className="logo-subtext">{t('landing.governmentPortal')}</span>
            </div>
          </div>
          <nav className="landing-nav">
            <a href="#about">{t('landing.menuAbout')}</a>
            <a href="#features">{t('landing.menuFeatures')}</a>
            <a href="#process">{t('landing.menuProcess')}</a>
            <a href="#statistics">{t('landing.menuStatistics')}</a>
            <a href="/admin/complaints" className="login-link">{t('landing.menuLogin')}</a>
            <div className="language-switcher-landing">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <div className="landing-backdrop">
        <div className="backdrop-pattern"></div>
      </div>

      <section className="landing-hero">
        <div className="hero-container">
          <div className="hero-left">
            <div className="official-badge">
              <span className="badge-icon">🏛️</span>
              <span>{t('landing.officialResource')}</span>
            </div>
            <h1>
              {t('landing.heroTitle')} <br />
              <span className="accent">{t('landing.heroSubtitle')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('landing.heroDescription')}
            </p>
            <div className="hero-actions">
              <a href="/admin/complaints" className="btn btn-primary">
                <span className="btn-icon">📝</span>
                {t('landing.heroButtonComplaint')}
              </a>
              <a href="#process" className="btn btn-outline">
                <span className="btn-icon">ℹ️</span>
                {t('landing.heroButtonLearnMore')}
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">12,435+</span>
                <span className="stat-label">{t('landing.resolvedComplaints')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">97%</span>
                <span className="stat-label">{t('landing.satisfactionRate')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">24/7</span>
                <span className="stat-label">{t('landing.availability')}</span>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="phone-mockup">
              <img src={PhoneDemo} alt={t('landing.heroTitle')} className="hero-illustration" />
              <div className="mockup-overlay"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="section-heading">
          <div className="section-icon">⭐</div>
          <h2>{t('landing.featuresTitle')}</h2>
          <p className="section-subtitle">{t('landing.featuresSubtitle')}</p>
        </div>
        <div className="features-list">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">{t('landing.featureAnonymity')}</div>
            <div className="feature-desc">{t('landing.featureAnonymityDesc')}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">{t('landing.featureSpeed')}</div>
            <div className="feature-desc">{t('landing.featureSpeedDesc')}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
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

      <section className="landing-process" id="process">
        <div className="section-heading">
          <div className="section-icon">🔄</div>
          <h2>{t('landing.processTitle')}</h2>
          <p className="section-subtitle">{t('landing.processSubtitle')}</p>
        </div>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>{t('landing.processStep1Title')}</h3>
              <p>{t('landing.processStep1Desc')}</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>{t('landing.processStep2Title')}</h3>
              <p>{t('landing.processStep2Desc')}</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>{t('landing.processStep3Title')}</h3>
              <p>{t('landing.processStep3Desc')}</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>{t('landing.processStep4Title')}</h3>
              <p>{t('landing.processStep4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-statistics" id="statistics">
        <div className="section-heading">
          <div className="section-icon">📊</div>
          <h2>{t('landing.statisticsTitle')}</h2>
          <p className="section-subtitle">{t('landing.statisticsSubtitle')}</p>
        </div>
        <div className="statistics-container">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-number">94%</div>
            <div className="stat-title">{t('landing.processingRate')}</div>
            <div className="stat-desc">{t('landing.processingRateDesc')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-number">48h</div>
            <div className="stat-title">{t('landing.responseTime')}</div>
            <div className="stat-desc">{t('landing.responseTimeDesc')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-number">35+</div>
            <div className="stat-title">{t('landing.governmentAgencies')}</div>
            <div className="stat-desc">{t('landing.governmentAgenciesDesc')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-number">7</div>
            <div className="stat-title">{t('landing.regionsTitle')}</div>
            <div className="stat-desc">{t('landing.regionsDesc')}</div>
          </div>
        </div>
      </section>

      <section className="landing-about" id="about">
        <div className="about-container">
          <div className="about-image">
            <img src={KgEmblem} alt="Герб Кыргызской Республики" className="kg-emblem" />
          </div>
          <div className="about-content">
            <h2>{t('landing.aboutTitle')}</h2>
            <p>{t('landing.aboutDescription')}</p>
            <p>{t('landing.aboutMission')}</p>
            <div className="about-cta">
              <a href="/admin/dashboard" className="btn btn-primary">{t('landing.exploreAnalytics')}</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-column">
            <div className="footer-logo">
              <span>Public Pulse</span>
            </div>
            <p className="footer-tagline">{t('landing.footerTagline')}</p>
          </div>
          <div className="footer-column">
            <h3>{t('landing.quickLinks')}</h3>
            <ul className="footer-links">
              <li><a href="#about">{t('landing.menuAbout')}</a></li>
              <li><a href="#features">{t('landing.menuFeatures')}</a></li>
              <li><a href="#process">{t('landing.menuProcess')}</a></li>
              <li><a href="#statistics">{t('landing.menuStatistics')}</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>{t('landing.contactUs')}</h3>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon">📞</span>
                <span>+996 312 123456</span>
              </li>
              <li>
                <span className="contact-icon">✉️</span>
                <span>info@publicpulse.kg</span>
              </li>
              <li>
                <span className="contact-icon">📍</span>
                <span>{t('landing.addressLine')}</span>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>{t('landing.followUs')}</h3>
            <div className="social-links">
              <a href="#" className="social-link">Facebook</a>
              <a href="#" className="social-link">Twitter</a>
              <a href="#" className="social-link">Instagram</a>
              <a href="#" className="social-link">Telegram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="copyright">
            &copy; {new Date().getFullYear()} {t('landing.copyrightText')}
          </div>
          <div className="footer-legal">
            <a href="#">{t('landing.privacyPolicy')}</a>
            <a href="#">{t('landing.termsOfService')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInUser } from '../../firebase/auth';
import './Login.scss';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../Components/LanguageSwitcher/LanguageSwitcher';
import ParticlesBackground from '../../Components/ParticlesBackground/ParticlesBackground';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInUser(formData.email, formData.password);
      navigate('/admin/dashboard'); // Redirect to dashboard on successful login
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">
            <img src="/logo-gov.svg" alt={t('app.title')} />
            <span>Public Pulse</span>
          </div>
          <p>{t('auth.loginDescription')}</p>
        </div>
        
        <div className="auth-content">
          <div className="auth-form">
            <h2>{t('auth.login')}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">{t('auth.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('auth.password')}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </form>

            <p>
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="link-button">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </div>
        <div className="auth-header-language">
          <LanguageSwitcher />
        </div>
      </div>
      <ParticlesBackground className="fixed-particles" />
    </div>
  );
};

export default Login;

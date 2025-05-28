import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInUser } from '../../firebase/auth';
import './Login.scss';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../Components/LanguageSwitcher/LanguageSwitcher';

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
          <h1>{t('auth.login')}</h1>
          <p>{t('auth.loginDescription')}</p>
          <Link to="/" className="landing-link">
            {t('auth.learnMore')}
          </Link>
          <div className="language-switcher auth-header-language">
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="auth-content">
          <div className="auth-form">
            <h2>{t('auth.login')}</h2>
            
            <div className="superadmin-info">
              <p><strong>{t('auth.superadminCredentials')}:</strong></p>
              <p>Email: superadmin@gov.kg</p>
              <p>Password: SuperAdmin123!</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">{t('auth.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
      </div>
    </div>
  );
};

export default Login;

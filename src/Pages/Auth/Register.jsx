import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpUser } from '../../firebase/auth';
import './Register.scss';
import ParticlesBackground from '../../Components/ParticlesBackground/ParticlesBackground';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await signUpUser(formData.email, formData.password, formData.displayName);
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="logo">
              <img src="/logo-gov.svg" alt="Public Pulse" />
              <span>Public Pulse</span>
            </div>
            <h1>Регистрация успешна</h1>
          </div>
          
          <div className="auth-content">
            <div className="auth-form">
              <h2>Регистрация выполнена!</h2>
              <div className="success-message">
                <p>Ваш аккаунт был успешно создан.</p>
                <p>Пожалуйста, дождитесь одобрения администратора перед тем, как войти в систему.</p>
              </div>
              <Link to="/login" className="primary-button">
                Вернуться на страницу входа
              </Link>
            </div>
          </div>
        </div>
        <ParticlesBackground className="fixed-particles" />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">
            <img src="/logo-gov.svg" alt="Public Pulse" />
            <span>Public Pulse</span>
          </div>
          <h1>Регистрация в системе</h1>
          <p>Создайте аккаунт для доступа к системе</p>
        </div>
        
        <div className="auth-content">
          <div className="auth-form">
            <h2>Регистрация</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="displayName">Полное имя</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
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
                <label htmlFor="password">Пароль</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Подтверждение пароля</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>

            <p>
              Уже есть аккаунт?{' '}
              <Link to="/login" className="link-button">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
      <ParticlesBackground className="fixed-particles" />
    </div>
  );
};

export default Register;

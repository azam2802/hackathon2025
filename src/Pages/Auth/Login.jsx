import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInUser } from '../../firebase/auth';
import './Login.scss';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
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

    try {
      await signInUser(formData.email, formData.password);
      navigate('/'); // Redirect to dashboard on successful login
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
            <img src="/logo-gov.svg" alt="ГосАналитика" />
            <span>ГосАналитика</span>
          </div>
          <h1>Вход в систему</h1>
          <p>Авторизуйтесь для доступа к системе</p>
          <Link to="/landing" className="landing-link">
            Узнать больше о системе
          </Link>
        </div>
        
        <div className="auth-content">
          <div className="auth-form">
            <h2>Вход</h2>
            
            <div className="superadmin-info">
              <p><strong>Superadmin credentials:</strong></p>
              <p>Email: superadmin@gov.kg</p>
              <p>Password: SuperAdmin123!</p>
            </div>

            <form onSubmit={handleSubmit}>
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
                <label htmlFor="password">Password</label>
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
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <p>
              Нет аккаунта?{' '}
              <Link to="/register" className="link-button">
                Зарегистрируйтесь
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import './Layout.scss'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'
import { useAuth } from '../../hooks/useAuth'
import { signOutUser, signInUser, signUpUser, isSuperAdmin } from '../../firebase/auth'
import AdminPanel from '../Admin/AdminPanel'

const Layout = () => {
  const { user, loading } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthToggle = (type) => {
    setShowLoginForm(type === 'login');
    setShowRegisterForm(type === 'register');
    setAuthError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      await signInUser(formData.email, formData.password);
      setShowLoginForm(false);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (formData.password !== formData.confirmPassword) {
      setAuthError('Passwords do not match');
      setAuthLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      setAuthLoading(false);
      return;
    }

    try {
      await signUpUser(formData.email, formData.password, formData.displayName);
      setShowRegisterForm(false);
      setAuthError('');
      alert('Registration successful! Please wait for admin approval.');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Show admin panel for superadmin only if they chose to view it
  if (user && isSuperAdmin(user.email) && showAdminPanel) {
    return <AdminPanel onBack={() => setShowAdminPanel(false)} />;
  }

  if (loading) {
    return (
      <div className="app-layout">
        <ParticlesBackground />
        <div className="loading-screen">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  // If no user is authenticated, show only the auth interface
  if (!user) {
    return (
      <div className="app-layout auth-only-layout">
        <ParticlesBackground />
        
        <div className="auth-container">
          <div className="auth-header">
            <div className="logo">
              <img src="/logo-gov.svg" alt="ГосАналитика" />
              <span>ГосАналитика</span>
            </div>
            <h1>Система анализа эффективности государственных услуг</h1>
            <p>Авторизуйтесь для доступа к системе</p>
          </div>

          <div className="auth-content">
            {!showLoginForm && !showRegisterForm ? (
              // Show login/register buttons
              <div className="auth-buttons">
                <button onClick={() => handleAuthToggle('login')} className="auth-btn login-btn">
                  Вход
                </button>
                <button onClick={() => handleAuthToggle('register')} className="auth-btn register-btn">
                  Регистрация
                </button>
              </div>
            ) : showLoginForm ? (
              // Show login form
              <div className="auth-form-container">
                <form onSubmit={handleLogin} className="auth-form">
                  <h3>Вход в систему</h3>
                  
                  <div className="superadmin-info">
                    <small>Суперадмин: superadmin@gov.kg / SuperAdmin123!</small>
                  </div>
                  
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <input
                    type="password"
                    name="password"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  
                  {authError && <div className="error-message">{authError}</div>}
                  
                  <div className="form-actions">
                    <button type="submit" disabled={authLoading}>
                      {authLoading ? 'Вход...' : 'Войти'}
                    </button>
                    <button type="button" onClick={() => handleAuthToggle('')}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Show register form
              <div className="auth-form-container">
                <form onSubmit={handleRegister} className="auth-form">
                  <h3>Регистрация в системе</h3>
                  
                  <input
                    type="text"
                    name="displayName"
                    placeholder="Полное имя"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <input
                    type="password"
                    name="password"
                    placeholder="Пароль (мин. 6 символов)"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                  />
                  
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Подтвердите пароль"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  
                  {authError && <div className="error-message">{authError}</div>}
                  
                  <div className="form-actions">
                    <button type="submit" disabled={authLoading}>
                      {authLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                    <button type="button" onClick={() => handleAuthToggle('')}>
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but not approved (and not superadmin), show pending approval message
  if (user && !isSuperAdmin(user.email) && user.isApproved === false) {
    console.log('User is pending approval:', user);
    return (
      <div className="app-layout auth-only-layout">
        <ParticlesBackground />
        
        <div className="auth-container">
          <div className="auth-header">
            <div className="logo">
              <img src="/logo-gov.svg" alt="ГосАналитика" />
              <span>ГосАналитика</span>
            </div>
            <h1>Ожидание одобрения</h1>
            <p>Ваш аккаунт находится на рассмотрении</p>
          </div>

          <div className="auth-content">
            <div className="pending-approval">
              <div className="pending-icon">
                <div className="pending-spinner"></div>
              </div>
              <h3>Добро пожаловать, {user.displayName || user.email}!</h3>
              <p>Ваша регистрация была успешно завершена.</p>
              <p>Пожалуйста, ожидайте одобрения администратора для доступа к системе.</p>
              <p className="status-note">Ваш запрос находится на рассмотрении.</p>
              <div className="pending-actions">
                <button onClick={handleLogout} className="logout-btn">
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show main layout for authenticated users
  return (
    <div className="app-layout">
      <ParticlesBackground />
      
      <header className="header">
        <div className="container">
          <div className="logo">
            <img src="/logo-gov.svg" alt="ГосАналитика" />
            <span>ГосАналитика</span>
          </div>
          
          <nav>
            <NavLink to="/" end>
              <span className="nav-icon">📊</span>
              <span>Дашборд</span>
            </NavLink>
            <NavLink to="/complaints">
              <span className="nav-icon">📝</span>
              <span>Обращения</span>
            </NavLink>
            <NavLink to="/services">
              <span className="nav-icon">🔍</span>
              <span>Услуги</span>
            </NavLink>
            <NavLink to="/reports">
              <span className="nav-icon">📈</span>
              <span>Отчеты</span>
            </NavLink>
            <NavLink to="/analytics">
              <span className="nav-icon">📊</span>
              <span>Аналитика</span>
            </NavLink>
          </nav>
          
          <div className="user-menu">
            <img src="/avatar-placeholder.svg" alt="User" className="user-avatar" />
            <span className="username">{user?.displayName || user?.email || 'Пользователь'}</span>
            {isSuperAdmin(user?.email) && (
              <button 
                onClick={() => setShowAdminPanel(true)} 
                className="admin-panel-button"
              >
                Admin Panel
              </button>
            )}
            <button onClick={handleLogout} className="logout-button">
              Выход
            </button>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} - ГосАналитика | Система анализа эффективности государственных услуг</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout 
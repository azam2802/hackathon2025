import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import './Layout.scss'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'
import { useAuth } from '../../hooks/useAuth'
import { signOutUser, isSuperAdmin } from '../../firebase/auth'
import AdminPanel from '../Admin/AdminPanel'

const Layout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
                Админ панель
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
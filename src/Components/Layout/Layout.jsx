import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import './Layout.scss'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'
import { useAuth } from '../../Hooks/useAuth'
import { signOutUser, isSuperAdmin } from '../../firebase/auth'
import AdminPanel from '../Admin/AdminPanel'
import { Assignment, Search, BarChart, Analytics, Logout, Speed, AdminPanelSettings } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher'
import { Menu } from '@mui/material'

const Layout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Show admin panel for superadmin only if they chose to view it
  if (user && isSuperAdmin(user.email) && showAdminPanel) {
    return <AdminPanel onBack={() => setShowAdminPanel(false)} />;
  }

  if (loading) {
    return (
      <div className="app-layout">
        <ParticlesBackground className="fixed-particles" />
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
        <ParticlesBackground className="fixed-particles" />
        
        <div className="auth-container">
          <div className="auth-header">
            <div className="logo">
              <img src="/logo-gov.svg" alt="Public Pulse" />
              <span>Public Pulse</span>
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
                  {t('navigation.logout')}
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
      
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-burger" onClick={toggleMobileMenu}>
          <Menu />
        </button>
        <div className="mobile-logo">
          <img src="/logo-gov.svg" alt="PublicPulse" />
          <span>PublicPulse</span>
        </div>
        <div className="mobile-user">
          <img src="/avatar-placeholder.svg" alt="User" className="user-avatar" />
          <span className="username">{user?.displayName || user?.email || 'Пользователь'}</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Sidebar */}
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo-gov.svg" alt="Public Pulse" />
          <span>Public Pulse</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>
            <Speed className="sidebar-icon" />
            <span>{t('navigation.dashboard')}</span>
          </NavLink>
          <NavLink to="/admin/complaints" className={({ isActive }) => isActive ? 'active' : ''}>
            <Assignment className="sidebar-icon" />
            <span>{t('navigation.complaints')}</span>
          </NavLink>
          <NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
            <Analytics className="sidebar-icon" />
            <span>{t('navigation.analytics')}</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <img src="/avatar-placeholder.svg" alt="User" className="user-avatar" />
            <span className="username">{user?.displayName || user?.email || 'Пользователь'}</span>
          </div>
          {isSuperAdmin(user?.email) && (
            <button 
              onClick={() => setShowAdminPanel(true)} 
              className="admin-panel-button"
              aria-label="Открыть админ панель"
            >
              <AdminPanelSettings className="sidebar-icon" />
              <span>{t('admin.title')}</span>
            </button>
          )}
          <div className="language-switcher sidebar-language">
            <LanguageSwitcher />
          </div>
          <button onClick={handleLogout} className="logout-button">
            <Logout className="sidebar-icon" />
            <span>{t('navigation.logout')}</span>
          </button>
        </div>
      </div>

      <div className="main-layout-content">
        <main className="main-content">
          <div className="container">
            <Outlet />
          </div>
        </main>
        <footer className="footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} - {t('app.title')}</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Layout
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.scss';
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Дашборд' },
    { path: '/dashboard/complaints', icon: '📝', label: 'Обращения' },
    { path: '/dashboard/services', icon: '🛠️', label: 'Услуги' },
    { path: '/dashboard/reports', icon: '📈', label: 'Отчеты' },
    { path: '/dashboard/analytics', icon: '📊', label: 'Аналитика' },
  ];

  return (
    <div className="layout">
      <ParticlesBackground />
      
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Система анализа</h2>
          <button 
            className="toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {isSidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="home-link">
            <span className="nav-icon">🏠</span>
            {isSidebarOpen && <span>На главную</span>}
          </Link>
        </div>
      </aside>

      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      
      <footer className={`footer ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="container">
          <p>&copy; 2025 - ГосАналитика | Система анализа эффективности государственных услуг</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 
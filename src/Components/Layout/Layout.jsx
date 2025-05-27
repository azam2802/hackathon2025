import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import './Layout.scss'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'

const Layout = () => {
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
            <span className="username">Администратор</span>
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
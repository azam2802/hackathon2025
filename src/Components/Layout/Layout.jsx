import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import './Layout.scss'

const Layout = () => {
  return (
    <div className="app-layout">
      <header className="header">
        <div className="container">
          <div className="logo">
            <img src="/logo-gov.svg" alt="ГосАналитика" />
            <span>ГосАналитика</span>
          </div>
          
          <nav>
            <NavLink to="/" end>Дашборд</NavLink>
            <NavLink to="/complaints">Обращения</NavLink>
            <NavLink to="/services">Услуги</NavLink>
            <NavLink to="/reports">Отчеты</NavLink>
            <NavLink to="/analytics">Аналитика</NavLink>
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
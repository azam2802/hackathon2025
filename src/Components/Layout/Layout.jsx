import React from 'react'
import { Outlet } from 'react-router-dom'
import './Layout.css'

const Layout = () => {
  return (
    <div className="app-layout">
      <header className="header">
        <div className="container">
          <nav>
            {/* Navigation will go here */}
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} - My App</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout 
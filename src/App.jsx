import './App.scss'
import { Routes, Route } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Layout from './Components/Layout/Layout'
import Dashboard from './Pages/Dashboard/Dashboard'
import Complaints from './Pages/Complaints/Complaints'
import { AuthProvider } from './contexts/AuthContext'
import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import ParticlesBackground from './Components/ParticlesBackground/ParticlesBackground'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={
          <div className="auth-only-layout">
            <ParticlesBackground />
            <Login />
          </div>
        } />
        <Route path="/register" element={
          <div className="auth-only-layout">
            <ParticlesBackground />
            <Register />
          </div>
        } />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="services" element={<Home />} />
          <Route path="reports" element={<Home />} />
          <Route path="analytics" element={<Home />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

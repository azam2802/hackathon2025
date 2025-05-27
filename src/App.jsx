import './App.scss'
import { Routes, Route } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Layout from './Components/Layout/Layout'
import Dashboard from './Pages/Dashboard/Dashboard'
import Complaints from './Pages/Complaints/Complaints'
import FirebaseExample from './Components/FirebaseExample/FirebaseExample'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="services" element={<Home />} />
          <Route path="reports" element={<Home />} />
          <Route path="analytics" element={<Home />} />
          <Route path="firebase-example" element={<FirebaseExample />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

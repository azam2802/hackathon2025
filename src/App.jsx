import './App.scss'
import { Routes, Route } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Layout from './Components/Layout/Layout'
import Dashboard from './Pages/Dashboard/Dashboard'
import Complaints from './Pages/Complaints/Complaints'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="services" element={<Home />} />
        <Route path="reports" element={<Home />} />
        <Route path="analytics" element={<Home />} />
      </Route>
    </Routes>
  )
}

export default App

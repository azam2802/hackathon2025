import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.scss'
import App from './App.jsx'
import AOS from 'aos'
import 'aos/dist/aos.css'

// Инициализация AOS
AOS.init({
  duration: 800,
  easing: 'ease-out',
  once: true
});

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AgencyChart = ({ monthlyReports, loading }) => {
  const [chartData, setChartData] = useState({ 
    labels: [], 
    datasets: [] 
  });
  
  const [showTopOnly, setShowTopOnly] = useState(true);
  
  useEffect(() => {
    if (loading || !monthlyReports) return;
    
    // Получаем все месяцы (отсортированные)
    const allMonths = Object.keys(monthlyReports).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      
      const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
    
    // Получаем все уникальные ведомства
    const allAgencies = new Set();
    Object.values(monthlyReports).forEach(month => {
      Object.keys(month.byAgency).forEach(agency => {
        allAgencies.add(agency);
      });
    });
    
    // Преобразуем в массив и выбираем топ-5 или все
    let agenciesToShow = Array.from(allAgencies);
    
    // Сортируем по общему количеству обращений (сумма по всем месяцам)
    agenciesToShow = agenciesToShow.map(agency => {
      const totalReports = Object.values(monthlyReports)
        .reduce((sum, month) => sum + (month.byAgency[agency] || 0), 0);
      return { agency, totalReports };
    }).sort((a, b) => b.totalReports - a.totalReports);
    
    // Ограничиваем число отображаемых ведомств
    let topAgencies;
    let includeOthers = false;
    
    if (showTopOnly) {
      // Показываем только топ-5
      topAgencies = agenciesToShow.slice(0, 5);
    } else {
      // Показываем топ-10, остальные объединяем в "Другие"
      topAgencies = agenciesToShow.slice(0, 10);
      
      if (agenciesToShow.length > 10) {
        includeOthers = true;
      }
    }
    
    // Формируем данные для графика
    const datasets = topAgencies.map(({ agency }, index) => {
      // Генерируем уникальный цвет для каждого ведомства
      const colors = [
        'rgba(75, 192, 192, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(217, 119, 6, 0.7)'
      ];
      
      return {
        label: agency,
        data: allMonths.map(month => monthlyReports[month].byAgency[agency] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('0.7', '0.1'),
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 3
      };
    });
    
    // Добавляем "Другие", если нужно
    if (includeOthers) {
      const otherAgencies = agenciesToShow.slice(10);
      
      // Вычисляем данные для "Другие" (сумма по всем оставшимся ведомствам)
      const otherData = allMonths.map(month => {
        return otherAgencies.reduce((sum, { agency }) => {
          return sum + (monthlyReports[month].byAgency[agency] || 0);
        }, 0);
      });
      
      datasets.push({
        label: 'Другие',
        data: otherData,
        borderColor: 'rgba(170, 170, 170, 0.7)',
        backgroundColor: 'rgba(170, 170, 170, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5], // Пунктирная линия для отличия
        fill: false,
        tension: 0.4,
        pointRadius: 3
      });
    }
    
    setChartData({
      labels: allMonths,
      datasets
    });
  }, [monthlyReports, showTopOnly, loading]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#333',
        bodyColor: '#333',
        borderWidth: 1,
        borderColor: '#ddd',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} обращений`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };
  
  if (loading) {
    return <div className="loading-chart">Загрузка данных...</div>;
  }
  
  return (
    <div className="chart-container">
      <div className="chart-filters">
        <button 
          className={`btn btn-sm btn-outline ${showTopOnly ? 'active' : ''}`}
          onClick={() => setShowTopOnly(true)}
        >
          Топ 5
        </button>
        <button 
          className={`btn btn-sm btn-outline ${!showTopOnly ? 'active' : ''}`}
          onClick={() => setShowTopOnly(false)}
        >
          Все
        </button>
      </div>
      
      <div style={{ height: '300px', position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default AgencyChart; 
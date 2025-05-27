import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Регистрируем компоненты Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const ServiceTypeChart = ({ serviceTypeDistribution, loading }) => {
  const [showProblemOnly, setShowProblemOnly] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' или 'table'
  
  // Цвета для графика
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
  
  // Подготовка данных для графика и таблицы
  const prepareData = () => {
    if (!serviceTypeDistribution || Object.keys(serviceTypeDistribution).length === 0) {
      return {
        chartData: {
          labels: ['Нет данных'],
          datasets: [{
            data: [1],
            backgroundColor: ['rgba(200, 200, 200, 0.5)'],
            borderColor: ['rgba(200, 200, 200, 1)'],
            borderWidth: 1,
          }]
        },
        tableData: []
      };
    }
    
    // Фильтруем данные, если нужно показать только проблемные
    let services = Object.entries(serviceTypeDistribution);
    
    if (showProblemOnly) {
      // Оставляем только услуги с количеством > 30
      services = services.filter(([_, count]) => count > 30);
    }
    
    // Сортируем по количеству обращений (по убыванию)
    services = services.sort((a, b) => b[1] - a[1]);
    
    // Сохраняем полные данные для таблицы (до 20 записей)
    const tableData = services.slice(0, 20).map(([service, count]) => ({
      service,
      count,
      percentage: Math.round((count / services.reduce((sum, [_, c]) => sum + c, 0)) * 100)
    }));
    
    // Если услуг больше 5, объединяем все кроме топ-5 в "Остальное" для диаграммы
    let finalServices = [];
    let otherCount = 0;
    
    if (services.length > 5) {
      finalServices = services.slice(0, 5);
      otherCount = services.slice(5).reduce((sum, [_, count]) => sum + count, 0);
      
      if (otherCount > 0) {
        finalServices.push(['Остальное', otherCount]);
      }
    } else {
      finalServices = services;
    }
    
    // Сокращаем длинные названия услуг
    const truncateService = (service) => {
      if (service === 'Остальное') return service;
      return service.length > 25 ? service.substring(0, 22) + '...' : service;
    };
    
    // Определяем цвета (для "Остальное" используем серый)
    const chartColors = finalServices.map((_, index) => {
      if (index === 5) {
        return 'rgba(170, 170, 170, 0.7)'; // Серый для "Остальное"
      }
      return colors[index];
    });
    
    const chartBorderColors = chartColors.map(color => 
      color === 'rgba(170, 170, 170, 0.7)' 
        ? 'rgba(170, 170, 170, 1)' 
        : color.replace('0.7', '1')
    );
    
    const chartData = {
      labels: finalServices.map(([service]) => truncateService(service)),
      datasets: [{
        data: finalServices.map(([_, count]) => count),
        backgroundColor: chartColors,
        borderColor: chartBorderColors,
        borderWidth: 1,
      }]
    };
    
    return { chartData, tableData };
  };
  
  const { chartData, tableData } = prepareData();
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 11
          },
          boxWidth: 15,
          padding: 10
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
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    // Анимация при обновлении
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };
  
  if (loading) {
    return <div className="loading-chart">Загрузка данных...</div>;
  }
  
  return (
    <div className="chart-container">
      <div className="chart-controls">
        <div className="chart-filters">
          <button 
            className={`btn btn-sm btn-outline ${!showProblemOnly ? 'active' : ''}`}
            onClick={() => setShowProblemOnly(false)}
          >
            Все
          </button>
          <button 
            className={`btn btn-sm btn-outline ${showProblemOnly ? 'active' : ''}`}
            onClick={() => setShowProblemOnly(true)}
          >
            Проблемные
          </button>
        </div>
        
        <div className="view-toggles">
          <button
            className={`btn btn-sm btn-icon ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => setViewMode('chart')}
            title="Диаграмма"
          >
            📊
          </button>
          <button
            className={`btn btn-sm btn-icon ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Таблица"
          >
            📋
          </button>
        </div>
      </div>
      
      {viewMode === 'chart' ? (
        <div style={{ height: '300px', position: 'relative' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      ) : (
        <div className="service-table-container">
          <table className="service-table">
            <thead>
              <tr>
                <th>Услуга</th>
                <th>Количество</th>
                <th>Доля</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, index) => (
                <tr key={index}>
                  <td>{item.service}</td>
                  <td>{item.count}</td>
                  <td>{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ServiceTypeChart; 
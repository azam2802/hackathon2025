import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './Analytics.scss';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Line, Bar, Pie, PolarArea } from 'react-chartjs-2';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { FaExpand, FaCompress } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const { t } = useTranslation();
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const parseReportDate = (dateString) => {
    if (!dateString) return new Date();
    
    try {
      // Handle format "dd.MM.yyyy HH:mm"
      if (dateString.includes('.')) {
        const [datePart, timePart = '00:00'] = dateString.split(' ');
        const [day, month, year] = datePart.split('.').map(part => parseInt(part, 10));
        const [hours, minutes] = timePart.split(':').map(part => parseInt(part, 10));
        
        return new Date(year, month - 1, day, hours, minutes);
      }
      
      // Default to current date if format is unrecognized
      return new Date(dateString);
    } catch (e) {
      console.error("Error parsing date:", e);
      return new Date();
    }
  };


  // Fetch reports data from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const reportsRef = collection(db, 'reports');
        const reportsQuery = query(reportsRef, orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(reportsQuery);
        
        const reports = [];
        querySnapshot.forEach((doc) => {
          reports.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setReportsData(reports);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(t('analytics.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [t]);

  // Filter data based on selected criteria
  const filteredData = useMemo(() => {
    if (!reportsData.length) return [];
    
    return reportsData.filter(report => {
      // Filter by agency
      if (selectedAgency !== 'all' && report.agency !== selectedAgency) {
        return false;
      }
      
      // Filter by region
      if (selectedRegion !== 'all' && report.region !== selectedRegion) {
        return false;
      }
      
      // Filter by timeframe
      if (selectedTimeframe !== 'all') {
        const reportDate = parseReportDate(report.created_at);
        const now = new Date();
        
        if (selectedTimeframe === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (reportDate < weekAgo) return false;
        } else if (selectedTimeframe === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          if (reportDate < monthAgo) return false;
        } else if (selectedTimeframe === 'quarter') {
          const quarterAgo = new Date();
          quarterAgo.setMonth(now.getMonth() - 3);
          if (reportDate < quarterAgo) return false;
        } else if (selectedTimeframe === 'year') {
          const yearAgo = new Date();
          yearAgo.setFullYear(now.getFullYear() - 1);
          if (reportDate < yearAgo) return false;
        }
      }
      
      return true;
    });
  }, [reportsData, selectedAgency, selectedTimeframe, selectedRegion]);
  
  // Compute agencies list
  const agencies = useMemo(() => {
    if (!reportsData.length) return [];
    
    const agenciesSet = new Set();
    reportsData.forEach(report => {
      if (report.agency) agenciesSet.add(report.agency);
    });
    
    return Array.from(agenciesSet);
  }, [reportsData]);

  // Compute regions list
  const regions = useMemo(() => {
    if (!reportsData.length) return [];
    
    const regionsSet = new Set();
    reportsData.forEach(report => {
      if (report.region) regionsSet.add(report.region);
    });
    
    return Array.from(regionsSet);
  }, [reportsData]);

  // Resolution time analytics
  const resolutionTimeData = useMemo(() => {
    if (!filteredData.length) return { average: null, byAgency: [] };
    
    const resolvedReports = filteredData.filter(report => 
      report.status === 'resolved' && report.created_at && report.resolved_at
    );
    
    if (!resolvedReports.length) return { average: null, byAgency: [] };
    
    let totalDays = 0;
    const agencyTimes = {};
    const agencyCounts = {};
    
    resolvedReports.forEach(report => {
      const createDate = parseReportDate(report.created_at);
      const resolveDate = parseReportDate(report.resolved_at);
      
      const daysDiff = Math.floor((resolveDate - createDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0) {
        totalDays += daysDiff;
        
        if (report.agency) {
          agencyTimes[report.agency] = (agencyTimes[report.agency] || 0) + daysDiff;
          agencyCounts[report.agency] = (agencyCounts[report.agency] || 0) + 1;
        }
      }
    });
    
    const average = totalDays / resolvedReports.length;
    
    const byAgency = Object.keys(agencyTimes).map(agency => ({
      agency,
      avgDays: agencyTimes[agency] / agencyCounts[agency]
    }));
    
    // Sort by average resolution time (ascending)
    byAgency.sort((a, b) => a.avgDays - b.avgDays);
    
    return { average, byAgency };
  }, [filteredData]);

  // Geographical distribution
  const geoDistribution = useMemo(() => {
    if (!filteredData.length) return { markers: [], regionCounts: {} };
    
    const markers = [];
    const regionCounts = {};
    
    filteredData.forEach(report => {
      // Add to region counts
      if (report.region) {
        regionCounts[report.region] = (regionCounts[report.region] || 0) + 1;
      }
      
      // Create marker if coordinates exist
      if (report.latitude && report.longitude) {
        markers.push({
          id: report.id,
          lat: report.latitude,
          lng: report.longitude,
          status: report.status,
          text: report.report_text
        });
      }
    });
    
    return { markers, regionCounts };
  }, [filteredData]);

  // Service types distribution
  const serviceDistribution = useMemo(() => {
    if (!filteredData.length) return [];
    
    const serviceCounts = {};
    
    filteredData.forEach(report => {
      if (report.service) {
        serviceCounts[report.service] = (serviceCounts[report.service] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count
    const serviceArray = Object.keys(serviceCounts).map(service => ({
      service,
      count: serviceCounts[service]
    }));
    
    serviceArray.sort((a, b) => b.count - a.count);
    
    return serviceArray.slice(0, 10); // Top 10 services
  }, [filteredData]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    if (!filteredData.length) return {};
    
    const counts = {
      resolved: 0,
      pending: 0,
      cancelled: 0,
      new: 0
    };
    
    filteredData.forEach(report => {
      if (report.status && counts[report.status] !== undefined) {
        counts[report.status]++;
      }
    });
    
    return counts;
  }, [filteredData]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    if (!filteredData.length) return {};
    
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    filteredData.forEach(report => {
      if (report.importance && counts[report.importance] !== undefined) {
        counts[report.importance]++;
      }
    });
    
    return counts;
  }, [filteredData]);

  // Prepare chart data for resolution time by agency
  const resolutionTimeChartData = {
    labels: resolutionTimeData.byAgency.map(item => item.agency),
    datasets: [
      {
        label: t('analytics.avgResolutionDays'),
        data: resolutionTimeData.byAgency.map(item => item.avgDays),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  // Prepare chart data for service distribution
  const serviceChartData = {
    labels: serviceDistribution.map(item => item.service),
    datasets: [
      {
        label: t('analytics.complaintCount'),
        data: serviceDistribution.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare chart data for status distribution
  const statusChartData = {
    labels: [
      t('status.resolved'),
      t('status.inProgress'),
      t('status.rejected'),
      t('analytics.new')
    ],
    datasets: [
      {
        data: [
          statusDistribution.resolved,
          statusDistribution.pending,
          statusDistribution.cancelled,
          statusDistribution.new
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare chart data for priority distribution
  const priorityChartData = {
    labels: [
      t('status.critical'),
      t('status.high'),
      t('status.medium'),
      t('status.low')
    ],
    datasets: [
      {
        data: [
          priorityDistribution.critical,
          priorityDistribution.high,
          priorityDistribution.medium,
          priorityDistribution.low
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Region distribution chart data
  const regionChartData = {
    labels: Object.keys(geoDistribution.regionCounts),
    datasets: [
      {
        label: t('analytics.complaintCount'),
        data: Object.values(geoDistribution.regionCounts),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  // Calculate map center based on markers
  const mapCenter = useMemo(() => {
    if (!geoDistribution.markers.length) {
      // Default to center of Kyrgyzstan if no markers
      return [41.20438, 74.76609];
    }
    
    const lats = geoDistribution.markers.map(marker => marker.lat);
    const lngs = geoDistribution.markers.map(marker => marker.lng);
    
    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
    
    return [centerLat, centerLng];
  }, [geoDistribution.markers]);

  // Добавляем функцию для обработки клика по метке
  const handleMarkerClick = (marker) => {
    const report = filteredData.find(r => r.id === marker.id);
    if (report) {
      setSelectedReport(report);
      setIsModalOpen(true);
    }
  };

  // Компонент модального окна
  const ReportModal = ({ report, onClose }) => {
    if (!report) return null;

    const getStatusChip = (status) => {
      const statusConfig = {
        pending: { text: 'В ожидании', color: '#ff9800', bgColor: '#fff3e0' },
        resolved: { text: 'Решено', color: '#4caf50', bgColor: '#e8f5e9' },
        cancelled: { text: 'Отменено', color: '#f44336', bgColor: '#ffebee' },
        new: { text: 'Новое', color: '#2196f3', bgColor: '#e3f2fd' }
      };
      
      const config = statusConfig[status] || statusConfig.new;
      
      return (
        <span className="status-chip" style={{ 
          color: config.color, 
          backgroundColor: config.bgColor,
          borderColor: config.color
        }}>
          {config.text}
        </span>
      );
    };

    const getPriorityChip = (priority) => {
      const priorityConfig = {
        critical: { text: 'Критическая', color: '#f44336', bgColor: '#ffebee' },
        high: { text: 'Высокая', color: '#ff9800', bgColor: '#fff3e0' },
        medium: { text: 'Средняя', color: '#2196f3', bgColor: '#e3f2fd' },
        low: { text: 'Низкая', color: '#4caf50', bgColor: '#e8f5e9' }
      };
      
      const config = priorityConfig[priority] || priorityConfig.medium;
      
      return (
        <span className="priority-chip" style={{ 
          color: config.color, 
          backgroundColor: config.bgColor,
          borderColor: config.color
        }}>
          {config.text}
        </span>
      );
    };

    return (
      <div className="report-modal-container">
        <div className="report-modal">
          <button className="close-button" onClick={onClose}>×</button>
          <h3>Детали жалобы</h3>
          <div className="report-details">
            <div className="detail-row">
              <span className="detail-label">Статус:</span>
              <span className="detail-value">
                {getStatusChip(report.status)}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Ведомство:</span>
              <span className="detail-value">{report.agency}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Регион:</span>
              <span className="detail-value">{report.region}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Услуга:</span>
              <span className="detail-value">{report.service}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Важность:</span>
              <span className="detail-value">
                {getPriorityChip(report.importance)}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Дата создания:</span>
              <span className="detail-value">{report.created_at}</span>
            </div>
            
            {report.resolved_at && (
              <div className="detail-row">
                <span className="detail-label">Дата решения:</span>
                <span className="detail-value">{report.resolved_at}</span>
              </div>
            )}
            
            <div className="report-text">
              <div className="detail-label">Описание:</div>
              <div className="detail-value">{report.report_text}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-page">
      <div className="page-title">
        <h1>{t('analytics.title')}</h1>
        <div className="filters-container">
          <div className="filter-group">
            <label>{t('dashboard.period')}:</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="week">{t('analytics.lastWeek')}</option>
              <option value="month">{t('analytics.lastMonth')}</option>
              <option value="quarter">{t('analytics.lastQuarter')}</option>
              <option value="year">{t('analytics.lastYear')}</option>
              <option value="all">{t('analytics.allTime')}</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>{t('complaints.agency')}:</label>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
            >
              <option value="all">{t('complaints.all')}</option>
              {agencies.map(agency => (
                <option key={agency} value={agency}>{agency}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>{t('complaints.region')}:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">{t('complaints.all')}</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('analytics.loading')}</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="analytics-content">
          <div className="stats-overview">
            <div className="stat-card total">
              <div className="stat-value">{filteredData.length}</div>
              <div className="stat-label">{t('analytics.totalComplaints')}</div>
            </div>
            
            <div className="stat-card resolved">
              <div className="stat-value">{statusDistribution.resolved}</div>
              <div className="stat-label">{t('analytics.resolvedComplaints')}</div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-value">{statusDistribution.pending}</div>
              <div className="stat-label">{t('analytics.pendingComplaints')}</div>
            </div>
            
            <div className="stat-card resolution-time">
              <div className="stat-value">
                {resolutionTimeData.average !== undefined && resolutionTimeData.average !== null 
                  ? resolutionTimeData.average.toFixed(1)
                  : t('analytics.noData')}
              </div>
              <div className="stat-label">{t('analytics.avgResolutionDays')}</div>
            </div>
          </div>
          
          <div className="chart-grid">
            <div className="chart-container status-chart">
              <h2>{t('analytics.statusDistribution')}</h2>
              <div className="chart-wrapper">
                <Pie 
                  data={statusChartData}
                  options={{
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      title: {
                        display: false
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>
            
            <div className="chart-container priority-chart">
              <h2>{t('analytics.priorityDistribution')}</h2>
              <div className="chart-wrapper">
                <PolarArea 
                  data={priorityChartData}
                  options={{
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      title: {
                        display: false
                      }
                    },
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>
            
            <div className="chart-container resolution-chart">
              <h2>{t('analytics.resolutionTimeByAgency')}</h2>
              <div className="chart-wrapper">
                {resolutionTimeData.byAgency.length > 0 ? (
                  <Bar 
                    data={resolutionTimeChartData}
                    options={{
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: t('analytics.days')
                          }
                        }
                      },
                      maintainAspectRatio: false
                    }}
                  />
                ) : (
                  <div className="no-data-message">{t('analytics.noResolutionData')}</div>
                )}
              </div>
            </div>
            
            <div className="chart-container service-chart">
              <h2>{t('analytics.topServices')}</h2>
              <div className="chart-wrapper">
                {serviceDistribution.length > 0 ? (
                  <Bar 
                    data={serviceChartData}
                    options={{
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: false
                        }
                      },
                      maintainAspectRatio: false
                    }}
                  />
                ) : (
                  <div className="no-data-message">{t('analytics.noServiceData')}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="geo-section">
            <h2>{t('analytics.geographicDistribution')}</h2>
            
            <div className="geo-container">
              <div className={`map-container ${isMapExpanded ? 'expanded' : ''}`}>
                {geoDistribution.markers.length > 0 ? (
                  <>
                    <button 
                      className="expand-map-button"
                      onClick={() => setIsMapExpanded(!isMapExpanded)}
                    >
                      {isMapExpanded ? <FaCompress /> : <FaExpand />}
                    </button>
                    <Map 
                      height={isMapExpanded ? 800 : 400}
                      center={mapCenter}
                      defaultZoom={7}
                    >
                      <ZoomControl />
                      {geoDistribution.markers.map(marker => (
                        <Marker
                          key={marker.id}
                          width={30}
                          anchor={[marker.lat, marker.lng]}
                          color={
                            marker.status === 'resolved' ? '#4caf50' :
                            marker.status === 'cancelled' ? '#f44336' :
                            '#2196f3'
                          }
                          onClick={() => handleMarkerClick(marker)}
                        />
                      ))}
                    </Map>
                    {isModalOpen && selectedReport && (
                      <ReportModal 
                        report={selectedReport} 
                        onClose={() => {
                          setIsModalOpen(false);
                          setSelectedReport(null);
                        }} 
                      />
                    )}
                  </>
                ) : (
                  <div className="no-data-message">{t('analytics.noGeoData')}</div>
                )}
              </div>
              
              <div className="region-chart">
                <h3>{t('analytics.complaintsByRegion')}</h3>
                {Object.keys(geoDistribution.regionCounts).length > 0 ? (
                  <Bar 
                    data={regionChartData}
                    options={{
                      indexAxis: 'y',
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: false
                        }
                      },
                      maintainAspectRatio: false
                    }}
                  />
                ) : (
                  <div className="no-data-message">{t('analytics.noRegionData')}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="insights-section">
            <h2>{t('analytics.keyInsights')}</h2>
            <div className="insights-container">
              {filteredData.length > 0 ? (
                <>
                  <div className="insight-card">
                    <h3>{t('analytics.mostCommonIssue')}</h3>
                    <p>{serviceDistribution[0]?.service || t('analytics.noData')}</p>
                    <div className="insight-value">{serviceDistribution[0]?.count || 0}</div>
                  </div>
                  
                  <div className="insight-card">
                    <h3>{t('analytics.fastestAgency')}</h3>
                    <p>{resolutionTimeData.byAgency[0]?.agency || t('analytics.noData')}</p>
                    <div className="insight-value">
                      {resolutionTimeData.byAgency[0] ? 
                        `${resolutionTimeData.byAgency[0].avgDays.toFixed(1)} ${t('analytics.days')}` : 
                        t('analytics.noData')
                      }
                    </div>
                  </div>
                  
                  <div className="insight-card">
                    <h3>{t('analytics.slowestAgency')}</h3>
                    <p>{resolutionTimeData.byAgency[resolutionTimeData.byAgency.length - 1]?.agency || t('analytics.noData')}</p>
                    <div className="insight-value">
                      {resolutionTimeData.byAgency.length > 0 ? 
                        `${resolutionTimeData.byAgency[resolutionTimeData.byAgency.length - 1].avgDays.toFixed(1)} ${t('analytics.days')}` : 
                        t('analytics.noData')
                      }
                    </div>
                  </div>
                  
                  <div className="insight-card">
                    <h3>{t('analytics.mostActiveRegion')}</h3>
                    {Object.keys(geoDistribution.regionCounts).length > 0 ? (
                      <>
                        <p>{Object.entries(geoDistribution.regionCounts)
                          .sort((a, b) => b[1] - a[1])[0][0]}</p>
                        <div className="insight-value">
                          {Object.entries(geoDistribution.regionCounts)
                            .sort((a, b) => b[1] - a[1])[0][1]}
                        </div>
                      </>
                    ) : (
                      <p>{t('analytics.noData')}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-data-message">{t('analytics.noDataAvailable')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

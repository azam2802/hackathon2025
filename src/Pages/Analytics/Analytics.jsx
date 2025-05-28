import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './Analytics.scss';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Line, Bar, Pie, PolarArea } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster';
import 'leaflet.heat';

// Fix Leaflet's default icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom marker icons based on status
const createMarkerIcon = (status) => {
  const colors = {
    resolved: '#4caf50',
    cancelled: '#f44336',
    pending: '#ff9800',
    new: '#2196f3'
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${colors[status] || colors.new}; 
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Custom Heatmap Layer component
const HeatmapLayer = ({ points }) => {
  const map = useLeafletMap();
  
  useEffect(() => {
    if (!map || !points.length) return;
    
    const heatmapData = points.map(point => [point.lat, point.lng, 1]);
    const heat = L.heatLayer(heatmapData, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: {
        0.0: 'blue',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    });
    
    heat.addTo(map);
    
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);
  
  return null;
};

// Hook to access map instance
const useLeafletMap = () => {
  const map = useMap();
  return map;
};

// Map Controls Component  
const MapControls = ({ mapFilters, setMapFilters, showHeatmap, setShowHeatmap, showClustering, setShowClustering }) => {
  const { t } = useTranslation();
  
  return (
    <div className="map-controls">
      <div className="map-controls-section">
        <h4>{t('analytics.layerControls')}</h4>
        <div className="control-group">
          <label className="control-item">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
            />
            <span>{t('analytics.showHeatmap')}</span>
          </label>
          <label className="control-item">
            <input
              type="checkbox"
              checked={showClustering}
              onChange={(e) => setShowClustering(e.target.checked)}
            />
            <span>{t('analytics.showClustering')}</span>
          </label>
        </div>
      </div>

      <div className="map-controls-section">
        <h4>{t('analytics.statusFilters')}</h4>
        <div className="control-group">
          <label className="control-item status-resolved">
            <input
              type="checkbox"
              checked={mapFilters.showResolved}
              onChange={(e) => setMapFilters(prev => ({ ...prev, showResolved: e.target.checked }))}
            />
            <span>{t('status.resolved')}</span>
          </label>
          <label className="control-item status-pending">
            <input
              type="checkbox"
              checked={mapFilters.showPending}
              onChange={(e) => setMapFilters(prev => ({ ...prev, showPending: e.target.checked }))}
            />
            <span>{t('status.pending')}</span>
          </label>
          <label className="control-item status-cancelled">
            <input
              type="checkbox"
              checked={mapFilters.showCancelled}
              onChange={(e) => setMapFilters(prev => ({ ...prev, showCancelled: e.target.checked }))}
            />
            <span>{t('status.cancelled')}</span>
          </label>
          <label className="control-item status-new">
            <input
              type="checkbox"
              checked={mapFilters.showNew}
              onChange={(e) => setMapFilters(prev => ({ ...prev, showNew: e.target.checked }))}
            />
            <span>{t('status.new')}</span>
          </label>
        </div>
      </div>

      <div className="map-controls-section">
        <h4>{t('analytics.priorityFilter')}</h4>
        <select
          value={mapFilters.priorityFilter}
          onChange={(e) => setMapFilters(prev => ({ ...prev, priorityFilter: e.target.value }))}
          className="priority-select"
        >
          <option value="all">{t('complaints.all')}</option>
          <option value="critical">{t('status.critical')}</option>
          <option value="high">{t('status.high')}</option>
          <option value="medium">{t('status.medium')}</option>
          <option value="low">{t('status.low')}</option>
        </select>
      </div>
    </div>
  );
};

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
  

  // Map-specific filters
  const [mapFilters, setMapFilters] = useState({
    showResolved: true,
    showPending: true,
    showCancelled: true,
    showNew: true,
    priorityFilter: 'all'
  });
  
  // Map layer controls
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClustering, setShowClustering] = useState(true);

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
    if (!filteredData.length) return { average: 0, byAgency: [] };
    
    const resolvedReports = filteredData.filter(report => 
      report.status === 'resolved' && report.created_at && report.resolved_at
    );
    
    if (!resolvedReports.length) return { average: 0, byAgency: [] };
    
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
          text: report.report_text,
          service: report.service,
          agency: report.agency,
          region: report.region,
          importance: report.importance,
          created_at: report.created_at
        });
      }
    });
    
    return { markers, regionCounts };
  }, [filteredData]);

  // Filter markers based on map-specific filters
  const visibleMarkers = useMemo(() => {
    return geoDistribution.markers.filter(marker => {
      // Filter by status
      if (!mapFilters.showResolved && marker.status === 'resolved') return false;
      if (!mapFilters.showPending && marker.status === 'pending') return false;
      if (!mapFilters.showCancelled && marker.status === 'cancelled') return false;
      if (!mapFilters.showNew && marker.status === 'new') return false;
      
      // Filter by priority
      if (mapFilters.priorityFilter !== 'all' && marker.importance !== mapFilters.priorityFilter) {
        return false;
      }
      
      return true;
    });
  }, [geoDistribution.markers, mapFilters]);

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

  // Calculate map center based on visible markers
  const mapCenter = useMemo(() => {
    if (!visibleMarkers.length) {
      // Default to center of Kyrgyzstan if no markers
      return [41.20438, 74.76609];
    }
    
    const lats = visibleMarkers.map(marker => marker.lat);
    const lngs = visibleMarkers.map(marker => marker.lng);
    
    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
    
    return [centerLat, centerLng];
  }, [visibleMarkers]);

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
              <div className="stat-value">{resolutionTimeData.average.toFixed(1)}</div>
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
              <div className="map-section">
                <div className="map-controls">
                  <div className="map-controls-section">
                    <h4>{t('analytics.layerControls')}</h4>
                    <div className="control-group">
                      <label className="control-item">
                        <input
                          type="checkbox"
                          checked={showHeatmap}
                          onChange={(e) => setShowHeatmap(e.target.checked)}
                        />
                        <span>{t('analytics.showHeatmap')}</span>
                      </label>
                      <label className="control-item">
                        <input
                          type="checkbox"
                          checked={showClustering}
                          onChange={(e) => setShowClustering(e.target.checked)}
                        />
                        <span>{t('analytics.showClustering')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="map-controls-section">
                    <h4>{t('analytics.statusFilters')}</h4>
                    <div className="control-group">
                      <label className="control-item status-resolved">
                        <input
                          type="checkbox"
                          checked={mapFilters.showResolved}
                          onChange={(e) => setMapFilters(prev => ({ ...prev, showResolved: e.target.checked }))}
                        />
                        <span>{t('status.resolved')}</span>
                      </label>
                      <label className="control-item status-pending">
                        <input
                          type="checkbox"
                          checked={mapFilters.showPending}
                          onChange={(e) => setMapFilters(prev => ({ ...prev, showPending: e.target.checked }))}
                        />
                        <span>{t('status.pending')}</span>
                      </label>
                      <label className="control-item status-cancelled">
                        <input
                          type="checkbox"
                          checked={mapFilters.showCancelled}
                          onChange={(e) => setMapFilters(prev => ({ ...prev, showCancelled: e.target.checked }))}
                        />
                        <span>{t('status.cancelled')}</span>
                      </label>
                      <label className="control-item status-new">
                        <input
                          type="checkbox"
                          checked={mapFilters.showNew}
                          onChange={(e) => setMapFilters(prev => ({ ...prev, showNew: e.target.checked }))}
                        />
                        <span>{t('status.new')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="map-controls-section">
                    <h4>{t('analytics.priorityFilter')}</h4>
                    <select
                      value={mapFilters.priorityFilter}
                      onChange={(e) => setMapFilters(prev => ({ ...prev, priorityFilter: e.target.value }))}
                      className="priority-select"
                    >
                      <option value="all">{t('complaints.all')}</option>
                      <option value="critical">{t('status.critical')}</option>
                      <option value="high">{t('status.high')}</option>
                      <option value="medium">{t('status.medium')}</option>
                      <option value="low">{t('status.low')}</option>
                    </select>
                  </div>
                </div>  
                
                <div className="map-container">
                  {visibleMarkers.length > 0 ? (
                    <MapContainer 
                      center={mapCenter} 
                      zoom={7} 
                      style={{ height: '400px', width: '100%' }}
                      zoomControl={true}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {/* Heatmap Layer */}
                      {showHeatmap && <HeatmapLayer points={visibleMarkers} />}
                      
                      {/* Markers with optional clustering */}
                      {showClustering ? (
                        <MarkerClusterGroup>
                          {visibleMarkers.map(marker => (
                            <Marker
                              key={marker.id}
                              position={[marker.lat, marker.lng]}
                              icon={createMarkerIcon(marker.status)}
                            >
                              <Popup maxWidth={300}>
                                <div className="marker-popup">
                                  <h4>{marker.service || t('analytics.unknownService')}</h4>
                                  <p><strong>{t('analytics.status')}:</strong> 
                                    <span className={`status-badge ${marker.status}`}>
                                      {t(`status.${marker.status}`)}
                                    </span>
                                  </p>
                                  {marker.agency && (
                                    <p><strong>{t('complaints.agency')}:</strong> {marker.agency}</p>
                                  )}
                                  {marker.region && (
                                    <p><strong>{t('complaints.region')}:</strong> {marker.region}</p>
                                  )}
                                  {marker.importance && (
                                    <p><strong>{t('complaints.importance')}:</strong> 
                                      <span className={`priority ${marker.importance}`}>
                                        {t(`status.${marker.importance}`)}
                                      </span>
                                    </p>
                                  )}
                                  {marker.text && (
                                    <p><strong>{t('analytics.description')}:</strong> 
                                      {marker.text.substring(0, 150)}
                                      {marker.text.length > 150 ? '...' : ''}
                                    </p>
                                  )}
                                  {marker.created_at && (
                                    <p><strong>{t('analytics.created')}:</strong> {marker.created_at}</p>
                                  )}
                                </div>
                              </Popup>
                            </Marker>
                          ))}
                        </MarkerClusterGroup>
                      ) : (
                        visibleMarkers.map(marker => (
                          <Marker
                            key={marker.id}
                            position={[marker.lat, marker.lng]}
                            icon={createMarkerIcon(marker.status)}
                          >
                            <Popup maxWidth={300}>
                              <div className="marker-popup">
                                <h4>{marker.service || t('analytics.unknownService')}</h4>
                                <p><strong>{t('analytics.status')}:</strong> 
                                  <span className={`status-badge ${marker.status}`}>
                                    {t(`status.${marker.status}`)}
                                  </span>
                                </p>
                                {marker.agency && (
                                  <p><strong>{t('complaints.agency')}:</strong> {marker.agency}</p>
                                )}
                                {marker.region && (
                                  <p><strong>{t('complaints.region')}:</strong> {marker.region}</p>
                                )}
                                {marker.importance && (
                                  <p><strong>{t('complaints.importance')}:</strong> 
                                    <span className={`priority ${marker.importance}`}>
                                      {t(`status.${marker.importance}`)}
                                    </span>
                                  </p>
                                )}
                                {marker.text && (
                                  <p><strong>{t('analytics.description')}:</strong> 
                                    {marker.text.substring(0, 150)}
                                    {marker.text.length > 150 ? '...' : ''}
                                  </p>
                                )}
                                {marker.created_at && (
                                  <p><strong>{t('analytics.created')}:</strong> {marker.created_at}</p>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        ))
                      )}
                    </MapContainer>
                  ) : (
                    <div className="no-data-message">{t('analytics.noGeoData')}</div>
                  )}
                </div>
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

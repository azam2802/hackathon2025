import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const center = {
  lat: 41.3111, // Центр Кыргызстана
  lng: 74.1917
};

const libraries = ['visualization'];

// Функция для определения цвета маркера в зависимости от количества жалоб
const getMarkerColor = (count) => {
  if (count >= 100) return '🔴'; // Красный для большого количества
  if (count >= 50) return '🟠';  // Оранжевый для среднего количества
  return '🟡';                   // Желтый для малого количества
};

const ComplaintsMap = ({ complaints }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "",
    libraries: libraries
  });

  const [map, setMap] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onMarkerClick = useCallback((complaint) => {
    setSelectedMarker(complaint);
  }, []);

  if (!isLoaded) {
    return <div className="map-loading">Загрузка карты...</div>;
  }

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={7}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#7c93a3' }]
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { weight: 2 }]
            }
          ]
        }}
      >
        {complaints?.map((complaint, index) => (
          <Marker
            key={index}
            position={{ lat: complaint.latitude, lng: complaint.longitude }}
            onClick={() => onMarkerClick(complaint)}
            label={{
              text: getMarkerColor(complaint.count),
              fontSize: '20px',
              fontWeight: 'bold'
            }}
          />
        ))}
      </GoogleMap>
      
      {selectedMarker && (
        <div className="marker-info">
          <h3>{selectedMarker.title}</h3>
          <p>Количество жалоб: {selectedMarker.count}</p>
        </div>
      )}
    </div>
  );
};

export default ComplaintsMap; 
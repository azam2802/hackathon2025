import { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000'

export const useComplaintApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitComplaint = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Сначала получаем координаты по адресу
      const query = new URLSearchParams({
  address: formData.address,
  city: formData.city,
  region: formData.region,
}).toString();

const geocodeResponse = await fetch(`${API_BASE_URL}/api/geocode/?${query}`, {
  method: 'GET',
});


      if (!geocodeResponse.ok) {
        throw new Error('Ошибка при получении координат');
      }

      const geocodeData = await geocodeResponse.json();

      // Подготавливаем данные для отправки жалобы
      const complaintData = {
        ...formData,
        latitude: geocodeData.latitude,
        longitude: geocodeData.longitude,
        contact_info: [formData.full_name, formData.phone, formData.email]
          .filter(Boolean)
          .join(', ') || null,
        created_at: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'pending',
        submission_source: 'website',
        location_source: 'geocoded',
        service: 'default',
        agency: 'default'
      };

      // Отправляем жалобу
      const response = await fetch(`${API_BASE_URL}/api/reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке жалобы');
      }

      const data = await response.json();
      return data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitComplaint,
    isLoading,
    error
  };
}; 
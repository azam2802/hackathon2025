import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './ComplaintModal.scss';

const ComplaintModal = ({ complaint, isOpen, onClose, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    importance: '',
    notes: ''
  });
  
  useEffect(() => {
    if (complaint) {
      setFormData({
        status: complaint.status || '',
        importance: complaint.importance || '',
        notes: complaint.notes || ''
      });
    }
  }, [complaint]);
  
  if (!isOpen || !complaint) return null;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Обновляем документ в Firestore
      const complaintRef = doc(db, 'reports', complaint.id);
      
      // Подготавливаем данные для обновления
      const updateData = {};
      
      // Добавляем только измененные поля
      if (formData.status !== complaint.status) {
        updateData.status = formData.status;
        
        // Если статус изменен на "resolved", добавляем дату разрешения
        if (formData.status === 'resolved') {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          
          updateData.resolved_at = `${day}.${month}.${year} ${hours}:${minutes}`;
        }
      }
      
      if (formData.importance !== complaint.importance) {
        updateData.importance = formData.importance;
      }
      
      if (formData.notes !== complaint.notes) {
        updateData.notes = formData.notes;
      }
      
      // Если есть что обновлять
      if (Object.keys(updateData).length > 0) {
        await updateDoc(complaintRef, updateData);
        
        // Вызываем коллбэк обновления с обновленными данными
        if (onUpdate) {
          onUpdate({
            ...updateData,
            id: complaint.id
          });
        }
      }
      
      // Закрываем модальное окно
      onClose();
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Ошибка при обновлении обращения: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Форматируем координаты
  const formatCoordinates = () => {
    if (!complaint.latitude || !complaint.longitude) return 'Не указаны';
    return `${complaint.latitude.toFixed(6)}, ${complaint.longitude.toFixed(6)}`;
  };
  
  // Получаем приоритет в виде текста
  const getPriorityText = (priority) => {
    switch(priority) {
      case 'critical': return 'Критический';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Не указан';
    }
  };
  
  // Получаем статус в виде текста
  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'В работе';
      case 'resolved': return 'Решено';
      case 'cancelled': return 'Отменено';
      default: return 'Не указан';
    }
  };
  
  // Рендерим модальное окно через портал в корень документа
  return createPortal(
    <div className={`complaint-modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Обращение #{complaint.id.substring(0, 5)}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="complaint-info">
            <div className="info-section">
              <h3>Основная информация</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">ID:</span>
                  <span className="value">{complaint.id}</span>
                </div>
                <div className="info-item">
                  <span className="label">Дата создания:</span>
                  <span className="value">{complaint.created_at || 'Не указана'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Дата разрешения:</span>
                  <span className="value">{complaint.resolved_at || 'Не разрешено'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Услуга:</span>
                  <span className="value">{complaint.service || 'Не указана'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Ведомство:</span>
                  <span className="value">{complaint.agency || 'Не указано'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Тип обращения:</span>
                  <span className="value">{complaint.report_type || 'Не указан'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Источник:</span>
                  <span className="value">{complaint.submission_source || 'Не указан'}</span>
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Текст обращения</h3>
              <div className="complaint-text">
                {complaint.report_text || 'Текст обращения отсутствует'}
              </div>
            </div>
            
            <div className="info-section">
              <h3>Информация о заявителе</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Контакт:</span>
                  <span className="value">{complaint.contact_info || 'Не указан'}</span>
                </div>
                {complaint.telegram_username && (
                  <div className="info-item">
                    <span className="label">Telegram:</span>
                    <span className="value">{complaint.telegram_username}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">Язык:</span>
                  <span className="value">{complaint.language || 'Не указан'}</span>
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Местоположение</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Адрес:</span>
                  <span className="value">{complaint.address || 'Не указан'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Город:</span>
                  <span className="value">{complaint.city || 'Не указан'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Регион:</span>
                  <span className="value">{complaint.region || 'Не указан'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Координаты:</span>
                  <span className="value">{formatCoordinates()}</span>
                </div>
                <div className="info-item">
                  <span className="label">Источник координат:</span>
                  <span className="value">{complaint.location_source || 'Не указан'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <form className="edit-form" onSubmit={handleSubmit}>
            <h3>Обработка обращения</h3>
            <div className="form-group">
              <label htmlFor="status">Статус:</label>
              <select 
                id="status" 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange}
                className={formData.status !== complaint.status ? 'changed' : ''}
              >
                <option value="">Выберите статус</option>
                <option value="pending">В работе</option>
                <option value="resolved">Решено</option>
                <option value="cancelled">Отменено</option>
              </select>
              {formData.status !== complaint.status && (
                <div className="change-indicator">
                  <span>Текущий статус: {getStatusText(complaint.status)}</span>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="importance">Приоритет:</label>
              <select 
                id="importance" 
                name="importance" 
                value={formData.importance} 
                onChange={handleInputChange}
                className={formData.importance !== complaint.importance ? 'changed' : ''}
              >
                <option value="">Выберите приоритет</option>
                <option value="critical">Критический</option>
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
              {formData.importance !== complaint.importance && (
                <div className="change-indicator">
                  <span>Текущий приоритет: {getPriorityText(complaint.importance)}</span>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Примечания:</label>
              <textarea 
                id="notes" 
                name="notes" 
                value={formData.notes} 
                onChange={handleInputChange}
                placeholder="Добавьте примечания к обращению"
                className={formData.notes !== complaint.notes ? 'changed' : ''}
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={onClose}
                disabled={isLoading}
              >
                Отмена
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading || (
                  formData.status === complaint.status && 
                  formData.importance === complaint.importance && 
                  formData.notes === complaint.notes
                )}
              >
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body // Рендерим прямо в body, чтобы избежать проблем с z-index и overflow
  );
};

export default ComplaintModal; 
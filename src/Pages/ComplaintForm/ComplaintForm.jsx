import React, { useState, useEffect } from 'react';
import './ComplaintForm.scss';
import ParticlesBackground from '../../Components/ParticlesBackground/ParticlesBackground';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  Assignment, 
  LocationOn, 
  ContactMail, 
  CheckCircle,
  Home,
  Feedback,
  Person,
  Phone,
  Email
} from '@mui/icons-material';

const ComplaintForm = () => {
  const [formData, setFormData] = useState({
    report_text: '',
    recommendations: '',
    report_type: 'Жалоба',
    region: '',
    city: '',
    address: '',
    full_name: '',
    phone: '',
    email: '',
    importance: 'medium',
    language: 'ru'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
    });
  }, []);

  const REGIONS_CITIES = {
    "Бишкек": ["Бишкек"],
    "Ош": ["Ош"],
    "Чуйская область": [
      "Токмок", "Кант", "Кара-Балта", "Шопоков", "Беловодское", 
      "Сокулук", "Жайыл", "Кемин", "Панфилов", "Московский"
    ],
    "Ошская область": [
      "Узген", "Кара-Суу", "Ноокат", "Кара-Кульджа", "Араван", 
      "Чон-Алай", "Алай", "Кызыл-Кия"
    ],
    "Джалал-Абадская область": [
      "Джалал-Абад", "Кербен", "Майлуу-Суу", "Таш-Кумыр", 
      "Кок-Жангак", "Казарман", "Чаткал", "Токтогул"
    ],
    "Баткенская область": [
      "Баткен", "Сулюкта", "Кызыл-Кия", "Кадамжай", 
      "Лейлек", "Кадамжай"
    ],
    "Нарынская область": [
      "Нарын", "Ат-Башы", "Жумгал", "Кочкор", "Ак-Талаа"
    ],
    "Иссык-Кульская область": [
      "Каракол", "Балыкчы", "Чолпон-Ата", "Кызыл-Суу", 
      "Тюп", "Ак-Суу", "Жети-Огуз", "Тон"
    ],
    "Таласская область": [
      "Талас", "Кара-Буура", "Бакай-Ата", "Манас", "Кызыл-Адыр"
    ]
  };

  const regions = Object.keys(REGIONS_CITIES);

  const reportTypes = [
    'Жалоба',
    'Рекомендации',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset city when region changes
      ...(name === 'region' && { city: '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Имитация отправки формы (здесь будет ваша логика API)
    try {
      // Создаем объект с данными как в telegram боте
      const complaintData = {
        ...formData,
        // Объединяем контактную информацию для совместимости с telegram форматом
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
        location_source: 'manual_input',
        latitude: null,
        longitude: null,
        // Устанавливаем значения по умолчанию для отсутствующих полей
        service: 'Общее обращение',
        agency: 'Не указано'
      };

      console.log('Submitting complaint:', complaintData);
      
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      
      // Сброс формы
      setFormData({
        report_text: '',
        recommendations: '',
        report_type: 'Жалоба',
        region: '',
        city: '',
        address: '',
        full_name: '',
        phone: '',
        email: '',
        importance: 'medium',
        language: 'ru'
      });

    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Произошла ошибка при отправке обращения. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="complaint-form-page">
        <ParticlesBackground />
        <div className="success-screen" data-aos="fade-in">
          <div className="success-icon">
            <CheckCircle style={{ fontSize: '4rem', color: '#10b981' }} />
          </div>
          <h1>Обращение отправлено!</h1>
          <p>Ваше обращение успешно зарегистрировано и передано в соответствующие органы.</p>
          <p>Номер вашего обращения: <strong>#{Math.random().toString(36).substr(2, 9).toUpperCase()}</strong></p>
          <div className="success-actions">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowSuccess(false)}
            >
              <Assignment style={{ marginRight: '8px', fontSize: '1.2rem' }} />
              Подать еще одно обращение
            </button>
            <a href="/landing" className="btn btn-outline">
              <Home style={{ marginRight: '8px', fontSize: '1.2rem' }} />
              Вернуться на главную
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="complaint-form-page">
      <ParticlesBackground />
      <div className="form-header" data-aos="fade-down">
        <div className="header-logo">
          <img src="/logo-gov.svg" alt="PublicPulse" />
          <span>PublicPulse</span>
        </div>
        <h1>Подача обращения</h1>
        <p>Заполните форму ниже, чтобы подать обращение или жалобу</p>
      </div>

      <form className="complaint-form" onSubmit={handleSubmit} data-aos="fade-up">
        <div className="form-section">
          <h3>
            <Assignment style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            Тип обращения
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="report_type">Тип обращения *</label>
              <select
                id="report_type"
                name="report_type"
                value={formData.report_type}
                onChange={handleInputChange}
                required
              >
                {reportTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {formData.report_type !== 'Рекомендации' && (
          <div className="form-section" data-aos="fade-up" data-aos-delay="100">
            <h3>
              <Feedback style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
              Описание проблемы
            </h3>
            <div className="form-group">
              <label htmlFor="report_text">Опишите вашу проблему или предложение *</label>
              <textarea
                id="report_text"
                name="report_text"
                value={formData.report_text}
                onChange={handleInputChange}
                placeholder="Детально опишите вашу проблему, предложение или жалобу..."
                rows="6"
                required
              />
            </div>
          </div>
        )}

        <div className="form-section" data-aos="fade-up" data-aos-delay="200">
          <h3>
            <Feedback style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            {formData.report_type === 'Рекомендации' ? 'Рекомендации' : 'Рекомендации по решению'}
          </h3>
          <div className="form-group">
            <label htmlFor="recommendations">
              {formData.report_type === 'Рекомендации' 
                ? 'Опишите ваши рекомендации *' 
                : 'Предложите решение проблемы (необязательно)'
              }
            </label>
            <textarea
              id="recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              placeholder={
                formData.report_type === 'Рекомендации'
                  ? "Детально опишите ваши рекомендации..."
                  : "Если у вас есть идеи о том, как можно решить эту проблему, опишите их здесь..."
              }
              rows={formData.report_type === 'Рекомендации' ? "6" : "4"}
              required={formData.report_type === 'Рекомендации'}
            />
          </div>
        </div>

        <div className="form-section" data-aos="fade-up" data-aos-delay="300">
          <h3>
            <LocationOn style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            Местоположение
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="region">Регион *</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите регион</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="city">Город/населенный пункт *</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                disabled={!formData.region}
              >
                <option value="">
                  {formData.region ? "Выберите город" : "Сначала выберите регион"}
                </option>
                {formData.region && REGIONS_CITIES[formData.region]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address">Адрес (необязательно)</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Укажите конкретный адрес, если необходимо"
            />
          </div>
        </div>

        <div className="form-section" data-aos="fade-up" data-aos-delay="400">
          <h3>
            <ContactMail style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            Контактная информация
          </h3>
          <div className="form-group">
            <label htmlFor="email">
              <Email style={{ marginRight: '4px', fontSize: '1rem', verticalAlign: 'middle' }} />
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="full_name">
              <Person style={{ marginRight: '4px', fontSize: '1rem', verticalAlign: 'middle' }} />
              ФИО (необязательно)
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Укажите ваше полное имя"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">
              <Phone style={{ marginRight: '4px', fontSize: '1rem', verticalAlign: 'middle' }} />
              Телефон (необязательно)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+996 XXX XXX XXX"
            />
          </div>
          <small className="form-hint">
            Email обязателен для получения уведомлений о статусе вашего обращения
          </small>
        </div>

        <div className="form-actions" data-aos="fade-up" data-aos-delay="500">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить обращение'}
          </button>
          <a href="/landing" className="btn btn-outline">
            <Home style={{ marginRight: '8px', fontSize: '1.2rem' }} />
            Отмена
          </a>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;

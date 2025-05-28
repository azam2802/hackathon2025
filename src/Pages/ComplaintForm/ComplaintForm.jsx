import React, { useState, useEffect } from 'react';
import './ComplaintForm.scss';
import ParticlesBackground from '../../Components/ParticlesBackground/ParticlesBackground';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTranslation } from 'react-i18next';
import { useComplaintApi } from '../../hooks/useComplaintApi';
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
import { 
  getTranslatedRegions, 
  getTranslatedCityName 
} from '../../utils/translationMappings';

const ComplaintForm = () => {
  const { t } = useTranslation();
  const { submitComplaint, isLoading, error } = useComplaintApi();
  const [formData, setFormData] = useState({
    report_text: '',
    recommendations: '',
    report_type: t('complaintForm.reportTypeComplaint'),
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

  const regions = getTranslatedRegions(t);

  const reportTypes = [
    t('complaintForm.reportTypeComplaint'),
    t('complaintForm.reportTypeRecommendation'),
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

    try {
      const result = await submitComplaint(formData);
      console.log('Жалоба успешно отправлена:', result);
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        report_text: '',
        recommendations: '',
        report_type: t('complaintForm.reportTypeComplaint'),
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
      console.error('Ошибка при отправке жалобы:', error);
      alert(t('complaintForm.errorMessage'));
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
          <h1>{t('complaintForm.successTitle')}</h1>
          <p>{t('complaintForm.successMessage')}</p>
          <p>{t('complaintForm.successNumber')} <strong>#{Math.random().toString(36).substr(2, 9).toUpperCase()}</strong></p>
          <div className="success-actions">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowSuccess(false)}
            >
              <Assignment style={{ marginRight: '8px', fontSize: '1.2rem' }} />
              {t('complaintForm.submitAnother')}
            </button>
            <a href="/" className="btn btn-outline">
              <Home style={{ marginRight: '8px', fontSize: '1.2rem' }} />
              {t('complaintForm.backToHome')}
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
        <h1>{t('complaintForm.pageTitle')}</h1>
        <p>{t('complaintForm.pageDescription')}</p>
      </div>

      <form className="complaint-form" onSubmit={handleSubmit} data-aos="fade-up">
        <div className="form-section">
          <h3>
            <Assignment style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            {t('complaintForm.reportTypeSectionTitle')}
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="report_type">{t('complaintForm.reportTypeLabel')}</label>
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

        {formData.report_type !== t('complaintForm.reportTypeRecommendation') && (
          <div className="form-section" data-aos="fade-up" data-aos-delay="100">
            <h3>
              <Feedback style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
              {t('complaintForm.problemDescriptionTitle')}
            </h3>
            <div className="form-group">
              <label htmlFor="report_text">{t('complaintForm.problemDescriptionLabel')}</label>
              <textarea
                id="report_text"
                name="report_text"
                value={formData.report_text}
                onChange={handleInputChange}
                placeholder={t('complaintForm.problemDescriptionPlaceholder')}
                rows="6"
                required
              />
            </div>
          </div>
        )}

        <div className="form-section" data-aos="fade-up" data-aos-delay="200">
          <h3>
            <Feedback style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            {formData.report_type === t('complaintForm.reportTypeRecommendation') ? t('complaintForm.recommendationsTitle') : t('complaintForm.recommendationsSolutionTitle')}
          </h3>
          <div className="form-group">
            <label htmlFor="recommendations">
              {formData.report_type === t('complaintForm.reportTypeRecommendation')
                ? t('complaintForm.recommendationsLabel') 
                : t('complaintForm.recommendationsSolutionLabel')
              }
            </label>
            <textarea
              id="recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              placeholder={
                formData.report_type === t('complaintForm.reportTypeRecommendation')
                  ? t('complaintForm.recommendationsPlaceholder')
                  : t('complaintForm.recommendationsSolutionPlaceholder')
              }
              rows={formData.report_type === t('complaintForm.reportTypeRecommendation') ? "6" : "4"}
              required={formData.report_type === t('complaintForm.reportTypeRecommendation')}
            />
          </div>
        </div>

        <div className="form-section" data-aos="fade-up" data-aos-delay="300">
          <h3>
            <LocationOn style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            {t('complaintForm.locationTitle')}
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="region">{t('complaintForm.regionLabel')}</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('complaintForm.selectRegion')}</option>
                {regions.map(region => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="city">{t('complaintForm.cityLabel')}</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                disabled={!formData.region}
              >
                <option value="">
                  {formData.region ? t('complaintForm.selectCity') : t('complaintForm.selectRegionFirst')}
                </option>
                {formData.region && REGIONS_CITIES[formData.region]?.map(city => (
                  <option key={city} value={city}>{getTranslatedCityName(city, t)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address">{t('complaintForm.addressLabel')}</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder={t('complaintForm.addressPlaceholder')}
            />
          </div>
        </div>

        <div className="form-section" data-aos="fade-up" data-aos-delay="400">
          <h3>
            <ContactMail style={{ marginRight: '8px', fontSize: '1.5rem', color: '#667eea' }} />
            {t('complaintForm.contactInfoTitle')}
          </h3>
          <div className="form-group">
            <label htmlFor="email">
              <Email style={{ marginRight: '4px', fontSize: '1rem', verticalAlign: 'middle' }} />
              {t('complaintForm.emailLabel')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('complaintForm.emailPlaceholder')}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="full_name">
              <Person style={{ marginRight: '4px', fontSize: '1rem', verticalAlign: 'middle' }} />
              {t('complaintForm.fullNameLabel')}
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder={t('complaintForm.fullNamePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">
              <Phone style={{ marginRight: '4px', fontSize: '1rem', verticalAlign: 'middle' }} />
              {t('complaintForm.phoneLabel')}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={t('complaintForm.phonePlaceholder')}
            />
          </div>
          <small className="form-hint">
            {t('complaintForm.emailHint')}
          </small>
        </div>

        <div className="form-actions" data-aos="fade-up" data-aos-delay="500">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('complaintForm.submitting') : t('complaintForm.submitButton')}
          </button>
          <a href="/" className="btn btn-outline">
            <Home style={{ marginRight: '8px', fontSize: '1.2rem' }} />
            {t('complaintForm.cancelButton')}
          </a>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;

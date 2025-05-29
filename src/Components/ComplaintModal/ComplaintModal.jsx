import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import "./ComplaintModal.scss";
import { useTranslation } from "react-i18next";

// Функция для парсинга даты из разных форматов
const parseDate = (dateString) => {
  if (!dateString) return null;

  let parsedDate;

  // Проверяем формат даты "dd.MM.YYYY HH:mm"
  if (dateString.includes(".")) {
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart
      .split(".")
      .map((num) => parseInt(num, 10));

    if (timePart) {
      const [hours, minutes] = timePart
        .split(":")
        .map((num) => parseInt(num, 10));
      parsedDate = new Date(year, month - 1, day, hours, minutes);
    } else {
      parsedDate = new Date(year, month - 1, day);
    }
  }
  // Проверяем формат даты "dd-MM-YYYY" или "YYYY-MM-DD"
  else if (dateString.includes("-")) {
    // Проверяем, не является ли это ISO форматом (YYYY-MM-DD)
    const parts = dateString.split("-");
    if (parts.length === 3) {
      // Если первая часть - год (4 цифры)
      if (parts[0].length === 4) {
        // ISO формат (YYYY-MM-DD)
        const [year, month, day] = parts.map((num) => parseInt(num, 10));
        parsedDate = new Date(year, month - 1, day);
      } else {
        // Наш формат (DD-MM-YYYY)
        const [day, month, year] = parts.map((num) => parseInt(num, 10));
        parsedDate = new Date(year, month - 1, day);
      }
    }
  }
  // Пробуем стандартный парсинг для ISO и других форматов
  else {
    parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      return null;
    }
  }

  // Проверяем валидность даты
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const ComplaintModal = ({ complaint, isOpen, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    importance: "",
    notes: "",
  });

  useEffect(() => {
    if (complaint) {
      setFormData({
        status: complaint.status || "",
        importance: complaint.importance || "",
        notes: complaint.notes || "",
      });
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Обновляем документ в Firestore
      const complaintRef = doc(db, "reports", complaint.id);

      // Подготавливаем данные для обновления
      const updateData = {};

      // Добавляем только измененные поля
      if (formData.status !== complaint.status) {
        updateData.status = formData.status;

        // Если статус изменен на "resolved", добавляем дату разрешения
        if (formData.status === "resolved") {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, "0");
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const year = now.getFullYear();
          const hours = String(now.getHours()).padStart(2, "0");
          const minutes = String(now.getMinutes()).padStart(2, "0");

          updateData.resolved_at = `${day}.${month}.${year} ${hours}:${minutes}`;
        }
        
        // Отправляем уведомления пользователю
        if (formData.status === 'resolved' || formData.status === 'cancelled' || formData.status === 'pending') {
          // Отправляем уведомление через Telegram бота для telegram пользователей
          if (complaint.telegram_user_id) {
            try {
              const response = await fetch('https://publicpulse-front-739844766362.asia-southeast2.run.app/api/notify-status-update', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  report_id: complaint.id,
                  content: complaint.report_text,
                  status: formData.status,
                  notes: formData.notes || '',
                  telegram_user_id: complaint.telegram_user_id,
                  language: complaint.language || 'ru'
                }),
              });
              
              if (!response.ok) {
                console.error('Failed to send Telegram notification:', await response.text());
              }
            } catch (error) {
              console.error('Error sending Telegram notification:', error);
            }
          }
          
          // Отправляем уведомление по email для website и mobile submissions
          if (complaint.submission_source === 'website' || complaint.submission_source === 'mobile') {
            try {
              const response = await fetch('https://publicpulse-back-739844766362.asia-southeast2.run.app/api/send-status-email/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  complaint_id: complaint.id,
                  status: formData.status,
                  notes: formData.notes || '',
                  language: complaint.language || 'ru'
                }),
              });
              
              if (!response.ok) {
                console.error('Failed to send email notification:', await response.text());
              } else {
                console.log('Email notification sent successfully');
              }
            } catch (error) {
              console.error('Error sending email notification:', error);
            }
            
            // Уведомляем Django admin о изменении статуса через webhook
            try {
              const webhookResponse = await fetch('https://publicpulse-back-739844766362.asia-southeast2.run.app/api/firestore-webhook/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  document_id: complaint.id,
                  action: 'update',
                  data: { ...complaint, status: formData.status, notes: formData.notes },
                  old_data: { status: complaint.status }
                }),
              });
              
              if (!webhookResponse.ok) {
                console.error('Failed to notify Django admin webhook:', await webhookResponse.text());
              } else {
                console.log('Django admin webhook notified successfully');
              }
            } catch (error) {
              console.error('Error calling Django admin webhook:', error);
            }
          }
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
            id: complaint.id,
          });
        }
      }

      // Закрываем модальное окно
      onClose();
    } catch (error) {
      console.error("Error updating complaint:", error);
      alert(t("complaints.updateError") + ": " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Форматируем координаты
  const formatCoordinates = () => {
    if (!complaint.latitude || !complaint.longitude)
      return t("complaints.notSpecified");
    return `${complaint.latitude.toFixed(6)}, ${complaint.longitude.toFixed(
      6
    )}`;
  };

  // Получаем приоритет в виде текста
  const getPriorityText = (priority) => {
    switch (priority) {
      case "critical":
        return t("status.critical");
      case "high":
        return t("status.high");
      case "medium":
        return t("status.medium");
      case "low":
        return t("status.low");
      default:
        return t("complaints.notSpecified");
    }
  };

  // Получаем статус в виде текста
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return t("status.inProgress");
      case "resolved":
        return t("status.resolved");
      case "cancelled":
        return t("status.rejected");
      default:
        return t("complaints.notSpecified");
    }
  };

  // Проверяем, просрочено ли обращение
  const isOverdue = () => {
    if (
      !complaint ||
      !complaint.created_at ||
      complaint.status === "resolved" ||
      complaint.status === "cancelled"
    ) {
      return false;
    }

    const createdDate = parseDate(complaint.created_at);
    if (!createdDate) return false;

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return createdDate <= monthAgo;
  };

  // Функция для расчета количества прошедших дней
  const getDaysPassed = () => {
    if (!complaint || !complaint.created_at) return 0;

    const createdDate = parseDate(complaint.created_at);
    if (!createdDate) return 0;

    const today = new Date();
    return Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
  };

  // Функция для форматирования срока просрочки
  const formatDaysPassed = (days) => {
    if (!days) return "";

    return `${days} ${t("complaints.days")}`;
  };

  // Рендерим модальное окно через портал в корень документа
  return createPortal(
    <div className={`complaint-modal ${isOpen ? "open" : ""}`}>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {t("complaints.complaint")} #{complaint.id.substring(0, 5)}
          </h2>
          {isOverdue() && (
            <div className="overdue-badge">
              {t("complaints.overdueBy")} {formatDaysPassed(getDaysPassed())}
            </div>
          )}
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="complaint-info">
            <div className="info-section">
              <h3>{t("complaints.basicInfo")}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">ID:</span>
                  <span className="value">{complaint.id}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t("complaints.creationDate")}:</span>
                  <span className="value">
                    {complaint.created_at || t("complaints.notSpecified")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">
                    {t("complaints.resolutionDate")}:
                  </span>
                  <span className="value">
                    {complaint.resolved_at || t("complaints.notResolved")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">{t("complaints.service")}:</span>
                  <span className="value">
                    {complaint.service || t("complaints.notSpecified")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">{t("complaints.agency")}:</span>
                  <span className="value">
                    {complaint.agency || t("complaints.notSpecified")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">
                    {t("complaints.complaintType")}:
                  </span>
                  <span className="value">
                    {complaint.report_type || t("complaints.notSpecified")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">{t("complaints.source")}:</span>
                  <span className="value">
                    {complaint.submission_source ||
                      t("complaints.notSpecified")}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>{t("complaints.complaintText")}</h3>
              <div className="complaint-text">
                {complaint.report_text || t("complaints.textMissing")}
              </div>
              {complaint.photo_url && (
                <div className="complaint-photo">
                  <h4>{t("complaints.photo")}</h4>
                  <img
                    src={complaint.photo_url}
                    alt={t("complaints.complaintPhoto")}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
              )}
            </div>
            {complaint.solution && (
              <div className="info-section">
                <h3>{t("complaints.solution")}</h3>
                <div className="solution-text">{complaint.solution}</div>
              </div>
            )}
            <div className="info-section">
              <h3>{t("complaints.applicantInfo")}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t("complaints.contact")}:</span>
                  <span className="value">
                    {complaint.contact_info || t("complaints.notSpecified")}
                  </span>
                </div>
                {complaint.telegram_username && (
                  <div className="info-item">
                    <span className="label">Telegram:</span>
                    <span className="value">{complaint.telegram_username}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">{t("complaints.language")}:</span>
                  <span className="value">
                    {complaint.language || t("complaints.notSpecified")}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>{t("complaints.location")}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t("complaints.address")}:</span>
                  <span className="value">
                    {complaint.address || t("complaints.notSpecified")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">{t("complaints.city")}:</span>
                  <span className="value">
                    {complaint.city || t("complaints.notSpecified")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">{t("complaints.region")}:</span>
                  <span className="value">
                    {complaint.region || t("complaints.notSpecified")}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">{t("complaints.coordinates")}:</span>
                  <span className="value">{formatCoordinates()}</span>
                </div>
                <div className="info-item">
                  <span className="label">
                    {t("complaints.coordinatesSource")}:
                  </span>
                  <span className="value">
                    {complaint.location_source || t("complaints.notSpecified")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form className="edit-form" onSubmit={handleSubmit}>
            <h3>{t("complaints.processingComplaint")}</h3>
            <div className="form-group">
              <label htmlFor="status">{t("complaints.status")}:</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={
                  formData.status !== complaint.status ? "changed" : ""
                }
              >
                <option value="">{t("complaints.selectStatus")}</option>
                <option value="pending">{t("status.inProgress")}</option>
                <option value="resolved">{t("status.resolved")}</option>
                <option value="cancelled">{t("status.rejected")}</option>
              </select>
              {formData.status !== complaint.status && (
                <div className="change-indicator">
                  <span>
                    {t("complaints.currentStatus")}:{" "}
                    {getStatusText(complaint.status)}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="importance">{t("complaints.priority")}:</label>
              <select
                id="importance"
                name="importance"
                value={formData.importance}
                onChange={handleInputChange}
                className={
                  formData.importance !== complaint.importance ? "changed" : ""
                }
              >
                <option value="">{t("complaints.selectPriority")}</option>
                <option value="critical">{t("status.critical")}</option>
                <option value="high">{t("status.high")}</option>
                <option value="medium">{t("status.medium")}</option>
                <option value="low">{t("status.low")}</option>
              </select>
              {formData.importance !== complaint.importance && (
                <div className="change-indicator">
                  <span>
                    {t("complaints.currentPriority")}:{" "}
                    {getPriorityText(complaint.importance)}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="notes">{t("complaints.notes")}:</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder={t("complaints.notesPlaceholder")}
                className={formData.notes !== complaint.notes ? "changed" : ""}
              ></textarea>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t("complaints.cancel")}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  isLoading ||
                  (formData.status === complaint.status &&
                    formData.importance === complaint.importance &&
                    formData.notes === complaint.notes)
                }
              >
                {isLoading
                  ? t("complaints.saving")
                  : t("complaints.saveChanges")}
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

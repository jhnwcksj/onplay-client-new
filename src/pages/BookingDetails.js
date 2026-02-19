import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './BookingDetails.css';

export default function BookingDetails() {
  const { publicCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    loadAppointmentDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicCode]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.REACT_APP_API_URL;

      const res = await fetch(`${API_URL}/api/online-booking/appointment/${publicCode}`);
      if (!res.ok) {
        throw new Error('Запись не найдена');
      }

      const data = await res.json();
      setAppointment(data.appointment);
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Update page title when appointment is loaded
  useEffect(() => {
    if (appointment) {
      const parts = [];
      if (appointment.service_name) parts.push(appointment.service_name);
      if (appointment.branch_name) parts.push(appointment.branch_name);
      const datePart = appointment.start_time ? new Date(appointment.start_time).toLocaleDateString('ru-RU') : null;
      if (datePart) parts.push(datePart);

      const titleBase = parts.length ? parts.join(' — ') : 'Детали записи';
      document.title = `${titleBase}${appointment.public_code ? ' — ' + appointment.public_code : ''}`;
      return;
    }

    if (publicCode) {
      document.title = `Запись ${publicCode}`;
      return;
    }

    document.title = 'Детали записи';
  }, [appointment, publicCode]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Ожидание', className: 'status-pending' },
      'waiting': { label: 'Ожидает подтверждения', className: 'status-waiting' },
      'arrived': { label: 'Пришел', className: 'status-arrived' },
      'no_show': { label: 'Не пришел', className: 'status-no-show' },
      'confirmed': { label: 'Подтверждено', className: 'status-confirmed' },
      'completed': { label: 'Завершено', className: 'status-completed' },
      'cancelled': { label: 'Отменено', className: 'status-cancelled' },
      'rejected': { label: 'Отклонено', className: 'status-rejected' }
    };

    const statusInfo = statusMap[status] || { label: status, className: '' };
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="booking-details-container">
        <div className="booking-details-loading">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="booking-details-container">
        <div className="booking-details-error">
          <h2>Ошибка</h2>
          <p>{error || 'Запись не найдена'}</p>
          <button onClick={() => window.location.href = '/'}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-details-container">
      <div className="booking-details-wrapper">
        {/* Заголовок */}
        <div className="booking-details-header">
          <h1>Детали записи</h1>
          {/* <div className="booking-code-display">
            <span>Код записи:</span>
            <strong>{appointment.public_code}</strong>
          </div> */}
        </div>

        {/* Основная информация */}
        <div className="booking-details-content">
          {/* Статус */}
          <div className="details-section">
            <h3>Статус</h3>
            <div className="status-display">
              {getStatusBadge(appointment.status)}
            </div>
          </div>

          {/* Информация о филиале */}
          <div className="details-section">
            <h3>Филиал</h3>
            <div className="info-card">
              <p><strong>{appointment.branch_name}</strong></p>
              {appointment.branch_address && <p>📍 {appointment.branch_address}</p>}
              {appointment.branch_phone && <p>📞 {appointment.branch_phone}</p>}
            </div>
          </div>

          {/* Дата и время */}
          <div className="details-section">
            <h3>Дата и время</h3>
            <div className="info-card">
              <p className="datetime-display">
                🗓️ {formatDateTime(appointment.start_time)}
              </p>
              <p className="duration-display">
                ⏱️ Длительность: {appointment.duration_minutes} минут
              </p>
            </div>
          </div>

          {/* Услуга */}
          <div className="details-section">
            <h3>Услуга</h3>
            <div className="info-card">
              <p><strong>{appointment.service_name}</strong></p>
              <p>Участников: {appointment.participants_count}</p>
            </div>
          </div>

          {/* Зоны */}
          {appointment.zone_names && appointment.zone_names.length > 0 && (
            <div className="details-section">
              <h3>Зоны</h3>
              <div className="info-card">
                <p>{appointment.zone_names.filter(z => z).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Стоимость */}
          <div className="details-section">
            <h3>Стоимость</h3>
            <div className="info-card price-card">
              <p className="price-display">{appointment.price} ₸</p>
            </div>
          </div>

          {/* Контактные данные */}
          <div className="details-section">
            <h3>Контактная информация</h3>
            <div className="info-card">
              <p><strong>{appointment.client_name}</strong></p>
              <p>📱 {appointment.client_phone}</p>
              {appointment.client_email && <p>✉️ {appointment.client_email}</p>}
            </div>
          </div>

          {/* Комментарий */}
          {appointment.comment && (
            <div className="details-section">
              <h3>Комментарий</h3>
              <div className="info-card">
                <p>{appointment.comment}</p>
              </div>
            </div>
          )}
        </div>

        {/* Действия */}
        <div className="booking-details-actions">
          <button
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Назад
          </button>
          <button
            className="btn-primary"
            onClick={() => window.print()}
          >
            Печать
          </button>
        </div>
      </div>
    </div>
  );
}

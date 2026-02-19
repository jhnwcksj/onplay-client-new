import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { formatPhoneNumber, normalizePhoneNumber, isValidPhoneNumber } from '../utils/phoneFormatter';
import './OnlineBookingBrand.css';

export default function OnlineBookingBrand({ initialBranch = null, initialSlug = null, initialPublicCode = null }) {
  const { slug: urlSlug, publicCode: urlPublicCode } = useParams();
  const slug = initialSlug || urlSlug;
  const publicCode = initialPublicCode || urlPublicCode;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchData, setBranchData] = useState(null);
  
  // Шаг процесса записи (1-услуга, 2-игры, 3-участники, 4-дата/время, 5-контакты, 6-успех)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Данные формы
  const [formData, setFormData] = useState({
    serviceId: null,
    serviceDuration: null,
    serviceQuantity: 1, // Количество услуг/сессий (для VR)
    selectedGames: [], // [{gameId, gameName, quantity}]
    participants: null,
    date: '',
    time: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    countryCode: '+7'
  });
  
  // Данные для выбора
  const [services, setServices] = useState([]);
  const [games, setGames] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  
  const [chooseGameInPlace, setChooseGameInPlace] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    if (initialBranch) {
      // Если данные переданы через пропсы, используем их
      setBranchData(initialBranch);
      loadServices(initialBranch.branch_id);
      setLoading(false);
    } else {
      // Иначе загружаем из API
      loadInitialData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, publicCode, initialBranch]);

  // Загружаем доступные даты при монтировании компонента
  useEffect(() => {
    if (branchData) {
      loadAvailableDates();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchData]);

  // Загружаем доступное время при выборе даты
  useEffect(() => {
    if (formData.date && formData.participants) {
      loadAvailableTimes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date, formData.participants]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.REACT_APP_API_URL;
      const directMode = window.location.pathname.includes('/booking-direct/');

      let res;
      if (directMode && publicCode) {
        res = await fetch(`${API_URL}/api/online-booking/branch-direct/${publicCode}`);
      } else if (publicCode) {
        res = await fetch(`${API_URL}/api/online-booking/branch/${slug}/${publicCode}`);
      } else {
        throw new Error('Не указан код филиала');
      }

      if (!res.ok) {
        throw new Error('Филиал не найден или онлайн-запись отключена');
      }

      const data = await res.json();
      setBranchData(data.branch);
      
      // Загружаем услуги сразу
      await loadServices(data.branch.branch_id);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, publicCode]);

  const loadServices = async (branchId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/api/online-booking/services/${branchId}`);
      const data = await res.json();
      // Backend уже фильтрует по is_online_available = TRUE
      setServices(data.services || []);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const loadGames = async (serviceId) => {
    try {
      // TODO: нужно добавить endpoint для получения игр по услуге
      // const API_URL = process.env.REACT_APP_API_URL;
      // Временно используем моковые данные
      const mockGames = [
        { game_id: 1, game_name: 'Кернел: Бункер', min_players: 2, max_players: 15 },
        { game_id: 2, game_name: 'Кернел: Вороны', min_players: 2, max_players: 15 },
        { game_id: 3, game_name: 'Шмутер: Фортс', min_players: 2, max_players: 15 },
        { game_id: 4, game_name: 'Starbase: Экспедиция', min_players: 2, max_players: 5 },
        { game_id: 5, game_name: 'Safe Night', min_players: 2, max_players: 5 },
      ];
      setGames(mockGames);
    } catch (err) {
      console.error('Error loading games:', err);
    }
  };

  const loadAvailableDates = async () => {
    try {
      // TODO: можно использовать API для проверки доступности дат
      // const API_URL = process.env.REACT_APP_API_URL;
      const today = new Date();
      const dates = [];
      
      // Генерируем даты на 60 дней вперед
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push({
          date: date.toISOString().split('T')[0],
          dayOfWeek: date.getDay(),
          available: true // Можно добавить проверку доступности
        });
      }
      
      setAvailableDates(dates);
      
      // Автоматически устанавливаем первую доступную дату
      if (dates.length > 0 && !formData.date) {
        setFormData({ ...formData, date: dates[0].date });
      }
    } catch (err) {
      console.error('Error loading available dates:', err);
    }
  };

  const loadAvailableTimes = async () => {
    if (!formData.date || !formData.participants || !branchData) {
      console.log('loadAvailableTimes: conditions not met:', {
        date: formData.date,
        participants: formData.participants,
        branchData: !!branchData
      });
      return;
    }
    
    try {
      setLoadingTimes(true);
      console.log('Loading available times for:', {
        branchId: branchData.branch_id,
        date: formData.date,
        participants: formData.participants
      });
      
      const API_URL = process.env.REACT_APP_API_URL;
      
      const params = new URLSearchParams({
        branchId: branchData.branch_id,
        date: formData.date,
        participants: formData.participants
      });
      
      const url = `${API_URL}/api/online-booking/available-times?${params}`;
      console.log('Fetching:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error:', res.status, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Available times response:', data);
      setAvailableTimes(data.slots || []);
    } catch (err) {
      console.error('Error loading available times:', err);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleServiceSelect = async (service) => {
    setFormData({ 
      ...formData, 
      serviceId: service.service_id,
      serviceDuration: service.duration
    });
    
    // Проверяем, является ли услуга VR
    const isVRService = service.service_name.toLowerCase().includes('vr');
    
    if (isVRService) {
      await loadGames(service.service_id);
    }
  };

  const addGame = (game) => {
    const existing = formData.selectedGames.find(g => g.gameId === game.game_id);
    
    if (existing) {
      setFormData({
        ...formData,
        selectedGames: formData.selectedGames.map(g =>
          g.gameId === game.game_id
            ? { ...g, quantity: g.quantity + 1 }
            : g
        )
      });
    } else {
      setFormData({
        ...formData,
        selectedGames: [
          ...formData.selectedGames,
          {
            gameId: game.game_id,
            gameName: game.game_name,
            quantity: 1
          }
        ]
      });
    }
  };

  const removeGame = (gameId) => {
    const existing = formData.selectedGames.find(g => g.gameId === gameId);
    
    if (existing && existing.quantity > 1) {
      setFormData({
        ...formData,
        selectedGames: formData.selectedGames.map(g =>
          g.gameId === gameId
            ? { ...g, quantity: g.quantity - 1 }
            : g
        )
      });
    } else {
      setFormData({
        ...formData,
        selectedGames: formData.selectedGames.filter(g => g.gameId !== gameId)
      });
    }
  };

  // Функция для подсчета общего количества участников
  // const getTotalParticipants = () => {
  //   return formData.selectedGames.reduce((total, game) => {
  //     return total + game.quantity;
  //   }, formData.participants);
  // };

  const handleSubmit = async () => {
    // Валидация всех полей
    if (!formData.serviceId) {
      alert('Выберите услугу');
      return;
    }

    const selectedService = services.find(s => s.service_id === formData.serviceId);
    const isVRService = selectedService && selectedService.service_name.toLowerCase().includes('vr');
    
    if (isVRService && !chooseGameInPlace && formData.selectedGames.length === 0) {
      alert('Выберите игру или пометьте "Выберу игру в VR-парке"');
      return;
    }

    if (!formData.participants) {
      alert('Выберите количество игроков');
      return;
    }

    if (!formData.date) {
      alert('Выберите дату');
      return;
    }

    if (!formData.time) {
      alert('Выберите время');
      return;
    }

    if (!formData.clientName || formData.clientName.trim() === '') {
      alert('Введите ваше имя');
      return;
    }

    if (!formData.clientPhone || formData.clientPhone.trim() === '') {
      alert('Введите номер телефона');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.clientPhone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      alert('Введите корректный номер телефона (10 цифр)');
      return;
    }

    try {
      setSubmitting(true);
      const API_URL = process.env.REACT_APP_API_URL;
      
      // Получаем зоны для выбранной услуги
      console.log('Finding zones for service:', formData.serviceId);
      const zonesRes = await fetch(`${API_URL}/api/online-booking/zones-by-service/${formData.serviceId}`);
      if (!zonesRes.ok) {
        throw new Error('Не удалось загрузить зоны для выбранной услуги');
      }
      const zonesData = await zonesRes.json();
      console.log('Available zones for service:', zonesData.zones);
      
      if (zonesData.zones.length === 0) {
        throw new Error('Для выбранной услуги нет доступных зон');
      }
      
      // Находим зону с достаточной вместимостью
      const suitableZone = zonesData.zones.find(zone => zone.capacity >= formData.participants);
      if (!suitableZone) {
        throw new Error('Не найдена зона с достаточной вместимостью для выбранной услуги');
      }
      
      console.log('Selected zone:', suitableZone);
      
      const bookingData = {
        branchId: branchData.branch_id,
        zoneId: suitableZone.zone_id,
        serviceId: formData.serviceId,
        duration: formData.serviceDuration,
        date: formData.date,
        time: formData.time,
        participants: formData.participants,
        clientName: formData.clientName,
        clientPhone: normalizedPhone,
        clientEmail: formData.clientEmail
      };
      
      console.log('Sending booking data:', bookingData);
      
      const res = await fetch(`${API_URL}/api/online-booking/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Ошибка при создании записи');
      }

      const data = await res.json();
      setBookingResult(data);
      
      // Перенаправляем на страницу деталей записи
      if (data.publicCode) {
        window.location.href = `/booking-details/${data.publicCode}`;
      } else {
        // Или показываем сообщение об успехе
        setCurrentStep(6);
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    return {
      day: date.getDate(),
      month: monthNames[date.getMonth()],
      weekday: dayNames[date.getDay()],
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  };

  if (loading) {
    return (
      <div className="aw-booking-container">
        <div className="aw-booking-loading">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aw-booking-container">
        <div className="aw-booking-error">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const selectedService = services.find(s => s.service_id === formData.serviceId);
  const isVRService = selectedService && selectedService.service_name.toLowerCase().includes('vr');

  return (
    <div className="aw-booking-container">
      {/* Простой хедер */}
      <header className="aw-booking-header">
        <div className="aw-booking-header-content">
          <div className="aw-booking-logo">
            <h2 style={{color: '#fff', margin: 0}}>Another World</h2>
          </div>
          <div className="aw-booking-contact">
            {branchData && branchData.phone && (
              <a href={`tel:${branchData.phone}`} style={{color: '#fff', textDecoration: 'none'}}>
                {branchData.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="reservation_paddingTop">
        {/* Адрес филиала */}
        {branchData && branchData.address && (
          <div className="reservation__locationAddress">
            <p>Адрес: {branchData.address}</p>
          </div>
        )}

        <div className="reservation_wrapper">
          {/* Заголовок */}
          <section className="reservation__header">
            <h1 className="awH2 ta-left">Выбери свое приключение</h1>
          </section>

          <div className="reservation-content-wrapper">
            {/* Основной контент */}
            <div className="reservation-main-content">

          {/* Шаг 1: Выбор услуги */}
          <section className="reservationFirstStep">
              <div className="reservation__stepTitle">
                <div className="reservation__position">Шаг 01/05</div>
                <div className="reservation__stepHeader">Выбор услуги</div>
              </div>

              {services.length === 0 ? (
                <div style={{padding: '2em', color: '#fff'}}>
                  <p>Услуги не найдены. Проверьте, что у филиала есть услуги с включенной онлайн-записью.</p>
                  <p style={{fontSize: '14px', color: '#888'}}>Branch ID: {branchData?.branch_id}</p>
                </div>
              ) : (
                <div className="reservation__games">
                  {services.map(service => (
                    <div
                      key={service.service_id}
                      className={`reservation__gamesItem ${formData.serviceId === service.service_id ? 'selected' : ''}`}
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="reservation__gamesDescription">
                        <div className="reservation__gameTitle">{service.service_name}</div>
                        {service.description && (
                          <div className="reservation__gameDetails">{service.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </section>

          {/* Шаг 2: Выбор игр (только для VR услуг) */}
          {isVRService && (
            <section className="reservationFirstStep">
              <div className="reservation__stepTitle">
                <div className="reservation__position">Шаг 02/05</div>
                <div className="reservation__stepHeader">Игра</div>
              </div>

              <div className="reservation__ChooseGameInPlace">
                <span>Выберу игру в VR-парке</span>
                <div 
                  className={`reservation__ChooseCheck ${chooseGameInPlace ? 'active' : ''}`}
                  onClick={() => setChooseGameInPlace(!chooseGameInPlace)}
                >
                  <span className={chooseGameInPlace ? 'active' : ''} />
                </div>
              </div>

              {chooseGameInPlace && (
                <div className="service-quantity-selector" style={{marginTop: '2em'}}>
                  <h4 style={{color: '#fff', marginBottom: '1em'}}>Количество услуг</h4>
                  <div className="reservation__playersQuantity">
                    {[1, 2, 3, 4, 5].map(num => (
                      <div
                        key={num}
                        className={`reservation__playersQuantityItem ${formData.serviceQuantity === num ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, serviceQuantity: num })}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!chooseGameInPlace && (
                <>
                  {formData.selectedGames.length > 0 && (
                    <div className="selected-games-summary">
                      <h4>Выбрано:</h4>
                      {formData.selectedGames.map(item => (
                        <div key={item.gameId} className="selected-game-item">
                          <span className="game-name">{item.gameName}</span>
                          <div className="game-quantity-controls">
                            <button onClick={() => removeGame(item.gameId)}>−</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => addGame(games.find(g => g.game_id === item.gameId))}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="reservation__games">
                    {games.map(game => (
                      <div
                        key={game.game_id}
                        className={`reservation__gamesItem ${formData.selectedGames.some(g => g.gameId === game.game_id) ? 'selected' : ''}`}
                        onClick={() => addGame(game)}
                      >
                        <div className="reservation__gamesDescription">
                          <div className="reservation__gameTitle">{game.game_name}</div>
                          <div className="reservation__gameDetails">
                            {game.min_players}-{game.max_players} игроков
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Шаг 3: Количество игроков */}
          <section className="reservationSecondStep">
              <div className="reservation__stepTitle">
                <div className="reservation__position">Шаг 03/05</div>
                <div className="reservation__stepHeader">Количество игроков</div>
              </div>

              {/* <div className="reservation__information">
                <div className="reservation__informationIcon">
                  <img src="/assets/images/icons/gameRecomendationIcon.svg" alt="" />
                </div>
                <div className="reservation__informationText">
                  При бронировании до 4 человек, другие игроки могут присутствовать на
                  игровой арене, но они не будут мешать вашей игре, так как будут
                  играть на другой площадке
                </div>
              </div> */}

              <div className="reservation__playersQuantity">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                  <div
                    key={num}
                    className={`reservation__playersQuantityItem ${formData.participants === num ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, participants: num })}
                  >
                    {num}
                  </div>
                ))}
              </div>
          </section>

          {/* Шаг 4: Дата и время */}
          <section className="reservationThirdStep">
              <div className="reservation__stepTitle">
                <div className="reservation__position">Шаг 04/05</div>
                <div className="reservation__stepHeader">Дата и время</div>
              </div>

              <div className="reservationThirdStep__dateContainer">
                <div className="reservation__dateContainerNew">
                  {availableDates.slice(0, 20).map((dateInfo) => {
                    const formatted = formatDate(dateInfo.date);
                    return (
                      <div
                        key={dateInfo.date}
                        className={`reservation__dateItemNew ${formData.date === dateInfo.date ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, date: dateInfo.date, time: '' })}
                      >
                        <div className={`reservation__day ${formatted.isWeekend ? 'holiday' : ''}`}>
                          {formatted.month}
                        </div>
                        <div className="reservation__dayNumber">{formatted.day}</div>
                        <div className={`reservation__day ${formatted.isWeekend ? 'holiday' : ''}`}>
                          {formatted.weekday}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {formData.date && (
                  <div className="reservation__timeSelector active">
                    {loadingTimes ? (
                      <p className="loading-text">Загрузка доступного времени...</p>
                    ) : availableTimes.length === 0 ? (
                      <p className="no-slots-text">На эту дату нет доступных слотов или не выбрано количество игроков</p>
                    ) : (
                      <>
                        {availableTimes
                          .filter(slot => slot.available)
                          .map(slot => (
                            <div
                              key={slot.time}
                              className={`reservation__timeItem ${formData.time === slot.time ? 'active' : ''}`}
                              onClick={() => setFormData({ ...formData, time: slot.time })}
                            >
                              <span>{slot.time}</span>
                              <span> {slot.available_places} мест</span>
                            </div>
                          ))}
                        {availableTimes.filter(slot => slot.available).length === 0 && (
                          <p className="no-slots-text">На эту дату нет доступных слотов</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
          </section>

          {/* Шаг 5: Контактные данные */}
          <section className="reservationFourthStep">
              <div className="reservation__stepTitle">
                <div className="reservation__position">Шаг 05/05</div>
                <div className="reservation__stepHeader">Ваши контактные данные</div>
              </div>

              {/* Сводка выбранных данных */}
              <div className="booking-summary">
                <h4>Детали записи:</h4>
                <p><strong>Услуга:</strong> {selectedService?.service_name}</p>
                {formData.selectedGames.length > 0 && (
                  <>
                    <p><strong>Игры:</strong></p>
                    <ul className="games-summary-list">
                      {formData.selectedGames.map(game => (
                        <li key={game.gameId}>
                          {game.gameName} × {game.quantity}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {chooseGameInPlace && (
                  <>
                    <p><em>Игра будет выбрана на месте</em></p>
                    <p><strong>Количество услуг:</strong> {formData.serviceQuantity}</p>
                  </>
                )}
                <p><strong>Участников:</strong> {formData.participants}</p>
                <p><strong>Дата:</strong> {formatDate(formData.date).day} {formatDate(formData.date).month}</p>
                <p><strong>Время:</strong> {formData.time}</p>
              </div>

              <div className="contact-form">
                <div className="form-field">
                  <label>Имя *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Как к вам обращаться?"
                  />
                </div>
                
                <div className="form-field">
                  <label>Телефон *</label>
                  <div className="phone-input-group">
                    <select
                      className="country-code-select"
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    >
                      <option value="+7">🇰🇿 +7</option>
                      <option value="+7">🇷🇺 +7</option>
                    </select>
                    <input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      onBlur={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setFormData({ ...formData, clientPhone: formatted });
                      }}
                      placeholder="(___) ___-__-__"
                    />
                  </div>
                </div>
                
                <div className="form-field">
                  <label>Email (необязательно)</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="booking-actions">
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Отправка...' : 'Забронировать'}
                </button>
              </div>
          </section>

          {/* Шаг 6: Подтверждение */}
          {currentStep === 6 && (
            <section className="booking-success">
              <div className="success-icon">✓</div>
              <h3>Запись успешно создана!</h3>
              <p>Мы свяжемся с вами для подтверждения.</p>
              <div className="booking-summary">
                <p><strong>Филиал:</strong> {branchData.branch_name}</p>
                <p><strong>Дата:</strong> {formatDate(formData.date).day} {formatDate(formData.date).month}</p>
                <p><strong>Время:</strong> {formData.time}</p>
                <p><strong>Участников:</strong> {formData.participants}</p>
              </div>
              {bookingResult && bookingResult.publicCode && (
                <button
                  className="btn-primary"
                  onClick={() => window.location.href = `/booking-details/${bookingResult.publicCode}`}
                >
                  Посмотреть детали записи
                </button>
              )}
            </section>
          )}
            </div>

            {/* Боковая панель "Ваша бронь" */}
            {currentStep !== 6 && (
              <aside className="reservationSummary">
                <div className="reservationSummary__title">Ваша бронь</div>
                <div className="reservationSummary__game">
                  {selectedService ? selectedService.service_name : 'Игра не выбрана'}
                </div>
                <div className="reservationSummary__details">
                  <div className={`reservationSummary__detailsItem ${formData.participants ? '' : 'notactive'}`}>
                    <div className="reservationSummary__icon">
                      👥
                    </div>
                    <div className="reservationSummary__description">
                      <span className="reservationSummary__playersQuantity">
                        {formData.participants || 'не выбрано'}
                      </span>
                      <span>Количество игроков</span>
                    </div>
                  </div>
                  <div className={`reservationSummary__detailsItem ${formData.date && formData.time ? '' : 'notactive'}`}>
                    <div className="reservationSummary__icon">
                      📅
                    </div>
                    <div className="reservationSummary__description">
                      <span className="reservationSummary__date">
                        {formData.date && formData.time 
                          ? `${formatDate(formData.date).day} ${formatDate(formData.date).month}, ${formData.time}`
                          : 'нет данных'}
                      </span>
                      <span>Дата и время сеанса</span>
                    </div>
                  </div>
                  {formData.selectedGames.length > 0 && (
                    <div className="reservationSummary__detailsItem">
                      <div className="reservationSummary__description">
                        <span>Выбранные игры:</span>
                        <ul style={{margin: '0.5em 0', paddingLeft: '1.5em'}}>
                          {formData.selectedGames.map(game => (
                            <li key={game.gameId}>{game.gameName} x{game.quantity}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {chooseGameInPlace && (
                    <div className="reservationSummary__detailsItem">
                      <div className="reservationSummary__description">
                        <span>Услуг: {formData.serviceQuantity}</span>
                        <span style={{fontSize: '0.85em', opacity: 0.7}}>Игра на месте</span>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

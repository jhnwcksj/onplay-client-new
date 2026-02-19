import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { formatPhoneNumber, normalizePhoneNumber, isValidPhoneNumber } from '../utils/phoneFormatter';
import OnlineBookingBrand from './OnlineBookingBrand';
import './OnlineBooking.css';

export default function OnlineBooking() {
  const { slug, publicCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [settings, setSettings] = useState(null);
  const [designType, setDesignType] = useState(null);
  
  // Шаг процесса записи (1-выбор филиала, 2-услуга, 3-дата/время, 4-контакты, 5-успех)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Данные формы
  const [formData, setFormData] = useState({
    date: '',
    participants: 1,
    time: '',
    selectedServices: [], // [{serviceId, quantity, service, price}]
    zoneId: null,
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    countryCode: '+7'
  });
  
  // Данные для выбора
  const [services, setServices] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [availableZones, setAvailableZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  
  // Данные календаря
  const [weekRules, setWeekRules] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, publicCode]);

  // Update page title depending on selected branch / loaded data
  useEffect(() => {
    if (selectedBranch && selectedBranch.branch_name) {
      document.title = `${selectedBranch.branch_name} — Онлайн-запись`;
      return;
    }

    if (branches && branches.length === 1 && branches[0].branch_name) {
      document.title = `${branches[0].branch_name} — Онлайн-запись`;
      return;
    }

    document.title = 'Онлайн-запись';
  }, [selectedBranch, branches]);

  // Автоматическая перезагрузка доступных времен при изменении параметров
  useEffect(() => {
    if (currentStep === 3 && formData.date && formData.participants) {
      setAvailableTimes([]); // Сбрасываем старые слоты
      loadAvailableTimes();
    } else {
      setAvailableTimes([]);
      setLoadingTimes(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, formData.date, formData.participants]);

  // Загрузка календарных данных
  useEffect(() => {
    if (selectedBranch) {
      loadCalendarData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  // Автоматическая загрузка зон при выборе услуги или изменении участников
  useEffect(() => {
    if (formData.selectedServices.length > 0 && selectedBranch) {
      loadAvailableZones();
    } else {
      setAvailableZones([]);
      setSelectedZone(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.selectedServices, formData.participants, selectedBranch]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.REACT_APP_API_URL;
      const directMode = window.location.pathname.includes('/booking-direct/');

      if (directMode && publicCode) {
        // Прямой доступ к филиалу без сети
        const res = await fetch(`${API_URL}/api/online-booking/branch-direct/${publicCode}`);
        if (!res.ok) {
          throw new Error('Филиал не найден или онлайн-запись отключена');
        }
        const data = await res.json();
        await selectBranch(data.branch);
      } else if (publicCode) {
        // Загружаем конкретный филиал через сеть
        const res = await fetch(`${API_URL}/api/online-booking/branch/${slug}/${publicCode}`);
        if (!res.ok) {
          throw new Error('Филиал не найден или онлайн-запись отключена');
        }
        const data = await res.json();
        await selectBranch(data.branch);
      } else {
        // Загружаем сеть и её филиалы
        const res = await fetch(`${API_URL}/api/online-booking/network/${slug}`);
        if (!res.ok) {
          throw new Error('Сеть не найдена');
        }
        const data = await res.json();
        setBranches(data.branches);
        
        // Если филиал один, автоматически выбираем его
        if (data.branches.length === 1) {
          await selectBranch(data.branches[0]);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, publicCode]);

  const selectBranch = async (branch) => {
    setSelectedBranch(branch);
    setSettings(branch);
    setDesignType(branch.design_type || 'default');
    
    // Загружаем услуги сразу при выборе филиала
    await loadServices(branch.branch_id);
    
    setCurrentStep(2);
  };

  const loadServices = async (branchId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/api/online-booking/services/${branchId}`);
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const loadCalendarData = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/calendar/${selectedBranch.branch_id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const data = await res.json();
      setWeekRules(data.weekRules || []);
      setHolidays(data.holidays || []);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    }
  };

  const loadAvailableZones = async () => {
    if (!selectedBranch || formData.selectedServices.length === 0) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const selectedServiceItem = formData.selectedServices[0];
      const selectedService = selectedServiceItem.service; // Берем объект услуги
      
      // Загружаем все зоны филиала
      const res = await fetch(`${API_URL}/api/online-booking/zones/${selectedBranch.branch_id}`);
      const data = await res.json();
      let allZones = data.zones || [];
      
      // Фильтруем зоны по linked_zone_ids из услуги (как в BookingDialog)
      let allowedZones = allZones;
      if (selectedService && Array.isArray(selectedService.linked_zone_ids) && selectedService.linked_zone_ids.length > 0) {
        const allowedIds = selectedService.linked_zone_ids.map(String);
        allowedZones = allZones.filter(z => allowedIds.includes(String(z.zone_id)));
        
        console.log('Услуга:', selectedService.service_name, 'связана с зонами:', selectedService.linked_zone_ids);
        console.log('Доступные зоны после фильтрации:', allowedZones.map(z => z.zone_name).join(', '));
        
        if (allowedZones.length === 0) {
          // На всякий случай, если привязка не совпала — используем исходный список
          console.warn('Нет зон, соответствующих привязке услуги. Используем все доступные зоны.');
          allowedZones = allZones;
        }
      }
      
      setAvailableZones(allowedZones);
      
      // Автоматически выбираем зоны (как в BookingDialog - getMergedZones)
      if (allowedZones.length > 0) {
        // Если услуга типа "package" — занимаем все доступные для неё зоны
        if (selectedService && selectedService.pricing_type === 'package') {
          const allZoneIds = allowedZones.map(z => z.zone_id);
          const zoneNames = allowedZones.map(z => z.zone_name).join(' + ');
          
          setSelectedZone({
            zone_id: allZoneIds[0], // Первая зона как основная
            zone_name: zoneNames,
            capacity: allowedZones.reduce((sum, z) => sum + (z.capacity || 0), 0)
          });
          setFormData(prev => ({ ...prev, zoneId: allZoneIds[0] }));
          console.log('Услуга типа "package", занимаются все зоны:', zoneNames);
        } else {
          // Обычная логика: выбираем подходящую зону или объединяем по вместимости
          let suitableZone = allowedZones.find(z => z.capacity >= formData.participants);
          
          if (!suitableZone) {
            // Объединяем зоны по вместимости
            let total = 0;
            let merged = [];
            for (const z of allowedZones) {
              total += Number(z.capacity) || 0;
              merged.push(z);
              if (formData.participants <= total) break;
            }
            
            if (merged.length > 0) {
              suitableZone = {
                zone_id: merged[0].zone_id,
                zone_name: merged.map(z => z.zone_name).join(' + '),
                capacity: total
              };
            } else {
              suitableZone = allowedZones[0];
            }
          }
          
          setSelectedZone(suitableZone);
          setFormData(prev => ({ ...prev, zoneId: suitableZone.zone_id }));
          console.log('Автоматически выбрана зона:', suitableZone.zone_name);
        }
      } else {
        setSelectedZone(null);
        setFormData(prev => ({ ...prev, zoneId: null }));
      }
    } catch (err) {
      console.error('Error loading zones:', err);
      setAvailableZones([]);
      setSelectedZone(null);
    }
  };

  const loadAvailableTimes = async () => {
    if (!formData.date || !formData.participants) return;
    
    try {
      setLoadingTimes(true);
      const API_URL = process.env.REACT_APP_API_URL;
      
      const params = new URLSearchParams({
        branchId: selectedBranch.branch_id,
        date: formData.date,
        participants: formData.participants
      });
      
      const res = await fetch(`${API_URL}/api/online-booking/available-times?${params}`);
      const data = await res.json();
      setAvailableTimes(data.slots || []);
    } catch (err) {
      console.error('Error loading available times:', err);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  // Определить цену услуги на основе выбранной даты
  const getServicePrice = (service) => {
    if (!service.prices || service.prices.length === 0) return 0;
    
    if (!formData.date) {
      return service.prices[0]?.price || 0;
    }
    
    const selectedDate = new Date(formData.date);
    const dayOfWeek = selectedDate.getDay();
    
    // 0 = воскресенье, 6 = суббота
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Ищем подходящую цену
    const weekendPrice = service.prices.find(p => p.day_type === 'weekend');
    const weekdayPrice = service.prices.find(p => p.day_type === 'weekday');
    
    if (isWeekend && weekendPrice) {
      return weekendPrice.price;
    }
    
    if (!isWeekend && weekdayPrice) {
      return weekdayPrice.price;
    }
    
    // Fallback на любую доступную цену
    return service.prices[0]?.price || 0;
  };

  // Показать диапазон цен (если цены различаются по дням)
  const getServicePriceRangeDisplay = (service) => {
    if (!service.prices || service.prices.length === 0) return '0';

    // Соберём числовые цены из правил
    const prices = service.prices
      .map(p => Number(p.price))
      .filter(p => !Number.isNaN(p));

    if (prices.length === 0) return '0';

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) return String(min);
    return `${min}-${max}`;
  };

  const handleNextStep = async () => {
    // Валидация перед переходом
    if (currentStep === 2 && formData.selectedServices.length === 0) {
      alert('Выберите хотя бы одну услугу');
      return;
    }
    if (currentStep === 3 && (!formData.date || !formData.time)) {
      alert('Выберите дату и время');
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  // Получение типа дня для календаря
  const getDayType = useCallback((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay();
    
    // Проверяем праздники
    const event = holidays.find(h => {
      const [sy, sm, sd] = h.start_date.split('-').map(Number);
      const [ey, em, ed] = h.end_date.split('-').map(Number);
      const current = new Date(y, m - 1, d);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      return current >= start && current <= end;
    });
    
    if (event) return event.day_type;
    
    // Используем правила недели
    const weekRule = weekRules.find(r => r.weekday === dayOfWeek);
    if (weekRule) return weekRule.day_type;
    
    // По умолчанию
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
  }, [weekRules, holidays]);

  // Построение матрицы календаря
  const buildCalendarMatrix = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const matrix = [];

    for (let i = firstWeekday - 1; i >= 0; i--) {
      matrix.push(new Date(year, month - 1, prevMonthDays - i));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      matrix.push(new Date(year, month, d));
    }

    let nextDay = 1;
    while (matrix.length % 7 !== 0) {
      matrix.push(new Date(year, month + 1, nextDay++));
    }

    return matrix;
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      // If user goes back from the services step (2), clear selected services
      if (currentStep === 2) {
        setFormData(prev => ({ ...prev, selectedServices: [] }));
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  const addService = (service) => {
    const existing = formData.selectedServices.find(s => s.serviceId === service.service_id);
    
    if (existing) {
      // Увеличиваем количество
      setFormData({
        ...formData,
        selectedServices: formData.selectedServices.map(s =>
          s.serviceId === service.service_id
            ? { ...s, quantity: s.quantity + 1 }
            : s
        )
      });
    } else {
      // Добавляем новую услугу
      setFormData({
        ...formData,
        selectedServices: [
          ...formData.selectedServices,
          {
            serviceId: service.service_id,
            quantity: 1,
            service: service,
            price: getServicePrice(service)
          }
        ]
      });
    }
  };

  const removeService = (serviceId) => {
    const existing = formData.selectedServices.find(s => s.serviceId === serviceId);
    
    if (existing && existing.quantity > 1) {
      // Уменьшаем количество
      setFormData({
        ...formData,
        selectedServices: formData.selectedServices.map(s =>
          s.serviceId === serviceId
            ? { ...s, quantity: s.quantity - 1 }
            : s
        )
      });
    } else {
      // Удаляем услугу
      setFormData({
        ...formData,
        selectedServices: formData.selectedServices.filter(s => s.serviceId !== serviceId)
      });
    }
  };

  const getTotalDuration = () => {
    return formData.selectedServices.reduce((total, item) => {
      return total + (item.service.duration || 0) * item.quantity;
    }, 0);
  };

  const getTotalPrice = () => {
    return formData.selectedServices.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity * formData.participants;
    }, 0);
  };

  // Compute total price range across selected services (min-max), considering quantity and participants
  const getTotalPriceRange = () => {
    if (!formData.selectedServices || formData.selectedServices.length === 0) return '0';

    let minTotal = 0;
    let maxTotal = 0;

    for (const item of formData.selectedServices) {
      const svc = item.service || {};
      const qty = Number(item.quantity || 1);
      const participants = Number(formData.participants || 1);

      if (!svc.prices || svc.prices.length === 0) {
        const p = Number(item.price || 0);
        minTotal += p * qty * participants;
        maxTotal += p * qty * participants;
        continue;
      }

      const prices = svc.prices
        .map(p => Number(p.price))
        .filter(p => !Number.isNaN(p));

      if (prices.length === 0) {
        const p = Number(item.price || 0);
        minTotal += p * qty * participants;
        maxTotal += p * qty * participants;
        continue;
      }

      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);

      minTotal += minP * qty * participants;
      maxTotal += maxP * qty * participants;
    }

    if (minTotal === maxTotal) return String(minTotal);
    return `${minTotal}-${maxTotal}`;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, clientPhone: value });
  };

  const handleSubmit = async () => {
    // Валидация
    if (!formData.clientName || !formData.clientPhone) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (formData.selectedServices.length === 0) {
      alert('Выберите услугу');
      return;
    }

    if (!formData.date || !formData.time) {
      alert('Выберите дату и время');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.clientPhone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      alert('Введите корректный номер телефона');
      return;
    }

    try {
      setSubmitting(true);
      const API_URL = process.env.REACT_APP_API_URL;
      
      // Используем первую услугу для создания записи
      const firstService = formData.selectedServices[0];
      
      const bookingData = {
        branchId: selectedBranch.branch_id,
        zoneId: null, // Backend автоматически определит зону
        serviceId: firstService.serviceId,
        date: formData.date,
        time: formData.time,
        participants: formData.participants,
        clientName: formData.clientName,
        clientPhone: normalizedPhone,
        clientEmail: formData.clientEmail,
        duration: getTotalDuration()
      };
      
      console.log('Отправка данных записи:', bookingData);
      
      const res = await fetch(`${API_URL}/api/online-booking/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('Ошибка от сервера:', errData);
        throw new Error(errData.error || errData.message || 'Ошибка при создании записи');
      }

      const data = await res.json();
      setBookingResult(data);
      
      // Успешная запись
      setCurrentStep(5);
    } catch (err) {
      console.error('Error creating booking:', err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="online-booking-container">
        <div className="online-booking-loading">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="online-booking-container">
        <div className="online-booking-error">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  // Если дизайн-тип anotherworld_brand - используем брендированный компонент
  if (designType === 'anotherworld_brand') {
    return (
      <OnlineBookingBrand 
        initialBranch={selectedBranch}
        initialSlug={slug}
        initialPublicCode={publicCode}
      />
    );
  }

  return (
    <div className="online-booking-container">
      <div className="online-booking-wrapper">
        {/* Заголовок */}
        <div className="online-booking-header">
          <h1>Онлайн-запись</h1>
          {selectedBranch && (
            <div className="online-booking-branch-info">
              <h2>{selectedBranch.branch_name}</h2>
              {selectedBranch.address && <p>{selectedBranch.address}</p>}
            </div>
          )}
        </div>

        {/* Индикатор прогресса */}
        {selectedBranch && currentStep < 5 && (
          <div className="online-booking-progress">
            <div className="progress-steps">
              <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Услуга</span>
              </div>
              <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Дата и время</span>
              </div>
              <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Контакты</span>
              </div>
            </div>
          </div>
        )}

        {/* Контент шагов */}
        <div className="online-booking-content">
          {/* Шаг 1: Выбор филиала */}
          {currentStep === 1 && (
            <div className="booking-step">
              <h3>Выберите филиал</h3>
              <div className="branches-grid">
                {branches.map(branch => (
                  <div
                    key={branch.branch_id}
                    className="branch-card"
                    onClick={() => selectBranch(branch)}
                  >
                    <h4>{branch.branch_name}</h4>
                    {branch.address && <p className="branch-address">{branch.address}</p>}
                    {branch.phone && <p className="branch-phone">{branch.phone}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Шаг 2: Выбор услуг */}
          {currentStep === 2 && (
            <div className="booking-step">
              <h3>Выберите услуги</h3>
              
              {/* Выбранные услуги */}
              {formData.selectedServices.length > 0 && (
                <div className="selected-services-summary">
                  <h4>Выбрано:</h4>
                  {formData.selectedServices.map(item => {
                    const selectedService = item.service;
                    return (
                      <div key={item.serviceId} className="selected-service-item">
                        <span className="service-name">{selectedService.service_name}</span>
                        <div className="service-quantity-controls">
                          <button onClick={() => removeService(item.serviceId)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => addService(selectedService)}>+</button>
                        </div>
                        <span className="service-price">
                          {settings?.show_prices && (() => {
                            const range = getServicePriceRangeDisplay(selectedService);
                            if (String(range).includes('-')) {
                              return `${range} ₸`;
                            }
                            // single value — multiply by quantity for display
                            return `${Number(range) * item.quantity} ₸`;
                          })()}
                        </span>
                      </div>
                    );
                  })}
                  <div className="total-summary">
                    <span>Итого:</span>
                    <span>{getTotalDuration()} мин</span>
                    {settings?.show_prices && (() => {
                      const totalRange = getTotalPriceRange();
                      if (String(totalRange).includes('-')) {
                        return <span>{totalRange} ₸</span>;
                      }
                      return <span>{totalRange} ₸</span>;
                    })()}
                  </div>
                </div>
              )}

              {/* Список доступных услуг */}
              <div className="services-list">
                {services.map(service => {
                  const price = getServicePrice(service);
                  const isSelected = formData.selectedServices.some(s => s.serviceId === service.service_id);
                  
                  return (
                    <div
                      key={service.service_id}
                      className={`service-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => addService(service)}
                    >
                      <h4>{service.service_name}</h4>
                      {service.description && <p className="service-description">{service.description}</p>}
                      <div className="service-details">
                        {settings?.show_duration && (
                          <span className="service-duration">{service.duration} мин</span>
                        )}
                        {settings?.show_prices && (
                          <span className="service-price">{getServicePriceRangeDisplay(service)} ₸</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Информация об автоматически выбранной зоне */}
              {/* {formData.selectedServices.length > 0 && selectedZone && (
                <div className="zone-info-notice">
                  <p>
                    ℹ️ Для вашей записи автоматически выбрана зона: <strong>{selectedZone.zone_name}</strong>
                  </p>
                </div>
              )}

              {formData.selectedServices.length > 0 && availableZones.length === 0 && (
                <div className="zone-warning-notice">
                  <p>
                    ⚠️ Для выбранной услуги нет доступных зон с достаточной вместимостью
                  </p>
                </div>
              )} */}
            </div>
          )}

          {/* Шаг 3: Дата и время с кастомным календарем */}
          {currentStep === 3 && (
            <div className="booking-step">
              <h3>Выберите дату и время</h3>
              
              {/* Кастомный календарь */}
              <div className="booking-section">
                <label>Дата</label>
                <div className="custom-calendar">
                  <div className="calendar-header">
                    <button
                      className="calendar-nav-btn"
                      onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      aria-label="Предыдущий месяц"
                    >
                      ‹
                    </button>
                    
                    <select
                      className="month-year-select"
                      value={`${calendarDate.getMonth()}-${calendarDate.getFullYear()}`}
                      onChange={(e) => {
                        const [month, year] = e.target.value.split('-').map(Number);
                        setCalendarDate(new Date(year, month, 1));
                      }}
                    >
                      {(() => {
                        const months = [];
                        const currentYear = new Date().getFullYear();
                        for (let y = currentYear; y <= currentYear + 1; y++) {
                          for (let m = 0; m < 12; m++) {
                            const date = new Date(y, m, 1);
                            const monthName = date.toLocaleDateString('ru-RU', { month: 'long' });
                            const label = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${y}`;
                            months.push(
                              <option key={`${m}-${y}`} value={`${m}-${y}`}>{label}</option>
                            );
                          }
                        }
                        return months;
                      })()}
                    </select>
                    
                    <button
                      className="calendar-nav-btn"
                      onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      aria-label="Следующий месяц"
                    >
                      ›
                    </button>
                  </div>
                  
                  <div className="calendar-body">
                    <div className="calendar-weekdays">
                      {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((wd, idx) => {
                        const weekdayNum = idx === 6 ? 0 : idx + 1;
                        const rule = weekRules.find(r => r.weekday === weekdayNum);
                        const dayType = rule ? rule.day_type : (weekdayNum === 0 || weekdayNum === 6 ? 'weekend' : 'weekday');
                        return (
                          <div key={wd} className={`calendar-weekday ${dayType === 'weekend' ? 'weekend' : ''} ${dayType === 'holiday' ? 'holiday' : ''}`}>
                            {wd}
                          </div>
                        );
                      })}                    </div>
                    
                    <div className="calendar-days">
                      {buildCalendarMatrix(calendarDate).map((cell, idx) => {
                        const cellMonth = cell.getMonth();
                        const isOtherMonth = cellMonth !== calendarDate.getMonth();
                        const today = new Date();
                        const isToday = cell.getFullYear() === today.getFullYear() &&
                                       cell.getMonth() === today.getMonth() &&
                                       cell.getDate() === today.getDate();
                        const cellDateStr = `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, '0')}-${String(cell.getDate()).padStart(2, '0')}`;
                        const dayType = getDayType(cellDateStr);
                        const isSelected = formData.date === cellDateStr;
                        const isPast = cell < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        
                        return (
                          <button
                            key={idx}
                            className={`calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayType === 'weekend' ? 'weekend' : ''} ${dayType === 'holiday' ? 'holiday' : ''} ${isPast ? 'past' : ''}`}
                            onClick={() => {
                              if (!isPast) {
                                setFormData({ ...formData, date: cellDateStr, time: '' });
                              }
                            }}
                            disabled={isPast}
                          >
                            {cell.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Количество участников */}
              {formData.date && (
                <div className="booking-section">
                  <label>Количество участников</label>
                  <div className="participants-selector">
                    <button
                      className="btn-participants"
                      onClick={() => setFormData({ ...formData, participants: Math.max(1, formData.participants - 1) })}
                    >
                      −
                    </button>
                    <span className="participants-count">{formData.participants}</span>
                    <button
                      className="btn-participants"
                      onClick={() => setFormData({ ...formData, participants: formData.participants + 1 })}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Выбор времени */}
              {formData.date && (
                <div className="booking-section">
                  <label>Время</label>
                  {loadingTimes ? (
                    <p className="loading-text">Загрузка доступного времени...</p>
                  ) : (
                    <>
                      {availableTimes.filter(slot => slot.available).length > 0 ? (
                        <div className="time-slots-grid">
                          {availableTimes
                            .filter(slot => slot.available)
                            .map(slot => (
                              <button
                                key={slot.time}
                                className={`time-slot ${formData.time === slot.time ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, time: slot.time })}
                              >
                                {slot.time}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <p className="no-slots-text">На эту дату нет доступных слотов</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Шаг 4: Форма контактов */}
          {currentStep === 4 && (
            <div className="booking-step">
              <h3>Ваши контактные данные</h3>
              
              {/* Сводка выбранных данных */}
              <div className="booking-summary">
                <h4>Детали записи:</h4>
                <p><strong>Дата:</strong> {formatDate(formData.date)}</p>
                <p><strong>Время:</strong> {formData.time}</p>
                <p><strong>Участников:</strong> {formData.participants}</p>
                <p><strong>Услуги:</strong></p>
                <ul className="services-summary-list">
                  {formData.selectedServices.map(item => (
                    <li key={item.serviceId}>
                      {item.service.service_name} × {item.quantity}
                      {settings?.show_prices && ` — ${item.price * item.quantity} ₸`}
                    </li>
                  ))}
                </ul>
                {selectedZone && (
                  <p><strong>Зона:</strong> {selectedZone.zone_name} (вместимость: до {selectedZone.capacity} чел.)</p>
                )}
                {settings?.show_prices && (
                  <p className="total-price"><strong>Итоговая стоимость:</strong> {getTotalPrice()} ₸</p>
                )}
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
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                    </select>
                    <input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={handlePhoneChange}
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
            </div>
          )}

          {/* Шаг 5: Подтверждение */}
          {currentStep === 5 && (
            <div className="booking-step booking-success">
              <div className="success-icon">✓</div>
              <h3>Запись успешно создана!</h3>
              <p>Мы свяжемся с вами для подтверждения.</p>
              <div className="booking-summary">
                <p><strong>Филиал:</strong> {selectedBranch.branch_name}</p>
                <p><strong>Дата:</strong> {formatDate(formData.date)}</p>
                <p><strong>Время:</strong> {formData.time}</p>
                <p><strong>Участников:</strong> {formData.participants}</p>
                {/* {bookingResult && bookingResult.publicCode && (
                  <p className="booking-code">
                    <strong>Код записи:</strong> {bookingResult.publicCode}
                  </p>
                )} */}
              </div>
              <button
                className="btn-primary"
                onClick={() => window.location.href = `/booking-details/${bookingResult?.publicCode}`}
              >
                Посмотреть детали записи
              </button>
            </div>
          )}
        </div>

        {/* Кнопки навигации */}
        {selectedBranch && currentStep > 1 && currentStep < 5 && (
          <div className="online-booking-actions">
            <button
              className="btn-secondary"
              onClick={handlePrevStep}
            >
              Назад
            </button>
            {currentStep < 4 ? (
              <button
                className="btn-primary"
                onClick={handleNextStep}
              >
                Далее
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Отправка...' : 'Подтвердить запись'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

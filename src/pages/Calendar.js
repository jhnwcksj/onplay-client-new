import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './Calendar.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function Calendar() {
  const [calendarDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  const [branchId, setBranchId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [weekRules, setWeekRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentUpdateTrigger, setAppointmentUpdateTrigger] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) return savedTheme === 'dark';
      const saved = localStorage.getItem('dark');
      if (saved !== null) return saved === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDayEvent, setSelectedDayEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    id: null,
    start_date: '',
    end_date: '',
    title: '',
    description: '',
    day_type: 'holiday'
  });

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  const dayTypeLabels = {
    weekday: 'Будние',
    weekend: 'Выходной',
    holiday: 'Праздник'
  };

  const dayTypeColors = {
    weekday: '#10b981',
    weekend: '#3b82f6',
    holiday: '#ef4444'
  };

  // Форматирует локальную дату в строку YYYY-MM-DD без UTC конвертации
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    document.title = 'Календарь';
    
    try {
      const url = new URL(window.location.href);
      const bid = url.searchParams.get('branchId');
      if (bid) {
        setBranchId(bid);
        localStorage.setItem('selectedBranchId', bid);
      } else {
        const saved = localStorage.getItem('selectedBranchId');
        if (saved) setBranchId(saved);
      }
    } catch (err) {
      console.error('Error getting branchId:', err);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      try {
        if (e && e.detail) setDarkMode(!!(e.detail.isDark || e.detail.themeId === 'dark'));
      } catch (err) { /* ignore */ }
    };

    window.addEventListener('appThemeChanged', handler);
    return () => window.removeEventListener('appThemeChanged', handler);
  }, []);

  // Проверка доступа к филиалу для user/vip-user
  useEffect(() => {
    if (branchId) {
      const checkBranchAccess = async () => {
        try {
          const storedUser = localStorage.getItem('user');
          if (!storedUser) {
            loadCalendarData();
            return;
          }
          
          const user = JSON.parse(storedUser);
          const userRole = user.role || 'user';
          
          // Проверка только для user и vip-user
          if (userRole !== 'user' && userRole !== 'vip-user') {
            loadCalendarData();
            return;
          }
          
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/branches?userId=${user.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          if (response.ok) {
            const data = await response.json();
            const branch = data.branches?.find(b => String(b.branch_id) === String(branchId));
            
            if (branch && branch.valid_until) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const validUntil = new Date(branch.valid_until);
              validUntil.setHours(0, 0, 0, 0);
              
              if (validUntil < today) {
                setMessage('Доступ к этому филиалу истек. Обратитесь к администратору.');
                setLoading(false);
                return;
              }
            }
          }
          
          loadCalendarData();
        } catch (err) {
          console.error('Error checking branch access:', err);
          loadCalendarData();
        }
      };
      
      checkBranchAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/calendar/${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load calendar data');

      const data = await response.json();
      setHolidays(data.holidays || []);
      setWeekRules(data.weekRules || []);
    } catch (err) {
      console.error('Error loading calendar:', err);
      showMessage('Ошибка при загрузке календаря', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateWeekRule = async (weekday, dayType) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/calendar/${branchId}/week-rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weekday, day_type: dayType })
      });

      if (!response.ok) throw new Error('Failed to update week rule');

      await loadCalendarData();
      showMessage('Правило обновлено. Изменения вступят в силу после обновления страницы', 'success');
      setAppointmentUpdateTrigger(prev => prev + 1); // Обновляем Sidebar
    } catch (err) {
      console.error('Error updating week rule:', err);
      showMessage('Ошибка при обновлении', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEventDialog = (event = null, date = null) => {
    if (event) {
      setEventForm({
        id: event.id,
        start_date: event.start_date,
        end_date: event.end_date,
        title: event.title || '',
        description: event.description || '',
        day_type: event.day_type
      });
      setSelectedDayEvent(event);
    } else {
      const dateStr = date || formatLocalDate(new Date());
      setEventForm({
        id: null,
        start_date: dateStr,
        end_date: dateStr,
        title: '',
        description: '',
        day_type: 'holiday'
      });
      setSelectedDayEvent(null);
    }
    setShowEventDialog(true);
  };

  const saveEvent = async () => {
    if (!eventForm.start_date) {
      showMessage('Выберите дату начала', 'error');
      return;
    }

    if (!eventForm.title) {
      showMessage('Введите название события', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/calendar/${branchId}/holidays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      await loadCalendarData();
      setShowEventDialog(false);
      showMessage(eventForm.id ? 'Событие обновлено. Изменения вступят в силу после обновления страницы' : 'Событие добавлено. Изменения вступят в силу после обновления страницы', 'success');
      setAppointmentUpdateTrigger(prev => prev + 1); // Обновляем Sidebar
    } catch (err) {
      console.error('Error saving event:', err);
      showMessage(err.message || 'Ошибка при сохранении', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Удалить это событие?')) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/calendar/${branchId}/holidays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete event');

      await loadCalendarData();
      showMessage('Событие удалено. Изменения вступят в силу после обновления страницы', 'success');
      setAppointmentUpdateTrigger(prev => prev + 1); // Обновляем Sidebar
    } catch (err) {
      console.error('Error deleting event:', err);
      showMessage('Ошибка при удалении', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventForDate = (dateStr) => {
    return holidays.find(h => {
      // Parse dates as local dates to avoid timezone shift
      const [cy, cm, cd] = dateStr.split('-').map(Number);
      const [sy, sm, sd] = h.start_date.split('-').map(Number);
      const [ey, em, ed] = h.end_date.split('-').map(Number);
      
      const current = new Date(cy, cm - 1, cd);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      
      return current >= start && current <= end;
    });
  };

  const getDayType = (dateStr) => {
    // Parse date as local date to avoid timezone shift
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay();
    const event = getEventForDate(dateStr);
    
    if (event) return event.day_type;
    
    // Используем правила недели из базы данных
    const weekRule = weekRules.find(r => r.weekday === dayOfWeek);
    if (weekRule) return weekRule.day_type;
    
    // По умолчанию
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
  };

  const handleDayClick = (dateStr) => {
    const event = getEventForDate(dateStr);
    if (event) {
      openEventDialog(event);
    } else {
      openEventDialog(null, dateStr);
    }
  };

  const renderMainCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Дни предыдущего месяца
    const prevMonthDays = getDaysInMonth(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1
    );
    const prevMonthStart = prevMonthDays - (firstDay === 0 ? 6 : firstDay - 1) + 1;
    
    for (let day = prevMonthStart; day <= prevMonthDays; day++) {
      const date = new Date(
        currentMonth === 0 ? currentYear - 1 : currentYear,
        currentMonth === 0 ? 11 : currentMonth - 1,
        day
      );
      const dateStr = formatLocalDate(date);
      const dayType = getDayType(dateStr);
      const event = getEventForDate(dateStr);
      const isStartOfEvent = event && event.start_date === dateStr;

      days.push(
        <div
          key={`prev-${day}`}
          className={`main-calendar-day ${dayType} other-month`}
          onClick={() => handleDayClick(dateStr)}
        >
          <div className="day-number">{day}</div>
          {isStartOfEvent && (
            <div 
              className="event-badge"
              style={{ backgroundColor: dayTypeColors[event.day_type] }}
            >
              {event.title}
            </div>
          )}
        </div>
      );
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatLocalDate(date);
      const dayType = getDayType(dateStr);
      const event = getEventForDate(dateStr);
      const isToday = new Date().toDateString() === date.toDateString();
      const isStartOfEvent = event && event.start_date === dateStr;

      days.push(
        <div
          key={day}
          className={`main-calendar-day ${dayType} ${isToday ? 'today' : ''}`}
          onClick={() => handleDayClick(dateStr)}
        >
          <div className="day-number">{day}</div>
          {isStartOfEvent && (
            <div 
              className="event-badge"
              style={{ backgroundColor: dayTypeColors[event.day_type] }}
            >
              {event.title}
            </div>
          )}
        </div>
      );
    }

    // Дни следующего месяца
    const totalCells = days.length;
    const remainingCells = 42 - totalCells; // 6 недель x 7 дней
    
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(
        currentMonth === 11 ? currentYear + 1 : currentYear,
        currentMonth === 11 ? 0 : currentMonth + 1,
        day
      );
      const dateStr = formatLocalDate(date);
      const dayType = getDayType(dateStr);
      const event = getEventForDate(dateStr);
      const isStartOfEvent = event && event.start_date === dateStr;

      days.push(
        <div
          key={`next-${day}`}
          className={`main-calendar-day ${dayType} other-month`}
          onClick={() => handleDayClick(dateStr)}
        >
          <div className="day-number">{day}</div>
          {isStartOfEvent && (
            <div 
              className="event-badge"
              style={{ backgroundColor: dayTypeColors[event.day_type] }}
            >
              {event.title}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const changeMainMonth = (delta) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const userName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Пользователь';
  const userEmail = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'email@example.com';
  const userRole = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role || 'user' : 'user';

  if (loading) {
    return (
      <div className="timetable-wrapper">
        <Sidebar
          calendarDate={calendarDate}
          setCalendarDate={() => {}}
          selectedDate={selectedDate}
          setSelectedDate={() => {}}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          loadingUser={false}
          userError={null}
        />
        <div className={`calendar-page-content ${darkMode ? 'dark' : ''}`}>
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-wrapper">
      <Sidebar
        calendarDate={calendarDate}
        setCalendarDate={() => {}}
        selectedDate={selectedDate}
        setSelectedDate={() => {}}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        loadingUser={false}
        userError={null}
        appointmentUpdateTrigger={appointmentUpdateTrigger}
      />

      <div className={`calendar-page-content ${darkMode ? 'dark' : ''}`}>
        {message && (
          <div className={`message-toast ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="calendar-layout">
          {/* Left Sidebar */}
          <div className="calendar-sidebar">
            <div className="sidebar-header">
              <button className="add-event-button" onClick={() => openEventDialog()}>
                + Добавить событие
              </button>
            </div>

            {/* Week Rules */}
            <div className="week-rules-section">
              <h3>ОБЫЧНЫЕ ДНИ НЕДЕЛИ</h3>
              <div className="week-rules-list">
                {[1, 2, 3, 4, 5, 6, 0].map(weekday => {
                  const rule = weekRules.find(r => r.weekday === weekday);
                  const currentType = rule?.day_type || (weekday === 0 || weekday === 6 ? 'weekend' : 'weekday');
                  
                  return (
                    <div key={weekday} className="week-rule-item">
                      <div className="day-name">{dayNames[weekday]}</div>
                      <div className="day-type-selector">
                        {Object.entries(dayTypeLabels).map(([type, label]) => (
                          <button
                            key={type}
                            className={`type-select-btn ${currentType === type ? 'active' : ''}`}
                            style={{
                              backgroundColor: currentType === type ? dayTypeColors[type] : 'transparent',
                              borderColor: dayTypeColors[type],
                              color: currentType === type ? '#fff' : dayTypeColors[type]
                            }}
                            onClick={() => updateWeekRule(weekday, type)}
                            disabled={saving}
                            title={label}
                          >
                            {label[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="legend-section">
              <h3>ЛЕГЕНДА</h3>
              {Object.entries(dayTypeLabels).map(([type, label]) => (
                <div key={type} className="legend-item">
                  <div 
                    className="legend-dot" 
                    style={{ backgroundColor: dayTypeColors[type] }}
                  ></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Events List */}
            <div className="events-section">
              <h3>СОБЫТИЯ</h3>
              {holidays.length === 0 ? (
                <p className="no-events">Нет событий</p>
              ) : (
                <div className="events-list">
                  {holidays.map(event => (
                    <div 
                      key={event.id} 
                      className="event-item"
                      onClick={() => openEventDialog(event)}
                    >
                      <div 
                        className="event-dot"
                        style={{ backgroundColor: dayTypeColors[event.day_type] }}
                      ></div>
                      <div className="event-info">
                        <div className="event-title">{event.title}</div>
                        <div className="event-date">
                          {event.start_date === event.end_date 
                            ? new Date(event.start_date).toLocaleDateString('ru-RU')
                            : `${new Date(event.start_date).toLocaleDateString('ru-RU')} - ${new Date(event.end_date).toLocaleDateString('ru-RU')}`
                          }
                        </div>
                      </div>
                      <button 
                        className="event-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(event.id);
                        }}
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Calendar */}
          <div className="main-calendar">
            <div className="main-calendar-header">
              <button onClick={() => changeMainMonth(-1)}>‹</button>
              <div className="header-center">
                <button className="today-button" onClick={goToToday}>
                  Сегодня
                </button>
                <h2>{monthNames[currentMonth]} {currentYear}</h2>
              </div>
              <button onClick={() => changeMainMonth(1)}>›</button>
            </div>

            <div className="main-calendar-weekdays">
              {['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'].map(day => (
                <div key={day} className="main-weekday">{day}</div>
              ))}
            </div>

            <div className="main-calendar-grid">
              {renderMainCalendar()}
            </div>
          </div>
        </div>

        {/* Event Dialog */}
        {showEventDialog && (
          <div className="dialog-overlay" onClick={() => setShowEventDialog(false)}>
            <div className="event-dialog" onClick={e => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>{eventForm.id ? 'Редактировать событие' : 'Добавить событие'}</h3>
                <button className="close-btn" onClick={() => setShowEventDialog(false)}>×</button>
              </div>
              
              <div className="dialog-content">
                <div className="form-group">
                  <label>Название</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Например: Новый год"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Дата начала</label>
                    <input
                      type="date"
                      value={eventForm.start_date}
                      onChange={e => setEventForm({ ...eventForm, start_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Дата окончания</label>
                    <input
                      type="date"
                      value={eventForm.end_date}
                      onChange={e => setEventForm({ ...eventForm, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Тип дня</label>
                  <div className="type-buttons">
                    {Object.entries(dayTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        className={`type-btn ${eventForm.day_type === type ? 'active' : ''}`}
                        style={{
                          backgroundColor: eventForm.day_type === type ? dayTypeColors[type] : 'transparent',
                          borderColor: dayTypeColors[type],
                          color: eventForm.day_type === type ? '#fff' : dayTypeColors[type]
                        }}
                        onClick={() => setEventForm({ ...eventForm, day_type: type })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Описание (опционально)</label>
                  <textarea
                    value={eventForm.description}
                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Дополнительная информация"
                    rows="3"
                  />
                </div>
              </div>

              <div className="dialog-actions">
                {eventForm.id && (
                  <button
                    className="delete-btn"
                    onClick={() => {
                      setShowEventDialog(false);
                      deleteEvent(eventForm.id);
                    }}
                    disabled={saving}
                  >
                    Удалить
                  </button>
                )}
                <button className="cancel-btn" onClick={() => setShowEventDialog(false)}>
                  Отмена
                </button>
                <button className="save-btn" onClick={saveEvent} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

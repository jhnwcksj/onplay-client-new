import React, { useState, useRef, useEffect } from 'react';
import './DatePickerWithHints.css';

export default function DatePickerWithHints({ value, onChange, placeholder, title, availableDates = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const d = new Date(value);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const [dropdownPosition, setDropdownPosition] = useState({ top: true, left: true });
  
  const containerRef = useRef(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Определение позиции выпадающего списка
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      // Учитываем реальную ширину календаря: min-width 280px + padding 32px + border 2px = 314px
      const dropdownWidth = 320;
      const dropdownHeight = 400;
      
      // Проверяем, помещается ли календарь снизу
      const fitsBottom = rect.bottom + dropdownHeight <= viewportHeight;
      // Проверяем, помещается ли календарь слева (left: 0 означает выравнивание по левому краю инпута)
      const fitsLeft = rect.left + dropdownWidth <= viewportWidth;
      
      setDropdownPosition({
        top: fitsBottom,
        left: fitsLeft
      });
    }
  }, [isOpen]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Понедельник = 0
    
    const days = [];
    // Пустые ячейки до начала месяца
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const handleDateClick = (date) => {
    if (!date) return;
    // Используем локальное время вместо UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    onChange({ target: { value: dateStr } });
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateAvailable = (date) => {
    if (!date) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return availableDates.includes(dateStr);
  };

  const isSelectedDate = (date) => {
    if (!date || !value) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr === value;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="date-picker-with-hints" ref={containerRef}>
      <input
        type="text"
        className="history-filter-date"
        value={formatDisplayDate(value)}
        placeholder={placeholder}
        title={title}
        onClick={() => setIsOpen(!isOpen)}
        readOnly
      />
      
      {isOpen && (
        <div className={`calendar-dropdown ${dropdownPosition.top ? 'position-bottom' : 'position-top'} ${dropdownPosition.left ? 'position-left' : 'position-right'}`}>
          <div className="calendar-header">
            <button type="button" onClick={handlePrevMonth} className="calendar-nav-btn">‹</button>
            <span className="calendar-month-name">{monthName}</span>
            <button type="button" onClick={handleNextMonth} className="calendar-nav-btn">›</button>
          </div>
          
          <div className="calendar-grid">
            {weekDays.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
            
            {days.map((date, idx) => (
              <div
                key={idx}
                className={`calendar-day ${!date ? 'empty' : ''} ${isSelectedDate(date) ? 'selected' : ''} ${isToday(date) ? 'today' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                {date && (
                  <>
                    <span className="day-number">{date.getDate()}</span>
                    {isDateAvailable(date) && <span className="date-indicator">•</span>}
                  </>
                )}
              </div>
            ))}
          </div>
          
          {value && (
            <div className="calendar-footer">
              <button 
                type="button" 
                onClick={() => { onChange({ target: { value: '' } }); setIsOpen(false); }}
                className="calendar-clear-btn"
              >
                Очистить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

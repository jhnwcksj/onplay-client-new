import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { toast } from '../hooks/use-toast';
import './BackgroundSettings.css';

const THEMES = [
  {
    id: 'light',
    name: 'Светлая тема',
    description: 'Классическая светлая тема (по умолчанию)',
    background: '#ffffff',
    text: '#1f2937',
    primary: '#3b82f6',
    secondary: '#e5e7eb',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)'
  },
  {
    id: 'dark',
    name: 'Темная тема',
    description: 'Современная темная тема для комфортной работы',
    background: '#1f2937',
    text: '#f3f4f6',
    primary: '#60a5fa',
    secondary: '#374151',
    preview: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)'
  },
  {
    id: 'blue',
    name: 'Синяя тема',
    description: 'Профессиональная синяя цветовая схема',
    background: '#eff6ff',
    text: '#1e3a8a',
    primary: '#3b82f6',
    secondary: '#bfdbfe',
    preview: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
  },
  {
    id: 'green',
    name: 'Зеленая тема',
    description: 'Свежая зеленая тема для глаз',
    background: '#f0fdf4',
    text: '#14532d',
    primary: '#22c55e',
    secondary: '#bbf7d0',
    preview: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
  },
  {
    id: 'purple',
    name: 'Фиолетовая тема',
    description: 'Креативная фиолетовая палитра',
    background: '#faf5ff',
    text: '#581c87',
    primary: '#a855f7',
    secondary: '#e9d5ff',
    preview: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'
  },
  {
    id: 'orange',
    name: 'Оранжевая тема',
    description: 'Энергичная оранжевая тема',
    background: '#fff7ed',
    text: '#7c2d12',
    primary: '#f97316',
    secondary: '#fed7aa',
    preview: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
  },
  {
    id: 'ocean',
    name: 'Океан',
    description: 'Спокойная морская тема',
    background: '#ecfeff',
    text: '#164e63',
    primary: '#06b6d4',
    secondary: '#a5f3fc',
    preview: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
  },
  {
    id: 'sunset',
    name: 'Закат',
    description: 'Теплая тема заката',
    background: '#fef2f2',
    text: '#7f1d1d',
    primary: '#ef4444',
    secondary: '#fecaca',
    preview: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
  }
];

const BACKGROUND_IMAGES = [
  {
    id: 'gradient-1',
    name: 'Градиент 1',
    url: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
  },
  {
    id: 'gradient-2',
    name: 'Градиент 2',
    url: 'linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)'
  },
  {
    id: 'gradient-3',
    name: 'Градиент 3',
    url: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)'
  },
  {
    id: 'pattern-1',
    name: 'Геометрический узор',
    url: 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)'
  }
];

export default function BackgroundSettings() {
  useEffect(() => { document.title = 'Настройки фона и темы'; }, []);

  const [selectedTheme, setSelectedTheme] = useState('light');
  const [selectedBackground, setSelectedBackground] = useState('none');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const [calendarDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  useEffect(() => {
    // Загрузить сохраненные настройки
    try {
      const savedTheme = localStorage.getItem('appTheme') || 'light';
      const savedBackground = localStorage.getItem('appBackground') || 'none';
      const savedCustomBg = localStorage.getItem('appCustomBackground') || '';
      
      setSelectedTheme(savedTheme);
      setSelectedBackground(savedBackground);
      setCustomBackgroundUrl(savedCustomBg);

      // Применить сохраненные настройки
      applyTheme(savedTheme, savedBackground, savedCustomBg, false);
    } catch (e) {
      console.error('Error loading theme settings:', e);
    }
  }, []);

  const applyTheme = (themeId, backgroundId, customBg, showToast = true) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const root = document.documentElement;

    // Функция для определения яркости цвета
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    // Определяем, темная ли тема (явная проверка)
    const isDark = themeId === 'dark' || getLuminance(theme.background) < 0.5;
    
    // Адаптивные цвета
    const adaptiveText = isDark ? '#f9fafb' : theme.text;
    const adaptiveCardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)';
    const adaptiveBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const adaptiveHover = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)';
    const adaptiveInput = isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff';
    const adaptiveInputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb';
    const adaptiveSubtext = isDark ? '#d1d5db' : '#6b7280';
    
    // Для темной темы используем более светлый фон
    const pageBackground = isDark ? '#1f2937' : theme.background;

    // Создаем темную версию primary для Sidebar
    const darkenColor = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = Math.max(0, ((rgb >> 16) & 0xff) * 0.25);
      const g = Math.max(0, ((rgb >> 8) & 0xff) * 0.25);
      const b = Math.max(0, (rgb & 0xff) * 0.25);
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    };

    // Применить цветовую схему темы
    root.style.setProperty('--theme-background', isDark ? '#1f2937' : theme.background);
    root.style.setProperty('--theme-text', adaptiveText);
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', isDark ? '#374151' : theme.secondary);
    root.style.setProperty('--theme-sidebar-bg', darkenColor(theme.primary));

    // Helpful extra variables for components
    root.style.setProperty('--theme-link', isDark ? '#93c5fd' : theme.primary);
    root.style.setProperty('--theme-card-text', isDark ? '#e6eef7' : '#0f172a');
    root.style.setProperty('--theme-inverse-text', isDark ? '#0b1228' : '#ffffff');
    
    // Адаптивные переменные
    root.style.setProperty('--theme-card-bg', adaptiveCardBg);
    root.style.setProperty('--theme-border', adaptiveBorder);
    root.style.setProperty('--theme-hover', adaptiveHover);
    root.style.setProperty('--theme-input-bg', adaptiveInput);
    root.style.setProperty('--theme-input-border', adaptiveInputBorder);
    root.style.setProperty('--theme-subtext', adaptiveSubtext);

    // Применить фон
    if (backgroundId === 'custom' && customBg) {
      // Проверяем, является ли это URL изображения или градиентом
      if (customBg.startsWith('linear-gradient') || customBg.startsWith('radial-gradient') || customBg.startsWith('repeating-')) {
        root.style.setProperty('--theme-page-background', customBg);
        root.style.setProperty('--theme-page-background-size', 'cover');
      } else {
        root.style.setProperty('--theme-page-background', `url(${customBg})`);
        root.style.setProperty('--theme-page-background-size', 'cover');
      }
    } else if (backgroundId !== 'none') {
      const background = BACKGROUND_IMAGES.find(b => b.id === backgroundId);
      if (background) {
        root.style.setProperty('--theme-page-background', background.url);
      }
    } else {
      root.style.setProperty('--theme-page-background', theme.background);
    }

    if (showToast) {
      toast({
        title: 'Тема применена',
        description: `Выбрана тема: ${theme.name}`,
        variant: 'success'
      });
    }
    // Notify other parts of the app about the theme change so they can react immediately
    try {
      window.dispatchEvent(new CustomEvent('appThemeChanged', { detail: { themeId, isDark } }));
    } catch {}
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('appTheme', selectedTheme);
      localStorage.setItem('appBackground', selectedBackground);
      localStorage.setItem('appCustomBackground', customBackgroundUrl);

      applyTheme(selectedTheme, selectedBackground, customBackgroundUrl);

      toast({
        title: 'Успешно',
        description: 'Настройки фона и темы сохранены',
        variant: 'success'
      });
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    }
  };

  const handleResetSettings = () => {
    try {
      localStorage.removeItem('appTheme');
      localStorage.removeItem('appBackground');
      localStorage.removeItem('appCustomBackground');

      setSelectedTheme('light');
      setSelectedBackground('none');
      setCustomBackgroundUrl('');

      applyTheme('light', 'none', '');

      toast({
        title: 'Сброшено',
        description: 'Настройки возвращены к значениям по умолчанию',
        variant: 'success'
      });
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сбросить настройки',
        variant: 'destructive'
      });
    }
  };

  const handlePreview = () => {
    applyTheme(selectedTheme, selectedBackground, customBackgroundUrl, false);
    setPreviewMode(true);
    setTimeout(() => setPreviewMode(false), 3000);
  };

  const userName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Пользователь';
  const userEmail = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'email@example.com';
  const userRole = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role || 'user' : 'user';

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

      <div className="background-settings-content">
        <div className="background-settings-header">
          <div className="background-settings-header-info">
            <h1>Настройки фона и темы</h1>
            <p className="background-settings-subtitle">
              Выберите цветовую тему и фон для вашего рабочего пространства
            </p>
          </div>
          <div className="background-settings-header-actions">
            <button className="btn btn-secondary" onClick={handleResetSettings}>
              🔄 Сбросить к умолчанию
            </button>
          </div>
        </div>

        {previewMode && (
          <div className="preview-banner">
            <span>🎨 Предварительный просмотр активен</span>
          </div>
        )}

        <div className="background-settings-section">
          <h2 className="section-title">Цветовая тема</h2>
          <div className="themes-grid">
            {THEMES.map(theme => (
              <div
                key={theme.id}
                className={`theme-card ${selectedTheme === theme.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTheme(theme.id);
                  applyTheme(theme.id, selectedBackground, customBackgroundUrl, false);
                  localStorage.setItem('appTheme', theme.id);
                  toast({
                    title: 'Тема применена',
                    description: `Выбрана тема: ${theme.name}`,
                    variant: 'success'
                  });
                }}
              >
                <div 
                  className="theme-preview" 
                  style={{ background: theme.preview }}
                />
                <div className="theme-info">
                  <h3>{theme.name}</h3>
                  <p>{theme.description}</p>
                </div>
                {selectedTheme === theme.id && (
                  <div className="theme-selected-badge">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* <div className="background-settings-section">
          <h2 className="section-title">Фоновый рисунок</h2>
          
          <div className="background-option">
            <label className="background-radio">
              <input
                type="radio"
                name="background"
                value="none"
                checked={selectedBackground === 'none'}
                onChange={(e) => {
                  setSelectedBackground(e.target.value);
                  applyTheme(selectedTheme, 'none', '', false);
                  localStorage.setItem('appBackground', 'none');
                }}
              />
              <span>Без фона (только цвет темы)</span>
            </label>
          </div>

          <div className="backgrounds-grid">
            {BACKGROUND_IMAGES.map(bg => (
              <div
                key={bg.id}
                className={`background-card ${selectedBackground === bg.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedBackground(bg.id);
                  applyTheme(selectedTheme, bg.id, customBackgroundUrl, false);
                  localStorage.setItem('appBackground', bg.id);
                }}
              >
                <div 
                  className="background-preview" 
                  style={{ background: bg.url }}
                />
                <div className="background-name">{bg.name}</div>
                {selectedBackground === bg.id && (
                  <div className="background-selected-badge">✓</div>
                )}
              </div>
            ))}
          </div>
        </div> */}

        {/* actions moved to header */}
      </div>
    </div>
  );
}

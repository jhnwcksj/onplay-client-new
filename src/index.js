import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Apply saved theme on page load
const applySavedTheme = () => {
  try {
    const THEMES = {
      light: { background: '#ffffff', text: '#1f2937', primary: '#3b82f6', secondary: '#e5e7eb' },
      dark: { background: '#1f2937', text: '#f3f4f6', primary: '#60a5fa', secondary: '#374151' },
      blue: { background: '#eff6ff', text: '#1e3a8a', primary: '#3b82f6', secondary: '#bfdbfe' },
      green: { background: '#f0fdf4', text: '#14532d', primary: '#22c55e', secondary: '#bbf7d0' },
      purple: { background: '#faf5ff', text: '#581c87', primary: '#a855f7', secondary: '#e9d5ff' },
      orange: { background: '#fff7ed', text: '#7c2d12', primary: '#f97316', secondary: '#fed7aa' },
      ocean: { background: '#ecfeff', text: '#164e63', primary: '#06b6d4', secondary: '#a5f3fc' },
      sunset: { background: '#fef2f2', text: '#7f1d1d', primary: '#ef4444', secondary: '#fecaca' }
    };

    const BACKGROUND_IMAGES = {
      'gradient-1': 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
      'gradient-2': 'linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)',
      'gradient-3': 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)',
      'pattern-1': 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)'
    };

    const savedTheme = localStorage.getItem('appTheme') || 'light';
    const savedBackground = localStorage.getItem('appBackground') || 'none';
    const savedCustomBg = localStorage.getItem('appCustomBackground') || '';

    const theme = THEMES[savedTheme] || THEMES.light;
    const root = document.documentElement;

    // Функция для определения яркости цвета
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    // Функция для затемнения цвета
    const darkenColor = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = Math.max(0, ((rgb >> 16) & 0xff) * 0.25);
      const g = Math.max(0, ((rgb >> 8) & 0xff) * 0.25);
      const b = Math.max(0, (rgb & 0xff) * 0.25);
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    };

    const isDark = savedTheme === 'dark' || getLuminance(theme.background) < 0.5;
    const adaptiveText = isDark ? '#f9fafb' : theme.text;
    
    // Адаптивные цвета для компонентов
    const adaptiveCardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)';
    const adaptiveBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const adaptiveHover = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)';
    const adaptiveInput = isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff';
    const adaptiveInputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb';
    const adaptiveSubtext = isDark ? '#d1d5db' : '#6b7280';

    root.style.setProperty('--theme-background', isDark ? '#1f2937' : theme.background);
    root.style.setProperty('--theme-text', adaptiveText);
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', isDark ? '#374151' : theme.secondary);
    root.style.setProperty('--theme-sidebar-bg', darkenColor(theme.primary));
    
    // Адаптивные переменные
    root.style.setProperty('--theme-card-bg', adaptiveCardBg);
    root.style.setProperty('--theme-border', adaptiveBorder);
    root.style.setProperty('--theme-hover', adaptiveHover);
    root.style.setProperty('--theme-input-bg', adaptiveInput);
    root.style.setProperty('--theme-input-border', adaptiveInputBorder);
    root.style.setProperty('--theme-subtext', adaptiveSubtext);

    if (savedBackground === 'custom' && savedCustomBg) {
      if (savedCustomBg.startsWith('linear-gradient') || savedCustomBg.startsWith('radial-gradient') || savedCustomBg.startsWith('repeating-')) {
        root.style.setProperty('--theme-page-background', savedCustomBg);
      } else {
        root.style.setProperty('--theme-page-background', `url(${savedCustomBg})`);
        root.style.setProperty('--theme-page-background-size', 'cover');
      }
    } else if (savedBackground !== 'none' && BACKGROUND_IMAGES[savedBackground]) {
      root.style.setProperty('--theme-page-background', BACKGROUND_IMAGES[savedBackground]);
    } else {
      root.style.setProperty('--theme-page-background', theme.background);
    }
  } catch (e) {
    console.error('Error applying saved theme:', e);
  }
};

// Apply theme before rendering
applySavedTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

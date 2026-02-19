import React from 'react';
import Sidebar from '../components/Sidebar';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Settings.css';

export default function Settings() {

  useEffect(() => {
      document.title = 'Настройки';
    }, []);

  // For now, Settings doesn't need dynamic data — it's static navigation cards
  const settingsGroups = [
    { title: 'Услуги', items: ['Услуги'] },
    { title: 'Зоны', items: ['Зоны'] },
    { title: 'Календарь', items: ['Календарь'] },
    // { title: 'График работы', items: ['График работы'] },
    { title: 'Настройки сетей и филиалов', items: ['Настройки сетей и филиалов'] },
    { title: 'Фон и тема', items: ['Фон и тема'] },
    // { title: 'Уведомление', items: ['Уведомление'] },
  ];

  // Keep sidebar state local for the small calendar behaviour; using a simple default.
  const [calendarDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate] = React.useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  const branchIdForLink = (() => {
    try {
      const url = new URL(window.location.href);
      const p = url.searchParams.get('branchId');
      if (p) return p;
    } catch {}
    try {
      const saved = localStorage.getItem('selectedBranchId');
      if (saved) return saved;
    } catch {}
    return null;
  })();

  const zonesLink = branchIdForLink ? `/settings/zones?branchId=${encodeURIComponent(branchIdForLink)}` : '/settings/zones';
  const calendarLink = branchIdForLink ? `/settings/calendar?branchId=${encodeURIComponent(branchIdForLink)}` : '/settings/calendar';
  const networksSettingsLink = branchIdForLink
    ? `/settings/networks?branchId=${encodeURIComponent(branchIdForLink)}`
    : '/settings/networks';
  const backgroundSettingsLink = branchIdForLink
    ? `/settings/background?branchId=${encodeURIComponent(branchIdForLink)}`
    : '/settings/background';

  // Получить текущую тему для отображения
  const getCurrentThemeName = () => {
    const themeNames = {
      light: 'Светлая',
      dark: 'Темная',
      blue: 'Синяя',
      green: 'Зеленая',
      purple: 'Фиолетовая',
      orange: 'Оранжевая',
      ocean: 'Океан',
      sunset: 'Закат'
    };
    try {
      const savedTheme = localStorage.getItem('appTheme') || 'light';
      return themeNames[savedTheme] || 'Светлая';
    } catch {
      return 'Светлая';
    }
  };

  // Determine whether the current app theme/background is dark and respond to changes
  const darkThemeKeys = React.useMemo(() => new Set(['dark', 'purple', 'ocean', 'sunset']), []);
  const [isDarkTheme, setIsDarkTheme] = React.useState(() => {
    try {
      const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
      if (cssText && cssText.startsWith('#')) {
        const rgb = parseInt(cssText.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = rgb & 0xff;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.7; // light text indicates dark background
      }
      const saved = localStorage.getItem('appTheme') || 'light';
      return darkThemeKeys.has(saved);
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const handler = (e) => {
      try {
        if (e && e.detail && typeof e.detail.isDark !== 'undefined') {
          setIsDarkTheme(Boolean(e.detail.isDark));
          return;
        }
        const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
        if (cssText && cssText.startsWith('#')) {
          const rgb = parseInt(cssText.slice(1), 16);
          const r = (rgb >> 16) & 0xff;
          const g = (rgb >> 8) & 0xff;
          const b = rgb & 0xff;
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setIsDarkTheme(lum > 0.7);
          return;
        }
        const saved = localStorage.getItem('appTheme') || 'light';
        setIsDarkTheme(darkThemeKeys.has(saved));
      } catch {}
    };
    window.addEventListener('appThemeChanged', handler);
    return () => window.removeEventListener('appThemeChanged', handler);
  }, [darkThemeKeys]);

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

      <div className={`settings-content ${isDarkTheme ? 'dark-theme' : ''}`}>
        <div className="settings-header">
          <div className="settings-burger">☰</div>
          <h1>Настройки</h1>
        </div>

        <div className="settings-grid">
          {settingsGroups.map((group) => (
            <div key={group.title} className="settings-card">
              <div className="settings-card-title">{group.title}</div>
              <ul>
                {group.items.map((it) => (
                  <li key={it}>
                    {it === 'Зоны' ? (
                      <Link to={zonesLink}>{it}</Link>
                    ) : it === 'Услуги' ? (
                      <Link to={branchIdForLink ? `/settings/services?branchId=${encodeURIComponent(branchIdForLink)}` : '/settings/services'}>{it}</Link>
                    ) : it === 'Календарь' ? (
                      <Link to={calendarLink}>{it}</Link>
                    ) : it === 'Настройки сетей и филиалов' ? (
                      <Link to={networksSettingsLink}>{it}</Link>
                    ) : it === 'Фон и тема' ? (
                      <Link to={backgroundSettingsLink}>
                        {it}
                        <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                          (Текущая: {getCurrentThemeName()})
                        </span>
                      </Link>
                    ) : (
                      it
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

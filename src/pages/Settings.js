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
    // { title: 'График работы', items: ['График работы'] },
    { title: 'Настройки сетей и филиалов', items: ['Настройки сетей и филиалов'] },
    { title: 'Уведомление', items: ['Уведомление'] },
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
  const networksSettingsLink = branchIdForLink
    ? `/settings/networks?branchId=${encodeURIComponent(branchIdForLink)}`
    : '/settings/networks';

  

  return (
    <div className="timetable-wrapper">
        <Sidebar
        calendarDate={calendarDate}
        setCalendarDate={() => {}}
        selectedDate={selectedDate}
        setSelectedDate={() => {}}
        userName={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Пользователь'}
        userEmail={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'email@example.com'}
        loadingUser={false}
        userError={null}
      />

      <div className="settings-content">
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
                    ) : it === 'Настройки сетей и филиалов' ? (
                      <Link to={networksSettingsLink}>{it}</Link>
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

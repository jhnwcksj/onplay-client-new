import React, { useEffect } from 'react';

import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AccessDenied from './AccessDenied';
import './Dashboard.css';


export default function Dashboard() {
    // Состояние для лимита отображаемых визитов
    const [visitsLimit, setVisitsLimit] = React.useState(6);
  useEffect(() => { document.title = 'Сводка'; }, []);

  const API_URL = process.env.REACT_APP_API_URL;

  const [calendarDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate] = React.useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  // Data will be provided by backend — read branchId from query param
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const branchId = params.get('branchId');

  const [journal, setJournal] = React.useState([]);
  const [loadingJournal, setLoadingJournal] = React.useState(false);
  const [journalError, setJournalError] = React.useState(null);

  const [userBranches, setUserBranches] = React.useState(null);
  // const [loadingBranches, setLoadingBranches] = React.useState(false); // больше не используется
  const [branchAccessDenied, setBranchAccessDenied] = React.useState(false);

  // --- Вставить хуки и функции для визитов ---
  const [visitsTab, setVisitsTab] = React.useState('upcoming');

  // Состояния для клиентов, услуг и зон
  const [clients, setClients] = React.useState([]);
  const [services, setServices] = React.useState([]);
  const [zones, setZones] = React.useState([]);
// Вспомогательная функция для форматирования телефона
function formatPhone(phone) {
  if (!phone) return '';
  // Пример: +7 701 123-45-67
  return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3-$4-$5');
}

  // Загрузка клиентов, услуг и зон для текущего филиала
  useEffect(() => {
    if (!branchId) return;
    let mounted = true;
    const fetchList = async (endpoint, setter, key) => {
      const url = API_URL ? `${API_URL}/${endpoint}?branch_id=${encodeURIComponent(branchId)}` : `/${endpoint}?branch_id=${encodeURIComponent(branchId)}`;
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error('Ошибка');
        const data = await r.json();
        if (!mounted) return;
        setter(Array.isArray(data) ? data : (data[key] || []));
      } catch { if (mounted) setter([]); }
    };
    fetchList('clients', setClients, 'clients');
    fetchList('services', setServices, 'services');
    fetchList('zones', setZones, 'zones');
    return () => { mounted = false; };
  }, [branchId]);
  // Состояние для клиентов
  // const [clients, setClients] = React.useState([]);
  // Загрузка клиентов для текущего филиала
  useEffect(() => {
    if (!branchId) return;
    let mounted = true;
    const url = API_URL ? `${API_URL}/clients?branch_id=${encodeURIComponent(branchId)}` : `/clients?branch_id=${encodeURIComponent(branchId)}`;

    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Ошибка загрузки клиентов')))
      .then(data => { if (!mounted) return; setClients(Array.isArray(data) ? data : (data.clients || [])); })
      .catch(() => { if (!mounted) return; setClients([]); });
    return () => { mounted = false; };
  }, [branchId]);

  function formatVisitDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function formatTime(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDuration(duration, start_time, end_time) {
    if (duration) {
      if (typeof duration === 'string') return duration;
      if (typeof duration === 'number') {
        const h = Math.floor(duration / 60);
        const m = duration % 60;
        return (h ? `${h}ч.` : '') + (m ? ` ${m}мин.` : (h ? '' : ''));
      }
    }
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      const diff = Math.round((end - start) / 60000);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return (h ? `${h}ч.` : '') + (m ? ` ${m}мин.` : (h ? '' : ''));
    }
    return '';
  }

  const upcomingVisits = React.useMemo(() => {
    const now = new Date();
    return journal.filter(v => {
      const start = new Date(v.start_time);
      return start >= now;
    });
  }, [journal]);
  const pastVisits = React.useMemo(() => {
    const now = new Date();
    return journal.filter(v => {
      const start = new Date(v.start_time);
      return start < now;
    });
  }, [journal]);
  const filteredVisits = visitsTab === 'upcoming' ? upcomingVisits : pastVisits;
  const groupedVisits = React.useMemo(() => {
    const groups = {};
    filteredVisits.forEach(v => {
      const d = new Date(v.start_time);
      const key = d.toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });
    return Object.fromEntries(
      Object.entries(groups).sort((a, b) => visitsTab === 'upcoming' ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]))
    );
  }, [filteredVisits, visitsTab]);
  // --- Конец вставки ---

  useEffect(() => {
    if (!branchId) return;
    let mounted = true;
    setLoadingJournal(true);
    setJournalError(null);

    const token = localStorage.getItem('token');

    const url = API_URL ? `${API_URL}/dashboard/appointments?branchId=${encodeURIComponent(branchId)}` : `/dashboard/appointments?branchId=${encodeURIComponent(branchId)}`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Ошибка сервера')))
      .then(data => { if (!mounted) return; setJournal(data.appointments || []); })
      .catch(err => { if (!mounted) return; setJournalError(err.message || 'Ошибка при загрузке'); })
      .finally(() => { if (!mounted) return; setLoadingJournal(false); });

    return () => { mounted = false; };
  }, [branchId]);

  // Fetch branches for current user (allow checking membership)
  React.useEffect(() => {
    const stored = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
    const uid = stored?.id || localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!uid) return;

    let mounted = true;
    // setLoadingBranches(true); // удалено, больше не используется
    setUserBranches(null);

    async function load() {
      const API_URL = process.env.REACT_APP_API_URL;
      const endpoints = [
          `${API_URL}/users/${uid}/branches`,
          `${API_URL}/branches?userId=${uid}`,
          `${API_URL}/branches?user_id=${uid}`,
        `/api/users/${uid}/branches`,
        `/api/branches?userId=${uid}`,
        `/api/branches?user_id=${uid}`,
      ];

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) continue;
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.branches || data.rows || data);
          if (mounted) setUserBranches(list || []);
          break;
        } catch (err) {}
      }

      // if (mounted) setLoadingBranches(false); // удалено, больше не используется
    }

    load();
    return () => { mounted = false; };
  }, []);

  // check membership when branches loaded
  React.useEffect(() => {
    try {
      if (!branchId) { setBranchAccessDenied(false); return; }
      if (userBranches === null) return; // not yet loaded
      const found = userBranches.find(b => String(b.branch_id || b.id || b.branchId) === String(branchId));
      setBranchAccessDenied(!Boolean(found));
    } catch { setBranchAccessDenied(false); }
  }, [branchId, userBranches]);

  // История изменений (activity feed)
  const [history, setHistory] = React.useState([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [historyError, setHistoryError] = React.useState(null);

  useEffect(() => {
    if (!branchId) return;
    let mounted = true;
    setLoadingHistory(true);
    setHistoryError(null);
    const token = localStorage.getItem('token');
    const url = API_URL ? `${API_URL}/dashboard/appointment-history?branchId=${encodeURIComponent(branchId)}` : `/dashboard/appointment-history?branchId=${encodeURIComponent(branchId)}`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Ошибка сервера')))
      .then(data => { if (!mounted) return; setHistory(data.history || []); })
      .catch(err => { if (!mounted) return; setHistoryError(err.message || 'Ошибка при загрузке'); })
      .finally(() => { if (!mounted) return; setLoadingHistory(false); });
    return () => { mounted = false; };
  }, [branchId]);

  return (
    <div className="timetable-wrapper dashboard-page">
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

      <div className="dashboard-content">
        <header className="dashboard-header">
          <button className="burger">☰</button>
          <div>
            <h1>Сводка</h1>
            <div className="sub">Обзор</div>
          </div>
        </header>

        { branchAccessDenied ? (
          <AccessDenied />
        ) : (
        <main className="dashboard-main">
          <div className="left-col">
            <div className="card card-id">
              <div className="card-title">Идентификатор филиала (ID)</div>
              <div className="card-big">#{branchId || <span className="empty">—</span>}</div>
            </div>

            {/* <div className="card card-manager">
              <div className="card-title">Менеджер сопровождения</div>
              <div className="manager">
                <div className="manager-avatar">OI</div>
                <div className="manager-info">
                    <div className="manager-name">{''}</div>
                    <div className="manager-meta">{''}</div>
                    <div className="manager-meta">{''}</div>
                  </div>
              </div>
              <div className="manager-hint">Поможет заключить договор и решить вопросы с оплатой</div>
            </div> */}


            <div className="card card-visits">
              <div className="card-title">Визиты</div>
              <div className="segments">
                <button className={`seg${visitsTab === 'upcoming' ? ' active' : ''}`} onClick={() => setVisitsTab('upcoming')}>предстоящие{upcomingVisits.length ? ` (${upcomingVisits.length})` : ''}</button>
                {/* <button className={`seg${visitsTab === 'past' ? ' active' : ''}`} onClick={() => setVisitsTab('past')}>прошедшие{pastVisits.length ? ` (${pastVisits.length})` : ''}</button> */}
                <button className={`seg${visitsTab === 'past' ? ' active' : ''}`} onClick={() => setVisitsTab('past')}>прошедшие</button>
              </div>
              <div className="visit-list">
                {loadingJournal ? (
                  <div className="clients-empty">Загрузка...</div>
                ) : journalError ? (
                  <div className="clients-empty">{journalError}</div>
                ) : filteredVisits.length === 0 ? (
                  <div className="clients-empty">Здесь пока нет данных</div>
                ) : (
                  (() => {
                    // Собираем все визиты в один массив с датой
                    const allVisits = [];
                    Object.entries(groupedVisits).forEach(([date, visits]) => {
                      visits.forEach((visit, idx) => {
                        allVisits.push({ date, visit, idx });
                      });
                    });
                    // Показываем только visitsLimit визитов
                    const shownVisits = allVisits.slice(0, visitsLimit);
                    // Группируем обратно по дате для рендера
                    const groupedShown = {};
                    shownVisits.forEach(({ date, visit, idx }) => {
                      if (!groupedShown[date]) groupedShown[date] = [];
                      groupedShown[date].push({ visit, idx });
                    });
                    return <>
                      {Object.entries(groupedShown).map(([date, visits]) => (
                        <div key={date} className="visit-day-group">
                          <div className="visit-date-label">{formatVisitDate(date)}</div>
                          {visits.map(({ visit, idx }) => {
                            const client = clients.find(c => String(c.client_id) === String(visit.client_id));
                            return (
                              <div key={idx} className="visit-row styled-visit-row">
                                <div className="visit-time-block centered-vertical">
                                  <div className="visit-clock styled-visit-clock">{formatTime(visit.start_time)}</div>
                                  <div className="visit-duration styled-visit-duration">{formatDuration(visit.duration_minutes, visit.start_time, visit.end_time)}</div>
                                </div>
                                <div className="visit-divider" />
                                <div className="visit-info-block">
                                  <div className="visit-client styled-visit-client bolder-text">
                                    <span className="visit-client-name styled-visit-client-name bolder-text">{client ? client.name : 'Клиент'}</span>
                                    {client && client.phone && (
                                      <span className="visit-client-phone styled-visit-client-phone bolder-text"> / {formatPhone(client.phone)}</span>
                                    )}
                                  </div>
                                  <div style={{ height: 6 }} />
                                  <div className="visit-service styled-visit-service bolder-text">{visit.service_name || visit.service || visit.title || visit.description || ''}</div>
                                  {visit.comment && <div className="visit-comment styled-visit-comment">{visit.comment}</div>}
                                  <div style={{ height: 8 }} />
                                  <div className="visit-location styled-visit-location thin-text">{Array.isArray(visit.zone_names) && visit.zone_names.length > 0 ? visit.zone_names.join(', ') : '—'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      {allVisits.length > visitsLimit && (
                        <div style={{ textAlign: 'center', margin: '16px 0' }}>
                          <button className="show-more-btn" onClick={() => setVisitsLimit(visitsLimit + 6)}>
                            Показать еще
                          </button>
                        </div>
                      )}
                    </>;
                  })()
                )}
              </div>
            </div>


          </div>

          <div className="main-col">
            <div className="card card-activity">
              <div className="card-title">Лента активности по записям</div>
              { !branchId && (
                <div className="clients-empty">Выберите филиал, чтобы увидеть журнал записей</div>
              ) }

              { branchId && loadingHistory && <div className="clients-empty">Загрузка ленты...</div> }
              { branchId && historyError && <div className="clients-empty">{historyError}</div> }

              { branchId && !loadingHistory && history.length === 0 && (
                <div className="clients-empty">В ленте пока нет событий</div>
              ) }

              { branchId && !loadingHistory && history.length > 0 && (
                <div className="activity-feed">
                  {/* Сортировка истории по changed_at по убыванию */}
                  {Object.entries(
                    // Группируем события по appointment_id
                    history
                      .slice()
                      .reduce((acc, h) => {
                        const id = h.appointment_id || h.appointmentId || 'noid_' + h.history_id;
                        if (!acc[id]) acc[id] = [];
                        acc[id].push(h);
                        return acc;
                      }, {})
                  )
                  // Сортируем группы по максимальному changed_at (новые группы сверху)
                  .sort(([, eventsA], [, eventsB]) => {
                    const maxA = Math.max(...eventsA.map(e => new Date(e.changed_at).getTime()));
                    const maxB = Math.max(...eventsB.map(e => new Date(e.changed_at).getTime()));
                    return maxB - maxA;
                  })
                  .map(([appointmentId, events], groupIdx) => {
                    // Сортируем события внутри группы:
                    // 1. Сначала все update (по возрастанию changed_at)
                    // 2. Затем все create (по возрастанию changed_at)
                    // 3. Остальные (например, delete) — после
                    events = events.slice().sort((a, b) => {
                    // Сортируем только по времени (по возрастанию changed_at)
                    return new Date(a.changed_at) - new Date(b.changed_at);
                  });
                    // Для каждого appointment_id — блок истории
                    // Берём последние известные ключевые поля (для шапки)
                    function extractFields(obj) {
                      if (!obj) return {};
                      let zones = obj.zone_names || obj.zone_ids || [];
                      if (typeof zones === 'string') try { zones = JSON.parse(zones); } catch {}
                      if (Array.isArray(zones)) zones = zones.join(', ');
                      let clientName = '';
                      let clientPhone = '';
                      if (obj.client) {
                        if (typeof obj.client === 'string') {
                          try { const c = JSON.parse(obj.client); clientName = c.name || ''; clientPhone = c.phone || ''; } catch { clientName = obj.client; }
                        } else if (typeof obj.client === 'object') {
                          clientName = obj.client.name || '';
                          clientPhone = obj.client.phone || '';
                        }
                      } else if (obj.client_name) {
                        clientName = obj.client_name;
                        clientPhone = obj.client_phone || '';
                      }
                      let date = obj.date || obj.start_time || '';
                      if (date && date.length > 10) date = date.slice(0, 10);
                      let duration = obj.duration_minutes || obj.duration || '';
                      if (!duration && obj.time_from && obj.time_to) {
                        const [h1, m1] = obj.time_from.split(':');
                        const [h2, m2] = obj.time_to.split(':');
                        duration = (parseInt(h2)*60+parseInt(m2))-(parseInt(h1)*60+parseInt(m1));
                        if (duration > 0) duration = duration + ' мин.';
                      }
                      return { date, zones, duration, clientName, clientPhone };
                    }
                    // Для каждого события внутри appointment_id
                    return (
                      <div key={appointmentId} className="activity-item activity-grouped-item">
                        {/* Шапка: дата, зоны, длительность, клиент — одной строкой */}
                        {(() => {
                          let last = null;
                          for (let i = events.length - 1; i >= 0; --i) {
                            const h = events[i];
                            if (h.changes && (h.changes.after || h.changes)) {
                              last = h.changes.after || h.changes;
                              break;
                            }
                          }
                          if (!last) last = events[0].changes?.after || events[0].changes || {};
                          const f = extractFields(last);
                          let appointment = null;
                          let service = null;
                          let serviceId = null;
                          if (events[0].appointment_id) {
                            appointment = journal.find(a => String(a.id) === String(events[0].appointment_id));
                          }
                          if (appointment && appointment.service_id) {
                            serviceId = appointment.service_id;
                          } else if (last.service_id) {
                            serviceId = last.service_id;
                          } else if (last.service) {
                            serviceId = last.service;
                          }
                          if (serviceId) {
                            service = services.find(s => String(s.service_id) === String(serviceId));
                          }
                          let dateTime = '';
                          function capitalizeFirst(str) {
                            if (!str) return str;
                            return str.charAt(0).toUpperCase() + str.slice(1);
                          }
                          if (appointment && appointment.start_time) {
                            const dt = new Date(appointment.start_time);
                            dateTime = capitalizeFirst(dt.toLocaleString('ru-RU', {
                              weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty'
                            }));
                          } else if (last.start_time || last.date) {
                            const dt = new Date(last.start_time || last.date);
                            dateTime = capitalizeFirst(dt.toLocaleString('ru-RU', {
                              weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty'
                            }));
                          }
                          let serviceName = '';
                          if (service && service.name) {
                            serviceName = service.name;
                          } else if (appointment && appointment.service_name) {
                            serviceName = appointment.service_name;
                          } else if (last.service_name) {
                            serviceName = last.service_name;
                          } else if (last.service && typeof last.service === 'string' && !services.find(s => String(s.service_id) === last.service)) {
                            serviceName = last.service;
                          } else if (last.title) {
                            serviceName = last.title;
                          } else if (last.description) {
                            serviceName = last.description;
                          }
                          return (
                            <div className="activity-group-header-row">
                              <span className="activity-group-date">{dateTime}</span>
                              <span className="activity-group-service">{serviceName}</span>
                              <span className="activity-group-duration">{f.duration}</span>
                              <span className="activity-group-client">{f.clientName}{f.clientPhone && <span style={{color:'#888'}}> / +{f.clientPhone}</span>}</span>
                            </div>
                          );
                        })()}
                        {/* Список событий по этой записи */}
                        <div className="activity-group-events">
                          {events.map((h, idx) => {
                            const isCreate = h.action === 'create';
                            const isUpdate = h.action === 'update';
                            const isDelete = h.action === 'delete';
                            const changes = h.changes || {};
                            let prev = null;
                            if (h.action === 'update') {
                              let foundUpdate = false;
                              for (let j = idx - 1; j >= 0; --j) {
                                if (events[j].action === 'update' && events[j].changes && events[j].changes.after) {
                                  prev = events[j].changes.after;
                                  foundUpdate = true;
                                  break;
                                }
                              }
                              if (!foundUpdate) {
                                for (let j = 0; j < events.length; ++j) {
                                  if (events[j].action === 'create' && events[j].changes && events[j].changes.after) {
                                    prev = events[j].changes.after;
                                    break;
                                  }
                                }
                              }
                            }
                            return (
                              <div key={h.history_id || idx} className="activity-group-event-item">
                                <div className="activity-meta-row">
                                  <span className="activity-user">{h.user_name || 'Система'}</span>
                                  <span className="activity-action">{isCreate ? 'Создание' : isUpdate ? 'Изменение' : isDelete ? 'Удаление' : h.action}</span>
                                  <span className="activity-date">{new Date(h.changed_at).toLocaleString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty' })}</span>
                                </div>
                                {isUpdate && prev && (
                                  <div className="activity-changes">
                                    {(() => {
                                      const allowedFields = [
                                        'date', 'duration', 'duration_minutes', 'participants', 'quantity', 'final_price', 'status', 'comment', 'payment_method', 'time_from', 'time_to', 'time'
                                      ];
                                      const fieldNames = {
                                        date: 'Сеанс',
                                        duration: 'Длительность',
                                        duration_minutes: 'Длительность',
                                        participants: 'Участники',
                                        quantity: 'Сеанс',
                                        final_price: 'Цена',
                                        status: 'Статус',
                                        comment: 'Комментарий',
                                        payment_method: 'Способ оплаты',
                                        time_from: 'Время',
                                        time_to: 'Время',
                                      };
                                      const statusMap = {
                                        pending: 'Ожидание',
                                        confirmed: 'Подтверждён',
                                        arrived: 'Пришёл',
                                        no_show: 'Не пришёл',
                                        cancelled: 'Отменён',
                                      };
                                      const paymentMap = {
                                        card: 'Картой',
                                        cash: 'Наличными',
                                        null: '',
                                        undefined: '',
                                      };
                                      const before = prev;
                                      const after = changes.after || changes;
                                      const keys = Object.keys({ ...before, ...after });
                                      const changed = keys.filter(k => allowedFields.includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
                                      if (!changed.length) return null;
                                      return (
                                        <>
                                          {changed.map((k, i) => {
                                            let oldVal = before[k];
                                            let newVal = after[k];
                                            if (k === 'status') {
                                              oldVal = statusMap[oldVal] || oldVal;
                                              newVal = statusMap[newVal] || newVal;
                                            }
                                            if (k === 'service_id' || k === 'service') {
                                              const getServiceName = (val) => {
                                                if (!val) return '';
                                                const s = services.find(sv => String(sv.service_id) === String(val) || String(sv.name) === String(val));
                                                return s ? s.name : val;
                                              };
                                              oldVal = getServiceName(oldVal);
                                              newVal = getServiceName(newVal);
                                            }
                                            if (k === 'payment_method') {
                                              oldVal = paymentMap[oldVal] || oldVal;
                                              newVal = paymentMap[newVal] || newVal;
                                            }
                                            if (k === 'time_from' || k === 'time') {
                                              if (before.time_from && before.time_to && after.time_from && after.time_to) {
                                                oldVal = `${before.time_from}—${before.time_to}`;
                                                newVal = `${after.time_from}—${after.time_to}`;
                                              }
                                            }
                                            if (typeof oldVal === 'boolean') oldVal = oldVal ? 'Да' : 'Нет';
                                            if (typeof newVal === 'boolean') newVal = newVal ? 'Да' : 'Нет';
                                            if (oldVal === undefined || oldVal === null) oldVal = '';
                                            if (newVal === undefined || newVal === null) newVal = '';
                                            return (
                                              <div className="activity-change-label" key={k}>
                                                {fieldNames[k] || k} — {String(oldVal)} <span style={{color:'#b0b0b0', margin:'0 4px'}}>&rarr;</span> {String(newVal)}
                                              </div>
                                            );
                                          })}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) }

            </div>
          </div>

        </main>
        )}
      </div>
    </div>
  );
}

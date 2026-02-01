
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Clients.css';

// Declare API_URL once at the top
const API_URL = process.env.REACT_APP_API_URL;

export default function Clients() {
        // Фильтры
      const [serviceFilter, setServiceFilter] = useState('');
      const [sortType, setSortType] = useState('newest');
        // Для фильтра по услугам: appointments
        const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    if (!serviceFilter) {
      setAppointments([]);
      return;
    }
    async function fetchAppointments() {
      try {
        const res = await fetch(API_URL + '/appointments?service_id=' + Number(serviceFilter));
        if (!res.ok) throw new Error('Ошибка загрузки записей');
        const data = await res.json();
        setAppointments(data);
      } catch (e) {
        setAppointments([]);
      }
    }
    fetchAppointments();
  }, [serviceFilter]);


  // Список услуг для фильтра
  const [servicesList, setServicesList] = useState([{ id: '', name: 'Все услуги' }]);
  useEffect(() => {
    async function fetchServices() {
      try {
        let branchId = null;
        try {
          const params = new URLSearchParams(window.location.search);
          branchId = params.get('branchId');
        } catch { branchId = null; }
        if (!branchId) branchId = localStorage.getItem('selectedBranchId');
        let url = API_URL + '/all-services';
        if (branchId) url += '?branch_id=' + encodeURIComponent(branchId);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Ошибка загрузки услуг');
        const data = await res.json();
        setServicesList([{ id: '', name: 'Все услуги' }, ...data.map(s => ({ id: String(s.service_id), name: s.name }))]);
      } catch (e) {
        setServicesList([{ id: '', name: 'Все услуги' }]);
      }
    }
    fetchServices();
  }, []);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

        // Поиск
        const [searchValue, setSearchValue] = useState('');
        const [search, setSearch] = useState('');

        // Сначала фильтруем клиентов по услуге (appointments), чтобы результат был сразу после получения appointments
        const clientsByService = React.useMemo(() => {
          if (!serviceFilter) return clients;
          let filteredAppointments = appointments;
          if (appointments.length && appointments.some(a => String(a.service_id) !== String(serviceFilter))) {
            filteredAppointments = appointments.filter(a => String(a.service_id) === String(serviceFilter));
          }
          const appointmentClientIds = filteredAppointments.map(a => String(a.client_id ?? a.id)).filter(Boolean);
          const clientIdsSet = new Set(appointmentClientIds);
          return clients.filter(c => clientIdsSet.has(String(c.client_id ?? c.id)));
        }, [clients, appointments, serviceFilter]);

        // Затем применяем поиск и сортировку только к уже отфильтрованным по услуге клиентам
        const filteredClients = React.useMemo(() => {
          let arr = clientsByService;
          if (search) {
            const q = search.trim().toLowerCase();
            arr = arr.filter(c =>
              (c.name && c.name.toLowerCase().includes(q)) ||
              (c.phone && c.phone.toLowerCase().includes(q)) ||
              (c.email && c.email.toLowerCase().includes(q))
            );
          }
          arr = [...arr];
          if (sortType === 'price-asc') {
            arr.sort((a, b) => (a.spent || 0) - (b.spent || 0));
          } else if (sortType === 'price-desc') {
            arr.sort((a, b) => (b.spent || 0) - (a.spent || 0));
          } else if (sortType === 'newest') {
            arr.sort((a, b) => new Date(b.created_at || b.first_visit || 0) - new Date(a.created_at || a.first_visit || 0));
          } else if (sortType === 'oldest') {
            arr.sort((a, b) => new Date(a.created_at || a.first_visit || 0) - new Date(b.created_at || b.first_visit || 0));
          } else if (sortType === 'first-visit-asc') {
            arr.sort((a, b) => new Date(a.first_visit || 0) - new Date(b.first_visit || 0));
          } else if (sortType === 'first-visit-desc') {
            arr.sort((a, b) => new Date(b.first_visit || 0) - new Date(a.first_visit || 0));
          } else if (sortType === 'last-visit-asc') {
            arr.sort((a, b) => new Date(a.last_visit || 0) - new Date(b.last_visit || 0));
          } else if (sortType === 'last-visit-desc') {
            arr.sort((a, b) => new Date(b.last_visit || 0) - new Date(a.last_visit || 0));
          } else if (sortType === 'visits-asc') {
            arr.sort((a, b) => (a.visits_count || 0) - (b.visits_count || 0));
          } else if (sortType === 'visits-desc') {
            arr.sort((a, b) => (b.visits_count || 0) - (a.visits_count || 0));
          }
          return arr;
        }, [clientsByService, search, sortType]);
  // Список клиентов должен быть объявлен первым!
  // const [clients, setClients] = useState([]);
  // Состояние для выбранных клиентов
  const [selectedClients, setSelectedClients] = useState([]);

      // Обработчик для чекбокса строки
      function handleClientCheckbox(client, checked) {
        setSelectedClients(prev => {
          const id = client.client_id ?? client.id;
          if (checked) {
            return [...prev, id];
          } else {
            return prev.filter(cid => cid !== id);
          }
        });
      }

      // Обработчик для чекбокса "выбрать все"
      function handleSelectAll(checked) {
        if (checked) {
          setSelectedClients(pagedClients.map(c => c.client_id ?? c.id));
        } else {
          setSelectedClients([]);
        }
      }

      // Массовое удаление
      async function handleBulkDelete() {
        if (!window.confirm('Удалить выбранных клиентов?')) return;
        for (const id of selectedClients) {
          const client = clients.find(c => (c.client_id ?? c.id) === id);
          if (client) {
            await onDeleteClient(client, { skipConfirm: true });
          }
        }
        setSelectedClients([]);
      }
    // Удаление клиента
    async function onDeleteClient(client, opts = {}) {
      if (!opts.skipConfirm) {
        if (!window.confirm('Удалить клиента: ' + client.name + '?')) return;
      }
      try {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/clients/${client.client_id ?? client.id}`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const text = await res.text();
          alert('Ошибка при удалении клиента: ' + text);
          return;
        }
        setClients(prev => prev.filter(c => (c.client_id ?? c.id) !== (client.client_id ?? client.id)));
      } catch (err) {
        alert('Ошибка при удалении клиента: ' + err.message);
      }
    }
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    additional_phone: '',
    email: '',
    gender: '',
    birth_date: '',
    comment: '',
    agreed_to_mailing: false,
    agreed_to_personal_data: false,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  useEffect(() => {
    document.title = 'Клиентская база';
  }, []);

  const [calendarDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDate] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });


  // Removed unused: activeSegment, setActiveSegment

  const location = useLocation();

  const formatMoney = (value) => {
    const num = Number(value) || 0;
    return `${num.toLocaleString('ru-RU')} тг`;
  };

  // Removed unused: formatDate

  const formatDateTime = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadClients() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');

        let branchId = null;
        try {
          const params = new URLSearchParams(location.search);
          branchId = params.get('branchId');
        } catch {
          branchId = null;
        }
        if (!branchId) {
          branchId = localStorage.getItem('selectedBranchId');
        }

        const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
        const url = `${API_URL}/clients${q}`;

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Ошибка при загрузке клиентов: ${res.status} ${res.statusText} ${
              text ? '- ' + text.slice(0, 200) : ''
            }`,
          );
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        let data;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(
            'Сервер вернул неожиданный ответ (не JSON). Ответ: ' +
              text.slice(0, 200),
          );
        }

        if (!mounted) return;
        const list = Array.isArray(data) ? data : data.clients || [];
        setClients(list);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Не удалось загрузить клиентов');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadClients();

    return () => {
      mounted = false;
    };
  }, [location.search]);

  // Pagination logic
  const total = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pagedClients = filteredClients.slice(startIdx, endIdx);

  // For page buttons
  const pageButtons = [];
  for (let i = 1; i <= totalPages && i <= 5; i++) {
    pageButtons.push(i);
  }

  return (
    <div className="timetable-wrapper clients-page">
      <Sidebar
        calendarDate={calendarDate}
        setCalendarDate={() => {}}
        selectedDate={selectedDate}
        setSelectedDate={() => {}}
        userName={
          localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')).name
            : 'Пользователь'
        }
        userEmail={
          localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')).email
            : 'email@example.com'
        }
        loadingUser={false}
        userError={null}
      />

      <div className="clients-content">
        <div className="clients-header">
          <div className="clients-title">
            <div className="clients-main">Клиентская база</div>
            <div className="clients-sub">Клиенты</div>
          </div>
          <div className="clients-actions" style={{display:'flex',alignItems:'center',gap:12}}>
            {selectedClients.length > 0 && (
              <button className="btn danger" style={{marginRight:8}} onClick={handleBulkDelete}>
                Удалить выбранных ({selectedClients.length})
              </button>
            )}
            <button className="btn yellow" onClick={() => setDialogOpen(true)}>
              <span className="plus">+</span> Добавить клиента
            </button>
            {dialogOpen && (
                  <div className="network-dialog-backdrop" onClick={() => setDialogOpen(false)}>
                    <div className="network-dialog" onClick={e => e.stopPropagation()}>
                      <div className="network-dialog-header">
                        <h2 className="network-dialog-title">Добавить клиента</h2>
                        <button type="button" className="network-dialog-close" onClick={() => setDialogOpen(false)} aria-label="Закрыть">×</button>
                      </div>
                      <form
                        className="network-dialog-body"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setCreating(true);
                          setCreateError(null);
                          try {
                            const token = localStorage.getItem('token');
                            let branchId = null;
                            try {
                              const params = new URLSearchParams(location.search);
                              branchId = params.get('branchId');
                            } catch { branchId = null; }
                            if (!branchId) branchId = localStorage.getItem('selectedBranchId');
                            const url = `${API_URL}/clients`;
                            const body = {
                              branch_id: Number(branchId),
                              name: form.name,
                              phone: form.phone,
                              additional_phone: form.additional_phone,
                              email: form.email,
                              gender: form.gender,
                              birth_date: form.birth_date,
                              comment: form.comment,
                              agreed_to_mailing: form.agreed_to_mailing,
                              agreed_to_personal_data: form.agreed_to_personal_data,
                            };
                            const res = await fetch(url, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify(body),
                            });
                            if (!res.ok) {
                              const text = await res.text();
                              throw new Error(`Ошибка: ${res.status} ${res.statusText} ${text}`);
                            }
                            setDialogOpen(false);
                            setForm({
                              name: '', phone: '', additional_phone: '', email: '', gender: '', birth_date: '', comment: '', agreed_to_mailing: false, agreed_to_personal_data: false
                            });
                            setCreating(false);
                            setCreateError(null);
                            setLoading(true);
                            setTimeout(() => window.location.reload(), 500);
                          } catch (err) {
                            setCreateError(err.message);
                            setCreating(false);
                          }
                        }}
                      >
                        <label className="network-field-label">
                          Имя
                          <input required className="network-field-input" placeholder="Имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Телефон
                          <input className="network-field-input" placeholder="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Доп. телефон
                          <input className="network-field-input" placeholder="Доп. телефон" value={form.additional_phone} onChange={e => setForm(f => ({ ...f, additional_phone: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Email
                          <input className="network-field-input" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Пол
                          <select className="network-field-input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                            <option value="">Выберите пол</option>
                            <option value="male">Мужской</option>
                            <option value="female">Женский</option>
                          </select>
                        </label>
                        <label className="network-field-label">
                          Дата рождения
                          <input type="date" className="network-field-input" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
                        </label>
                        <label className="network-field-label">
                          Комментарий
                          <textarea className="network-field-input" placeholder="Комментарий" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
                        </label>
                        {/* <label className="network-field-label">
                          <input type="checkbox" checked={form.agreed_to_mailing} onChange={e => setForm(f => ({ ...f, agreed_to_mailing: e.target.checked }))} /> Согласен на рассылку
                        </label>
                        <label className="network-field-label">
                          <input type="checkbox" checked={form.agreed_to_personal_data} onChange={e => setForm(f => ({ ...f, agreed_to_personal_data: e.target.checked }))} /> Согласен на обработку персональных данных
                        </label> */}
                        {createError && <div className="network-dialog-error">{createError}</div>}
                        <div className="network-dialog-footer">
                          <button type="button" className="btn secondary" onClick={() => setDialogOpen(false)} disabled={creating}>Отмена</button>
                          <button type="submit" className="btn yellow" disabled={creating}>Создать</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
          </div>
        </div>

        <div className="clients-search">
          <div className="search-wrap" style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <input
              placeholder="Поиск (по имени, телефону, Email или номеру карты)"
              className="search-input"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSearch(searchValue);
                  setPage(1);
                }
              }}
              style={{width:'100%'}}
            />
            <button
              className="btn small search-btn"
              style={{marginLeft:8,minWidth:120}}
              onClick={() => { setSearch(searchValue); setPage(1); }}
            >
              Найти
            </button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:24,marginTop:12,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontWeight:500,fontSize:16}}>Фильтры:</span>
              <select
                className="filter-select"
                value={serviceFilter}
                onChange={e => {
                  setServiceFilter(e.target.value);
                  setAppointments([]); // сбрасываем appointments для новой услуги
                  setPage(1); // сбрасываем страницу на первую
                }}
                style={{padding:'6px 16px',borderRadius:6,border:'1px solid #d1d5db',background:'#fff',fontSize:15,minWidth:140}}
              >
                {servicesList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{position:'relative'}}>
              <select
                className="filter-select"
                value={sortType}
                onChange={e => setSortType(e.target.value)}
                style={{padding:'6px 16px',borderRadius:6,border:'1px solid #d1d5db',background:'#222c36',color:'#fff',fontSize:15,minWidth:220,fontWeight:500}}
              >
                <option value="price-asc">Цена (по возрастанию)</option>
                <option value="price-desc">Цена (по убыванию)</option>
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="first-visit-asc">Первый визит (по возрастанию)</option>
                <option value="first-visit-desc">Первый визит (по убыванию)</option>
                <option value="last-visit-asc">Последний визит (по возрастанию)</option>
                <option value="last-visit-desc">Последний визит (по убыванию)</option>
                <option value="visits-asc">Визиты (по возрастанию)</option>
                <option value="visits-desc">Визиты (по убыванию)</option>
              </select>
            </div>
          </div>
        </div>

        {/*
        <div className="clients-filters">
          <div className="clients-segments">
            <span className="segments-label">Сегменты:</span>
            <button
              type="button"
              className={
                'link-like' + (activeSegment === 'new' ? ' active' : '')
              }
              onClick={() => setActiveSegment('new')}
            >
              Новые
            </button>
            <button
              type="button"
              className={
                'link-like' + (activeSegment === 'repeat' ? ' active' : '')
              }
              onClick={() => setActiveSegment('repeat')}
            >
              Повторные
            </button>
          </div>
        </div>
        */}

        <div className="clients-table-wrap">
          <table className="clients-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={pagedClients.length > 0 && pagedClients.every(c => selectedClients.includes(c.client_id ?? c.id))}
                    indeterminate={pagedClients.some(c => selectedClients.includes(c.client_id ?? c.id)) && !pagedClients.every(c => selectedClients.includes(c.client_id ?? c.id))}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>Имя</th>
                <th className="has-lock">Телефон</th>
                <th className="has-lock">Email</th>
                <th>Продано</th>
                <th>Визиты</th>
                <th className="has-lock">Последний визит</th>
                <th className="has-lock">Первый визит</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9">Загрузка клиентов...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="9">{error}</td>
                </tr>
              )}
              {!loading && !error && clients.length === 0 && (
                <tr>
                  <td colSpan="9">Клиенты не найдены.</td>
                </tr>
              )}
              {!loading && !error &&
                pagedClients.map((client) => (
                  <tr key={client.client_id ?? client.id}>
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.client_id ?? client.id)}
                        onChange={e => handleClientCheckbox(client, e.target.checked)}
                      />
                    </td>
                    <td>
                      <button type="button" className="client-link">
                        {client.name}
                      </button>
                    </td>
                    <td>+{client.phone}</td>
                    <td>{client.email || ''}</td>
                    <td>{formatMoney(client.spent)}</td>
                    <td>{client.visits_count || 0}</td>
                    <td>{formatDateTime(client.last_visit)}</td>
                    <td>{formatDateTime(client.first_visit)}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Удалить клиента"
                        style={{ color: '#e53935', fontSize: '18px' }}
                        onClick={() => onDeleteClient(client)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="clients-footer">
            <div className="pagination-left">
              <select className="page-size-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>результатов на странице</span>
            </div>
            <div className="pagination-center">
              Показаны результаты с {total === 0 ? 0 : startIdx + 1} по {endIdx} из {total}
            </div>
            <div className="pagination-right">
              <button type="button" className="btn small secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Назад</button>
              <div className="pagination-pages">
                {pageButtons.map(num => (
                  <button
                    key={num}
                    type="button"
                    className={"page-btn" + (num === currentPage ? " active" : "")}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                {totalPages > 5 && <span className="page-dots">...</span>}
              </div>
              <button type="button" className="btn small secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Вперед</button>
              {/* <button type="button" className="btn actions-btn">Действия ▾</button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

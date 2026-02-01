import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import noImage from '../assets/images/image.png';
import './Zones.css';

export default function Zones() {
  useEffect(() => { document.title = 'Зоны'; }, []);

  const [zones, setZones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingZoneId, setTogglingZoneId] = useState(null);

  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneDialogName, setZoneDialogName] = useState('');
  const [zoneDialogDescription, setZoneDialogDescription] = useState('');
  const [zoneDialogImageUrl, setZoneDialogImageUrl] = useState('');
  const [zoneDialogCapacity, setZoneDialogCapacity] = useState('');
  const [zoneDialogType, setZoneDialogType] = useState('');
  const [zoneDialogCanMerge, setZoneDialogCanMerge] = useState(true);
  const [zoneDialogIsSingleOnly, setZoneDialogIsSingleOnly] = useState(false);
  const [zoneDialogBookingAvailable, setZoneDialogBookingAvailable] = useState(true);
  const [zoneDialogWorkingFrom, setZoneDialogWorkingFrom] = useState('10:00');
  const [zoneDialogWorkingTo, setZoneDialogWorkingTo] = useState('22:00');
  const [zoneDialogSaving, setZoneDialogSaving] = useState(false);
  const [zoneDialogError, setZoneDialogError] = useState(null);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const urlBranchId = query.get('branchId');

  // Маска для ввода времени ЧЧ:ММ с автодвоеточием
  const formatTimeInput = (raw, allow24 = false) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';

    if (digits.length === 1 || digits.length === 2) {
      return digits;
    }

    if (digits.length === 3) {
      let h = parseInt(digits.slice(0, 2), 10);
      const m1 = digits.slice(2, 3);
      if (!Number.isFinite(h)) h = 0;
      if (h < 0) h = 0;
      if (allow24) {
        if (h > 24) h = 24;
      } else if (h > 23) {
        h = 23;
      }
      const hh = String(h).padStart(2, '0');
      return `${hh}:${m1}`;
    }

    let h = parseInt(digits.slice(0, 2), 10);
    let m = parseInt(digits.slice(2, 4), 10);
    if (!Number.isFinite(h)) h = 0;
    if (!Number.isFinite(m)) m = 0;
    if (h < 0) h = 0;
    if (allow24) {
      if (h > 24) h = 24;
      if (h === 24) {
        // 24:00 — специальное значение «до конца дня»
        m = 0;
      } else {
        if (m < 0) m = 0;
        if (m > 59) m = 59;
      }
    } else {
      if (h > 23) h = 23;
      if (m < 0) m = 0;
      if (m > 59) m = 59;
    }
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const normalizeTimeForPayload = (raw, allow24End = false) => {
    const v = (raw || '').trim();
    if (!v) return null;
    if (v === '24:00') {
      // 24:00 храним как NULL (до конца дня)
      return allow24End ? null : null;
    }
    const m = v.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    let mm = parseInt(m[2], 10);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  const resolveBranchId = () => {
    const saved = localStorage.getItem('selectedBranchId');
    return urlBranchId || saved || '';
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const branchId = resolveBranchId();
        const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';

        // In dev environment the frontend runs on :3000 and backend on :5000.
        // Use explicit backend URL when developing locally to avoid getting
        // served the React index.html (HTML) which causes JSON parse errors.
        const base = process.env.REACT_APP_API_URL || '';
        const url = `${base}/zones${q}`;

        const res = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ошибка при загрузке: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        let data;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          // Received non-JSON response (likely HTML). Read as text and show helpful message.
          const text = await res.text();
          throw new Error('Сервер вернул неожиданный ответ (не JSON). Ответ начинается с: ' + text.slice(0,200));
        }
        if (!mounted) return;
        setZones(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unknown error');
        setZones([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [urlBranchId]);

  const resetZoneDialogState = () => {
    setEditingZone(null);
    setZoneDialogName('');
    setZoneDialogDescription('');
    setZoneDialogImageUrl('');
    setZoneDialogCapacity('');
    setZoneDialogType('');
    setZoneDialogCanMerge(true);
    setZoneDialogIsSingleOnly(false);
    setZoneDialogBookingAvailable(true);
    // При создании новой зоны поля графика работы пустые,
    // пользователь сам выбирает время или использует подсказки.
    setZoneDialogWorkingFrom('');
    setZoneDialogWorkingTo('');
    setZoneDialogSaving(false);
    setZoneDialogError(null);
  };

  const handleOpenAddZone = () => {
    resetZoneDialogState();
    setShowZoneDialog(true);
  };

  const handleOpenEditZone = (zone) => {
    if (!zone) return;
    setEditingZone(zone);
    setZoneDialogName(zone.name || '');
    setZoneDialogDescription(zone.description || '');
    setZoneDialogImageUrl(zone.image_url || '');
    setZoneDialogCapacity(
      zone.capacity != null && zone.capacity !== '' ? String(zone.capacity) : ''
    );
    setZoneDialogType(zone.zone_type || '');
    setZoneDialogCanMerge(zone.can_merge !== false);
    setZoneDialogIsSingleOnly(!!zone.is_single_only);
    setZoneDialogBookingAvailable(zone.is_booking_available !== false);

    const normTime = (t, fallback, isEnd = false) => {
      if (!t && t !== 0) {
        // Для конца дня интерпретируем NULL как 24:00
        return isEnd ? '24:00' : fallback;
      }
      try {
        const s = t.toString();
        return s.slice(0, 5);
      } catch {
        return fallback;
      }
    };

    setZoneDialogWorkingFrom(normTime(zone.working_from, '10:00', false));
    setZoneDialogWorkingTo(normTime(zone.working_to, '22:00', true));
    setZoneDialogSaving(false);
    setZoneDialogError(null);
    setShowZoneDialog(true);
  };

  const handleCloseZoneDialog = () => {
    if (zoneDialogSaving) return;
    setShowZoneDialog(false);
    resetZoneDialogState();
  };

  const handleSaveZone = async () => {
    if (zoneDialogSaving) return;
    const name = (zoneDialogName || '').trim();
    if (!name) {
      setZoneDialogError('Укажите название зоны');
      return;
    }

    const isEdit = !!editingZone;
    const zoneId = editingZone && (editingZone.zone_id || editingZone.id);
    const branchId = resolveBranchId();

    if (!isEdit && !branchId) {
      setZoneDialogError('Не выбран филиал для зоны');
      return;
    }

    try {
      setZoneDialogSaving(true);
      setZoneDialogError(null);

      const token = localStorage.getItem('token');
      const base = process.env.REACT_APP_API_URL || '';

      const url = isEdit ? `${base}/zones/${zoneId}` : `${base}/zones`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name,
        description: zoneDialogDescription.trim() || null,
        image_url: zoneDialogImageUrl.trim() || null,
        capacity: zoneDialogCapacity,
        zone_type: zoneDialogType.trim() || null,
        can_merge: !!zoneDialogCanMerge,
        is_single_only: !!zoneDialogIsSingleOnly,
        is_booking_available: !!zoneDialogBookingAvailable,
        working_from: normalizeTimeForPayload(zoneDialogWorkingFrom, false),
        working_to: normalizeTimeForPayload(zoneDialogWorkingTo, true)
      };

      if (!isEdit) {
        payload.branchId = branchId;
      } else {
        payload.branchId = branchId || editingZone.branch_id || null;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        const action = isEdit ? 'сохранении' : 'создании';
        throw new Error(`Ошибка при ${action} зоны: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      const saved = await res.json();

      setZones(prev => {
        const list = Array.isArray(prev) ? prev : [];
        if (isEdit) {
          return list.map(z =>
            (z.zone_id === saved.zone_id || z.id === saved.zone_id)
              ? { ...z, ...saved }
              : z
          );
        }
        return [...list, saved];
      });

      handleCloseZoneDialog();
    } catch (e) {
      setZoneDialogError(e.message || (editingZone ? 'Не удалось сохранить зону' : 'Не удалось создать зону'));
      setZoneDialogSaving(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!editingZone || zoneDialogSaving) return;
    const zoneId = editingZone.zone_id || editingZone.id;
    if (!zoneId) return;

    const confirmed = window.confirm('Удалить эту зону и связанные услуги?');
    if (!confirmed) return;

    try {
      setZoneDialogSaving(true);
      setZoneDialogError(null);
      const token = localStorage.getItem('token');
      const base = process.env.REACT_APP_API_URL || '';

      const res = await fetch(`${base}/zones/${zoneId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ошибка при удалении зоны: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      setZones(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.filter(z => (z.zone_id || z.id) !== zoneId);
      });

      handleCloseZoneDialog();
    } catch (e) {
      setZoneDialogError(e.message || 'Не удалось удалить зону');
      setZoneDialogSaving(false);
    }
  };

  const handleToggleZoneBooking = async (zone) => {
    if (!zone || togglingZoneId) return;
    const zoneId = zone.zone_id || zone.id;
    if (!zoneId) return;

    const current = !!zone.is_booking_available;
    const next = !current;

    try {
      setTogglingZoneId(zoneId);
      // Оптимистично обновляем UI
      setZones(prev =>
        Array.isArray(prev)
          ? prev.map(z =>
              (z.zone_id === zoneId || z.id === zoneId)
                ? { ...z, is_booking_available: next }
                : z
            )
          : prev
      );

      const token = localStorage.getItem('token');
      const base = process.env.REACT_APP_API_URL || '';

      const res = await fetch(`${base}/zones/${zoneId}/booking`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_booking_available: next })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Не удалось изменить онлайн-запись зоны: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      const updated = await res.json();
      setZones(prev =>
        Array.isArray(prev)
          ? prev.map(z =>
              (z.zone_id === zoneId || z.id === zoneId)
                ? { ...z, is_booking_available: updated.is_booking_available }
                : z
            )
          : prev
      );
    } catch (e) {
      // Откатим оптимистичное изменение при ошибке
      setZones(prev =>
        Array.isArray(prev)
          ? prev.map(z =>
              (z.zone_id === zoneId || z.id === zoneId)
                ? { ...z, is_booking_available: current }
                : z
            )
          : prev
      );
      alert(e.message || 'Не удалось изменить онлайн-запись зоны');
    } finally {
      setTogglingZoneId(null);
    }
  };

  return (
    <div className="timetable-wrapper">
      <Sidebar
        calendarDate={new Date()}
        setCalendarDate={() => {}}
        selectedDate={new Date()}
        setSelectedDate={() => {}}
        userName={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Пользователь'}
        userEmail={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'email@example.com'}
        loadingUser={false}
        userError={null}
      />

      <div className="zones-content">
        <div className="zones-header">
          <div className="zones-burger">☰</div>
          <h1>Зоны</h1>
          <div className="zones-actions">
            <button className="btn-primary" type="button" onClick={handleOpenAddZone}>+ Добавить зону</button>
          </div>
        </div>

        <div className="zones-panel">
          <div className="zones-search">
            {/* <input placeholder="Поиск зоны по имени" />
            <button className="btn">Найти</button> */}
            {/* <button className="btn">Сбросить</button> */}
            <div className="found">Найдено: {zones ? zones.length : '...'}</div>
          </div>

          {/* <div className="zones-note">В таком порядке зоны отображаются в аналитике, онлайн-записи и журнале записи. Чтобы изменить порядок, перетащите сотрудника вверх или вниз</div> */}

          <div className="zones-table">
            <div className="zones-row zones-header-row">
              <div className="col name">Имя</div>
              <div className="col schedule">График работы</div>
              <div className="col booking">Онлайн-запись</div>
              <div className="col services">Оказывает услуг</div>
            </div>

            {loading && <div className="zones-empty">Загрузка...</div>}
            {error && <div className="zones-empty error">{error}</div>}
            {!loading && !error && zones && zones.length === 0 && (
              <div className="zones-empty">Зоны не найдены в базе данных.</div>
            )}

            {!loading && !error && zones && zones.map((z) => (
              <div className="zones-row" key={z.zone_id || z.id || Math.random()}>
                <div className="col name">
                  <div className="zone-avatar">
                    <img src={z.image_url || noImage} alt={z.name} />
                  </div>
                  <div className="zone-info">
                    <div className="zone-title">{z.name}</div>
                    {z.description && <div className="zone-sub">{z.description}</div>}
                  </div>
                </div>

                <div className="col schedule">{(() => {
                  const fromRaw = z.working_from;
                  const toRaw = z.working_to;
                  const fmt = (t, isEnd = false) => {
                    if (!t && t !== 0) {
                      // Для графика работы NULL конца дня показываем как 24:00
                      return isEnd ? '24:00' : '';
                    }
                    try {
                      const s = t.toString();
                      // take first 5 chars like '10:00' from '10:00:00' or '10:00'
                      return s.slice(0,5);
                    } catch { return ''; }
                  };
                  const noFrom = fromRaw == null || fromRaw === '';
                  const noTo = toRaw == null || toRaw === '';
                  if (noFrom && noTo) return '—';
                  const f = fmt(fromRaw, false);
                  const tt = fmt(toRaw, true);
                  if (f && tt) return `${f}-${tt}`;
                  return f || tt || '—';
                })()}</div>
                <div className="col booking">
                  <button
                    type="button"
                    className="zone-booking-toggle-btn"
                    onClick={() => handleToggleZoneBooking(z)}
                    disabled={togglingZoneId === (z.zone_id || z.id)}
                  >
                    <span
                      className={
                        `toggle ${z.is_booking_available ? 'on' : 'off'} ${togglingZoneId === (z.zone_id || z.id) ? 'is-busy' : ''}`
                      }
                    >
                      <span className="toggle-knob" />
                    </span>
                  </button>
                </div>
                <div className="col services">
                  <div className="zone-services-cell">
                    <span className="zone-services-count">{(() => {
                  try {
                    if (Array.isArray(z.linked_services)) {
                      return z.linked_services.length;
                    }
                    if (!z.services) return 0;
                    if (Array.isArray(z.services)) return z.services.length;
                    const parsed = typeof z.services === 'string' ? JSON.parse(z.services) : z.services;
                    if (Array.isArray(parsed)) return parsed.length;
                    return 0;
                  } catch { return 0; }
                })()}</span>
                    <button
                      type="button"
                      className="zone-edit-btn"
                      title="Редактировать зону"
                      onClick={() => handleOpenEditZone(z)}
                    >
                      ✎
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {showZoneDialog && (
            <div className="zones-dialog-backdrop" onClick={handleCloseZoneDialog}>
              <div
                className="zones-dialog"
                role="dialog"
                aria-modal="true"
                onClick={e => e.stopPropagation()}
              >
                <div className="zones-dialog-header">
                  <h2>{editingZone ? 'Настройки зоны' : 'Новая зона'}</h2>
                  <button
                    type="button"
                    className="zones-dialog-close"
                    onClick={handleCloseZoneDialog}
                    disabled={zoneDialogSaving}
                    aria-label="Закрыть"
                  >
                    ×
                  </button>
                </div>
                <div className="zones-dialog-body">
                  <label className="zones-dialog-field">
                    <span>Название зоны</span>
                    <input
                      type="text"
                      value={zoneDialogName}
                      onChange={e => setZoneDialogName(e.target.value)}
                      placeholder="Например, VR-зона 1"
                    />
                  </label>

                  <label className="zones-dialog-field">
                    <span>Описание (необязательно)</span>
                    <textarea
                      rows={3}
                      value={zoneDialogDescription}
                      onChange={e => setZoneDialogDescription(e.target.value)}
                      placeholder="Краткое описание зоны"
                    />
                  </label>

                  <label className="zones-dialog-field">
                    <span>Ссылка на изображение (необязательно)</span>
                    <input
                      type="text"
                      value={zoneDialogImageUrl}
                      onChange={e => setZoneDialogImageUrl(e.target.value)}
                      placeholder="URL картинки или оставить пустым"
                    />
                  </label>

                  <div className="zones-dialog-two-cols">
                    <label className="zones-dialog-field">
                      <span>Тип зоны</span>
                      <input
                        type="text"
                        value={zoneDialogType}
                        onChange={e => setZoneDialogType(e.target.value)}
                        placeholder="Например, VR, PS5"
                      />
                    </label>
                    <label className="zones-dialog-field">
                      <span>Вместимость</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={zoneDialogCapacity}
                        onChange={e => setZoneDialogCapacity(e.target.value)}
                        placeholder="Например, 5"
                      />
                    </label>
                  </div>

                  <div className="zones-dialog-switches">
                    <label className="zones-dialog-checkbox">
                      <input
                        type="checkbox"
                        checked={zoneDialogCanMerge}
                        onChange={e => setZoneDialogCanMerge(e.target.checked)}
                      />
                      <span>Можно объединять с другими зонами</span>
                    </label>
                    <label className="zones-dialog-checkbox">
                      <input
                        type="checkbox"
                        checked={zoneDialogIsSingleOnly}
                        onChange={e => setZoneDialogIsSingleOnly(e.target.checked)}
                      />
                      <span>Одиночная зона</span>
                    </label>
                  </div>

                  <div className="zones-dialog-work">
                    <div className="zones-dialog-work-label">График работы</div>
                    <div className="zones-dialog-work-row">
                      <label>
                        <span>с</span>
                        <input
                          type="text"
                          placeholder="00:00"
                          value={zoneDialogWorkingFrom}
                          list="zones-time-presets"
                          onChange={e => setZoneDialogWorkingFrom(formatTimeInput(e.target.value, false))}
                        />
                      </label>
                      <label>
                        <span>до</span>
                        <input
                          type="text"
                          placeholder="24:00"
                          value={zoneDialogWorkingTo}
                          list="zones-time-presets"
                          onChange={e => setZoneDialogWorkingTo(formatTimeInput(e.target.value, true))}
                        />
                      </label>
                    </div>
                  </div>

                  <datalist id="zones-time-presets">
                    {Array.from({ length: 25 }, (_, h) => {
                      const label = `${String(h).padStart(2, '0')}:00`;
                      return <option key={label} value={label} />;
                    })}
                  </datalist>

                  <div className="zones-dialog-online-row">
                    <div className="zones-dialog-online-label">Онлайн-запись</div>
                    <button
                      type="button"
                      className="zone-booking-toggle-btn"
                      onClick={() => setZoneDialogBookingAvailable(v => !v)}
                    >
                      <span className={`toggle ${zoneDialogBookingAvailable ? 'on' : 'off'}`}>
                        <span className="toggle-knob" />
                      </span>
                    </button>
                  </div>

                  {zoneDialogError && (
                    <div className="zones-dialog-error">{zoneDialogError}</div>
                  )}
                </div>
                <div className="zones-dialog-actions">
                  {editingZone && (
                    <button
                      type="button"
                      className="zones-dialog-btn danger"
                      onClick={handleDeleteZone}
                      disabled={zoneDialogSaving}
                    >
                      Удалить
                    </button>
                  )}
                  <button
                    type="button"
                    className="zones-dialog-btn secondary"
                    onClick={handleCloseZoneDialog}
                    disabled={zoneDialogSaving}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="zones-dialog-btn primary"
                    onClick={handleSaveZone}
                    disabled={zoneDialogSaving || !zoneDialogName.trim()}
                  >
                    {zoneDialogSaving
                      ? (editingZone ? 'Сохранение...' : 'Создание...')
                      : (editingZone ? 'Сохранить' : 'Создать')}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

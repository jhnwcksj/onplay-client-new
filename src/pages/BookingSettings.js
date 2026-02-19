import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { toast } from '../hooks/use-toast';
import './BookingSettings.css';

export default function BookingSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [settings, setSettings] = useState({
    is_enabled: true,
    flow_type: 'service_first',
    design_type: 'default',
    primary_color: '',
    secondary_color: '',
    show_prices: true,
    show_duration: true
  });
  const [saving, setSaving] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    document.title = 'Настройки онлайн-записи';
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser.id || localStorage.getItem('userId');

      if (!userId) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Пользователь не найден'
        });
        navigate('/login');
        return;
      }

      const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');
      const res = await fetch(`${API_URL}/api/booking-settings/setup?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const data = await res.json();
      setBranches(data.branches || []);

      // Автоматически выбираем первый филиал
      if (data.branches && data.branches.length > 0) {
        selectBranch(data.branches[0]);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить филиалы'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectBranch = async (branch) => {
    setSelectedBranch(branch);
    
    // Загружаем настройки филиала
    try {
      const token = localStorage.getItem('token');
      const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');
      const res = await fetch(`${API_URL}/api/booking-settings/${branch.branch_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSettings({
          is_enabled: data.is_enabled ?? true,
          flow_type: data.flow_type || 'service_first',
          design_type: data.design_type || 'default',
          primary_color: data.primary_color || '',
          secondary_color: data.secondary_color || '',
          show_prices: data.show_prices ?? true,
          show_duration: data.show_duration ?? true
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const generatePublicCode = async (branchId, force = false) => {
    try {
      setGeneratingCode(true);
      const token = localStorage.getItem('token');
      const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');

      const res = await fetch(`${API_URL}/api/booking-settings/generate-public-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ branchId, force })
      });

      if (!res.ok) {
        throw new Error('Ошибка генерации кода');
      }

      const data = await res.json();
      
      toast({
        variant: 'success',
        title: 'Успешно',
        description: force ? 'Код успешно перегенерирован' : 'Код успешно сгенерирован'
      });

      // Перезагружаем список филиалов
      await loadBranches();
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message || 'Не удалось сгенерировать код'
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const saveSettings = async () => {
    if (!selectedBranch) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');

      const res = await fetch(`${API_URL}/api/booking-settings/${selectedBranch.branch_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        throw new Error('Ошибка сохранения настроек');
      }

      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Настройки сохранены'
      });

      // Перезагружаем данные
      await loadBranches();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить настройки'
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      variant: 'success',
      title: 'Скопировано',
      description: 'Ссылка скопирована в буфер обмена'
    });
  };

  const userName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Пользователь';
  const userEmail = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'email@example.com';
  const userRole = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role || 'user' : 'user';

  if (loading) {
    return (
      <div className="timetable-wrapper">
        <Sidebar
          calendarDate={new Date()}
          setCalendarDate={() => {}}
          selectedDate={new Date()}
          setSelectedDate={() => {}}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          loadingUser={false}
          userError={null}
        />
        <div className="booking-settings-content">
          <div className="booking-settings-loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-wrapper">
      <Sidebar
        calendarDate={new Date()}
        setCalendarDate={() => {}}
        selectedDate={new Date()}
        setSelectedDate={() => {}}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        loadingUser={false}
        userError={null}
      />

      <div className="booking-settings-content">
        <div className="booking-settings-header">
          <h1>Настройки онлайн-записи</h1>
        </div>

        {branches.length === 0 ? (
          <div className="booking-settings-empty">
            <p>Филиалы не найдены. Создайте филиал в настройках сетей.</p>
          </div>
        ) : (
          <div className="booking-settings-layout">
            {/* Список филиалов */}
            <div className="booking-settings-sidebar">
              <h3>Филиалы</h3>
              <div className="booking-settings-branch-list">
                {branches.map((branch) => (
                  <div
                    key={branch.branch_id}
                    className={`booking-settings-branch-item ${
                      selectedBranch?.branch_id === branch.branch_id ? 'active' : ''
                    }`}
                    onClick={() => selectBranch(branch)}
                  >
                    <div className="booking-settings-branch-name">{branch.branch_name}</div>
                    <div className="booking-settings-branch-status">
                      {branch.is_enabled ? (
                        <span className="status-badge status-enabled">Включено</span>
                      ) : (
                        <span className="status-badge status-disabled">Выключено</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Настройки выбранного филиала */}
            {selectedBranch && (
              <div className="booking-settings-main">
                <div className="booking-settings-section">
                  <h2>{selectedBranch.branch_name}</h2>

                  {/* Предупреждения */}
                  {selectedBranch.needs_public_code && (
                    <div className="booking-settings-alert alert-warning">
                      <div className="alert-content">
                        <strong>⚠️ Требуется публичный код</strong>
                        <p>Для этого филиала не создан уникальный код. Сгенерируйте его для создания ссылки онлайн-записи.</p>
                      </div>
                      <button
                        className="btn-generate"
                        onClick={() => generatePublicCode(selectedBranch.branch_id)}
                        disabled={generatingCode}
                      >
                        {generatingCode ? 'Генерация...' : 'Сгенерировать код'}
                      </button>
                    </div>
                  )}

                  {selectedBranch.needs_network_slug && (
                    <div className="booking-settings-alert alert-info">
                      <strong>ℹ️ Информация</strong>
                      <p>Для сети этого филиала не указан slug. Обновите настройки сети.</p>
                    </div>
                  )}

                  {selectedBranch.online_services_count === 0 && (
                    <div className="booking-settings-alert alert-warning">
                      <strong>⚠️ Нет доступных услуг</strong>
                      <p>
                        У этого филиала нет услуг с включенной онлайн-записью. 
                        Перейдите в раздел <a href="/services">Услуги</a> и включите онлайн-запись для нужных услуг.
                      </p>
                    </div>
                  )}

                  {selectedBranch.booking_zones_count === 0 && selectedBranch.total_zones_count > 0 && (
                    <div className="booking-settings-alert alert-warning">
                      <strong>⚠️ Нет доступных зон</strong>
                      <p>
                        У этого филиала нет зон с включенной онлайн-записью. 
                        Перейдите в раздел <a href="/zones">Зоны</a> и включите онлайн-запись для нужных зон.
                      </p>
                    </div>
                  )}

                  {/* Ссылка на сеть */}
                  {selectedBranch.network_slug && (
                    <div className="booking-settings-url-section">
                      <label>Ссылка на сеть "{selectedBranch.network_name}"</label>
                      <div className="booking-settings-url-group">
                        <input
                          type="text"
                          value={`${window.location.origin}/booking/${selectedBranch.network_slug}`}
                          readOnly
                          className="booking-settings-url-input"
                        />
                        <button
                          className="btn-copy"
                          onClick={() => copyToClipboard(`${window.location.origin}/booking/${selectedBranch.network_slug}`)}
                        >
                          📋 Копировать
                        </button>
                      </div>
                      <p className="booking-settings-url-hint">
                        Эта ссылка позволяет клиентам выбрать филиал из сети и записаться онлайн.
                      </p>
                    </div>
                  )}

                  {/* Ссылка на филиал */}
                  {selectedBranch.booking_url && (
                    <div className="booking-settings-url-section">
                      <label>Ссылка на филиал для онлайн-записи</label>
                      <div className="booking-settings-url-group">
                        <input
                          type="text"
                          value={`${window.location.origin}${selectedBranch.booking_url}`}
                          readOnly
                          className="booking-settings-url-input"
                        />
                        <button
                          className="btn-copy"
                          onClick={() => copyToClipboard(`${window.location.origin}${selectedBranch.booking_url}`)}
                        >
                          📋 Копировать
                        </button>
                      </div>
                      {selectedBranch.public_code && (
                        <div className="booking-settings-regenerate-section">
                          <button
                            className="btn-regenerate"
                            onClick={() => {
                              if (window.confirm('Перегенерировать публичный код? Старая ссылка перестанет работать.')) {
                                generatePublicCode(selectedBranch.branch_id, true);
                              }
                            }}
                            disabled={generatingCode}
                          >
                            {generatingCode ? 'Перегенерация...' : '🔄 Перегенерировать код'}
                          </button>
                          <span className="booking-settings-regenerate-hint">
                            Текущий код: <strong>{selectedBranch.public_code}</strong>
                          </span>
                        </div>
                      )}
                      <p className="booking-settings-url-hint">
                        Эта ссылка ведёт напрямую на онлайн-запись в этот филиал.
                      </p>
                    </div>
                  )}

                  {/* Основные настройки */}
                  <div className="booking-settings-field">
                    <label className="booking-settings-checkbox">
                      <input
                        type="checkbox"
                        checked={settings.is_enabled}
                        onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                      />
                      <span>Включить онлайн-запись для этого филиала</span>
                    </label>
                  </div>

                  {/* <div className="booking-settings-field">
                    <label>Порядок выбора</label>
                    <select
                      value={settings.flow_type}
                      onChange={(e) => setSettings({ ...settings, flow_type: e.target.value })}
                      className="booking-settings-select"
                    >
                      <option value="service_first">Сначала услуга</option>
                      <option value="zone_first">Сначала зона</option>
                      <option value="time_first">Сначала время</option>
                    </select>
                  </div> */}

                  <div className="booking-settings-field">
                    <label>Тип дизайна</label>
                    <select
                      value={settings.design_type}
                      onChange={(e) => setSettings({ ...settings, design_type: e.target.value })}
                      className="booking-settings-select"
                    >
                      <option value="default">По умолчанию</option>
                      {/*
                        <option value="anotherworld_brand">Компания Another World</option>
                        Отключено временно — нужно вернуть позже при добавлении фирменной темы
                      */}
                    </select>
                  </div>

                  <div className="booking-settings-field">
                    <label className="booking-settings-checkbox">
                      <input
                        type="checkbox"
                        checked={settings.show_prices}
                        onChange={(e) => setSettings({ ...settings, show_prices: e.target.checked })}
                      />
                      <span>Показывать цены</span>
                    </label>
                  </div>

                  <div className="booking-settings-field">
                    <label className="booking-settings-checkbox">
                      <input
                        type="checkbox"
                        checked={settings.show_duration}
                        onChange={(e) => setSettings({ ...settings, show_duration: e.target.checked })}
                      />
                      <span>Показывать длительность</span>
                    </label>
                  </div>

                  {/* Статистика */}
                  <div className="booking-settings-stats">
                    <h3>Статистика</h3>
                    <div className="booking-settings-stats-grid">
                      <div className="stat-item">
                        <div className="stat-label">Услуги с онлайн-записью</div>
                        <div className="stat-value">
                          {selectedBranch.online_services_count} / {selectedBranch.total_services_count}
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-label">Зоны с онлайн-записью</div>
                        <div className="stat-value">
                          {selectedBranch.booking_zones_count} / {selectedBranch.total_zones_count}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Кнопки действий */}
                  <div className="booking-settings-actions">
                    <button
                      className="btn-primary"
                      onClick={saveSettings}
                      disabled={saving || !selectedBranch.public_code}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить настройки'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

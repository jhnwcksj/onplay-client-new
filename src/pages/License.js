import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import './License.css';

const API_URL = process.env.REACT_APP_API_URL;

export default function License() {
  const token = localStorage.getItem('token');
  
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  const currentUser = storedUser || null;
  const userRole = currentUser?.role || 'user';
  
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]); // Тарифы из БД
  const [selectedPlanId, setSelectedPlanId] = useState(null); // Выбранный тариф
  const [subscriptions, setSubscriptions] = useState([]); // Подписки пользователя
  const darkThemeKeys = useMemo(() => new Set(['dark', 'purple', 'ocean', 'sunset']), []);
  const [isDark, setIsDark] = useState(() => {
    try {
      const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
      if (cssText && cssText.startsWith('#')) {
        const rgb = parseInt(cssText.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = rgb & 0xff;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.7;
      }
      const saved = localStorage.getItem('appTheme') || 'light';
      return darkThemeKeys.has(saved);
    } catch { return false; }
  });

  useEffect(() => { 
    document.title = 'Лицензия'; 
  }, []);

  // Загрузка филиалов пользователя (для user/vip-user)
  useEffect(() => {
    if (userRole !== 'user' && userRole !== 'vip-user') {
      setLoading(false);
      return;
    }

    const loadBranches = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/branches?userId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const branchesList = Array.isArray(data) ? data : (data.branches || []);
          setBranches(branchesList);
          
          // Установить первый филиал как выбранный, если есть
          if (branchesList.length > 0) {
            const firstBranch = branchesList[0];
            const firstId = firstBranch.branch_id || firstBranch.id;
            setSelectedBranchId(firstId);
            setSelectedBranch(firstBranch);
          }
        }
      } catch (error) {
        // suppressed logging
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, [currentUser?.id, token, userRole]);

  // Загрузка тарифов из API
  useEffect(() => {
    const loadPlans = async () => {
      try {
        // Для admin/manager загружаем все планы, для user/vip-user фильтруем по роли
        const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
        const url = isAdminOrManager 
          ? `${API_URL}/api/plans` 
          : `${API_URL}/api/plans?userRole=${userRole}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
          // Устанавливаем первый тариф как выбранный по умолчанию (для user/vip-user)
          if (!isAdminOrManager && data.plans && data.plans.length > 0) {
            setSelectedPlanId(data.plans[0].plan_id);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
      }
    };

    loadPlans();
  }, [userRole]);

  // Загрузка подписок для выбранного филиала
  useEffect(() => {
    if (!selectedBranchId || !token) return;

    const loadSubscriptions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/subscriptions/branch/${selectedBranchId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        console.error('Ошибка загрузки подписок:', error);
      }
    };

    loadSubscriptions();
  }, [selectedBranchId, token]);

  // Автоматический выбор первого тарифа для категории выбранного филиала
  useEffect(() => {
    if (!selectedBranch || !plans.length) return;
    
    const availablePlans = getPlansForBranch(selectedBranch);
    if (availablePlans.length > 0) {
      setSelectedPlanId(availablePlans[0].plan_id);
    }
  }, [selectedBranch, plans]);

  // Use same theme detection as Timetable: prefer --theme-text luminance or appTheme/local event
  useEffect(() => {
    const handler = (e) => {
      try {
        if (e && e.detail && typeof e.detail.isDark !== 'undefined') { setIsDark(Boolean(e.detail.isDark)); return; }
        const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
        if (cssText && cssText.startsWith('#')) {
          const rgb = parseInt(cssText.slice(1), 16);
          const r = (rgb >> 16) & 0xff;
          const g = (rgb >> 8) & 0xff;
          const b = rgb & 0xff;
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setIsDark(lum > 0.7);
          return;
        }
        const saved = localStorage.getItem('appTheme') || 'light';
        setIsDark(darkThemeKeys.has(saved));
      } catch {}
    };
    window.addEventListener('appThemeChanged', handler);
    return () => window.removeEventListener('appThemeChanged', handler);
  }, [darkThemeKeys]);

  // Обработка выбора филиала
  const handleBranchSelect = (branch) => {
    const branchId = branch.branch_id || branch.id;
    setSelectedBranchId(branchId);
    setSelectedBranch(branch);
  };

  // Получить тарифы для выбранного филиала (по категории)
  const getPlansForBranch = (branch) => {
    if (!branch || !branch.category) return [];
    return plans.filter(p => p.category_name === branch.category);
  };

  // Получить выбранный тариф
  const getSelectedPlan = () => {
    return plans.find(p => p.plan_id === selectedPlanId);
  };

  // Получить цену из выбранного тарифа
  const calculatePrice = () => {
    const plan = getSelectedPlan();
    if (!plan) return 0;
    // Возвращаем цену напрямую из таблицы plans
    return plan.price;
  };

  // Получение количества месяцев из дней
  const getMonthsFromDays = (days) => {
    if (days === 365) return 12; // 1 год = 12 месяцев
    return Math.ceil(days / 30);
  };

  // Получение общего количества месяцев с учетом базового периода и бонусов
  const getTotalMonths = () => {
    const plan = getSelectedPlan();
    if (!plan) return 0;
    
    // Считаем базовый период (может быть годом)
    const baseMonths = getMonthsFromDays(plan.duration_days);
    // Считаем бонусные месяцы отдельно
    const bonusMonths = Math.floor((plan.bonus_days || 0) / 30);
    
    return baseMonths + bonusMonths;
  };

  // Получение общего количества дней (с бонусами)
  const getTotalDays = () => {
    const plan = getSelectedPlan();
    if (!plan) return 0;
    return plan.duration_days + (plan.bonus_days || 0);
  };

  // Форматирование названия периода
  const formatPeriodLabel = (plan) => {
    if (!plan) return '';
    // Проверяем точное количество дней для года
    if (plan.duration_days === 365) return '1 год';
    
    const months = Math.ceil(plan.duration_days / 30);
    if (months === 1) return '1 месяц';
    if (months === 3) return '3 месяца';
    if (months === 6) return '6 месяцев';
    return `${months} мес.`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLicenseStatusLabel = (status) => {
    const labels = {
      'free_trial': 'Бесплатный пробный период',
      'paid': 'Платная лицензия',
      'expired': 'Истекла',
    };
    return labels[status] || status;
  };

  const getLicenseStatusClass = (status) => {
    if (status === 'free_trial') return 'status-trial';
    if (status === 'paid') return 'status-paid';
    if (status === 'expired') return 'status-expired';
    return '';
  };

  const isLicenseExpired = (branch) => {
    if (!branch?.valid_until) return false;
    const validUntil = new Date(branch.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    validUntil.setHours(0, 0, 0, 0);
    return validUntil < today;
  };

  const getDaysRemaining = (branch) => {
    if (!branch?.valid_until) return null;
    const validUntil = new Date(branch.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    validUntil.setHours(0, 0, 0, 0);
    const diffTime = validUntil - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Рендер для user/vip-user
  const renderUserView = () => {
    if (loading) return <p>Загрузка...</p>;

    if (branches.length === 0) {
      return (
        <div className="license-no-branch">
          <p>У вас нет филиалов</p>
        </div>
      );
    }

    return (
      <>
        {/* Выбор филиала */}
        <div className="license-card">
          <h2>Выберите филиал</h2>
          <div className="branch-selector">
            {branches.map((branch) => {
              const branchId = branch.branch_id || branch.id;
              const isSelected = branchId === selectedBranchId;
              return (
                <button
                  key={branchId}
                  className={`branch-select-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleBranchSelect(branch)}
                >
                  <div className="branch-select-name">{branch.branch_name}</div>
                  <div className="branch-select-info">
                    {branch.category && (
                      <span className="branch-category">{branch.category}</span>
                    )}
                    <span className="branch-city">{branch.city}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedBranch && (
          <>
            {/* Текущий статус лицензии */}
            <div className="license-card">
              <h2>Текущая лицензия</h2>
              <div className="license-info-grid">
                <div className="license-info-item">
                  <span className="label">Филиал:</span>
                  <span className="value">{selectedBranch.branch_name}</span>
                </div>
                <div className="license-info-item">
                  <span className="label">Категория:</span>
                  <span className="value">{selectedBranch.category || '—'}</span>
                </div>
                <div className="license-info-item">
                  <span className="label">Статус:</span>
                  <span className={`value license-status ${getLicenseStatusClass(isLicenseExpired(selectedBranch) ? 'expired' : selectedBranch.license_status)}`}>
                    {isLicenseExpired(selectedBranch) ? 'Истекла' : getLicenseStatusLabel(selectedBranch.license_status)}
                  </span>
                </div>
                <div className="license-info-item">
                  <span className="label">Действует с:</span>
                  <span className="value">{formatDate(selectedBranch.valid_from)}</span>
                </div>
                <div className="license-info-item">
                  <span className="label">Действует до:</span>
                  <span className="value">{formatDate(selectedBranch.valid_until)}</span>
                </div>
                {selectedBranch.valid_until && getDaysRemaining(selectedBranch) !== null && (
                  <div className="license-info-item">
                    <span className="label">Осталось дней:</span>
                    <span className={`value ${getDaysRemaining(selectedBranch) < 7 ? 'text-warning' : getDaysRemaining(selectedBranch) < 0 ? 'text-danger' : ''}`}>
                      {getDaysRemaining(selectedBranch) >= 0 ? getDaysRemaining(selectedBranch) : 'Истекла'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Калькулятор стоимости */}
            <div className="license-card">
              <h2>Продление лицензии</h2>
              {getPlansForBranch(selectedBranch).length === 0 ? (
                <div className="license-no-branch">
                  <p>Для категории "{selectedBranch.category}" пока нет доступных тарифов</p>
                </div>
              ) : (
                <div className="pricing-calculator">
                  <div className="period-selector">
                    <label>Выберите период:</label>
                    <div className="period-buttons">
                      {getPlansForBranch(selectedBranch).map((plan) => {
                        const isSelected = selectedPlanId === plan.plan_id;
                        const bonusDays = plan.bonus_days || 0;
                        const bonusMonths = Math.floor(bonusDays / 30);
                        
                        return (
                          <button
                            key={plan.plan_id}
                            className={`period-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedPlanId(plan.plan_id)}
                          >
                            <div className="period-label">{formatPeriodLabel(plan)}</div>
                            {bonusMonths > 0 && (
                              <div className="period-bonus">+{bonusMonths} мес. в подарок</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="price-summary">
                    <div className="price-row">
                      <span className="price-label">Категория:</span>
                      <span className="price-value">{selectedBranch.category || '—'}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">Базовая цена:</span>
                      <span className="price-value">
                        {getSelectedPlan() ? `${getSelectedPlan().price.toLocaleString('ru-RU')} ${getSelectedPlan().currency || '₸'}/месяц` : '—'}
                      </span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">Период:</span>
                      <span className="price-value">
                        {getSelectedPlan() ? `${getTotalMonths()} мес.` : '—'}
                      </span>
                    </div>
                    <div className="price-row total">
                      <span className="price-label">Итого к оплате:</span>
                      <span className="price-value">
                        {getSelectedPlan() ? `${calculatePrice().toLocaleString('ru-RU')} ${getSelectedPlan().currency || '₸'}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* <button className="pay-button">Оплатить</button> */}
                </div>
              )}
            </div>
          </>
        )}

        {/* Информация */}
        {/* <div className="license-card">
          <h2>Информация</h2>
          <div className="license-description">
            <p>
              <strong>Стоимость подписки</strong> зависит от вашего статуса и категории филиала.
            </p>
            <p>
              Ваш текущий статус: <strong>{userRole === 'user' ? 'Пользователь' : 'VIP Пользователь'}</strong>
            </p>
            <h3>Способы оплаты:</h3>
            <ul>
              <li>Банковская карта</li>
              <li>Банковский перевод</li>
              <li>Kaspi QR</li>
            </ul>
            <h3>Поддержка:</h3>
            <p>
              Email: <a href="mailto:support@anotherworld.kz">support@anotherworld.kz</a><br />
              Телефон: <a href="tel:+77001234567">+7 700 123 45 67</a>
            </p>
          </div>
        </div> */}
      </>
    );
  };

  // Рендер для admin/manager - справочник цен
  const renderAdminView = () => {
    if (plans.length === 0) {
      return (
        <div className="license-card">
          <h2>Справочник стоимости лицензий</h2>
          <div className="license-no-branch">
            <p>Тарифы пока не загружены. Выполните миграцию базы данных.</p>
          </div>
        </div>
      );
    }
    
    // Группируем планы по типу (standard/vip) и категории
    const standardPlans = plans.filter(p => p.plan_type === 'standard');
    const vipPlans = plans.filter(p => p.plan_type === 'vip');
    
    // Получаем уникальные категории
    const categories = [...new Set(plans.map(p => p.category_name))].filter(Boolean);
    
    return (
      <>
        {/* Каждая категория в отдельной карточке */}
        {categories.map(category => {
          const categoryStandardPlans = standardPlans.filter(p => p.category_name === category);
          const categoryVipPlans = vipPlans.filter(p => p.category_name === category);
          
          return (
            <div key={category} className="license-card" style={{ marginBottom: '20px' }}>
              <h2 style={{ marginBottom: '20px', color: 'var(--theme-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>
                  {categoryStandardPlans[0]?.category_icon || categoryVipPlans[0]?.category_icon || ''}
                </span>
                {category}
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Колонка 1: Standard */}
                <div style={{ 
                  background: 'rgba(var(--accent-rgb), 0.05)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '2px solid rgba(var(--accent-rgb), 0.2)'
                }}>
                  <h3 style={{ 
                    marginBottom: '16px', 
                    color: 'var(--theme-text)', 
                    fontSize: '18px',
                    fontWeight: '600',
                    borderBottom: '2px solid rgba(var(--accent-rgb), 0.3)',
                    paddingBottom: '8px'
                  }}>
                    Для пользователей (Standard)
                  </h3>
                  {categoryStandardPlans.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ 
                            padding: '10px 8px', 
                            textAlign: 'left', 
                            color: 'var(--theme-text)',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderBottom: '1px solid var(--border-color)'
                          }}>Период</th>
                          <th style={{ 
                            padding: '10px 8px', 
                            textAlign: 'right', 
                            color: 'var(--theme-text)',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderBottom: '1px solid var(--border-color)'
                          }}>Цена</th>
                          <th style={{ 
                            padding: '10px 8px', 
                            textAlign: 'center', 
                            color: 'var(--theme-text)',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderBottom: '1px solid var(--border-color)'
                          }}>Бонус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryStandardPlans.map((plan, idx) => (
                          <tr key={plan.plan_id}>
                            <td style={{ 
                              padding: '10px 8px', 
                              color: 'var(--theme-text)',
                              fontSize: '14px',
                              borderBottom: idx < categoryStandardPlans.length - 1 ? '1px solid rgba(var(--border-rgb), 0.3)' : 'none'
                            }}>
                              {formatPeriodLabel(plan)}
                            </td>
                            <td style={{ 
                              padding: '10px 8px', 
                              textAlign: 'right', 
                              color: 'var(--theme-text)', 
                              fontWeight: '600',
                              fontSize: '14px',
                              borderBottom: idx < categoryStandardPlans.length - 1 ? '1px solid rgba(var(--border-rgb), 0.3)' : 'none'
                            }}>
                              {plan.price.toLocaleString('ru-RU')} {plan.currency || '₸'}
                            </td>
                            <td style={{ 
                              padding: '10px 8px', 
                              textAlign: 'center', 
                              color: '#10b981',
                              fontSize: '14px',
                              fontWeight: '500',
                              borderBottom: idx < categoryStandardPlans.length - 1 ? '1px solid rgba(var(--border-rgb), 0.3)' : 'none'
                            }}>
                              {plan.bonus_days > 0 
                                ? `+${Math.floor(plan.bonus_days / 30)} мес.` 
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      Нет тарифов
                    </p>
                  )}
                </div>

                {/* Колонка 2: VIP */}
                <div style={{ 
                  background: 'rgba(168, 85, 247, 0.05)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '2px solid rgba(168, 85, 247, 0.2)'
                }}>
                  <h3 style={{ 
                    marginBottom: '16px', 
                    color: 'var(--theme-text)', 
                    fontSize: '18px',
                    fontWeight: '600',
                    borderBottom: '2px solid rgba(168, 85, 247, 0.3)',
                    paddingBottom: '8px'
                  }}>
                    Для VIP пользователей
                  </h3>
                  {categoryVipPlans.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ 
                            padding: '10px 8px', 
                            textAlign: 'left', 
                            color: 'var(--theme-text)',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderBottom: '1px solid var(--border-color)'
                          }}>Период</th>
                          <th style={{ 
                            padding: '10px 8px', 
                            textAlign: 'right', 
                            color: 'var(--theme-text)',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderBottom: '1px solid var(--border-color)'
                          }}>Цена</th>
                          <th style={{ 
                            padding: '10px 8px', 
                            textAlign: 'center', 
                            color: 'var(--theme-text)',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderBottom: '1px solid var(--border-color)'
                          }}>Бонус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryVipPlans.map((plan, idx) => (
                          <tr key={plan.plan_id}>
                            <td style={{ 
                              padding: '10px 8px', 
                              color: 'var(--theme-text)',
                              fontSize: '14px',
                              borderBottom: idx < categoryVipPlans.length - 1 ? '1px solid rgba(var(--border-rgb), 0.3)' : 'none'
                            }}>
                              {formatPeriodLabel(plan)}
                            </td>
                            <td style={{ 
                              padding: '10px 8px', 
                              textAlign: 'right', 
                              color: 'var(--theme-text)', 
                              fontWeight: '600',
                              fontSize: '14px',
                              borderBottom: idx < categoryVipPlans.length - 1 ? '1px solid rgba(var(--border-rgb), 0.3)' : 'none'
                            }}>
                              {plan.price.toLocaleString('ru-RU')} {plan.currency || '₸'}
                            </td>
                            <td style={{ 
                              padding: '10px 8px', 
                              textAlign: 'center', 
                              color: '#10b981',
                              fontSize: '14px',
                              fontWeight: '500',
                              borderBottom: idx < categoryVipPlans.length - 1 ? '1px solid rgba(var(--border-rgb), 0.3)' : 'none'
                            }}>
                              {plan.bonus_days > 0 
                                ? `+${Math.floor(plan.bonus_days / 30)} мес.` 
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      Нет тарифов
                    </p>
                  )}
                </div>
              </div>

              {/* Пример расчёта для этой категории */}
              {(categoryStandardPlans.length > 0 || categoryVipPlans.length > 0) && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '16px', 
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <h4 style={{ 
                    marginBottom: '12px', 
                    color: 'var(--theme-text)', 
                    fontSize: '15px',
                    fontWeight: '600'
                  }}>
                    💡 Пример расчёта:
                  </h4>
                  {categoryStandardPlans.length > 0 && (
                    <div style={{ marginBottom: categoryVipPlans.length > 0 ? '12px' : '0' }}>
                      {(() => {
                        const plan = categoryStandardPlans[0];
                        const months = plan.duration_days === 365 ? 12 : Math.ceil(plan.duration_days / 30);
                        const bonusMonths = Math.floor((plan.bonus_days || 0) / 30);
                        const totalMonths = months + bonusMonths;
                        return (
                          <>
                            <p style={{ color: 'var(--theme-text)', fontSize: '14px', marginBottom: '4px' }}>
                              <strong>Standard:</strong> {formatPeriodLabel(plan)} — {plan.price.toLocaleString('ru-RU')} ₸
                            </p>
                            {bonusMonths > 0 && (
                              <p style={{ color: '#10b981', fontSize: '13px', marginLeft: '20px' }}>
                                + {bonusMonths} мес. в подарок (итого {totalMonths} мес.)
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {categoryVipPlans.length > 0 && (
                    <div>
                      {(() => {
                        const plan = categoryVipPlans[0];
                        const months = plan.duration_days === 365 ? 12 : Math.ceil(plan.duration_days / 30);
                        const bonusMonths = Math.floor((plan.bonus_days || 0) / 30);
                        const totalMonths = months + bonusMonths;
                        return (
                          <>
                            <p style={{ color: 'var(--theme-text)', fontSize: '14px', marginBottom: '4px' }}>
                              <strong>VIP:</strong> {formatPeriodLabel(plan)} — {plan.price.toLocaleString('ru-RU')} ₸
                            </p>
                            {bonusMonths > 0 && (
                              <p style={{ color: '#10b981', fontSize: '13px', marginLeft: '20px' }}>
                                + {bonusMonths} мес. в подарок (итого {totalMonths} мес.)
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className={`license-wrapper ${isDark ? 'dark-theme' : ''}`}>
      <Sidebar
        userName={currentUser?.name || 'Пользователь'}
        userEmail={currentUser?.email || ''}
        userRole={currentUser?.role}
        loadingUser={false}
        userError={null}
      />

      <div className={`license-content ${isDark ? 'dark-theme' : ''}`}>
        <div className="license-header">
          <h1>
            {userRole === 'user' || userRole === 'vip-user' 
              ? 'Моя лицензия' 
              : 'Справочник лицензий'}
          </h1>
        </div>

        <div className="license-body">
          {userRole === 'user' || userRole === 'vip-user' 
            ? renderUserView() 
            : renderAdminView()}
        </div>
      </div>
    </div>
  );
}

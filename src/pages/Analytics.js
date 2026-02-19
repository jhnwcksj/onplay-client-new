import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Analytics.css';

const API_URL = process.env.REACT_APP_API_URL;

function Analytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branchId') || localStorage.getItem('selectedBranchId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) return savedTheme === 'dark';
      const saved = localStorage.getItem('dark');
      if (saved !== null) return saved === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      document.title = 'Аналитика';
    } catch (e) {
      // ignore
    }
  }, []);

  // Фильтры
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Данные
  const [metrics, setMetrics] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    activeClients: 0,
    avgCheck: 0,
    appointmentsChange: 0,
    revenueChange: 0,
    clientsChange: 0,
    avgCheckChange: 0,
  });

  const [revenueData, setRevenueData] = useState([]);
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [profitLossData, setProfitLossData] = useState({
    income: [],
    expenses: [],
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitability: 0,
  });
  const [serviceDistribution, setServiceDistribution] = useState([]);
  const [detailedStats, setDetailedStats] = useState([]);

  // Состояния для Sidebar
  const [calendarDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Данные пользователя для Sidebar
  const userName = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')).name 
    : 'Пользователь';
  const userEmail = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')).email 
    : 'email@example.com';
  const userRole = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')).role || 'user' 
    : 'user';

  useEffect(() => {
    if (!branchId) {
      setError('Филиал не выбран');
      setLoading(false);
      return;
    }
    
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          branch_id: branchId,
          start_date: startDate,
          end_date: endDate,
        });

        const response = await fetch(`${API_URL}/analytics?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки данных');
        }

        const data = await response.json();

        setMetrics({
          totalAppointments: data.metrics?.total_appointments || 0,
          totalRevenue: data.metrics?.total_revenue || 0,
          activeClients: data.metrics?.active_clients || 0,
          avgCheck: data.metrics?.avg_check || 0,
          appointmentsChange: data.metrics?.appointments_change || 0,
          revenueChange: data.metrics?.revenue_change || 0,
          clientsChange: data.metrics?.clients_change || 0,
          avgCheckChange: data.metrics?.avg_check_change || 0,
        });

        setRevenueData(data.revenue_by_month || []);
        setAppointmentsData(data.appointments_by_month || []);
        setServiceDistribution(data.service_distribution || []);
        setDetailedStats(data.detailed_stats || []);

        setProfitLossData({
          income: data.profit_loss?.income || [],
          expenses: data.profit_loss?.expenses || [],
          totalIncome: data.profit_loss?.total_income || 0,
          totalExpenses: data.profit_loss?.total_expenses || 0,
          netProfit: data.profit_loss?.net_profit || 0,
          profitability: data.profit_loss?.profitability || 0,
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [branchId, startDate, endDate, navigate]);

  useEffect(() => {
    const handler = (e) => {
      try {
        if (e && e.detail) setDarkMode(!!(e.detail.isDark || e.detail.themeId === 'dark'));
      } catch (err) { /* ignore */ }
    };

    window.addEventListener('appThemeChanged', handler);
    return () => window.removeEventListener('appThemeChanged', handler);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('ru-RU').format(value);
  };

  const formatMonthLabel = (m) => {
    if (!m) return '';
    try {
      // ISO yyyy-mm or yyyy-mm-dd
      if (/^\d{4}-\d{2}(?:-\d{2})?$/.test(m)) {
        const iso = m.length === 7 ? `${m}-01` : m;
        const d = new Date(iso);
        if (!Number.isNaN(d.getTime())) {
          return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d).replace(/\.$/, '');
        }
      }

      // Try direct Date parse (handles 'Jan', 'January', 'Mar 2025' etc.)
      const d2 = new Date(m);
      if (!Number.isNaN(d2.getTime())) {
        return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d2).replace(/\.$/, '');
      }

      // Fallback: try parsing by appending a day/year
      const parsed = Date.parse(m + ' 1 2000');
      if (!Number.isNaN(parsed)) {
        const d3 = new Date(parsed);
        return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d3).replace(/\.$/, '');
      }
    } catch (e) {
      // ignore and fallback
    }
    return String(m);
  };

  const handleExport = () => {
    alert('Функция экспорта будет реализована');
  };

  const handleRefresh = () => {
    // Перезагружаем данные, изменяя состояние для вызова useEffect
    setLoading(true);
    const params = new URLSearchParams({
      branch_id: branchId,
      start_date: startDate,
      end_date: endDate,
    });
    window.location.href = `/analytics?${params}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
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
        <div className={`analytics-container ${darkMode ? 'dark' : ''}`}>
          <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex' }}>
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
        <div className={`analytics-container ${darkMode ? 'dark' : ''}`}>
          <div style={{ textAlign: 'center', padding: '50px', color: '#c62828' }}>
            Ошибка: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
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
      <div className={`analytics-container ${darkMode ? 'dark' : ''}`}>
        {/* Заголовок */}
        <div className="analytics-header">
          <h1 className="analytics-title">Аналитика журнала записи</h1>
          <p className="analytics-subtitle">Обзор основных показателей и финансовых результатов</p>
        </div>

        {/* Фильтры */}
        <div className="analytics-filters">
          <div className="analytics-filter-group">
            <label className="analytics-filter-label">Период:</label>
            <input
              type="date"
              className="analytics-filter-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="analytics-filter-group">
            <label className="analytics-filter-label">&nbsp;</label>
            <input
              type="date"
              className="analytics-filter-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="analytics-actions">
            <button className="analytics-btn analytics-btn-primary" onClick={handleRefresh}>
              Обновить
            </button>
            <button className="analytics-btn analytics-btn-secondary" onClick={handleExport}>
              Экспорт
            </button>
          </div>
        </div>

        {/* Основные показатели */}
        <div className="analytics-metrics">
          <div className="analytics-metric-card">
            <div className="analytics-metric-header">
              <div className="analytics-metric-icon blue">📅</div>
              <div className="analytics-metric-info">
                <div className="analytics-metric-label">Всего записей</div>
              </div>
            </div>
            <div className="analytics-metric-value">{formatNumber(metrics.totalAppointments)}</div>
            <div className={`analytics-metric-change ${metrics.appointmentsChange >= 0 ? 'positive' : 'negative'}`}>
              {metrics.appointmentsChange >= 0 ? '+' : ''}{metrics.appointmentsChange.toFixed(1)}%
            </div>
          </div>

          <div className="analytics-metric-card">
            <div className="analytics-metric-header">
              <div className="analytics-metric-icon green">₽</div>
              <div className="analytics-metric-info">
                <div className="analytics-metric-label">Общий доход</div>
              </div>
            </div>
            <div className="analytics-metric-value" style={{ fontSize: '24px' }}>
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <div className={`analytics-metric-change ${metrics.revenueChange >= 0 ? 'positive' : 'negative'}`}>
              {metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}%
            </div>
          </div>

          <div className="analytics-metric-card">
            <div className="analytics-metric-header">
              <div className="analytics-metric-icon purple">👥</div>
              <div className="analytics-metric-info">
                <div className="analytics-metric-label">Активных клиентов</div>
              </div>
            </div>
            <div className="analytics-metric-value">{formatNumber(metrics.activeClients)}</div>
            <div className={`analytics-metric-change ${metrics.clientsChange >= 0 ? 'positive' : 'negative'}`}>
              {metrics.clientsChange >= 0 ? '+' : ''}{metrics.clientsChange.toFixed(1)}%
            </div>
          </div>

          <div className="analytics-metric-card">
            <div className="analytics-metric-header">
              <div className="analytics-metric-icon orange">📊</div>
              <div className="analytics-metric-info">
                <div className="analytics-metric-label">Средний чек</div>
              </div>
            </div>
            <div className="analytics-metric-value" style={{ fontSize: '24px' }}>
              {formatCurrency(metrics.avgCheck)}
            </div>
            <div className={`analytics-metric-change ${metrics.avgCheckChange >= 0 ? 'positive' : 'negative'}`}>
              {metrics.avgCheckChange >= 0 ? '+' : ''}{metrics.avgCheckChange.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Графики динамики */}
        <div className="analytics-charts">
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <div>
                <div className="analytics-chart-title">Динамика доходов</div>
                <div className="analytics-chart-subtitle">Помесячная статистика за год</div>
              </div>
              <button className="analytics-chart-export" onClick={handleExport}>📥</button>
            </div>
            <div className="analytics-chart-body">
              <div className="analytics-simple-chart">
                {revenueData.map((item, idx) => {
                  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
                  const height = (item.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={idx}
                      className="analytics-simple-chart-bar"
                      style={{ height: `${height}%` }}
                      title={`${formatMonthLabel(item.month)}: ${formatCurrency(item.revenue)}`}
                    >
                      <div className="analytics-simple-chart-label">{formatMonthLabel(item.month)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <div>
                <div className="analytics-chart-title">Количество записей</div>
                <div className="analytics-chart-subtitle">Сравнение по месяцам</div>
              </div>
              <button className="analytics-chart-export" onClick={handleExport}>📥</button>
            </div>
            <div className="analytics-chart-body">
              <div className="analytics-simple-chart">
                {appointmentsData.map((item, idx) => {
                  const maxCount = Math.max(...appointmentsData.map(d => d.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div
                      key={idx}
                      className="analytics-simple-chart-bar"
                      style={{ 
                        height: `${height}%`,
                        background: 'linear-gradient(to top, #764ba2, #667eea)'
                      }}
                      title={`${formatMonthLabel(item.month)}: ${item.count} записей`}
                    >
                      <div className="analytics-simple-chart-label">{formatMonthLabel(item.month)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Прибыли и убытки */}
        <div className="analytics-profit-loss">
          <h2 className="analytics-profit-loss-title">Прибыли и убытки</h2>
          <div className="analytics-profit-loss-grid">
            {/* Доходы */}
            <div className="analytics-income-section">
              <div className="analytics-section-title income">Доходы</div>
              <div className="analytics-section-total income">
                {formatCurrency(profitLossData.totalIncome)}
              </div>
              {profitLossData.income.map((item, idx) => (
                <div key={idx} className="analytics-item">
                  <div className="analytics-item-label">{item.category}</div>
                  <div className="analytics-item-value">{formatCurrency(item.amount)}</div>
                </div>
              ))}
            </div>

            {/* Расходы */}
            <div className="analytics-expense-section">
              <div className="analytics-section-title expense">Расходы</div>
              <div className="analytics-section-total expense">
                {formatCurrency(profitLossData.totalExpenses)}
              </div>
              {profitLossData.expenses.map((item, idx) => (
                <div key={idx} className="analytics-item">
                  <div className="analytics-item-label">{item.category}</div>
                  <div className="analytics-item-value">{formatCurrency(item.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Чистая прибыль */}
          <div className="analytics-net-profit">
            <div className="analytics-net-profit-label">Чистая прибыль</div>
            <div className="analytics-net-profit-value">
              {formatCurrency(profitLossData.netProfit)}
            </div>
            <div className="analytics-net-profit-margin">
              За выбранный период • Рентабельность: {profitLossData.profitability.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Распределение по услугам и Эффективность */}
        <div className="analytics-double-charts">
          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <div>
                <div className="analytics-chart-title">Распределение по услугам</div>
                <div className="analytics-chart-subtitle">Доля каждой категории</div>
              </div>
            </div>
            <div className="analytics-chart-body">
              <div className="analytics-pie-chart">
                <div className="analytics-pie-visual">
                  <div
                    className="analytics-pie-donut"
                    style={{
                      background: serviceDistribution.length > 0
                        ? `conic-gradient(${serviceDistribution.map((item, idx) => {
                            const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444'];
                            return `${colors[idx % colors.length]} ${item.startAngle}deg ${item.endAngle}deg`;
                          }).join(', ')})`
                        : '#e2e8f0'
                    }}
                  >
                    <div className="analytics-pie-center"></div>
                  </div>
                </div>
                <div className="analytics-pie-legend">
                  {serviceDistribution.map((item, idx) => {
                    const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444'];
                    return (
                      <div key={idx} className="analytics-pie-legend-item">
                        <div
                          className="analytics-pie-legend-color"
                          style={{ background: colors[idx % colors.length] }}
                        ></div>
                        <div className="analytics-pie-legend-label">{item.service_name}</div>
                        <div className="analytics-pie-legend-value">{item.percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-chart-card">
            <div className="analytics-chart-header">
              <div>
                <div className="analytics-chart-title">Эффективность услуг</div>
                <div className="analytics-chart-subtitle">Доход по услугам</div>
              </div>
            </div>
            <div className="analytics-chart-body">
              <div className="analytics-bar-chart">
                {serviceDistribution.slice(0, 5).map((item, idx) => {
                  const maxRevenue = Math.max(...serviceDistribution.map(d => d.revenue), 1);
                  const width = (item.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="analytics-bar-item">
                      <div className="analytics-bar-label">{item.service_name}</div>
                      <div className="analytics-bar-visual">
                        <div
                          className="analytics-bar-fill"
                          style={{ width: `${width}%` }}
                        >
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Детальная статистика */}
        <div className="analytics-table-card">
          <div className="analytics-table-header">
            <div>
              <div className="analytics-table-title">Детальная статистика</div>
              <div className="analytics-table-subtitle">Полная информация по периодам</div>
            </div>
            <button className="analytics-table-link" onClick={(e) => { e.preventDefault(); handleExport(); }}>
              📥 Полная таблица
            </button>
          </div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Период</th>
                <th>Записей</th>
                <th>Доход</th>
                <th>Расходы</th>
                <th>Прибыль</th>
                <th>Рентабельность</th>
              </tr>
            </thead>
            <tbody>
              {detailedStats.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.period}</td>
                  <td>{formatNumber(row.appointments)}</td>
                  <td>{formatCurrency(row.revenue)}</td>
                  <td>{formatCurrency(row.expenses)}</td>
                  <td>{formatCurrency(row.profit)}</td>
                  <td>{row.profitability.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Итого</td>
                <td>{formatNumber(detailedStats.reduce((sum, row) => sum + row.appointments, 0))}</td>
                <td>{formatCurrency(detailedStats.reduce((sum, row) => sum + row.revenue, 0))}</td>
                <td>{formatCurrency(detailedStats.reduce((sum, row) => sum + row.expenses, 0))}</td>
                <td>{formatCurrency(detailedStats.reduce((sum, row) => sum + row.profit, 0))}</td>
                <td>
                  {(profitLossData.profitability || 0).toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

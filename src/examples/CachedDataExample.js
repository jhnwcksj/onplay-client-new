import React from 'react';
import { useCachedData } from '../hooks/useCachedData';
import { CACHE_TTL } from '../config/version';

/**
 * Пример компонента, использующего систему кэширования
 * 
 * Этот компонент демонстрирует:
 * 1. Загрузку данных с автоматическим кэшированием
 * 2. Использование TTL для контроля актуальности
 * 3. Ручное обновление данных
 * 4. Отображение статуса загрузки
 */
function ServicesListExample() {
  const API_URL = process.env.REACT_APP_API_URL;
  const branchId = localStorage.getItem('selectedBranchId');

  // Используем хук для работы с кэшированными данными
  const {
    data: services,
    loading,
    error,
    refresh,
    clearCache,
    isCacheValid,
  } = useCachedData(
    `services_branch_${branchId}`, // Уникальный ключ кэша
    async () => {
      // Функция загрузки данных
      const response = await fetch(`${API_URL}/api/services?branchId=${branchId}`);
      if (!response.ok) throw new Error('Ошибка загрузки услуг');
      const data = await response.json();
      return data.services || [];
    },
    CACHE_TTL.SERVICES, // TTL из конфигурации (12 часов)
    [branchId] // Перезагружать при смене филиала
  );

  // Обработчик принудительного обновления
  const handleRefresh = async () => {
    console.log('Обновление списка услуг...');
    await refresh();
  };

  // Обработчик очистки кэша
  const handleClearCache = () => {
    clearCache();
    window.location.reload(); // Перезагрузка для демонстрации
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка услуг...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Ошибка загрузки данных</h3>
        <p>{error.message}</p>
        <button onClick={handleRefresh}>Повторить</button>
      </div>
    );
  }

  return (
    <div className="services-list-example">
      <div className="header">
        <h2>Список услуг</h2>
        <div className="actions">
          <span className={`cache-status ${isCacheValid() ? 'valid' : 'invalid'}`}>
            {isCacheValid() ? '✓ Кэш актуален' : '⚠ Кэш устарел'}
          </span>
          <button onClick={handleRefresh} className="btn-refresh">
            🔄 Обновить
          </button>
          <button onClick={handleClearCache} className="btn-clear">
            🗑️ Очистить кэш
          </button>
        </div>
      </div>

      <div className="services-grid">
        {services && services.length > 0 ? (
          services.map(service => (
            <div key={service.service_id} className="service-card">
              <h3>{service.service_name}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span>⏱ {service.duration} мин</span>
                <span>💰 {service.price} ₸</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">Нет доступных услуг</p>
        )}
      </div>
    </div>
  );
}

/**
 * Пример 2: Компонент с предзагрузкой данных
 */
function DashboardWithPreload() {
  const API_URL = process.env.REACT_APP_API_URL;
  const branchId = localStorage.getItem('selectedBranchId');
  const token = localStorage.getItem('token');

  // Предзагружаем несколько типов данных
  const { data: services } = useCachedData(
    `services_${branchId}`,
    () => fetch(`${API_URL}/api/services?branchId=${branchId}`).then(r => r.json()),
    CACHE_TTL.SERVICES
  );

  const { data: zones } = useCachedData(
    `zones_${branchId}`,
    () => fetch(`${API_URL}/api/zones?branchId=${branchId}`).then(r => r.json()),
    CACHE_TTL.ZONES
  );

  const { data: appointments, refresh: refreshAppointments } = useCachedData(
    `appointments_${branchId}`,
    () => fetch(`${API_URL}/api/appointments?branchId=${branchId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    CACHE_TTL.APPOINTMENTS
  );

  return (
    <div className="dashboard">
      <h1>Панель управления</h1>
      
      <section>
        <h2>Услуги ({services?.length || 0})</h2>
        {/* Список услуг */}
      </section>

      <section>
        <h2>Зоны ({zones?.length || 0})</h2>
        {/* Список зон */}
      </section>

      <section>
        <h2>Записи</h2>
        <button onClick={refreshAppointments}>Обновить записи</button>
        {/* Список записей */}
      </section>
    </div>
  );
}

/**
 * Пример 3: Компонент с ручным управлением кэшем
 */
function ManualCacheExample() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const loadWithCache = async () => {
    setLoading(true);
    
    try {
      // Импортируем утилиты напрямую
      const { getCachedData, setCachedData } = await import('../utils/storageVersion');
      const { CACHE_TTL } = await import('../config/version');
      
      // Проверяем кэш
      const cached = getCachedData('manual_data', CACHE_TTL.SERVICES);
      
      if (cached) {
        console.log('Данные из кэша');
        setData(cached);
        setLoading(false);
        return;
      }
      
      // Загружаем с сервера
      const response = await fetch('/api/some-data');
      const result = await response.json();
      
      // Сохраняем в кэш
      setCachedData('manual_data', result);
      setData(result);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadWithCache();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

export default ServicesListExample;
export { DashboardWithPreload, ManualCacheExample };

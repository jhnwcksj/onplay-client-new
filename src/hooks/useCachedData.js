import { useState, useEffect, useCallback } from 'react';
import { getCachedData, setCachedData, isCacheValid } from '../utils/storageVersion';
import { CACHE_TTL } from '../config/version';

/**
 * Хук для работы с кэшированными данными
 * Автоматически управляет загрузкой, кэшированием и обновлением данных
 * 
 * @param {string} cacheKey - Уникальный ключ для кэша
 * @param {Function} fetchFunction - Асинхронная функция для загрузки данных
 * @param {number} ttl - TTL в минутах (из CACHE_TTL)
 * @param {Array} dependencies - Зависимости для автоматической перезагрузки
 * 
 * @returns {Object} { data, loading, error, refresh, clearCache }
 * 
 * @example
 * const { data: services, loading, refresh } = useCachedData(
 *   'services_list',
 *   () => fetch(`${API_URL}/api/services`).then(r => r.json()),
 *   CACHE_TTL.SERVICES,
 *   [branchId]
 * );
 */
export function useCachedData(cacheKey, fetchFunction, ttl, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем кэш если не форсируем обновление
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey, ttl);
        if (cached) {
          console.log(`[useCachedData] Загружено из кэша: ${cacheKey}`);
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Загружаем с сервера
      console.log(`[useCachedData] Загрузка с сервера: ${cacheKey}`);
      const result = await fetchFunction();
      
      // Сохраняем в кэш
      setCachedData(cacheKey, result);
      setData(result);
      
      return result;
    } catch (err) {
      console.error(`[useCachedData] Ошибка загрузки ${cacheKey}:`, err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFunction, ttl]);

  // Функция для принудительного обновления
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Функция для очистки кэша
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);
    console.log(`[useCachedData] Кэш очищен: ${cacheKey}`);
  }, [cacheKey]);

  // Загружаем данные при монтировании или изменении зависимостей
  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    isCacheValid: () => isCacheValid(cacheKey, ttl),
  };
}

/**
 * Хук для автоматической проверки актуальности данных
 * Периодически проверяет кэш и обновляет данные при необходимости
 * 
 * @param {string} cacheKey - Ключ кэша
 * @param {number} ttl - TTL в минутах
 * @param {Function} onExpired - Callback при истечении кэша
 * @param {number} checkInterval - Интервал проверки в мс (по умолчанию 60000 - 1 минута)
 */
export function useCacheValidation(cacheKey, ttl, onExpired, checkInterval = 60000) {
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isCacheValid(cacheKey, ttl)) {
        console.log(`[useCacheValidation] Кэш устарел: ${cacheKey}`);
        onExpired?.();
      }
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [cacheKey, ttl, onExpired, checkInterval]);
}

/**
 * Хук для предзагрузки данных в кэш
 * Загружает данные в фоновом режиме для улучшения UX
 * 
 * @param {Object} preloadConfig - Конфигурация предзагрузки
 * @example
 * useDataPreload({
 *   services: {
 *     cacheKey: 'services_list',
 *     fetchFn: () => fetch('/api/services').then(r => r.json()),
 *     ttl: CACHE_TTL.SERVICES
 *   },
 *   zones: {
 *     cacheKey: 'zones_list',
 *     fetchFn: () => fetch('/api/zones').then(r => r.json()),
 *     ttl: CACHE_TTL.ZONES
 *   }
 * });
 */
export function useDataPreload(preloadConfig) {
  useEffect(() => {
    const preloadAll = async () => {
      for (const [name, config] of Object.entries(preloadConfig)) {
        const { cacheKey, fetchFn, ttl } = config;
        
        // Пропускаем если кэш актуален
        if (isCacheValid(cacheKey, ttl)) {
          console.log(`[useDataPreload] ${name}: кэш актуален`);
          continue;
        }
        
        try {
          console.log(`[useDataPreload] ${name}: предзагрузка...`);
          const data = await fetchFn();
          setCachedData(cacheKey, data);
          console.log(`[useDataPreload] ${name}: успешно предзагружено`);
        } catch (error) {
          console.error(`[useDataPreload] ${name}: ошибка предзагрузки`, error);
        }
      }
    };

    // Запускаем предзагрузку с небольшой задержкой
    const timeoutId = setTimeout(preloadAll, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
}

/**
 * Хук для управления состоянием загрузки с кэшем
 * Похож на useCachedData, но с дополнительными возможностями
 */
export function useSmartCache(options) {
  const {
    cacheKey,
    fetchFunction,
    ttl,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 минут
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null,
  });

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (!forceRefresh) {
        const cached = getCachedData(cacheKey, ttl);
        if (cached) {
          const timestamp = localStorage.getItem(`${cacheKey}_timestamp`);
          setState({
            data: cached,
            loading: false,
            error: null,
            lastUpdate: timestamp ? new Date(parseInt(timestamp)) : null,
          });
          onSuccess?.(cached, true);
          return cached;
        }
      }

      const result = await fetchFunction();
      setCachedData(cacheKey, result);
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdate: new Date(),
      });
      
      onSuccess?.(result, false);
      return result;
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
      }));
      onError?.(err);
      return null;
    }
  }, [cacheKey, fetchFunction, ttl, onSuccess, onError]);

  // Автоматическое обновление
  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const intervalId = setInterval(() => {
        loadData(true);
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [loadData, autoRefresh, refreshInterval]);

  return {
    ...state,
    refresh: () => loadData(true),
    clearCache: () => {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_timestamp`);
    },
  };
}

export default useCachedData;

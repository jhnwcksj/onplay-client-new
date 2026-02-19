import { APP_VERSION, API_VERSIONS, CACHE_TTL } from '../config/version';

/**
 * Ключи для хранения версий в localStorage
 */
const STORAGE_KEYS = {
  APP_VERSION: 'app_version',
  API_VERSIONS: 'api_versions',
  LAST_UPDATE_CHECK: 'last_update_check',
};

/**
 * Проверяет версию приложения и очищает localStorage при несовпадении
 * Вызывать при инициализации приложения
 */
export function checkAndUpdateAppVersion() {
  try {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    
    if (storedVersion !== APP_VERSION) {
      // console.log(`[StorageVersion] Обнаружено обновление приложения: ${storedVersion || 'не установлено'} → ${APP_VERSION}`);
      
      // Определяем тип обновления
      const updateType = getUpdateType(storedVersion, APP_VERSION);
      
      if (updateType === 'MAJOR') {
        // Полная очистка при мажорном обновлении
        // console.log('[StorageVersion] Мажорное обновление - очистка всех данных кроме авторизации');
        clearStorageExceptAuth();
      } else if (updateType === 'MINOR') {
        // Выборочная очистка при минорном обновлении
        // console.log('[StorageVersion] Минорное обновление - очистка кэшированных данных');
        clearCachedData();
      } else {
        // Патч - только обновляем версию
        // console.log('[StorageVersion] Патч обновление - сохранение данных');
      }
      
      // Обновляем версию
      localStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);
      localStorage.setItem(STORAGE_KEYS.API_VERSIONS, JSON.stringify(API_VERSIONS));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE_CHECK, Date.now().toString());
      
      return true; // Было обновление
    }
    
    return false; // Обновления не было
  } catch (error) {
    console.error('[StorageVersion] Ошибка проверки версии:', error);
    return false;
  }
}

/**
 * Определяет тип обновления по семантической версии
 */
function getUpdateType(oldVersion, newVersion) {
  if (!oldVersion) return 'MAJOR';
  
  try {
    const oldParts = oldVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);
    
    if (newParts[0] > oldParts[0]) return 'MAJOR';
    if (newParts[1] > oldParts[1]) return 'MINOR';
    if (newParts[2] > oldParts[2]) return 'PATCH';
    
    return 'NONE';
  } catch {
    return 'MAJOR';
  }
}

/**
 * Очищает весь localStorage кроме данных авторизации
 */
function clearStorageExceptAuth() {
  const authKeys = ['token', 'user', 'userId'];
  const authData = {};
  
  // Сохраняем данные авторизации
  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) authData[key] = value;
  });
  
  // Очищаем всё
  localStorage.clear();
  
  // Восстанавливаем авторизацию
  Object.entries(authData).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}

/**
 * Очищает только кэшированные данные (не затрагивает настройки и авторизацию)
 */
function clearCachedData() {
  const preserveKeys = [
    'token',
    'user',
    'userId',
    'selectedBranchId',
    STORAGE_KEYS.APP_VERSION,
    STORAGE_KEYS.API_VERSIONS,
    STORAGE_KEYS.LAST_UPDATE_CHECK,
  ];
  
  const keysToRemove = [];
  
  // Собираем ключи для удаления
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !preserveKeys.includes(key) && !key.startsWith('branch_')) {
      keysToRemove.push(key);
    }
  }
  
  // Удаляем кэш
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // console.log(`[StorageVersion] Очищено кэшированных ключей: ${keysToRemove.length}`);
}

/**
 * Проверяет актуальность данных по TTL
 * @param {string} key - Ключ в localStorage
 * @param {number} ttlMinutes - TTL в минутах
 * @returns {boolean} - true если данные актуальны
 */
export function isCacheValid(key, ttlMinutes) {
  try {
    const timestampKey = `${key}_timestamp`;
    const timestamp = localStorage.getItem(timestampKey);
    
    if (!timestamp) return false;
    
    const age = Date.now() - parseInt(timestamp, 10);
    const maxAge = ttlMinutes * 60 * 1000;
    
    return age < maxAge;
  } catch {
    return false;
  }
}

/**
 * Сохраняет данные в localStorage с временной меткой
 * @param {string} key - Ключ
 * @param {any} data - Данные (будут сериализованы в JSON)
 */
export function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
  } catch (error) {
    console.error(`[StorageVersion] Ошибка сохранения ${key}:`, error);
  }
}

/**
 * Получает данные из localStorage если они актуальны
 * @param {string} key - Ключ
 * @param {number} ttlMinutes - TTL в минутах
 * @returns {any|null} - Данные или null
 */
export function getCachedData(key, ttlMinutes) {
  try {
    if (!isCacheValid(key, ttlMinutes)) return null;
    
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`[StorageVersion] Ошибка чтения ${key}:`, error);
    return null;
  }
}

/**
 * Проверяет версию данных пользователя на сервере
 * @param {string} apiUrl - URL API
 * @param {string} token - Токен авторизации
 * @returns {Promise<boolean>} - true если нужно обновить данные
 */
export async function checkServerDataVersion(apiUrl, token) {
  try {
    const response = await fetch(`${apiUrl}/api/version/check`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    
    // Сравниваем версии API
    const storedVersions = JSON.parse(localStorage.getItem(STORAGE_KEYS.API_VERSIONS) || '{}');
    let needsUpdate = false;
    
    if (data.versions) {
      Object.entries(data.versions).forEach(([key, serverVersion]) => {
        if (storedVersions[key] !== serverVersion) {
          // console.log(`[StorageVersion] Обновление версии ${key}: ${storedVersions[key]} → ${serverVersion}`);
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        // Обновляем версии
        localStorage.setItem(STORAGE_KEYS.API_VERSIONS, JSON.stringify(data.versions));
        clearCachedData();
      }
    }
    
    return needsUpdate;
  } catch (error) {
    console.error('[StorageVersion] Ошибка проверки версии на сервере:', error);
    return false;
  }
}

/**
 * Принудительная очистка всех данных (для отладки)
 */
export function forceResetStorage() {
  // console.log('[StorageVersion] Принудительная очистка всех данных');
  localStorage.clear();
  window.location.reload();
}

/**
 * Получает информацию о текущем состоянии хранилища
 */
export function getStorageInfo() {
  const info = {
    appVersion: localStorage.getItem(STORAGE_KEYS.APP_VERSION),
    currentVersion: APP_VERSION,
    apiVersions: JSON.parse(localStorage.getItem(STORAGE_KEYS.API_VERSIONS) || '{}'),
    lastUpdateCheck: localStorage.getItem(STORAGE_KEYS.LAST_UPDATE_CHECK),
    totalKeys: localStorage.length,
    estimatedSize: new Blob(Object.values(localStorage)).size,
  };
  
  console.table(info);
  return info;
}

// Экспорт для использования в консоли разработчика
if (process.env.NODE_ENV === 'development') {
  window.__storageDebug = {
    getInfo: getStorageInfo,
    forceReset: forceResetStorage,
    clearCache: clearCachedData,
    checkVersion: checkAndUpdateAppVersion,
  };
  // console.log('[StorageVersion] Debug утилиты доступны в window.__storageDebug');
}

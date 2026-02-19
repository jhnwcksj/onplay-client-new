// Утилиты для работы с часовыми поясами

// Получить часовой пояс текущего филиала из localStorage или базы данных
export function getBranchTimezone() {
  try {
    // Пробуем получить информацию о филиале из localStorage
    const branchId = localStorage.getItem('selectedBranchId');
    if (!branchId) {
      return 'Asia/Almaty'; // fallback по умолчанию
    }

    // Пробуем получить сохранённый часовой пояс филиала
    const cachedTimezone = localStorage.getItem(`branch_${branchId}_timezone`);
    if (cachedTimezone) {
      return cachedTimezone;
    }

    // Если нет в кеше, возвращаем значение по умолчанию
    // Приложение должно вызывать updateBranchTimezoneCache после загрузки данных филиала
    return 'Asia/Almaty';
  } catch {
    return 'Asia/Almaty';
  }
}

// Сохранить часовой пояс филиала в кеш
export function updateBranchTimezoneCache(branchId, timezone) {
  try {
    if (branchId && timezone) {
      localStorage.setItem(`branch_${branchId}_timezone`, timezone);
    }
  } catch {
    // ignore errors
  }
}

// Загрузить часовой пояс филиала с сервера
export async function loadBranchTimezoneFromServer(branchId) {
  if (!branchId) return null;

  try {
    const API_URL = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem('token');
    
    const res = await fetch(`${API_URL}/branches/${branchId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return null;

    const data = await res.json();
    const branch = data.branch || data;
    const timezone = branch.timezone || 'Asia/Almaty';

    // Сохраняем в кеш
    updateBranchTimezoneCache(branchId, timezone);

    return timezone;
  } catch {
    return null;
  }
}

// Получить offset для заданного часового пояса
export function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const localDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offsetMs = tzDate.getTime() - localDate.getTime();
    const offsetHours = offsetMs / (1000 * 60 * 60);
    const sign = offsetHours >= 0 ? '+' : '-';
    const absHours = Math.abs(Math.floor(offsetHours));
    const minutes = Math.abs(Math.round((offsetHours % 1) * 60));
    return `${sign}${String(absHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } catch {
    return '+05:00'; // fallback
  }
}

// Получить количество часов offset для заданного часового пояса
export function getTimezoneOffsetHours(timezone) {
  try {
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const localDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offsetMs = tzDate.getTime() - localDate.getTime();
    return offsetMs / (1000 * 60 * 60);
  } catch {
    return 5; // fallback
  }
}

// Геттер-функции для получения текущих значений timezone
// Эти функции возвращают актуальное значение при каждом вызове

export function TIMEZONE_NAME() {
  return getBranchTimezone();
}

export function TIMEZONE_OFFSET() {
  const tz = getBranchTimezone();
  return getTimezoneOffset(tz);
}

export function TIMEZONE_OFFSET_HOURS() {
  const tz = getBranchTimezone();
  return getTimezoneOffsetHours(tz);
}

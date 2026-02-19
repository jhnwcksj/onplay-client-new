/**
 * Форматирует номер телефона в читаемый вид
 * @param {string} phone - Номер телефона (может быть с или без префикса)
 * @returns {string} Отформатированный номер телефона
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Убираем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');
  
  // Если номер начинается с 7 или 8 (российский формат)
  if (cleaned.length === 11 && (cleaned[0] === '7' || cleaned[0] === '8')) {
    // Формат: +7 (XXX) XXX-XX-XX
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  }
  
  // Если номер начинается с кода страны (не 7 и не 8)
  if (cleaned.length > 10) {
    const countryCode = cleaned.slice(0, cleaned.length - 10);
    const rest = cleaned.slice(cleaned.length - 10);
    return `+${countryCode} (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 8)}-${rest.slice(8, 10)}`;
  }
  
  // Для 10-значных номеров (без кода страны)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  }
  
  // Для коротких номеров - просто группировка
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 7)}`;
  }
  
  // Если формат не подошел, возвращаем как есть
  return phone;
}

/**
 * Нормализует номер телефона к стандартному формату для хранения
 * @param {string} phone - Номер телефона в любом формате
 * @returns {string} Нормализованный номер (только цифры с кодом страны)
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Если начинается с 8, заменяем на 7
  if (cleaned.length === 11 && cleaned[0] === '8') {
    return '7' + cleaned.slice(1);
  }
  
  // Если начинается с 7 и длина 11 - уже нормализован
  if (cleaned.length === 11 && cleaned[0] === '7') {
    return cleaned;
  }
  
  // Если 10 цифр, добавляем код России
  if (cleaned.length === 10) {
    return '7' + cleaned;
  }
  
  return cleaned;
}

/**
 * Валидирует номер телефона
 * @param {string} phone - Номер телефона
 * @returns {boolean} true если номер валиден
 */
export function isValidPhoneNumber(phone) {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Проверяем длину (должно быть от 10 до 15 цифр)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

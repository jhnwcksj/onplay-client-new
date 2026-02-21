

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from '../hooks/use-toast';
import './BookingDialog.css';

const API_URL = process.env.REACT_APP_API_URL;

// --- Country/city/phone code data ---
const COUNTRIES = [
  { code: 'KZ', name: 'Казахстан' },
  { code: 'RU', name: 'Россия' },
  { code: 'UA', name: 'Украина' },
  { code: 'BY', name: 'Беларусь' },
  { code: 'KG', name: 'Киргизия' },
  { code: 'UZ', name: 'Узбекистан' },
  { code: 'TJ', name: 'Таджикистан' },
  { code: 'TM', name: 'Туркменистан' },
  { code: 'AZ', name: 'Азербайджан' },
  { code: 'AM', name: 'Армения' },
  { code: 'GE', name: 'Грузия' },
  { code: 'LV', name: 'Латвия' },
  { code: 'LT', name: 'Литва' },
  { code: 'EE', name: 'Эстония' },
  { code: 'US', name: 'США' },
  { code: 'CA', name: 'Канада' },
  { code: 'GB', name: 'Великобритания' },
  { code: 'DE', name: 'Германия' },
  { code: 'FR', name: 'Франция' },
  { code: 'IT', name: 'Италия' },
  { code: 'ES', name: 'Испания' },
  { code: 'PT', name: 'Португалия' },
  { code: 'NL', name: 'Нидерланды' },
  { code: 'BE', name: 'Бельгия' },
  { code: 'CH', name: 'Швейцария' },
  { code: 'AT', name: 'Австрия' },
  { code: 'PL', name: 'Польша' },
  { code: 'CZ', name: 'Чехия' },
  { code: 'SK', name: 'Словакия' },
  { code: 'HU', name: 'Венгрия' },
  { code: 'RO', name: 'Румыния' },
  { code: 'BG', name: 'Болгария' },
  { code: 'TR', name: 'Турция' },
  { code: 'CN', name: 'Китай' },
  { code: 'JP', name: 'Япония' },
  { code: 'KR', name: 'Южная Корея' },
  { code: 'IN', name: 'Индия' },
  { code: 'AE', name: 'ОАЭ' },
  { code: 'SA', name: 'Саудовская Аравия' },
  { code: 'IL', name: 'Израиль' },
  { code: 'EG', name: 'Египет' },
  { code: 'TH', name: 'Таиланд' },
  { code: 'VN', name: 'Вьетнам' },
  { code: 'SG', name: 'Сингапур' },
  { code: 'MY', name: 'Малайзия' },
  { code: 'ID', name: 'Индонезия' },
  { code: 'BR', name: 'Бразилия' },
  { code: 'MX', name: 'Мексика' },
  { code: 'AR', name: 'Аргентина' },
  { code: 'CL', name: 'Чили' },
  { code: 'AU', name: 'Австралия' },
  { code: 'NZ', name: 'Новая Зеландия' },
];

const COUNTRY_PHONE_CODES = {
  KZ: '+7', RU: '+7', UA: '+380', BY: '+375', KG: '+996', UZ: '+998', TJ: '+992', TM: '+993', AZ: '+994', AM: '+374', GE: '+995', LV: '+371', LT: '+370', EE: '+372', US: '+1', CA: '+1', GB: '+44', DE: '+49', FR: '+33', IT: '+39', ES: '+34', PT: '+351', NL: '+31', BE: '+32', CH: '+41', AT: '+43', PL: '+48', CZ: '+420', SK: '+421', HU: '+36', RO: '+40', BG: '+359', TR: '+90', CN: '+86', JP: '+81', KR: '+82', IN: '+91', AE: '+971', SA: '+966', IL: '+972', EG: '+20', TH: '+66', VN: '+84', SG: '+65', MY: '+60', ID: '+62', BR: '+55', MX: '+52', AR: '+54', CL: '+56', AU: '+61', NZ: '+64',
};

const COUNTRY_PHONE_NATIONAL_DIGITS = {
  KZ: 10, RU: 10, US: 10, CA: 10, GB: 10, DE: 10, FR: 10, IT: 10, ES: 10, PT: 10, NL: 10, BE: 10, CH: 10, AT: 10, PL: 10, CZ: 10, SK: 10, HU: 10, RO: 10, BG: 10, TR: 10, BR: 10, MX: 10, AR: 10, CL: 10, AU: 10, NZ: 10, UA: 9, BY: 9, KG: 9, UZ: 9, TJ: 9, TM: 9, AZ: 9, AM: 9, GE: 9, LV: 9, LT: 9, EE: 9,
};

// Форматы для отображения номера телефона
const COUNTRY_PHONE_FORMATS = {
  // Страны СНГ (10 цифр)
  KZ: 'XXX XXX-XX-XX',  // 700 000-00-00
  RU: 'XXX XXX-XX-XX',  // 900 000-00-00
  
  // Страны СНГ (9 цифр)
  UA: 'XX XXX-XX-XX',   // 50 123-45-67
  BY: 'XX XXX-XX-XX',   // 29 123-45-67
  KG: 'XXX XXX-XXX',    // 700 123-456
  UZ: 'XX XXX-XX-XX',   // 90 123-45-67
  TJ: 'XX XXX-XXXX',    // 91 123-4567
  TM: 'X XXX-XXXX',     // 6 512-3456
  AZ: 'XX XXX-XX-XX',   // 50 123-45-67
  AM: 'XX XXX-XXX',     // 91 123-456
  GE: 'XXX XXX-XXX',    // 555 123-456
  LV: 'XXXX-XXXX',      // 2012-3456
  LT: 'XXX XXXXX',      // 612 34567
  EE: 'XXXX XXXX',      // 5123 4567
  
  // Северная Америка (10 цифр)
  US: 'XXX XXX-XXXX',   // 555 123-4567
  CA: 'XXX XXX-XXXX',   // 416 123-4567
  
  // Европа (10 цифр)
  GB: 'XX XXXX XXXX',   // 20 1234 5678
  DE: 'XXX XXXX-XXX',   // 151 2345-678
  FR: 'X XX XX XX XX',  // 6 12 34 56 78
  IT: 'XXX XXX-XXXX',   // 312 345-6789
  ES: 'XXX XXX-XXX',    // 612 345-678
  PT: 'XXX XXX-XXX',    // 912 345-678
  NL: 'XX XXX-XXXX',    // 20 123-4567
  BE: 'XXX XX-XX-XX',   // 471 12-34-56
  CH: 'XX XXX-XX-XX',   // 79 123-45-67
  AT: 'XXX XXX-XXXX',   // 664 123-4567
  PL: 'XXX XXX-XXX',    // 500 123-456
  CZ: 'XXX XXX-XXX',    // 601 234-567
  SK: 'XXX XXX-XXX',    // 905 123-456
  HU: 'XX XXX-XXXX',    // 20 123-4567
  RO: 'XXX XXX-XXX',    // 721 234-567
  BG: 'XXX XXX-XXX',    // 887 123-456
  TR: 'XXX XXX-XXXX',   // 532 123-4567
  
  // Азия (10 цифр)
  CN: 'XXX XXXX-XXXX',  // 139 1234-5678
  JP: 'XX-XXXX-XXXX',   // 90-1234-5678
  KR: 'XX-XXXX-XXXX',   // 10-1234-5678
  IN: 'XXXXX-XXXXX',    // 98765-43210
  AE: 'XX XXX-XXXX',    // 50 123-4567
  SA: 'XX XXX-XXXX',    // 50 123-4567
  IL: 'XX-XXX-XXXX',    // 50-123-4567
  EG: 'XXX XXX-XXXX',   // 100 123-4567
  TH: 'XX XXX-XXXX',    // 81 234-5678
  VN: 'XXX XXX-XXXX',   // 912 345-6789
  SG: 'XXXX-XXXX',      // 8123-4567
  MY: 'XX-XXXX-XXXX',   // 12-3456-7890
  ID: 'XXX-XXX-XXXX',   // 812-345-6789
  
  // Южная Америка (10 цифр)
  BR: 'XX XXXXX-XXXX',  // 11 98765-4321
  MX: 'XXX XXX-XXXX',   // 555 123-4567
  AR: 'XX XXXX-XXXX',   // 11 1234-5678
  CL: 'X XXXX-XXXX',    // 9 1234-5678
  
  // Океания (10 цифр)
  AU: 'XXX XXX-XXX',    // 412 345-678
  NZ: 'XX XXX-XXXX',    // 21 123-4567
};

// Функция для форматирования номера телефона
function formatPhoneNumber(digits, countryCode) {
  const format = COUNTRY_PHONE_FORMATS[countryCode];
  if (!format) {
    // Базовый формат для неизвестных стран
    return digits;
  }
  
  let formatted = '';
  let digitIndex = 0;
  
  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === 'X') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += format[i];
    }
  }
  
  return formatted;
}

// Функция для очистки номера от всех нецифровых символов
function cleanPhoneNumber(value) {
  return value.replace(/[^0-9]/g, '');
}

// Функция для нормализации вставленного номера
function normalizePhoneForPaste(pastedValue, countryCode) {
  // Удаляем все пробелы, дефисы, скобки
  let cleaned = cleanPhoneNumber(pastedValue);
  
  // Получаем код страны без +
  const currentCode = COUNTRY_PHONE_CODES[countryCode]?.replace('+', '') || '7';
  
  // Специальная обработка для стран с кодом +7 (Казахстан, Россия)
  // Если номер начинается с 8, заменяем на 7
  if (currentCode === '7' && cleaned.startsWith('8')) {
    cleaned = '7' + cleaned.slice(1);
  }
  
  // Для Украины: если номер начинается с 0, это местный формат
  if (countryCode === 'UA' && cleaned.startsWith('0')) {
    // Удаляем ведущий 0 и добавляем код страны
    cleaned = currentCode + cleaned.slice(1);
  }
  
  // Для других стран СНГ с возможным ведущим 0
  const countriesWithLeadingZero = ['BY', 'UZ', 'TM', 'AZ', 'AM'];
  if (countriesWithLeadingZero.includes(countryCode) && cleaned.startsWith('0')) {
    cleaned = currentCode + cleaned.slice(1);
  }
  
  // Определяем ожидаемую длину локального номера
  const maxLen = COUNTRY_PHONE_NATIONAL_DIGITS[countryCode] || 10;
  
  // Удаляем код страны только если:
  // 1. Номер начинается с кода страны
  // 2. Длина номера больше, чем локальная длина (то есть включает код страны)
  // Например: для KZ, если номер "7654321754" (10 цифр), это локальный номер
  // Если номер "77654321754" (11 цифр), то это +7 + локальный номер
  if (cleaned.startsWith(currentCode) && cleaned.length > maxLen) {
    cleaned = cleaned.slice(currentCode.length);
  }
  
  // Ограничиваем длину
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }
  
  return cleaned;
}

const STATUS_LIST = [
  { key: 'pending', label: 'Ожидание', color: '#222' },
  { key: 'arrived', label: 'Пришел', color: '#27ae60' },
  { key: 'no_show', label: 'Не пришел', color: '#e74c3c' },
  { key: 'confirmed', label: 'Подтвердил', color: '#3b82f6' },
];

// Предустановленные цвета для записей
const COLOR_OPTIONS = [
  { key: 'default', label: 'По умолчанию', value: '#e0f9f3' },
  { key: 'red', label: 'Красный', value: '#f44336' },
  { key: 'pink', label: 'Розовый', value: '#e91e63' },
  { key: 'purple', label: 'Фиолетовый', value: '#9c27b0' },
  { key: 'deep-purple', label: 'Темно-фиолетовый', value: '#673ab7' },
  { key: 'indigo', label: 'Индиго', value: '#3f51b5' },
  { key: 'pantone-307c', label: 'Pantone 307 C', value: '#0076a8' },
  { key: 'blue', label: 'Синий', value: '#2196f3' },
  { key: 'light-blue', label: 'Светло-синий', value: '#64b5f6' },
  { key: 'cyan', label: 'Голубой', value: '#03a9f4' },
  { key: 'teal', label: 'Бирюзовый', value: '#00bcd4' },
  { key: 'green', label: 'Зеленый', value: '#4caf50' },
  { key: 'light-green', label: 'Светло-зеленый', value: '#8bc34a' },
  { key: 'lime', label: 'Лаймовый', value: '#cddc39' },
  { key: 'yellow', label: 'Желтый', value: '#ffeb3b' },
  { key: 'amber', label: 'Янтарный', value: '#ffc107' },
  { key: 'orange', label: 'Оранжевый', value: '#ff9800' },
  { key: 'deep-orange', label: 'Оранжево-красный', value: '#ff5722' },
  { key: 'dark-orange', label: 'Темно-оранжевый', value: '#f57c00' },
  { key: 'brown', label: 'Коричневый', value: '#795548' },
  { key: 'grey', label: 'Серый', value: '#9e9e9e' },
  { key: 'blue-grey', label: 'Сизый', value: '#607d8b' },
];

function getTimeOptions(start = '10:00', end = '24:00', step = 5) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const result = [];
  let d = new Date(2000, 0, 1, sh, sm);
  const endD = new Date(2000, 0, 1, eh, em);
  while (d <= endD) {
    result.push(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    d = new Date(d.getTime() + step * 60000);
  }
  return result;
}




function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}



export default function BookingDialog({
  open,
  onClose,
  zone,
  date,
  time,
  onSubmit,
  zones = [],
  mode = 'create', // 'create' | 'edit'
  appointment = null,
  onDelete,
  onClientUpdate, // callback для уведомления о обновлении данных клиента
}) {
  const [selectedPayment, setSelectedPayment] = useState('none'); // 'card' | 'cash' | 'none'
  const [showClientConflictDialog, setShowClientConflictDialog] = useState(false);
  const [conflictingClient, setConflictingClient] = useState(null);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);

  // Theme detection for dialog (apply dark-theme class when app background is dark)
  const darkThemeKeys = useMemo(() => new Set(['dark', 'purple', 'ocean', 'sunset']), []);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
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
    const handler = (e) => {
      try {
        if (e && e.detail && typeof e.detail.isDark !== 'undefined') { setIsDarkTheme(Boolean(e.detail.isDark)); return; }
        const cssText = getComputedStyle(document.documentElement).getPropertyValue('--theme-text').trim();
        if (cssText && cssText.startsWith('#')) {
          const rgb = parseInt(cssText.slice(1), 16);
          const r = (rgb >> 16) & 0xff;
          const g = (rgb >> 8) & 0xff;
          const b = rgb & 0xff;
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          setIsDarkTheme(lum > 0.7);
          return;
        }
        const saved = localStorage.getItem('appTheme') || 'light';
        setIsDarkTheme(darkThemeKeys.has(saved));
      } catch {}
    };
    window.addEventListener('appThemeChanged', handler);
    return () => window.removeEventListener('appThemeChanged', handler);
  }, [darkThemeKeys]);

  // При открытии в режиме редактирования — выставить выбранный способ оплаты
  useEffect(() => {
    if (mode === 'edit' && appointment) {
      if (appointment.is_paid === true && appointment.payment_method === 'card') {
        setSelectedPayment('card');
      } else if (appointment.is_paid === true && appointment.payment_method === 'cash') {
        setSelectedPayment('cash');
      } else {
        setSelectedPayment('none');
      }
    } else if (mode === 'create') {
      setSelectedPayment('none');
    }
  }, [mode, appointment]);


    
  const [showPayDialog, setShowPayDialog] = useState(false);
  function handlePayment(method) {
    setShowPayDialog(false);
    toast({ title: 'Оплата', description: 'Оплата через: ' + (method === 'card' ? 'Картой' : 'Наличными') });
  }
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  // --- Phone input state ---
  const [client, setClient] = useState({ name: '', phone: '', email: '' });
  const [selectedCountry, setSelectedCountry] = useState('KZ');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const phoneInputRef = useRef(null);
  const [prepaid, setPrepaid] = useState('');
  const [prepaidType, setPrepaidType] = useState('amount'); // amount | percent
  const [participants, setParticipants] = useState(1);
  const [quantity, setQuantity] = useState(1); // Количество выбранной услуги
  const [discount, setDiscount] = useState('');
  // Скидка теперь задаётся как сумма, а не процент
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('pending');
  const [colorKey, setColorKey] = useState('default');
  const [showColorList, setShowColorList] = useState(false);
  const zoneValid = zone && zone.zone_id && zone.branch_id;
  const [availableZoneIds, setAvailableZoneIds] = useState(null); // свободные для записи зоны на выбранное время

  // Если zone не входит в zones, добавим его в начало списка для выбора
  let zonesWithSelected = zones;
  if (zoneValid && !zones.some(z => z.zone_id === zone.zone_id)) {
    zonesWithSelected = [zone, ...zones];
  }
  const [selectedZoneId, setSelectedZoneId] = useState(zoneValid ? zone.zone_id : (zonesWithSelected[0]?.zone_id || ''));


  // Базовое объединение зон только по выбранной зоне и количеству участников (без учёта выбранной услуги)
  function getMergedZonesForServices(selectedZoneId, participants) {
    let allowedZones = zonesWithSelected;

    // Если мы уже знаем, какие зоны свободны на это время — ограничиваемся только ими
    if (Array.isArray(availableZoneIds) && availableZoneIds.length > 0) {
      const freeSet = new Set(availableZoneIds.map(id => String(id)));
      const filtered = allowedZones.filter(z => freeSet.has(String(z.zone_id)));
      if (filtered.length > 0) {
        allowedZones = filtered;
      }
    }

    const baseZone = allowedZones.find(z => String(z.zone_id) === String(selectedZoneId)) || allowedZones[0];
    if (!baseZone) return [];
    let total = Number(baseZone.capacity) || 0;
    let merged = [baseZone];
    if (participants <= total) return merged;

    const others = allowedZones.filter(z => z.zone_id !== baseZone.zone_id);
    for (const z of others) {
      if (merged.some(mz => mz.zone_id === z.zone_id)) continue;
      total += Number(z.capacity) || 0;
      merged.push(z);
      if (participants <= total) break;
    }
    return merged;
  }

  // Автоматическое объединение зон с учётом привязки услуги к зонам (service_zones)
  function getMergedZones(selectedZoneId, participants) {
    // Список зон, в которых текущая услуга вообще может оказываться
    let allowedZones = zonesWithSelected;
    if (selectedService && Array.isArray(selectedService.linked_zone_ids) && selectedService.linked_zone_ids.length > 0) {
      const allowedIds = selectedService.linked_zone_ids.map(String);
      allowedZones = zonesWithSelected.filter(z => allowedIds.includes(String(z.zone_id)));
      if (allowedZones.length === 0) {
        // На всякий случай, если привязка не совпала — используем исходный список
        allowedZones = zonesWithSelected;
      }
    }

    // Если мы уже знаем, какие зоны свободны на это время — ограничиваемся только ими
    if (Array.isArray(availableZoneIds) && availableZoneIds.length > 0) {
      const freeSet = new Set(availableZoneIds.map(id => String(id)));
      const filtered = allowedZones.filter(z => freeSet.has(String(z.zone_id)));
      if (filtered.length > 0) {
        allowedZones = filtered;
      }
    }

    // Если выбрана услуга типа "package" — занимаем все доступные для неё зоны
    if (selectedService && selectedService.pricing_type === 'package') {
      return allowedZones;
    }

    // Обычная логика: объединяем зоны по вместимости под кол-во участников
    const baseZone = allowedZones.find(z => String(z.zone_id) === String(selectedZoneId)) || allowedZones[0];
    if (!baseZone) return [];
    let total = Number(baseZone.capacity) || 0;
    let merged = [baseZone];
    if (participants <= total) return merged;
    // Добавляем другие подходящие зоны, пока не хватит вместимости
    const others = allowedZones.filter(z => z.zone_id !== baseZone.zone_id);
    for (const z of others) {
      if (merged.some(mz => mz.zone_id === z.zone_id)) continue;
      total += Number(z.capacity) || 0;
      merged.push(z);
      if (participants <= total) break;
    }
    return merged;
  }

  const mergedZones = getMergedZones(selectedZoneId, participants);
  const mergedZoneNames = mergedZones.map(z => z.name).join(' + ');
  const [selectedDate, setSelectedDate] = useState(date);
  const [timeFrom, setTimeFrom] = useState(time || '10:00');
  const [timeTo, setTimeTo] = useState('11:00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(null);
  const [showTimeListFrom, setShowTimeListFrom] = useState(false);
  const [showTimeListTo, setShowTimeListTo] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [packageConflictError, setPackageConflictError] = useState(null);
  const [perPersonHint, setPerPersonHint] = useState(null);
  const [servicePreselected, setServicePreselected] = useState(false); // чтобы авто-выбор в режиме редактирования происходил только один раз
  const [weekRules, setWeekRules] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [calendarLoaded, setCalendarLoaded] = useState(false);
  const [serviceWeekOverrides, setServiceWeekOverrides] = useState({});
  const [branchData, setBranchData] = useState(null); // Данные филиала для проверки лицензии
  const fromTimeRef = useRef(null);
  const toTimeRef = useRef(null);
  const dateWrapperRef = useRef(null);
  const colorWrapperRef = useRef(null);
  const dateCorrectedRef = useRef(false); // Флаг, что дата уже была скорректирована для текущего открытия
  // const colorListRef = useRef(null);

  const selectedColorOption = COLOR_OPTIONS.find(opt => opt.key === colorKey) || COLOR_OPTIONS[0];
  const selectedColorValue = selectedColorOption.value;

  // Определяет тип дня на основе weekRules, holidays и переопределений услуги
  const getDayType = (dateStr, serviceId = null) => {
    // dateStr в формате DD.MM.YYYY, конвертируем в YYYY-MM-DD
    const parts = dateStr.split('.');
    if (parts.length !== 3) return 'weekday';
    const [d, m, y] = parts.map(Number);
    const dateFormatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay();
    
    // Если передан serviceId, проверяем переопределения для этой услуги
    if (serviceId && serviceWeekOverrides[serviceId]) {
      const override = serviceWeekOverrides[serviceId][dayOfWeek];
      if (override) return override;
    }
    
    // Проверяем праздники
    const event = holidays.find(h => {
      const [sy, sm, sd] = h.start_date.split('-').map(Number);
      const [ey, em, ed] = h.end_date.split('-').map(Number);
      const current = new Date(y, m - 1, d);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      return current >= start && current <= end;
    });
    
    if (event) return event.day_type;
    
    // Используем правила недели
    const weekRule = weekRules.find(r => r.weekday === dayOfWeek);
    if (weekRule) return weekRule.day_type;
    
    // По умолчанию
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
  };

  // Инициализация при открытии в режиме создания новой записи
  useEffect(() => {
    if (open && mode === 'create' && zone && zone.zone_id && zone.branch_id) {
      setSelectedZoneId(zone.zone_id);
      setSelectedDate(date);
      const baseFrom = time || '10:00';
      setTimeFrom(baseFrom);
      setColorKey('default');

      const fromM = timeToMinutes(baseFrom);
      if (fromM != null) {
        const maxMinutes = 24 * 60;
        const endM = Math.min(fromM + 60, maxMinutes);
        const d = new Date(2000, 0, 1, 0, 0);
        d.setMinutes(endM);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setTimeTo(`${hh}:${mm}`);
      } else {
        setTimeTo('11:00');
      }
    }
  }, [open, mode, zone, date, time]);

  // Загружаем календарные данные при открытии диалога
  useEffect(() => {
    if (!open) return;
    
    const currentBranch = zone?.branch_id || localStorage.getItem('selectedBranchId');
    if (!currentBranch) return;

    const token = localStorage.getItem('token');
    
    setCalendarLoaded(false);
    fetch(`${API_URL}/api/calendar/${currentBranch}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setWeekRules(data.weekRules || []);
        setHolidays(data.holidays || []);
        setCalendarLoaded(true);
      })
      .catch(err => {
        console.error('Ошибка загрузки календаря:', err);
        // allow services to load even if calendar fetch failed
        setWeekRules([]);
        setHolidays([]);
        setCalendarLoaded(true);
      });
    
    // Загружаем данные филиала для проверки лицензии
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        fetch(`${API_URL}/branches?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : Promise.reject())
          .then(data => {
            const branchList = data.branches || data;
            const branch = Array.isArray(branchList) 
              ? branchList.find(b => String(b.branch_id || b.id) === String(currentBranch))
              : null;
            if (branch) {
              // console.log('BookingDialog: Loaded branch data:', branch);
              setBranchData(branch);
            }
          })
          .catch(err => {
            console.error('Ошибка загрузки данных филиала:', err);
          });
      } catch (e) {
        console.error('Ошибка парсинга user:', e);
      }
    }
  }, [open, zone]);
  
  // Сброс флага коррекции даты при закрытии диалога
  useEffect(() => {
    if (!open) {
      dateCorrectedRef.current = false;
    }
  }, [open]);
  
  // Проверка и коррекция даты при открытии диалога (для user/vip-user)
  useEffect(() => {
    if (!open || !branchData || !branchData.valid_until || dateCorrectedRef.current) return;
    
    let userRole = 'user';
    try {
      const stored = localStorage.getItem('user');
      if (stored) userRole = JSON.parse(stored).role || 'user';
    } catch {}
    
    const isRestrictedRole = userRole === 'user' || userRole === 'vip-user';
    if (!isRestrictedRole) return;
    
    // Используем функциональное обновление для чтения актуального значения selectedDate
    setSelectedDate(currentDate => {
      // Проверяем выбранную дату
      const parts = (currentDate || '').split('.');
      if (parts.length !== 3) return currentDate;
      const [d, m, y] = parts.map(Number);
      
      // Проверка на NaN
      if (isNaN(d) || isNaN(m) || isNaN(y) || d <= 0 || m <= 0 || y <= 0) {
        console.warn('BookingDialog: Invalid date format, skipping correction:', currentDate);
        return currentDate;
      }
      
      const currentDateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      
      if (currentDateStr > branchData.valid_until) {
        // Дата после valid_until - устанавливаем последний валидный день
        const validParts = branchData.valid_until.split('-');
        if (validParts.length === 3) {
          const [vy, vm, vd] = validParts.map(Number);
          if (!isNaN(vy) && !isNaN(vm) && !isNaN(vd) && vy > 0 && vm > 0 && vd > 0) {
            const newDate = `${String(vd).padStart(2,'0')}.${String(vm).padStart(2,'0')}.${vy}`;
            console.log(`BookingDialog: Auto-correcting date from ${currentDate} to ${newDate} (valid_until: ${branchData.valid_until})`);
            dateCorrectedRef.current = true; // Помечаем, что коррекция выполнена
            return newDate;
          }
        }
      }
      
      return currentDate; // Дата валидна, не меняем
    });
  }, [open, branchData]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: selectedDate намеренно не включён в зависимости, чтобы избежать бесконечного цикла
  
    // Менять цвет записи по статусу
  useEffect(() => {
    // Цвет меняется по статусу всегда, кроме момента открытия (инициализации) диалога
    // Для 'pending' — по услуге, для остальных — как раньше
    if (status === 'arrived') {
      setColorKey('orange'); // ярко-оранжевый
    } else if (status === 'no_show') {
      setColorKey('red'); // ярко-красный
    } else if (status === 'confirmed') {
      setColorKey('blue'); // ярко-синий
    } else if (status === 'pending') {
      // Если услуга выбрана и у неё есть цвет, используем его
      // if (selectedService && selectedService.color) {
      //   // Найти соответствующий ключ цвета в COLOR_OPTIONS
      //   const matched = COLOR_OPTIONS.find(opt =>
      //     typeof selectedService.color === 'string' &&
      //     opt.value.toLowerCase() === selectedService.color.toLowerCase()
      //   );
      //   setColorKey(matched ? matched.key : 'default');
      // } else {
      //   setColorKey('default'); // fallback
      // }
      if (selectedService && selectedService.pricing_type === 'package') {
      setColorKey('yellow');
    } else {
      setColorKey('default');
    }
    }
  }, [status, selectedService]);

  // Автоматически выбирать желтый цвет для услуги типа 'package', иначе сбрасывать на 'default'
  useEffect(() => {
    // Менять цвет только если:
    // - мы в режиме создания (appointment == null)
    // - или в режиме редактирования, но у appointment нет цвета в appointment_meta.color и appointment.color
    const hasCustomColor = mode === 'edit' && appointment && ((appointment.appointment_meta && appointment.appointment_meta.color) || appointment.color);
    if (hasCustomColor) return;
    if (selectedService && selectedService.pricing_type === 'package') {
      setColorKey('yellow');
    } else {
      setColorKey('default');
    }
  }, [selectedService, mode, appointment]);

  // Инициализация при открытии в режиме редактирования существующей записи
  useEffect(() => {
    if (!open || mode !== 'edit' || !appointment) return;

    const startRaw = appointment.start_time || appointment.starts_at || appointment.start || appointment.time_from;
    const endRaw = appointment.end_time || appointment.ends_at || appointment.end || appointment.time_to;

    const parseDate = (val) => {
      if (!val) return date || '';
      const d = new Date(val);
      if (!Number.isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
      }
      return date || '';
    };

    const parseTime = (val, fallback) => {
      if (!val) return fallback;
      if (val instanceof Date) {
        return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`;
      }
      if (typeof val === 'string') {
        // Если ISO строка с timezone offset, извлекаем локальное время напрямую
        // "2026-02-01T14:00:00+05:00" → "14:00"
        const isoMatch = val.match(/(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})(?::(\d{2}))?([+-]\d{2}:\d{2}|Z)?/);
        if (isoMatch) {
          return `${String(isoMatch[4]).padStart(2, '0')}:${String(isoMatch[5]).padStart(2, '0')}`;
        }
        // Fallback: простой поиск HH:MM в строке
        const m = val.match(/(\d{1,2}):(\d{2})/);
        if (m) {
          return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
        }
      }
      return fallback;
    };

    const newDate = parseDate(startRaw);
    const newFrom = parseTime(startRaw, timeFrom || '10:00');
    const newTo = parseTime(endRaw, timeTo || '11:00');

    setSelectedDate(newDate);
    setTimeFrom(newFrom);
    setTimeTo(newTo);

    const participantsFromAppt = appointment.participants_count || 1;
    const qtyFromAppt = (appointment.quantity != null
      ? appointment.quantity
      : (appointment.extra && appointment.extra.quantity != null ? appointment.extra.quantity : 1));
    const discountFromAppt = (appointment.discount != null
      ? appointment.discount
      : (appointment.extra && appointment.extra.discount != null ? appointment.extra.discount : 0));

    const prepaidFromAppt = (appointment.prepayment != null
      ? appointment.prepayment
      : (appointment.extra && appointment.extra.prepaid != null ? appointment.extra.prepaid : 0));

    const statusFromAppt = appointment.status || (appointment.extra && appointment.extra.status) || 'pending';
    const commentFromAppt = appointment.comment || '';

    setParticipants(Number(participantsFromAppt) || 1);
    setQuantity(Number(qtyFromAppt) || 1);
    // Восстанавливаем скидку как сумму
    setDiscount(discountFromAppt ? String(discountFromAppt) : '');
    setPrepaid(prepaidFromAppt ? String(prepaidFromAppt) : '');
    setPrepaidType('amount');
    setStatus(statusFromAppt);
    setComment(commentFromAppt);

    // Используем цвет из appointment_meta.color, если есть
    let colorFromAppt = '#e0f9f3';
    if (appointment.appointment_meta && appointment.appointment_meta.color) {
      colorFromAppt = appointment.appointment_meta.color;
    } else if (appointment.color) {
      colorFromAppt = appointment.color;
    }
    const matchedColor = COLOR_OPTIONS.find(opt =>
      typeof colorFromAppt === 'string'
      && opt.value.toLowerCase() === colorFromAppt.toLowerCase()
    );
    setColorKey(matchedColor ? matchedColor.key : 'default');

    const clientFromAppt = (appointment.extra && appointment.extra.client)
      || appointment.client
      || {
        name: appointment.client_name || '',
        phone: appointment.client_phone || '',
        email: appointment.client_email || '',
      };
    setClient({
      name: clientFromAppt.name || '',
      phone: clientFromAppt.phone || '',
      email: clientFromAppt.email || '',
    });

    if (zone && zone.zone_id) {
      setSelectedZoneId(zone.zone_id);
    }
  }, [open, mode, appointment, date, zone]);

  // --- Phone: set country by phone on open/edit ---
  useEffect(() => {
    if (client.phone) {
      // Try to detect country by code
      const found = Object.entries(COUNTRY_PHONE_CODES).find(([code, prefix]) =>
        client.phone.startsWith(prefix.replace('+', ''))
      );
      if (found) setSelectedCountry(found[0]);
    }
  }, [open]);

  // Получаем все услуги для всех объединённых зон
  useEffect(() => {
    // Определяем актуальный branch_id из выбранной зоны или из пропса zone
    const selectedZoneObj = zonesWithSelected.find(z => String(z.zone_id) === String(selectedZoneId)) || zone;
    const currentBranchId = selectedZoneObj && selectedZoneObj.branch_id;

    // Wait for calendar data (weekRules/holidays) to be loaded first
    if (open && selectedZoneId && currentBranchId && calendarLoaded) {
      setServicesLoading(true);
      const dayType = getDayType(selectedDate);
      
      // Получаем день недели из выбранной даты для передачи в API
      const parts = selectedDate.split('.');
      let weekday = null;
      if (parts.length === 3) {
        const [d, m, y] = parts.map(Number);
        const date = new Date(y, m - 1, d);
        weekday = date.getDay(); // 0=вс, 1=пн, ..., 6=сб
      }
      
      // Получаем услуги для всех зон и объединяем без дублей
      // Для подбора услуг при смене зоны используем объединение зон только по зоне и количеству участников
      const currentMergedZones = getMergedZonesForServices(selectedZoneId, participants);
      Promise.all(
        currentMergedZones.map(z =>
          fetch(`${API_URL}/branches/${currentBranchId}/zones/${z.zone_id}/services?dayType=${dayType}&time=${timeFrom}&weekday=${weekday}`)
            .then(res => res.json())
            .then(data => data.services || [])
        )
      ).then(results => {
        // Собираем карту: service_id -> [zone_id...]
        const serviceZoneMap = new Map();
        results.forEach((servicesArr, idx) => {
          const zoneId = currentMergedZones[idx].zone_id;
          for (const s of servicesArr) {
            if (!serviceZoneMap.has(s.service_id)) serviceZoneMap.set(s.service_id, { service: s, zones: new Set() });
            serviceZoneMap.get(s.service_id).zones.add(zoneId);
          }
        });
        // Фильтруем: услуга показывается только если она есть во всех объединённых зонах
        const mergedZoneIds = currentMergedZones.map(z => z.zone_id);
        const filtered = [];
        for (const { service, zones } of serviceZoneMap.values()) {
          // Услуга должна быть привязана ко всем выбранным зонам
          const allZonesPresent = mergedZoneIds.every(zid => zones.has(zid));
          if (!allZonesPresent) continue;
          filtered.push(service);
        }

        // Применяем отфильтрованный список услуг
        setServices(filtered);
        
        // Загружаем переопределения дней недели для всех услуг
        const token = localStorage.getItem('token');
        const overridesPromises = filtered.map(s =>
          fetch(`${API_URL}/services/${s.service_id}/week-overrides`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
            .then(res => res.ok ? res.json() : [])
            .then(overrides => {
              const map = {};
              overrides.forEach(o => {
                map[o.weekday] = o.override_day_type;
              });
              return { serviceId: s.service_id, overrides: map };
            })
            .catch(() => ({ serviceId: s.service_id, overrides: {} }))
        );
        
        Promise.all(overridesPromises).then(results => {
          const overridesMap = {};
          results.forEach(r => {
            overridesMap[r.serviceId] = r.overrides;
          });
          setServiceWeekOverrides(overridesMap);
        });
        
        setServicesLoading(false);

        // Если ранее была выбрана услуга, но она недоступна для новой зоны — сбрасываем выбор
        if (selectedService) {
          const stillExists = filtered.some(s => String(s.service_id) === String(selectedService.service_id));
          if (!stillExists) {
            setSelectedService(null);
            setParticipants(1);
            setDiscount('');
            setPrepaid('');
            setCustomPrice('');
          }
        }
      }).catch(err => {
        console.error('Error loading services:', err);
        setServicesLoading(false);
      });
      // Получаем зоны (для выпадающего списка, если zones не передан)
      fetch(`${API_URL}/zones?branchId=${currentBranchId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // если zones не передан как проп, можно обновить локально
            // setZones(data); // если нужно
          }
        });
    } else if (!open) {
      setServices([]);
      setServicesLoading(false);
      setSelectedService(null);
      setPrepaid('');
      setParticipants(1);
      setQuantity(1);
      setDiscount('');
      setComment('');
      setStatus('pending');
      setCustomPrice('');
      setColorKey('default');
      // очищаем данные клиента при закрытии диалога
      setClient({ name: '', phone: '', email: '' });
      setAvailableZoneIds(null);
      setPackageConflictError(null);
      setCalendarLoaded(false);
      setServicePreselected(false);
    }
  }, [open, selectedZoneId, participants, selectedDate, timeFrom, zone, calendarLoaded]);

  // В режиме редактирования выбираем услугу по service_id, когда список услуг загружен
  useEffect(() => {
    if (!open || mode !== 'edit' || !appointment) return;
    if (servicePreselected) return; // уже один раз выбрали, дальше не мешаем пользователю
    if (!Array.isArray(services) || services.length === 0) return;
    if (!appointment.service_id) return;
    // если пользователь уже сам выбрал услугу (или поменял), не переопределяем
    if (selectedService) return;

    const found = services.find(s => String(s.service_id) === String(appointment.service_id));
    if (found) {
      setSelectedService(found);
      setServicePreselected(true);
    }
  }, [open, mode, appointment, services, selectedService, servicePreselected]);

  // Определяем свободные зоны на выбранное время для текущей услуги
  useEffect(() => {
    if (!open) return;

    const selectedZoneObj = zonesWithSelected.find(z => String(z.zone_id) === String(selectedZoneId)) || zone;
    const currentBranchId = selectedZoneObj && selectedZoneObj.branch_id;
    if (!currentBranchId || !selectedDate || !timeFrom || !timeTo) {
      setAvailableZoneIds(null);
      setPackageConflictError(null);
      setPerPersonHint(null);
      return;
    }

    // Базовый набор зон, в которых может оказываться услуга
    let baseZones = zonesWithSelected;
    if (selectedService && Array.isArray(selectedService.linked_zone_ids) && selectedService.linked_zone_ids.length > 0) {
      const allowedIds = selectedService.linked_zone_ids.map(String);
      const filtered = zonesWithSelected.filter(z => allowedIds.includes(String(z.zone_id)));
      if (filtered.length > 0) baseZones = filtered;
    }

    const candidateIds = baseZones.map(z => z.zone_id).filter(Boolean);
    if (candidateIds.length === 0) {
      setAvailableZoneIds([]);
      setPerPersonHint(null);
      return;
    }


    // Формируем start_time и end_time в ISO с offset филиала
    // ВАЖНО: НЕ используем Date объект, чтобы избежать зависимости от timezone устройства!
    function toBranchISO(dateStr, timeStr) {
      // dateStr: DD.MM.YYYY, timeStr: HH:MM
      if (!dateStr || !timeStr) return null;
      const [d, m, y] = dateStr.split('.').map(Number);
      const [hh, mm] = timeStr.split(':').map(Number);
      
      // Получаем offset филиала (backend добавит правильный offset)
      // Формируем ISO строку БЕЗ offset - backend сам добавит нужный
      const year = String(y).padStart(4, '0');
      const month = String(m).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      const hour = String(hh).padStart(2, '0');
      const minute = String(mm).padStart(2, '0');
      
      // Возвращаем простую ISO строку без Z и без offset
      // Backend сам добавит правильный offset на основе timezone филиала
      return `${year}-${month}-${day}T${hour}:${minute}:00`;
    }

    const start_time = toBranchISO(selectedDate, timeFrom);
    const end_time = toBranchISO(selectedDate, timeTo);

    const body = {
      branch_id: currentBranchId,
      zone_ids: candidateIds,
      start_time,
      end_time,
    };

    // В режиме редактирования исключаем из проверки текущую запись,
    // чтобы она не считалась конфликтующей с самой собой
    const currentAppointmentId = (appointment && (appointment.id || appointment.appointment_id))
      ? (appointment.id || appointment.appointment_id)
      : null;
    if (mode === 'edit' && currentAppointmentId) {
      body.appointment_id = currentAppointmentId;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/appointments/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setAvailableZoneIds(null);
          return;
        }
        const data = await res.json();
        const conflicts = Array.isArray(data.conflicts) ? data.conflicts : [];
        const busy = new Set();
        for (const row of conflicts) {
          if (Array.isArray(row.zone_ids)) {
            for (const zid of row.zone_ids) busy.add(String(zid));
          }
        }
        const free = candidateIds.filter(id => !busy.has(String(id)));
        setAvailableZoneIds(free);

        // Подсказка для услуг типа per_person: если участников больше, чем вмещают свободные зоны,
        // и при этом есть занятые зоны, показываем пользователю, какие зоны заняты.
        if (selectedService && selectedService.pricing_type === 'per_person' && Number(participants) > 0) {
          const freeSet = new Set(free.map(id => String(id)));
          const freeZones = baseZones.filter(z => freeSet.has(String(z.zone_id)));
          const busyZones = baseZones.filter(z => busy.has(String(z.zone_id)));
          const totalFreeCapacity = freeZones.reduce((sum, z) => sum + (Number(z.capacity) || 0), 0);

          if (Number(participants) > totalFreeCapacity && busyZones.length > 0) {
            const busyNames = busyZones.map(z => z.name).join(', ');
            const capacityText = totalFreeCapacity > 0
              ? `В свободных зонах сейчас помещается до ${totalFreeCapacity} чел.`
              : 'Свободных зон для этой услуги сейчас нет.';

            setPerPersonHint(
              `Количество участников (${participants}) превышает доступные места: другие зоны уже заняты (${busyNames}). ${capacityText}`
            );
          } else {
            setPerPersonHint(null);
          }
        } else {
          setPerPersonHint(null);
        }
      } catch (e) {
        console.warn('Не удалось получить свободные зоны', e);
        setAvailableZoneIds(null);
        setPerPersonHint(null);
      }
    })();
  }, [open, selectedZoneId, selectedService, selectedDate, timeFrom, timeTo, zonesWithSelected, zone, participants, mode, appointment]);

  

  // Форматирование цены
  const formatPrice = (price) => (price || price === 0) ? Number(price).toLocaleString('ru-RU') + ' тг' : '—';
  const selectedFormatPrice = formatPrice;
  const timeOptions = getTimeOptions();

  // Гарантируем, что время окончания минимум на 5 минут позже начала
  useEffect(() => {
    const fromM = timeToMinutes(timeFrom);
    const toM = timeToMinutes(timeTo);
    if (fromM == null || toM == null) return;
    const minTo = fromM + 5;
    if (toM < minTo) {
      const candidate = timeOptions.find(t => {
        const m = timeToMinutes(t);
        return m != null && m >= minTo;
      });
      if (candidate) setTimeTo(candidate);
    }
  }, [timeFrom, timeTo, timeOptions]);

  // Закрываем выпадающие списки при клике вне
  useEffect(() => {
    function handleClickOutside(e) {
      if (fromTimeRef.current && !fromTimeRef.current.contains(e.target)) {
        setShowTimeListFrom(false);
      }
      if (toTimeRef.current && !toTimeRef.current.contains(e.target)) {
        setShowTimeListTo(false);
      }
      if (dateWrapperRef.current && !dateWrapperRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
      if (colorWrapperRef.current && !colorWrapperRef.current.contains(e.target)) {
        setShowColorList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  if (!open) return null;
  const appointmentId = appointment && (appointment.id || appointment.appointment_id)
    ? (appointment.id || appointment.appointment_id)
    : null;
  // Расчет цены с учетом типа категории
  function calcServicePrice(service, participants) {
    if (!service) return 0;
    // Универсально: fallback к per_person если нет типа
    let pricingType = service.pricing_type;
    let max = service.max_participants;
    let extra = service.extra_person_price;
    // fallback если поля не пришли
    if (!pricingType && service.category_id && Array.isArray(categories)) {
      const cat = categories.find(c => c.category_id === service.category_id);
      if (cat) {
        pricingType = cat.pricing_type;
        max = cat.max_participants;
        extra = cat.extra_person_price;
      }
    }
    if (!pricingType) pricingType = 'per_person';
    max = Number(max) || 0;
    extra = Number(extra) || 0;
    if (pricingType === 'per_person') {
    //   return Number(service.price) * participants;
      return Number(service.price) * participants;
    }
    if (pricingType === 'package') {
      // Цена не меняется при изменении участников, если не превышен лимит
      if (!max || participants <= max) return Number(service.price);
      // Только если участников больше max — добавляем доплату
      return Number(service.price) + (participants - max) * extra;
    }
    return Number(service.price);
  }

  function getServiceMaxParticipants(service) {
    if (!service) return 0;
    let max = Number(service.max_participants) || 0;
    if (!max && service.category_id && Array.isArray(categories)) {
      const cat = categories.find(c => c.category_id === service.category_id);
      if (cat && cat.max_participants) {
        max = Number(cat.max_participants) || 0;
      }
    }
    return max;
  }

  const total = selectedService ? calcServicePrice(selectedService, Number(participants)) : 0;


  // Сумма по всем сеансам
  const totalSum = total * Number(quantity);

  // Скидка в сумме (тг), ограничена общей стоимостью всех сеансов
  const discountValue = Math.max(
    0,
    Math.min(Number(discount) || 0, totalSum),
  );

  // Предоплата: проценты или сумма, от общей суммы минус скидка
  const prepaidValue = prepaidType === 'percent'
    ? Math.round((totalSum - discountValue) * (Number(prepaid) || 0) / 100)
    : Math.max(0, Math.min(Number(prepaid) || 0, totalSum - discountValue));

  const finalPrice = customPrice !== '' ? Number(customPrice) : totalSum - discountValue;
  const toPay = finalPrice - prepaidValue;

  return (
  <div className="booking-dialog-backdrop" onClick={onClose}>
    <div className={`booking-dialog ${isDarkTheme ? 'dark-theme' : ''}`} onClick={e => e.stopPropagation()}>
        {/* Левая колонка: зона, дата, время, комментарий */}
        <div className="booking-dialog-col booking-dialog-col-left">
          <div className="booking-dialog-label">Зона</div>
          <select
            className="booking-dialog-input"
            value={selectedZoneId || ''}
            onChange={e => setSelectedZoneId(e.target.value)}
            disabled={zonesWithSelected.length === 0}
          >
            <option value="" disabled hidden>
              {!zoneValid ? 'Зона не выбрана или невалидна' : (zonesWithSelected.length === 0 ? 'Нет доступных зон' : 'Выберите зону')}
            </option>
            {zonesWithSelected.map(z => (
              <option key={z.zone_id} value={z.zone_id}>
                {/* {z.name} (до {z.capacity || '?'} чел) */}
                {z.name}
              </option>
            ))}
          </select>
          {/* Показываем объединённые зоны, если их больше одной */}
          {mergedZones.length > 1 && (
            <div style={{
            //   display: 'inline-block',
              marginTop: 8,
            //   marginBottom: 16,
              color: '#3b82f6',
              fontWeight: 500,
            //   background: '#eaf6ff',
            //   borderRadius: 8,
              paddingBottom: '15%',
            //   boxShadow: '0 1px 4px #0001',
              maxWidth: 200,
              height: 32,
            //   lineHeight: '20px',
            //   overflow: 'hidden',
            //   textOverflow: 'ellipsis',
            //   whiteSpace: 'nowrap',
            //   verticalAlign: 'middle',
            }}
            title={mergedZoneNames}
            >
              Объединены зоны: {mergedZoneNames}
            </div>
          )}

          <div className="booking-dialog-label" style={{ marginTop: 8 }}>Цвет записи</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{ position: 'relative', width: 220 }}>
              <div className={`booking-color-toggle booking-dialog-input`} onClick={() => setShowColorList(v => !v)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="booking-color-swatch" style={{ background: selectedColorValue }} />
                  <span>{selectedColorOption.label}</span>
                </div>
                <span style={{ fontSize: 18, lineHeight: 1 }}>▾</span>
              </div>
              {showColorList && (
                <div className="booking-color-list">
                  {COLOR_OPTIONS.map((opt) => (
                    <div
                      key={opt.key}
                      className={`booking-color-item ${opt.key === colorKey ? 'selected' : ''}`}
                      onClick={() => {
                        setColorKey(opt.key);
                        setShowColorList(false);
                      }}
                    >
                      <div className="booking-color-swatch" style={{ background: opt.value }} />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="booking-dialog-label">Дата</div>
          <div className="booking-dialog-date-wrapper" ref={dateWrapperRef}>
            <input
              className="booking-dialog-input booking-dialog-input-date"
            //   style={{width:'100%'}}
              value={selectedDate}
              readOnly
              onClick={() => {
                setShowCalendar(prev => {
                  const next = !prev;
                  if (next) {
                    // При открытии календаря устанавливаем месяц просмотра по выбранной дате
                    const parts = (selectedDate || '').split('.');
                    if (parts.length === 3) {
                      const d = Number(parts[0]);
                      const m = Number(parts[1]);
                      const y = Number(parts[2]);
                      const parsed = new Date(y, m - 1, d || 1);
                      if (!Number.isNaN(parsed.getTime())) {
                        setCalendarViewDate(parsed);
                      } else {
                        setCalendarViewDate(new Date());
                      }
                    } else {
                      setCalendarViewDate(new Date());
                    }
                  }
                  return next;
                });
              }}
            />
            {showCalendar && (
              <div className="booking-dialog-calendar">
                {(() => {
                  const selectedParsed = (() => {
                    const parts = (selectedDate || '').split('.');
                    if (parts.length === 3) {
                      const d = Number(parts[0]);
                      const m = Number(parts[1]);
                      const y = Number(parts[2]);
                      const dt = new Date(y, m - 1, d || 1);
                      return Number.isNaN(dt.getTime()) ? null : dt;
                    }
                    return null;
                  })();

                  const base = calendarViewDate || selectedParsed || new Date();
                  const year = base.getFullYear();
                  const month = base.getMonth();
                  const today = new Date();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const firstDay = new Date(year, month, 1).getDay();
                  const weekDays = ['пн','вт','ср','чт','пт','сб','вс'];
                  function changeMonth(delta) {
                    const newDate = new Date(year, month + delta, 1);
                    setCalendarViewDate(newDate);
                  }
                  return (
                    <>
                      <div className="booking-dialog-calendar-header">
                        <button
                          type="button"
                          className="booking-dialog-calendar-nav-btn"
                          onClick={e=>{e.stopPropagation();changeMonth(-1);}}
                        >‹</button>
                        <span className="booking-dialog-calendar-title">
                          {base.toLocaleString('ru-RU',{month:'long',year:'numeric'})}
                        </span>
                        <button
                          type="button"
                          className="booking-dialog-calendar-nav-btn"
                          onClick={e=>{e.stopPropagation();changeMonth(1);}}
                        >›</button>
                      </div>
                      <div className="booking-dialog-calendar-weekdays">
                        {weekDays.map(w=>(
                          <div key={w}>{w}</div>
                        ))}
                      </div>
                      <div className="booking-dialog-calendar-grid">
                        {Array((firstDay+6)%7).fill(0).map((_,i)=>(
                          <div key={'empty'+i}></div>
                        ))}
                        {Array(daysInMonth).fill(0).map((_,i)=>{
                          const day = i+1;
                          const isSelected = !!selectedParsed &&
                            day === selectedParsed.getDate() &&
                            month === selectedParsed.getMonth() &&
                            year === selectedParsed.getFullYear();
                          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                          
                          // Проверка лицензии для user/vip-user
                          let userRole = 'user';
                          try {
                            const stored = localStorage.getItem('user');
                            if (stored) userRole = JSON.parse(stored).role || 'user';
                          } catch {}
                          const isRestrictedRole = userRole === 'user' || userRole === 'vip-user';
                          const branchValidUntil = branchData?.valid_until;
                          const cellDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                          const isDateBlocked = isRestrictedRole && branchValidUntil && cellDateStr > branchValidUntil;
                          
                          // Debug: показываем блокировку для первых пар дат
                          // if (day <= 2) {
                          //   console.log(`BookingDialog calendar day ${day}: role=${userRole}, validUntil=${branchValidUntil}, cellDate=${cellDateStr}, blocked=${isDateBlocked}`);
                          // }
                          
                          const dayClass = [
                            'booking-dialog-calendar-day',
                            isSelected ? 'booking-dialog-calendar-day-selected' : '',
                            isToday ? 'booking-dialog-calendar-day-today' : '',
                            isDateBlocked ? 'booking-dialog-calendar-day-blocked' : '',
                          ].filter(Boolean).join(' ');
                          return (
                            <div
                              key={day}
                              className={dayClass}
                              style={{
                                opacity: isDateBlocked ? 0.3 : 1,
                                cursor: isDateBlocked ? 'not-allowed' : 'pointer',
                              }}
                              onClick={e=>{
                                if (isDateBlocked) return;
                                e.stopPropagation();
                                const newDate = new Date(year, month, day);
                                setSelectedDate(`${String(day).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`);
                                setCalendarViewDate(newDate);
                                setShowCalendar(false);
                              }}
                            >
                              {day}
                              <div className="booking-dialog-calendar-day-dot" />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          {!zoneValid && (
            <div style={{color:'#e74c3c',margin:'12px 0'}}>Зона не выбрана или невалидна. Выберите корректную зону.</div>
          )}

          <div className="booking-dialog-label" style={{marginBottom: 4}}>Время и Длительность записи</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {/* Время начала */}
            <div className="booking-dialog-time-input-wrapper" ref={fromTimeRef}>
              <input
                type="text"
                className="booking-dialog-input booking-dialog-time-input"
                style={{width:'100%',cursor:'pointer'}}
                value={timeFrom}
                onClick={()=>setShowTimeListFrom(v => !v)}
                readOnly
              />
              {!!timeFrom && (
                <button
                  type="button"
                  className="booking-dialog-time-clear"
                  onClick={()=>{setTimeFrom('');setShowTimeListFrom(false);} }
                >×</button>
              )}
              {showTimeListFrom && (
                <div
                  id="booking-time-from-list"
                  className="booking-dialog-time-list"
                >
                  {timeOptions.map(t=>{
                    const selected = t === timeFrom;
                    return (
                      <div
                        key={t}
                        className={
                          'booking-dialog-time-option' +
                          (selected ? ' booking-dialog-time-option-selected' : '')
                        }
                        onClick={()=>{
                          setTimeFrom(t);
                          setShowTimeListFrom(false);
                          const fromM = timeToMinutes(t);

                          // Если уже выбрана услуга, ориентируем «до» на её длительность * количество
                          if (selectedService && selectedService.duration && fromM != null) {
                            const unit = Number(selectedService.duration) || 0;
                            const qtyNum = Number(quantity) || 1;
                            if (unit > 0) {
                              const totalMinutes = fromM + unit * qtyNum;
                              const capped = Math.min(totalMinutes, 24 * 60);
                              const d = new Date(2000, 0, 1, 0, 0);
                              d.setMinutes(capped);
                              const hh = String(d.getHours()).padStart(2, '0');
                              const mm = String(d.getMinutes()).padStart(2, '0');
                              setTimeTo(`${hh}:${mm}`);
                            }
                          } else if (mode === 'create' && !selectedService) {
                            // В режиме создания и без выбранной услуги по умолчанию ставим конец на 1 час позже начала (но не позже 24:00)
                            if (fromM != null) {
                              const maxMinutes = 24 * 60;
                              const endM = Math.min(fromM + 60, maxMinutes);
                              const d = new Date(2000, 0, 1, 0, 0);
                              d.setMinutes(endM);
                              const hh = String(d.getHours()).padStart(2, '0');
                              const mm = String(d.getMinutes()).padStart(2, '0');
                              setTimeTo(`${hh}:${mm}`);
                            }
                          }
                        }}
                      >
                        <span>{t}</span>
                        {selected && <span className="booking-dialog-time-option-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Время окончания */}
            <div className="booking-dialog-time-input-wrapper" ref={toTimeRef}>
              <input
                type="text"
                className="booking-dialog-input booking-dialog-time-input"
                style={{width:'100%',cursor:'pointer'}}
                value={timeTo}
                onClick={()=>setShowTimeListTo(v => !v)}
                readOnly
              />
              {!!timeTo && (
                <button
                  type="button"
                  className="booking-dialog-time-clear"
                  onClick={()=>{setTimeTo('');setShowTimeListTo(false);} }
                >×</button>
              )}
              {showTimeListTo && (
                <div
                  id="booking-time-to-list"
                  className="booking-dialog-time-list"
                >
                  {timeOptions
                    .filter(t => {
                      const fromM = timeToMinutes(timeFrom);
                      const m = timeToMinutes(t);
                      if (fromM == null || m == null) return true;
                      return m >= fromM + 5;
                    })
                    .map(t=>{
                    const selected = t === timeTo;
                    return (
                      <div
                        key={t}
                        className={
                          'booking-dialog-time-option' +
                          (selected ? ' booking-dialog-time-option-selected' : '')
                        }
                        onClick={()=>{
                          setTimeTo(t);
                          setShowTimeListTo(false);

                          // При ручном выборе времени "до" синхронизируем количество сеансов с разницей между "от" и "до"
                          if (selectedService && selectedService.duration && timeFrom) {
                            const fromM = timeToMinutes(timeFrom);
                            const toM = timeToMinutes(t);
                            const unit = Number(selectedService.duration) || 0;
                            if (unit > 0 && fromM != null && toM != null && toM > fromM) {
                              const diff = toM - fromM;
                              let sessions = Math.round(diff / unit) || 1;
                              if (sessions < 1) sessions = 1;
                              if (sessions > 99) sessions = 99;
                              setQuantity(String(sessions));
                            }
                          }
                        }}
                      >
                        <span>{t}</span>
                        {selected && <span className="booking-dialog-time-option-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Длительность: шаг 5 минут, до 24 часов */}
          <div style={{marginBottom:1}}>
            {(() => {
              const fromM = timeToMinutes(timeFrom);
              const toM = timeToMinutes(timeTo);
              const diff = (fromM != null && toM != null && toM > fromM) ? (toM - fromM) : null;
              const maxDuration = 24 * 60; // 24 часа в минутах

              // Если время начала не выбрано — просто показываем заглушку
              if (fromM == null) {
                return (
                  <select
                    className="booking-dialog-input-duration"
                    style={{width:'100%'}}
                    value=""
                    disabled
                  >
                    <option value="">—</option>
                  </select>
                );
              }

              const options = [];
              for (let m = 5; m <= maxDuration; m += 5) {
                options.push(m);
              }

              const formatDuration = (mins) => {
                if (mins >= 60) {
                  const h = Math.floor(mins / 60);
                  const mm = mins % 60;
                  return h + ' ч' + (mm > 0 ? ' ' + mm + ' мин.' : '.');
                }
                return mins + ' мин.';
              };

              const currentValue = (diff && diff > 0 && diff <= maxDuration) ? String(diff) : '';

              return (
                <select
                  className="booking-dialog-input-duration"
                  style={{width:'100%'}}
                  value={currentValue}
                  onChange={e => {
                    const newDuration = Number(e.target.value);
                    if (!timeFrom || !newDuration || Number.isNaN(newDuration)) return;
                    const [h, m] = timeFrom.split(':').map(Number);
                    if (Number.isNaN(h) || Number.isNaN(m)) return;
                    const d = new Date(2000, 0, 1, h, m);
                    d.setMinutes(d.getMinutes() + newDuration);
                    const hh = String(d.getHours()).padStart(2, '0');
                    const mm = String(d.getMinutes()).padStart(2, '0');
                    setTimeTo(`${hh}:${mm}`);

                    // При смене длительности синхронизируем количество сеансов с новой разницей между "от" и "до"
                    if (selectedService && selectedService.duration) {
                      const unit = Number(selectedService.duration) || 0;
                      if (unit > 0) {
                        let sessions = Math.round(newDuration / unit) || 1;
                        if (sessions < 1) sessions = 1;
                        if (sessions > 99) sessions = 99;
                        setQuantity(String(sessions));
                      }
                    }
                  }}
                >
                  <option value="">—</option>
                  {options.map(mins => (
                    <option key={mins} value={mins}>{formatDuration(mins)}</option>
                  ))}
                </select>
              );
            })()}
          </div>

          <div className="booking-dialog-label">Комментарий</div>
          <textarea className="booking-dialog-input" style={{minHeight:60}} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Комментарий к записи"/>

          
        </div>

        {/* Центр: статус и услуги */}
        <div className="booking-dialog-col booking-dialog-col-center">
          {packageConflictError && (
            <div style={{
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 10,
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 14,
            }}>
              {packageConflictError}
            </div>
          )}
          {perPersonHint && !packageConflictError && (
            <div style={{
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 10,
              background: '#fffbeb',
              color: '#92400e',
              fontSize: 14,
              display: 'inline-block',
              maxWidth: 580,
            }}>
              {perPersonHint}
            </div>
          )}
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {STATUS_LIST.map(s => (
              <button
                key={s.key}
                className={`booking-status-btn ${status === s.key ? 'active' : ''}`}
                style={status === s.key ? { background: s.color, color: '#fff', fontWeight: 600 } : {}}
                onClick={() => setStatus(s.key)}
                aria-pressed={status === s.key}
              >
                {s.label}
              </button>
            ))}
          </div>
          {selectedService && (
            <div className="booking-dialog-selected-service-card">
              <div className="booking-dialog-selected-service-title">{selectedService.name}</div>
              <div className="booking-dialog-selected-service-price">{formatPrice(calcServicePrice(selectedService, Number(participants)) * Number(quantity))}</div>
              <div className="booking-dialog-selected-service-form">
                <div className="booking-dialog-selected-service-form-row">
                  <span>Сеанс кол-во:</span>
                  <div className="booking-dialog-number-control">
                    <button
                      type="button"
                      className="booking-dialog-number-btn"
                      onClick={() => {
                        const current = Number(quantity) || 1;
                        let newQty = Math.max(1, current - 1);
                        if (selectedService && selectedService.duration && timeFrom) {
                          const unit = Number(selectedService.duration) || 0;
                          const startM = timeToMinutes(timeFrom);
                          if (unit > 0 && startM != null) {
                            const totalMinutes = startM + unit * newQty;
                            const capped = Math.min(totalMinutes, 24 * 60);
                            const d = new Date(2000, 0, 1, 0, 0);
                            d.setMinutes(capped);
                            const hh = String(d.getHours()).padStart(2, '0');
                            const mm = String(d.getMinutes()).padStart(2, '0');
                            setTimeTo(`${hh}:${mm}`);
                          }
                        }
                        if (newQty < 1) newQty = 1;
                        if (newQty > 99) newQty = 99;
                        setQuantity(String(newQty));
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="booking-dialog-input booking-dialog-number-input"
                      value={quantity}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        let newQty = cleaned === '' ? 1 : Number(cleaned) || 1;
                        if (selectedService && selectedService.duration && timeFrom) {
                          const unit = Number(selectedService.duration) || 0;
                          const startM = timeToMinutes(timeFrom);
                          if (unit > 0 && startM != null) {
                            const totalMinutes = startM + unit * newQty;
                            const capped = Math.min(totalMinutes, 24 * 60);
                            const d = new Date(2000, 0, 1, 0, 0);
                            d.setMinutes(capped);
                            const hh = String(d.getHours()).padStart(2, '0');
                            const mm = String(d.getMinutes()).padStart(2, '0');
                            setTimeTo(`${hh}:${mm}`);
                          }
                        }
                        if (newQty < 1) newQty = 1;
                        if (newQty > 99) newQty = 99;
                        setQuantity(String(newQty));
                      }}
                    />
                    <button
                      type="button"
                      className="booking-dialog-number-btn"
                      onClick={() => {
                        const current = Number(quantity) || 1;
                        let newQty = current + 1;
                        if (selectedService && selectedService.duration && timeFrom) {
                          const unit = Number(selectedService.duration) || 0;
                          const startM = timeToMinutes(timeFrom);
                          if (unit > 0 && startM != null) {
                            const totalMinutes = startM + unit * newQty;
                            const capped = Math.min(totalMinutes, 24 * 60);
                            const d = new Date(2000, 0, 1, 0, 0);
                            d.setMinutes(capped);
                            const hh = String(d.getHours()).padStart(2, '0');
                            const mm = String(d.getMinutes()).padStart(2, '0');
                            setTimeTo(`${hh}:${mm}`);
                          }
                        }
                        if (newQty < 1) newQty = 1;
                        if (newQty > 99) newQty = 99;
                        setQuantity(String(newQty));
                      }}
                    >
                      +
                    </button>
                    {/* <button
                      type="button"
                      className="booking-dialog-number-btn"
                      onClick={() => {
                        const current = Number(quantity) || 1;
                        let newQty = current + 1;

                        if (selectedService && selectedService.duration && timeFrom) {
                          const unit = Number(selectedService.duration) || 0;
                          const startM = timeToMinutes(timeFrom);
                          if (unit > 0 && startM != null) {
                            const totalMinutes = startM + unit * newQty;
                            const capped = Math.min(totalMinutes, 24 * 60);
                            const d = new Date(2000, 0, 1, 0, 0);
                            d.setMinutes(capped);
                            const hh = String(d.getHours()).padStart(2, '0');
                            const mm = String(d.getMinutes()).padStart(2, '0');
                            setTimeTo(`${hh}:${mm}`);
                          }
                        }

                        if (newQty < 1) newQty = 1;
                        if (newQty > 99) newQty = 99;
                        setQuantity(String(newQty));
                      }}
                    >
                      +
                    </button> */}
                  </div>
                </div>

                <div className="booking-dialog-selected-service-form-row">
                  <span>Участники:</span>
                  <div className="booking-dialog-number-control">
                    <button
                      type="button"
                      className="booking-dialog-number-btn"
                      onClick={() => {
                        let valueNum = (Number(participants) || 1) - 1;

                        if (selectedService) {
                          const maxPerZone = getServiceMaxParticipants(selectedService);
                          if (maxPerZone > 0) {
                            const allowedIds = Array.isArray(selectedService.linked_zone_ids)
                              ? selectedService.linked_zone_ids
                              : [];
                            const allowedCount = allowedIds.length || 1;
                            const maxTotal = maxPerZone * allowedCount;
                            valueNum = Math.min(Math.max(1, valueNum), maxTotal || 1);
                          }
                        }

                        if (!valueNum || valueNum < 1) valueNum = 1;
                        setParticipants(valueNum);
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      className="booking-dialog-input booking-dialog-number-input"
                      value={participants}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        let valueNum = cleaned === '' ? '' : Number(cleaned) || 0;

                        if (selectedService) {
                          const maxPerZone = getServiceMaxParticipants(selectedService);
                          if (maxPerZone > 0) {
                            const allowedIds = Array.isArray(selectedService.linked_zone_ids)
                              ? selectedService.linked_zone_ids
                              : [];
                            const allowedCount = allowedIds.length || 1;
                            const maxTotal = maxPerZone * allowedCount;
                            if (typeof valueNum === 'number') {
                              valueNum = Math.min(Math.max(1, valueNum), maxTotal || 1);
                            }
                          }
                        }
                        setParticipants(valueNum);
                      }}
                    />
                    <button
                      type="button"
                      className="booking-dialog-number-btn"
                      onClick={() => {
                        let valueNum = (Number(participants) || 1) + 1;

                        if (selectedService) {
                          const maxPerZone = getServiceMaxParticipants(selectedService);
                          if (maxPerZone > 0) {
                            const allowedIds = Array.isArray(selectedService.linked_zone_ids)
                              ? selectedService.linked_zone_ids
                              : [];
                            const allowedCount = allowedIds.length || 1;
                            const maxTotal = maxPerZone * allowedCount;
                            valueNum = Math.min(Math.max(1, valueNum), maxTotal || 1);
                          }
                        }

                        if (!valueNum || valueNum < 1) valueNum = 1;
                        setParticipants(valueNum);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="booking-dialog-selected-service-form-row">
                  <span>Скидка:</span>
                  <input
                    type="number"
                    min={0}
                    className="booking-dialog-input"
                    style={{width:60}}
                    value={discount}
                    onChange={e => setDiscount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={`Сумма`}
                  />
                  <span style={{fontSize:15}}>тг</span>
                </div>

                <div className="booking-dialog-selected-service-form-row">
                  <span>Предоплата:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="booking-dialog-input"
                    style={{width:60}}
                    value={prepaid}
                    onChange={e => setPrepaid(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={prepaidType === 'percent' ? '%' : `Сумма`}
                  />
                  <select
                    className="booking-dialog-input"
                    style={{width:80}}
                    value={prepaidType}
                    onChange={e => setPrepaidType(e.target.value)}
                  >
                    <option value="amount">тг</option>
                    <option value="percent">%</option>
                  </select>
                </div>

                <div className="booking-dialog-selected-service-form-row">
                  <span>Итого:</span>
                  <input
                    type="number"
                    min={0}
                    className="booking-dialog-input"
                    style={{width:70}}
                    value={customPrice !== '' ? customPrice : finalPrice}
                    onChange={e => setCustomPrice(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={finalPrice}
                  />
                </div>

                <div className="booking-dialog-selected-service-form-row">
                  <span>Остаток:</span>
                  <span style={{fontWeight:600,fontSize:18,color:'#4cc9f3ff'}}>{formatPrice(toPay)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  className="booking-dialog-delete-service-btn"
                  onClick={() => {
                    setSelectedService(null);
                    setParticipants(1);
                    setQuantity(1);
                    setDiscount('');
                    setPrepaid('');
                    setPrepaidType('amount');
                    setCustomPrice('');
                    setPackageConflictError(null);
                    setPerPersonHint(null);
                  }}
                >
                  Удалить услугу
                </button>
                <span style={{ marginLeft: 16, fontWeight: 500 }}>Оплатить:</span>
                <button
                  style={{
                    background: selectedPayment === 'none' ? '#2563eb' : '#e5e7eb',
                    color: selectedPayment === 'none' ? '#fff' : '#222',
                    fontWeight: selectedPayment === 'none' ? 700 : 500,
                    borderRadius: 8,
                    padding: '8px 16px',
                    border: selectedPayment === 'none' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onClick={() => {
                    setSelectedPayment('none');
                  }}
                >Не оплачено</button>
                <button
                  style={{
                    background: selectedPayment === 'card' ? '#2563eb' : '#e5e7eb',
                    color: selectedPayment === 'card' ? '#fff' : '#222',
                    fontWeight: selectedPayment === 'card' ? 700 : 500,
                    borderRadius: 8,
                    padding: '8px 16px',
                    border: selectedPayment === 'card' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onClick={() => {
                    setSelectedPayment('card');
                  }}
                >Картой</button>
                <button
                  style={{
                    background: selectedPayment === 'cash' ? '#2563eb' : '#e5e7eb',
                    color: selectedPayment === 'cash' ? '#fff' : '#222',
                    fontWeight: selectedPayment === 'cash' ? 700 : 500,
                    borderRadius: 8,
                    padding: '8px 16px',
                    border: selectedPayment === 'cash' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onClick={() => {
                    setSelectedPayment('cash');
                  }}
                >Наличными</button>
              </div>
              {showPayDialog && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 8px 32px #0002', position: 'relative' }}>
                    <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 18 }}>Выберите способ оплаты</div>
                    <button style={{ width: '100%', marginBottom: 12, padding: '10px 0', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', fontWeight: 500, fontSize: 16, cursor: 'pointer' }} onClick={() => handlePayment('card')}>Картой</button>
                    <button style={{ width: '100%', marginBottom: 12, padding: '10px 0', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', fontWeight: 500, fontSize: 16, cursor: 'pointer' }} onClick={() => handlePayment('cash')}>Наличными</button>
                    <button style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }} onClick={() => setShowPayDialog(false)}>×</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Всегда показываем список услуг */}
          <div className="booking-dialog-services-list">
            {servicesLoading && (
              <div style={{color:'#aaa',fontSize:15,textAlign:'center',padding:'20px'}}>
                Загрузка услуг...
              </div>
            )}
            {!servicesLoading && services.length === 0 && <div style={{color:'#aaa',fontSize:15}}>Нет доступных услуг</div>}
            {!servicesLoading && services.map(service => {
              const isSelected = selectedService && selectedService.service_id === service.service_id;
              // Для невыбранных услуг с типом 'package' показываем цену для max_participants, а не для 1
              let previewCount = 1;
              if (service.pricing_type === 'package') {
                previewCount = Number(service.max_participants) || 1;
              }
              // Показываем длительность услуги в минутах и часах
              let durationText = '';
              if (service.duration) {
                const mins = Number(service.duration);
                if (mins >= 60) {
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  durationText = ` (${h} ч${m > 0 ? ' ' + m + ' мин' : ''})`;
                } else {
                  durationText = ` (${mins} мин)`;
                }
              }
              // Цена для выбранной услуги зависит от участников, для остальных — фиксирована
              let selectedServicePrice = '';
              let previewServicePrice = '';
              if (isSelected) {
                selectedServicePrice = formatPrice(calcServicePrice(service, Number(participants)));
              } else {
                previewServicePrice = formatPrice(calcServicePrice(service, previewCount));
              }
              const displayPrice = isSelected ? selectedServicePrice : previewServicePrice;
              return (
                <div
                  key={service.service_id}
                  className={'booking-dialog-service' + (isSelected ? ' selected' : '')}
                  onClick={() => {
                    setSelectedService(service);
                    setParticipants(1);
                    setQuantity(1);
                    setDiscount('');
                    setPrepaid('');
                    setPrepaidType('amount');
                    setCustomPrice('');
                    setPackageConflictError(null);
                    setPerPersonHint(null);
                    // После выбора услуги — выставить время окончания по duration
                    if (service.duration && timeFrom) {
                      const [h, m] = timeFrom.split(':').map(Number);
                      const d = new Date(2000, 0, 1, h, m);
                      const totalDuration = Number(service.duration) || 0;
                      d.setMinutes(d.getMinutes() + totalDuration);
                      const hh = String(d.getHours()).padStart(2, '0');
                      const mm = String(d.getMinutes()).padStart(2, '0');
                      setTimeTo(`${hh}:${mm}`);
                    }
                  }}
                  style={{marginBottom:8,cursor:'pointer'}}
                >
                  <div className="booking-dialog-service-title">{service.name}{durationText}</div>
                  <div className="booking-dialog-service-price">{displayPrice}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Правая колонка: клиент */}
        <div className="booking-dialog-col booking-dialog-col-right">
          <div className="booking-dialog-label">Имя</div>
          <input className="booking-dialog-input" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} placeholder="Имя клиента" />
          <div className="booking-dialog-label">Телефон</div>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <button
              type="button"
              className={`booking-country-button ${showCountryDropdown ? 'open' : ''}`}
              onClick={() => setShowCountryDropdown(v => !v)}
              tabIndex={-1}
              aria-expanded={showCountryDropdown}
            >
              <span className="booking-country-code">{COUNTRY_PHONE_CODES[selectedCountry] || '+7'}</span>
              <span className="booking-country-caret">▾</span>
            </button>
            <input
              ref={phoneInputRef}
              className="booking-dialog-input"
              style={{ borderRadius: '0 6px 6px 0', borderLeft: 'none', width: '100%' }}
              value={(() => {
                const code = COUNTRY_PHONE_CODES[selectedCountry]?.replace('+', '') || '7';
                let digits = client.phone;
                if (digits.startsWith(code)) {
                  digits = digits.slice(code.length);
                }
                // Форматируем цифры для отображения
                return formatPhoneNumber(digits, selectedCountry);
              })()}
              onChange={e => {
                // Удаляем все нецифровые символы
                let val = cleanPhoneNumber(e.target.value);
                // Ограничить длину по стране
                const maxLen = COUNTRY_PHONE_NATIONAL_DIGITS[selectedCountry] || 10;
                if (val.length > maxLen) val = val.slice(0, maxLen);
                const code = COUNTRY_PHONE_CODES[selectedCountry].replace('+', '');
                setClient({ ...client, phone: code + val });
              }}
              onPaste={e => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                const normalized = normalizePhoneForPaste(pastedText, selectedCountry);
                const code = COUNTRY_PHONE_CODES[selectedCountry].replace('+', '');
                setClient({ ...client, phone: code + normalized });
              }}
              placeholder={selectedCountry === 'KZ' ? '700 000-00-00' : (selectedCountry === 'RU' ? '900 000-00-00' : (selectedCountry === 'UA' ? '50 123-45-67' : ''))}
              inputMode="numeric"
            />
            {showCountryDropdown && (
              <div className="booking-country-dropdown">
                {COUNTRIES.map(c => (
                  <div
                    key={c.code}
                    className={`booking-country-item ${c.code === selectedCountry ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCountry(c.code);
                      setShowCountryDropdown(false);
                      // Перенести phone к новому коду
                      let val = client.phone;
                      // Удалить старый код, если был
                      const oldCode = COUNTRY_PHONE_CODES[selectedCountry]?.replace('+', '');
                      if (val.startsWith(oldCode)) val = val.slice(oldCode.length);
                      // Ограничить длину по стране
                      const maxLen = COUNTRY_PHONE_NATIONAL_DIGITS[c.code] || 10;
                      if (val.length > maxLen) val = val.slice(0, maxLen);
                      setClient({ ...client, phone: COUNTRY_PHONE_CODES[c.code].replace('+', '') + val });
                      // Фокус на поле ввода
                      setTimeout(() => { phoneInputRef.current?.focus(); }, 100);
                    }}
                  >
                    <span className="booking-country-code">{COUNTRY_PHONE_CODES[c.code]}</span>
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="booking-dialog-label">Email</div>
          <input className="booking-dialog-input" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} placeholder="Email" />
        </div>
        {/* </div> */}
        {/* Кнопки */}
        <button className="booking-dialog-close" onClick={onClose}>×</button>
        <div className="booking-dialog-actions">
          {mode === 'edit' && appointmentId && onDelete && (
            <button
              className="booking-dialog-submit"
              style={{ background: '#e74c3c', color: '#fff', width: '100%' }}
              onClick={() => {
                if (window.confirm('Удалить эту запись?')) {
                  onDelete({ appointmentId });
                }
              }}
            >
              Удалить
            </button>
          )}
          <button
            className="booking-dialog-submit"
            style={{ width: '100%' }}
            onClick={async () => {
              if (!selectedService) return;

              // Для услуг типа 'package' дополнительно проверяем, свободны ли все нужные зоны
              if (selectedService.pricing_type === 'package') {
                const selectedZoneObj = zonesWithSelected.find(z => String(z.zone_id) === String(selectedZoneId)) || zone;
                const currentBranchId = selectedZoneObj && selectedZoneObj.branch_id;
                const requiredZoneIds = (Array.isArray(selectedService.linked_zone_ids) && selectedService.linked_zone_ids.length > 0)
                  ? selectedService.linked_zone_ids
                  : mergedZones.map(z => z.zone_id).filter(Boolean);

                if (currentBranchId && requiredZoneIds.length > 0 && selectedDate && timeFrom && timeTo) {
                  try {
                    const res = await fetch(`${API_URL}/appointments/check`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        branch_id: currentBranchId,
                        zone_ids: requiredZoneIds,
                        date: selectedDate,
                        time_from: timeFrom,
                        time_to: timeTo,
                        appointment_id: appointmentId || null,
                      }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const conflicts = Array.isArray(data.conflicts) ? data.conflicts : [];
                      if (conflicts.length > 0) {
                        // Формируем список занятых зон
                        const busyZoneIds = new Set();
                        for (const row of conflicts) {
                          if (Array.isArray(row.zone_ids)) {
                            for (const zid of row.zone_ids) busyZoneIds.add(String(zid));
                          }
                        }
                        const busyZoneNames = zonesWithSelected
                          .filter(z => busyZoneIds.has(String(z.zone_id)))
                          .map(z => z.name)
                          .join(', ');

                        setPackageConflictError(
                          busyZoneNames
                            ? `Невозможно записать пакетную услугу: на это время уже заняты зоны: ${busyZoneNames}.`
                            : 'Невозможно записать пакетную услугу на это время: зоны уже заняты.'
                        );
                        return;
                      }
                    }
                  } catch (e) {
                    console.warn('Не удалось проверить занятость зон для package-услуги', e);
                  }
                }
              }

              setPackageConflictError(null);

              // Проверка клиента по номеру телефона
              if (client.phone) {
                try {
                  const res = await fetch(`${API_URL}/clients/check-phone`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: client.phone }),
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    if (data.exists && data.client) {
                      // Проверяем, отличаются ли имя или email
                      const nameChanged = client.name && data.client.name !== client.name;
                      const emailChanged = client.email && data.client.email !== client.email;
                      
                      if (nameChanged || emailChanged) {
                        // Показываем диалоговое окно подтверждения
                        setConflictingClient(data.client);
                        setPendingSubmitData({
                          zones: mergedZones,
                          date: selectedDate,
                          time: `${timeFrom}—${timeTo}`,
                          service: selectedService,
                          client,
                          prepaid: prepaidValue,
                          discount: discountValue,
                          participants: Number(participants),
                          quantity: Number(quantity),
                          comment,
                          status,
                          finalPrice: finalPrice,
                          appointmentId,
                          color: selectedColorValue,
                          is_paid: selectedPayment === 'card' || selectedPayment === 'cash' ? true : false,
                          payment_method:
                            selectedPayment === 'card'
                              ? 'card'
                              : selectedPayment === 'cash'
                              ? 'cash'
                              : null,
                          changes: mode === 'create' ? {
                            after: {
                              date: selectedDate,
                              color: selectedColorValue,
                              client: { ...client },
                              status,
                              comment,
                              is_paid: selectedPayment !== 'none',
                              prepaid: Number(prepaid) || 0,
                              time_to: timeTo,
                              discount: Number(discount) || 0,
                              quantity: Number(quantity) || 1,
                              zone_ids: mergedZones.map(z => z.zone_id),
                              branch_id: zone && zone.branch_id ? zone.branch_id : (zonesWithSelected[0]?.branch_id || null),
                              time_from: timeFrom,
                              service_id: selectedService.service_id,
                              final_price: customPrice !== '' ? Number(customPrice) : finalPrice * Number(quantity),
                              participants: Number(participants) || 1,
                              payment_method: selectedPayment === 'none' ? null : selectedPayment,
                            }
                          } : {}
                        });
                        setShowClientConflictDialog(true);
                        return;
                      }
                    }
                  }
                } catch (e) {
                  console.warn('Не удалось проверить клиента', e);
                }
              }

              // Формируем changes для истории
              let changes = {};
              if (mode === 'create') {
                changes = {
                  after: {
                    date: selectedDate,
                    color: selectedColorValue,
                    client: { ...client },
                    status,
                    comment,
                    is_paid: selectedPayment !== 'none',
                    prepaid: Number(prepaid) || 0,
                    time_to: timeTo,
                    discount: Number(discount) || 0,
                    quantity: Number(quantity) || 1,
                    zone_ids: mergedZones.map(z => z.zone_id),
                    branch_id: zone && zone.branch_id ? zone.branch_id : (zonesWithSelected[0]?.branch_id || null),
                    time_from: timeFrom,
                    service_id: selectedService.service_id,
                    final_price: customPrice !== '' ? Number(customPrice) : finalPrice * Number(quantity),
                    participants: Number(participants) || 1,
                    payment_method: selectedPayment === 'none' ? null : selectedPayment,
                  }
                };
              }
              try {
                const maybePromise = onSubmit({
                  zones: mergedZones,
                  date: selectedDate,
                  time: `${timeFrom}—${timeTo}`,
                  service: selectedService,
                  client,
                  prepaid: prepaidValue,
                  discount: discountValue,
                  participants: Number(participants),
                  quantity: Number(quantity),
                  comment,
                  status,
                  finalPrice: finalPrice,
                  appointmentId,
                  color: selectedColorValue,
                  is_paid: selectedPayment === 'card' || selectedPayment === 'cash' ? true : false,
                  payment_method:
                    selectedPayment === 'card'
                      ? 'card'
                      : selectedPayment === 'cash'
                      ? 'cash'
                      : null,
                  changes
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                  await maybePromise;
                }

                toast({
                  title: mode === 'edit' ? 'Запись обновлена' : 'Запись создана',
                  description: mode === 'edit' ? 'Изменения успешно сохранены' : 'Новая запись успешно создана',
                });
                
                // Уведомляем об обновлении записей для обновления точек на календаре
                window.dispatchEvent(new CustomEvent('appointmentUpdated'));
              } catch (e) {
                console.error('Ошибка при сохранении записи:', e);
                toast({
                  title: 'Ошибка',
                  description: e?.message || 'Не удалось сохранить запись',
                });
              }
            }}
            disabled={(() => {
              if (!selectedService) return true;
              
              // Проверка лицензии для user/vip-user
              let userRole = 'user';
              try {
                const stored = localStorage.getItem('user');
                if (stored) userRole = JSON.parse(stored).role || 'user';
              } catch {}
              
              const isRestrictedRole = userRole === 'user' || userRole === 'vip-user';
              if (!isRestrictedRole) return false;
              
              const branchValidUntil = branchData?.valid_until;
              if (!branchValidUntil) return false;
              
              const parts = (selectedDate || '').split('.');
              if (parts.length !== 3) return false;
              const [d, m, y] = parts.map(Number);
              const currentDateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              
              return currentDateStr > branchValidUntil;
            })()}
          >
            {mode === 'edit' ? 'Сохранить изменения' : 'Создать запись'}
          </button>
        </div>
      </div>
      {/* Диалоговое окно подтверждения изменения данных клиента */}
      {showClientConflictDialog && conflictingClient && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 420, maxWidth: 600, boxShadow: '0 8px 32px #0004', position: 'relative', zIndex: 100001 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <button
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 24,
                lineHeight: 1,
                cursor: 'pointer',
                color: '#9ca3af',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#9ca3af';
              }}
              onClick={() => {
                setShowClientConflictDialog(false);
                setConflictingClient(null);
                setPendingSubmitData(null);
              }}
              title="Закрыть"
            >
              ×
            </button>
            <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 18, color: '#1f2937', paddingRight: 32 }}>Клиент с таким номером уже существует</div>
            <div style={{ marginBottom: 24, color: '#4b5563', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 12 }}>В базе данных найден клиент с номером <strong>+{client.phone}</strong>:</p>
              <div style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}><strong>Текущие данные в базе:</strong></div>
                <div>Имя: <strong>{conflictingClient.name || 'Не указано'}</strong></div>
                <div>Email: <strong>{conflictingClient.email || 'Не указан'}</strong></div>
              </div>
              <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8 }}>
                <div style={{ marginBottom: 8 }}><strong>Новые данные:</strong></div>
                <div>Имя: <strong>{client.name || 'Не указано'}</strong></div>
                <div>Email: <strong>{client.email || 'Не указан'}</strong></div>
              </div>
            </div>
            <div style={{ marginBottom: 16, color: '#6b7280', fontSize: 14 }}>
              Хотите обновить данные клиента в базе?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 500, fontSize: 15, cursor: 'pointer', color: '#6b7280' }}
                onClick={() => {
                  setShowClientConflictDialog(false);
                  setConflictingClient(null);
                  setPendingSubmitData(null);
                }}
              >
                Отмена
              </button>
              <button
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#6b7280', fontWeight: 500, fontSize: 15, cursor: 'pointer', color: '#fff' }}
                onClick={async () => {
                  // Оставить старые данные, просто создать запись
                  setShowClientConflictDialog(false);
                  if (pendingSubmitData) {
                    onSubmit(pendingSubmitData);
                  }
                  setConflictingClient(null);
                  setPendingSubmitData(null);
                }}
              >
                Оставить старые данные
              </button>
              <button
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#2563eb', fontWeight: 500, fontSize: 15, cursor: 'pointer', color: '#fff' }}
                onClick={async () => {
                  // Обновить данные клиента
                  try {
                    const clientId = conflictingClient.client_id;
                    const updateRes = await fetch(`${API_URL}/clients/${clientId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: client.name,
                        phone: client.phone,
                        email: client.email,
                        additional_phone: conflictingClient.additional_phone || '',
                        gender: conflictingClient.gender || '',
                        birth_date: conflictingClient.birth_date || '',
                        comment: conflictingClient.comment || '',
                        agreed_to_mailing: conflictingClient.agreed_to_mailing || false,
                        agreed_to_personal_data: conflictingClient.agreed_to_personal_data || false,
                      }),
                    });
                    
                    if (updateRes.ok) {
                      console.log('Данные клиента успешно обновлены');
                      // Уведомляем родительский компонент об обновлении клиента
                      if (onClientUpdate) {
                        onClientUpdate();
                      }
                    }
                  } catch (e) {
                    console.warn('Не удалось обновить данные клиента', e);
                  }
                  
                  setShowClientConflictDialog(false);
                  if (pendingSubmitData) {
                    onSubmit(pendingSubmitData);
                  }
                  setConflictingClient(null);
                  setPendingSubmitData(null);
                }}
              >
                Обновить данные
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { Navigate, useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import "./Timetable.css";
import Sidebar from "../components/Sidebar";
import '../pages/Zones.css';
import BookingDialog from '../components/BookingDialog';
import { TIMEZONE_NAME, updateBranchTimezoneCache } from '../utils/timezone';
import { formatPhoneNumber } from '../utils/phoneFormatter';
import { toast } from '../hooks/use-toast';

/**
 * TIMEZONE FLOW:
 * 1. Загружаем timezone филиала из БД при монтировании компонента
 * 2. Сохраняем в localStorage через updateBranchTimezoneCache()
 * 3. TIMEZONE_NAME() возвращает актуальный timezone филиала из кеша
 * 
 * СОЗДАНИЕ/ИЗМЕНЕНИЕ ЗАПИСЕЙ:
 * - Frontend создает Date объекты локально (new Date(year, month, date, hour, minute))
 * - Это "наивное" календарное время без timezone (например, 14:00 = 14:00)
 * - toISO() форматирует в ISO без offset: "2026-02-01T14:00:00"
 * - Backend добавляет timezone offset филиала: "2026-02-01T14:00:00+05:00"
 * - PostgreSQL сохраняет с offset
 * 
 * ОТОБРАЖЕНИЕ ЗАПИСЕЙ:
 * - Backend возвращает ISO с offset: "2026-02-01T14:00:00+05:00"
 * - parseTimeToMinutes() и formatTimeRange() извлекают время НАПРЯМУЮ из строки через regex
 * - НЕ используем new Date() + Intl API для строк с offset - это вызывает двойную конверсию:
 *   * new Date("2026-02-01T14:00:00+05:00") → парсит как UTC (14:00 UTC+5 = 09:00 UTC)
 *   * Intl API в timezone Asia/Almaty → конвертирует обратно (09:00 UTC = 14:00 +05:00)
 *   * Результат: правильно, НО это лишняя работа и потенциальный источник ошибок
 * - ПРАВИЛЬНЫЙ ПОДХОД: regex извлекает часы/минуты напрямую: "...T14:00:00+05:00" → 14:00
 * - Результат: время отображается в timezone филиала, независимо от timezone браузера
 * 
 * ВАЖНО: 
 * - Не используем toLocaleString для создания Date объектов - двойная конверсия!
 * - Для ISO строк с offset используем regex, а не new Date() + Intl API
 */

// Declare API_URL once at the top
const API_URL = process.env.REACT_APP_API_URL;

// Высота одной строки (15 минут) в пикселях — используется и в сетке, и при ресайзе записей
// Для основных строк (:00 и :30) высота 30px, для скрытых (:15 и :45) - только текст
const ROW_HEIGHT = 30;

  // Вспомогательная функция форматирования минут в строку HH:MM
  function minutesToHHMM(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Универсальная функция для ISO-строки (простое форматирование без timezone конвертации)
  function toISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${mi}:${s}`;
  }

export default function Timetable() {
    // Popup state (создание новой записи по клику на слот)
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, slotIdx: null, zoneIdx: null });
  const popupRef = useRef();
  const bodyRef = useRef(null);

  // Hover‑карточка для существующей записи
  const [hoverCard, setHoverCard] = useState({ visible: false, x: 0, y: 0, appointment: null });
  const hoverRef = useRef();

  // Подсказка времени при наведении на пустой слот
  const [slotHover, setSlotHover] = useState({ visible: false, row: null, col: null, time: '' });
  // Зафиксированный по клику слот
  const [selectedSlot, setSelectedSlot] = useState({ row: null, col: null, time: '' });

  // Закрытие popup при клике вне его
  useEffect(() => {
    if (!popup.visible) return;
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup(p => ({ ...p, visible: false }));
        // Сбрасываем зафиксированный слот при клике вне popup
        setSelectedSlot({ row: null, col: null, time: '' });
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popup.visible]);

  // Закрытие hover‑карточки при клике вне
  useEffect(() => {
    if (!hoverCard.visible) return;
    function handleHoverClick(e) {
      if (hoverRef.current && !hoverRef.current.contains(e.target)) {
        setHoverCard(h => ({ ...h, visible: false }));
      }
    }
    document.addEventListener('mousedown', handleHoverClick);
    return () => document.removeEventListener('mousedown', handleHoverClick);
  }, [hoverCard.visible]);

  const navigate = useNavigate();

    useEffect(() => {
    document.title = 'Журнал записи';
    }, []);

  const token = localStorage.getItem("token");

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const { userId } = useParams();

  const [today, setToday] = useState("");

  // Текущее время для индикатора "сейчас" в журнале
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Обновляем раз в 30 секунд, чтобы линия текущего времени двигалась в реальном времени
    const id = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(id);
  }, []);

  const location = useLocation();

  // branch context — optional
  const [branchJournal, setBranchJournal] = useState([]);
  const [journalReloadKey, setJournalReloadKey] = useState(0);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [journalError, setJournalError] = useState(null);

  // Service filtering state
  const [branchServices, setBranchServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  // Derive selected service names for display tags
  const selectedServiceNames = useMemo(() => {
    if (!selectedServices || selectedServices.length === 0) return [];
    // branchServices items look like { service_id, name }
    return branchServices
      .filter(s => selectedServices.includes(s.service_id))
      .map(s => ({ id: s.service_id, name: s.name }));
  }, [branchServices, selectedServices]);

  const branchId = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get('branchId');
    } catch { return null; }
  }, [location.search]);

  // Закрытие dropdown фильтра услуг при клике вне
  useEffect(() => {
    if (!showFilterDropdown) return;
    function handleFilterClick(e) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleFilterClick);
    return () => document.removeEventListener('mousedown', handleFilterClick);
  }, [showFilterDropdown]);

  // проверяем, что branchId из URL / localStorage реально существует у пользователя
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Admin bypass: allow access to any branch without validation
      const userRole = storedUser?.role || 'user';
      if (userRole === 'admin') {
        // Admin can access any branch - skip validation
        if (branchId) {
          try { localStorage.setItem('selectedBranchId', String(branchId)); } catch {}
        }
        return;
      }
      
      // определяем userId
      let uid = userId;
      if (!uid) {
        try {
          if (storedUser && storedUser.id) uid = storedUser.id;
          else uid = localStorage.getItem('userId');
        } catch {}
      }
      if (!uid) return;

      const t = token;
      // use top-level API_URL
      const endpoints = [
        `${API_URL}/users/${uid}/branches`,
        `${API_URL}/branches?userId=${uid}`,
        `${API_URL}/branches?user_id=${uid}`,
      ];

      let branches = [];
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
          if (!res.ok) continue;
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.branches || data.rows || data);
          branches = list || [];
          break;
        } catch {
          // пробуем следующий вариант
        }
      }

      if (cancelled || !branches || branches.length === 0) return;

      const findById = (id) =>
        branches.find(b => String(b.branch_id || b.id || b.branchId) === String(id));

      // берем приоритетный branchId: сначала из URL, потом из localStorage
      let preferredId = branchId;
      let storedSelected = null;
      try {
        storedSelected = localStorage.getItem('selectedBranchId');
      } catch {}

      // 1) Если в URL есть branchId и он валиден — просто синхронизируем localStorage и выходим
      if (preferredId && findById(preferredId)) {
        try { localStorage.setItem('selectedBranchId', String(preferredId)); } catch {}
        return;
      }

      // 2) Если URL-параметр пустой или невалиден, но в localStorage есть валидный филиал — переходим к нему
      if (storedSelected && findById(storedSelected)) {
        const goodId = String(storedSelected);
        try { localStorage.setItem('selectedBranchId', goodId); } catch {}
        try {
          const params = new URLSearchParams(location.search || '');
          if (params.get('branchId') !== goodId) {
            params.set('branchId', goodId);
            navigate(`${location.pathname}?${params.toString()}`, { replace: true });
          }
        } catch {}
        return;
      }

      // 3) Иначе выбираем первый доступный филиал
      const first = branches[0];
      if (!first) return;
      const firstId = String(first.branch_id || first.id || first.branchId);

      try { localStorage.setItem('selectedBranchId', firstId); } catch {}

      try {
        const params = new URLSearchParams(location.search || '');
        if (params.get('branchId') === firstId) return;
        params.set('branchId', firstId);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [branchId, location.pathname, location.search, navigate, token, userId, storedUser]);

  // Определение selectedDate (должно быть ДО useEffect, который использует selectedDate)
  const [selectedDate, setSelectedDate] = useState(() => {
    // prefer ?date=YYYY-MM-DD query param or navigation state, otherwise today
    try {
      const params = new URLSearchParams(location.search);
      const s = params.get('date') || (location.state && location.state.date) || (typeof localStorage !== 'undefined' ? localStorage.getItem('selectedDate') : null) || null;
      if (s) {
        // parse yyyy-mm-dd as a local date (avoid new Date(string) which treats it as UTC)
        const parts = (s || '').split('-').map(p => Number(p));
        if (parts.length === 3) {
          const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
          parsed.setHours(0,0,0,0);
          return parsed;
        }
        const parsedFallback = new Date(s);
        parsedFallback.setHours(0,0,0,0);
        return parsedFallback;
      }
    } catch {}
    // Fallback на сегодня в timezone филиала
    const branchTimezone = TIMEZONE_NAME();
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: branchTimezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      const parts = formatter.formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year').value, 10);
      const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
      const day = parseInt(parts.find(p => p.type === 'day').value, 10);
      const d = new Date(year, month, day, 0, 0, 0, 0);
      return d;
    } catch {
      const d = new Date();
      d.setHours(0,0,0,0);
      return d;
    }
  });

  // Проверка доступа к филиалу для user/vip-user
  const [branchAccessDenied, setBranchAccessDenied] = useState(false);
  const [branchValidUntil, setBranchValidUntil] = useState(null);
  useEffect(() => {
    if (!branchId || !storedUser) return;
    
    const checkBranchAccess = async () => {
      try {
        const user = storedUser; // storedUser already parsed as object
        const userRole = user?.role || 'user';
        
        // Проверка только для user и vip-user
        if (userRole !== 'user' && userRole !== 'vip-user') {
          setBranchAccessDenied(false);
          setBranchValidUntil(null);
          return;
        }
        
        if (!user?.id) return; // Exit if user id is not available
        
        const response = await fetch(`${API_URL}/branches?userId=${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (response.ok) {
          const data = await response.json();
          const branch = data.branches?.find(b => String(b.branch_id) === String(branchId));
          
          if (branch && branch.valid_until) {
            setBranchValidUntil(branch.valid_until);
            // Проверяем только если selectedDate установлена
            if (selectedDate) {
              const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
              if (selectedDateStr > branch.valid_until) {
                setBranchAccessDenied(true);
              } else {
                setBranchAccessDenied(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking branch access:', err);
      }
    };
    
    checkBranchAccess();
  }, [branchId, storedUser, token, selectedDate]);

  // persist selected date to localStorage so other components (Sidebar) can read it
  useEffect(() => {
    try {
      if (selectedDate) {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const isoLocal = `${y}-${m}-${d}`;
        localStorage.setItem('selectedDate', isoLocal);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [selectedDate]);

  // Load services for current branch
  useEffect(() => {
    if (!branchId) {
      setBranchServices([]);
      setSelectedServices([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const url = `${API_URL}/all-services?branchId=${encodeURIComponent(branchId)}`;
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error('Failed to load services');
        const data = await res.json();
        if (!mounted) return;
        setBranchServices(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading services:', err);
        setBranchServices([]);
      }
    })();

    return () => { mounted = false; };
  }, [branchId, token]);

  useEffect(() => {
    // Используем selectedDate или fallback на сегодня в timezone филиала
    const date = selectedDate || (() => {
      const branchTimezone = TIMEZONE_NAME();
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: branchTimezone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        });
        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year').value, 10);
        const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
        const day = parseInt(parts.find(p => p.type === 'day').value, 10);
        return new Date(year, month, day, 0, 0, 0, 0);
      } catch {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      }
    })();
    const dayMonth = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: TIMEZONE_NAME() });
    const weekday = date.toLocaleDateString("ru-RU", { weekday: "long", timeZone: TIMEZONE_NAME() });
    setToday(`${dayMonth}, ${weekday}`);
  }, [selectedDate]);

  // also update selectedDate if the url ?date= changes (e.g. navigation)
  useEffect(() => {
    // parse date out of the url search parameters and update local selection if needed
    // include selectedDate in deps so we only set state when the value truly differs
    try {
      const params = new URLSearchParams(location.search);
      const s = params.get('date');
      if (s) {
        const parts = (s || '').split('-').map(p => Number(p));
        let parsed;
        if (parts.length === 3) {
          parsed = new Date(parts[0], parts[1] - 1, parts[2]);
          parsed.setHours(0,0,0,0);
        } else {
          parsed = new Date(s);
          parsed.setHours(0,0,0,0);
        }
        // only update if different
        if (!selectedDate || parsed.getTime() !== selectedDate.getTime()) {
          setSelectedDate(parsed);
        }
      }
    } catch {}
  }, [location.search, selectedDate]);

  // fetch branch appointments when branchId, selected date or reload key changes
  useEffect(() => {
    if (!branchId) return;
    let mounted = true;
    setLoadingJournal(true);
    setJournalError(null);

    (async () => {
      try {
        // use top-level API_URL
        const d = selectedDate || (() => {
          const branchTimezone = TIMEZONE_NAME();
          try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: branchTimezone,
              year: 'numeric',
              month: 'numeric',
              day: 'numeric'
            });
            const parts = formatter.formatToParts(now);
            const year = parseInt(parts.find(p => p.type === 'year').value, 10);
            const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
            const day = parseInt(parts.find(p => p.type === 'day').value, 10);
            return new Date(year, month, day, 0, 0, 0, 0);
          } catch {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
          }
        })();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateParam = `${y}-${m}-${day}`;

        let url = `${API_URL}/branches/${encodeURIComponent(branchId)}/appointments?date=${encodeURIComponent(dateParam)}`;
        
        // Add service_ids filter if any services are selected
        if (selectedServices.length > 0) {
          const serviceParams = selectedServices.map(id => `service_ids[]=${encodeURIComponent(id)}`).join('&');
          url += `&${serviceParams}`;
          // console.log('Fetching appointments with service filter:', { selectedServices, url });
        } else {
          // console.log('Fetching all appointments (no filter):', { url });
        }

        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          const text = await res.text();

          // Если сервер вернул 404 по филиалу, считаем, что филиал удалён.
          // Сбрасываем branchId из URL и localStorage, а выбор нового филиала
          // выполнит верхний эффект, который проверяет список филиалов.
          if (res.status === 404) {
            try { localStorage.removeItem('selectedBranchId'); } catch {}
            try {
              const params = new URLSearchParams(location.search || '');
              params.delete('branchId');
              const qs = params.toString();
              navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
            } catch {}
            return;
          }

          throw new Error(`Ошибка при загрузке: ${res.status} ${res.statusText} ${text ? '- ' + text.slice(0,200) : ''}`);
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        let data;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error('Сервер вернул неожиданный ответ (не JSON). Ответ начинается с: ' + text.slice(0,200));
        }

        if (!mounted) return;
        setBranchJournal(data.appointments || []);
      } catch (err) {
        if (!mounted) return;
        setJournalError(err.message || 'Ошибка при загрузке журнала');
      } finally {
        if (!mounted) return;
        setLoadingJournal(false);
      }
    })();

    return () => { mounted = false; };
  }, [branchId, token, selectedDate, journalReloadKey, navigate, location.pathname, location.search, selectedServices]);

  // fetch branch details (schedule) and zones for the header
  const [branchSchedule, setBranchSchedule] = useState(null);
  const [zonesList, setZonesList] = useState([]);
  useEffect(() => {
    if (!branchId) return;
    let mounted = true;
    (async () => {
      try {
        // use top-level API_URL
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // branch details
        try {
          const br = await fetch(`${API_URL}/branches/${encodeURIComponent(branchId)}`, { headers });
          if (br.ok) {
            const brData = await br.json();
            const branch = brData.branch || brData;
            if (mounted) {
              setBranchSchedule(branch?.schedule || null);
              // Сохраняем timezone филиала в кеш
              if (branch?.timezone) {
                updateBranchTimezoneCache(branchId, branch.timezone);
              }
            }
          }
        } catch (e) {
          // ignore branch detail errors for now
        }

        // zones for this branch
        try {
          const zres = await fetch(`${API_URL}/zones?branchId=${encodeURIComponent(branchId)}`, { headers });
          if (zres.ok) {
            const zdata = await zres.json();
            if (mounted) setZonesList(Array.isArray(zdata) ? zdata : (zdata.value || []));
          }
        } catch (e) {
          // ignore zones errors
        }
      } finally {
        if (!mounted) return;
      }
    })();
    return () => { mounted = false; };
  }, [branchId, token]);

  const [user, setUser] = useState(storedUser || null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  const [calendarDate, setCalendarDate] = useState(() => {
    // Начальная дата календаря в timezone филиала
    const branchTimezone = TIMEZONE_NAME();
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: branchTimezone,
        year: 'numeric',
        month: 'numeric'
      });
      const parts = formatter.formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year').value, 10);
      const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
      return new Date(year, month, 1);
    } catch {
      return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    }
  });

  // Drag & drop существующих записей по сетке расписания
  const [draggingAppointment, setDraggingAppointment] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState({ row: null, col: null });
  const dragMovedRef = useRef(false);
  const dragOriginRef = useRef(null);
  const [dragOriginHighlight, setDragOriginHighlight] = useState(null);
  // Растягивание/сжатие записи за нижний край
  const [resizing, setResizing] = useState(null);
  // Растягивание/сжатие записи по зонам (горизонтально)
  const [zoneResizing, setZoneResizing] = useState(null);
  const resizeClickRef = useRef(false);

  // fetch user
  useEffect(() => {
    if (!userId && !token) return;

    async function fetchUser() {
      setLoadingUser(true);
      setUserError(null);



      try {
        let res;
        // if (userId) res = await fetch(`${API_URL}/users/${userId}`, { headers });
        // else res = await fetch(`${API_URL}/auth/me`, { headers });

        // if (!res.ok) {
        //   if (userId) {
        //     const alt = await fetch(`${API_URL}/auth/me`, { headers });
        //     if (!alt.ok) throw new Error("Не удалось загрузить пользователя с сервера");
        //     const altData = await alt.json();
        //     const altUser = altData.user || altData;
        //     setUser(altUser);
        //     try { localStorage.setItem("user", JSON.stringify(altUser)); } catch {}
        //     return;
        //   }
        //   throw new Error("Не удалось загрузить пользователя с сервера");
        // }

        const data = await res.json();
        const fetched = data.user || data;
        if (fetched) {
          setUser(fetched);
          try { localStorage.setItem("user", JSON.stringify(fetched)); } catch {}
        }
      } catch (err) {
        setUserError(err.message || "Ошибка при загрузке пользователя");
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUser();
  }, [userId, token]);

  const userName = user?.name || "Пользователь";
  const userEmail = user?.email || "email@example.com";
  const userRole = user?.role || "user";

  const [bookingDialog, setBookingDialog] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    zone: null,
    date: '',
    time: '',
    appointment: null,
  });

  // Авто-скрытие подсветки исходной позиции записи после переноса
  useEffect(() => {
    if (!dragOriginHighlight) return;
    const t = setTimeout(() => setDragOriginHighlight(null), 1200);
    return () => clearTimeout(t);
  }, [dragOriginHighlight]);

  // Обработка drag-ресайза записи за нижний край (изменение длительности)
  useEffect(() => {
    if (!resizing) return;

    function handleMouseMove(e) {
      setResizing(prev => {
        if (!prev) return null;
        const deltaY = e.clientY - prev.startClientY;
        const deltaSlots = Math.round(deltaY / ROW_HEIGHT);
        const stepMinutes = 15;
        const maxMinutes = 24 * 60;
        let newEndM = prev.originalEndMinutes + deltaSlots * stepMinutes;

        if (newEndM < prev.startMinutes + stepMinutes) {
          newEndM = prev.startMinutes + stepMinutes;
        }
        if (newEndM > maxMinutes) newEndM = maxMinutes;
        if (newEndM === prev.endMinutes) return prev;
        return { ...prev, endMinutes: newEndM };
      });
    }

    function handleMouseUp() {
      const current = resizing;
      setResizing(null);
      if (!current) return;

      const { appointmentId, appt, zoneIds, startMinutes, originalEndMinutes, endMinutes } = current;
      if (!appointmentId || !branchId) return;
      if (endMinutes == null || endMinutes === originalEndMinutes) return;


      // Проверка валидности времени
      if (startMinutes == null || endMinutes == null) return;

      // const ok = window.confirm(`Изменить время записи на ${minutesToHHMM(startMinutes)}–${minutesToHHMM(endMinutes)}?`);
      // if (!ok) return;


      const dateObj = selectedDate || (() => {
        const branchTimezone = TIMEZONE_NAME();
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: branchTimezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          });
          const parts = formatter.formatToParts(now);
          const year = parseInt(parts.find(p => p.type === 'year').value, 10);
          const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
          const day = parseInt(parts.find(p => p.type === 'day').value, 10);
          return new Date(year, month, day, 0, 0, 0, 0);
        } catch {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return today;
        }
      })();
      const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      startDate.setMinutes(startMinutes);
      const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      endDate.setMinutes(endMinutes);
      // Форматируем время для подтверждения
      const formatTime = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const ok = window.confirm(`Изменить время записи на ${formatTime(startDate)}–${formatTime(endDate)}?`);
      if (!ok) return;
      // Формируем ISO-строки
      const newStartISO = toISO(startDate);
      const newEndISO = toISO(endDate);


      const serviceId =
        appt.service_id
        || (appt.service && appt.service.service_id)
        || (appt.extra
          && Array.isArray(appt.extra.services)
          && appt.extra.services.length > 0
          && appt.extra.services[0].service_id)
        || null;

      if (!serviceId) {
        toast({ title: 'Ошибка', description: 'Не удалось изменить длительность: не указана услуга', variant: 'destructive' });
        return;
      }

      const participantsVal =
        appt.participants_count
        || (appt.extra && appt.extra.participants)
        || 1;

      const quantityVal =
        (appt.quantity != null ? Number(appt.quantity) : NaN);
      const extraQuantity =
        appt.extra && appt.extra.quantity != null
          ? Number(appt.extra.quantity)
          : NaN;
      const qty = !Number.isNaN(quantityVal)
        ? Math.max(1, quantityVal)
        : (!Number.isNaN(extraQuantity) ? Math.max(1, extraQuantity) : 1);

      const finalPriceVal =
        (appt.price != null ? Number(appt.price) : NaN);
      const extraFullPrice =
        appt.extra && appt.extra.full_price != null
          ? Number(appt.extra.full_price)
          : NaN;
      const finalPrice = !Number.isNaN(finalPriceVal)
        ? finalPriceVal
        : (!Number.isNaN(extraFullPrice) ? extraFullPrice : 0);

      const prepaidVal =
        (appt.prepayment != null ? Number(appt.prepayment) : NaN);
      const extraPrepaid =
        appt.extra && appt.extra.prepaid != null
          ? Number(appt.extra.prepaid)
          : NaN;
      const prepaid = !Number.isNaN(prepaidVal)
        ? prepaidVal
        : (!Number.isNaN(extraPrepaid) ? extraPrepaid : 0);

      const discountVal =
        (appt.discount != null ? Number(appt.discount) : NaN);
      const extraDiscount =
        appt.extra && appt.extra.discount != null
          ? Number(appt.extra.discount)
          : NaN;
      const discount = !Number.isNaN(discountVal)
        ? discountVal
        : (!Number.isNaN(extraDiscount) ? extraDiscount : 0);

      const comment = appt.comment || (appt.extra && appt.extra.comment) || null;
      const status = appt.status || (appt.extra && appt.extra.status) || 'waiting';

      // Новый формат для backend: start_time, end_time (ISO)
      const body = {
        branch_id: Number(branchId),
        zone_ids: zoneIds && zoneIds.length > 0 ? zoneIds : [],
        start_time: toISO(startDate),
        end_time: toISO(endDate),
        service_id: serviceId,
        participants: participantsVal,
        quantity: qty,
        final_price: finalPrice,
        prepaid,
        discount,
        comment,
        status,
        is_paid: typeof appt.is_paid === 'boolean' ? appt.is_paid : false,
        payment_method: appt.payment_method || null,
      };

      // Оптимистично обновляем только время окончания записи
      setBranchJournal(prev =>
        Array.isArray(prev)
          ? prev.map(item => {
              const itemId = item && (item.id || item.appointment_id);
              if (!itemId || String(itemId) !== String(appointmentId)) return item;
              return {
                ...item,
                end_time: newEndISO,
              };
            })
          : prev
      );

 
      // use API_URL for all API requests

      (async () => {
        try {
          const res = await fetch(`${API_URL}/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error('Update appointment (resize) error:', text);
            toast({ title: 'Ошибка', description: 'Ошибка при изменении длительности записи', variant: 'destructive' });
            return;
          }

          toast({ title: 'Успешно', description: 'Длительность записи изменена' });
          setJournalReloadKey(k => k + 1);
        } catch (err) {
          console.error('Update appointment (resize) exception:', err);
          toast({ title: 'Ошибка', description: 'Не удалось изменить длительность записи', variant: 'destructive' });
        }
      })();
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, branchId, selectedDate, setBranchJournal, setJournalReloadKey]);

  // Обработка drag-ресайза записи по горизонтали (объединение/сжатие зон)
  useEffect(() => {
    if (!zoneResizing) return;

    function handleMouseMove(e) {
      setZoneResizing(prev => {
        if (!prev) return null;
        const { side, startClientX, originalColStart, originalColEnd, colWidth, totalCols } = prev;
        if (!colWidth || !totalCols) return prev;
        const deltaX = e.clientX - startClientX;
        const deltaCols = Math.round(deltaX / colWidth);

        let newColStart = originalColStart;
        let newColEnd = originalColEnd;

        if (side === 'right') {
          newColEnd = originalColEnd + deltaCols;
          if (newColEnd < originalColStart) newColEnd = originalColStart;
          if (newColEnd > totalCols - 1) newColEnd = totalCols - 1;
        } else {
          newColStart = originalColStart + deltaCols;
          if (newColStart > originalColEnd) newColStart = originalColEnd;
          if (newColStart < 0) newColStart = 0;
        }

        if (newColStart === prev.colStart && newColEnd === prev.colEnd) return prev;
        return { ...prev, colStart: newColStart, colEnd: newColEnd };
      });
    }

    function handleMouseUp() {
      const current = zoneResizing;
      setZoneResizing(null);
      if (!current) return;

      const {
        appointmentId,
        appt,
        originalZoneIds,
        originalColStart,
        originalColEnd,
        colStart,
        colEnd,
        startMinutes,
        endMinutes,
      } = current;

      if (!appointmentId || !branchId) return;
      if (colStart === originalColStart && colEnd === originalColEnd) return;
      if (!Array.isArray(zonesList) || zonesList.length === 0) return;

      const safeStart = Math.max(0, Math.min(colStart, zonesList.length - 1));
      const safeEnd = Math.max(safeStart, Math.min(colEnd, zonesList.length - 1));
      const newZonesSlice = zonesList.slice(safeStart, safeEnd + 1);
      const newZoneIds = newZonesSlice.map(z => z.zone_id || z.id).filter(Boolean);
      if (newZoneIds.length === 0) return;

      const baseOriginalZoneIds = (Array.isArray(originalZoneIds) && originalZoneIds.length > 0)
        ? originalZoneIds
        : (aptt => {
            if (aptt.zone_ids && Array.isArray(aptt.zone_ids) && aptt.zone_ids.length > 0) return aptt.zone_ids;
            if (aptt.zone_id) return [aptt.zone_id];
            return [];
          })(appt);

      if (
        Array.isArray(baseOriginalZoneIds)
        && baseOriginalZoneIds.length === newZoneIds.length
        && baseOriginalZoneIds.every((id, i) => String(id) === String(newZoneIds[i]))
      ) {
        return;
      }

      const zoneNames = newZonesSlice.map(z => z.name).filter(Boolean).join(' + ');
      const zoneConfirmText = zoneNames
        ? `Изменить зоны записи на: ${zoneNames}?`
        : 'Изменить зоны записи?';
      const zoneOk = window.confirm(zoneConfirmText);
      if (!zoneOk) return;

      // const dateObj = selectedDate || new Date();


      const serviceId =
        appt.service_id
        || (appt.service && appt.service.service_id)
        || (appt.extra
          && Array.isArray(appt.extra.services)
          && appt.extra.services.length > 0
          && appt.extra.services[0].service_id)
        || null;

      if (!serviceId) {
        toast({ title: 'Ошибка', description: 'Не удалось изменить зоны: не указана услуга', variant: 'destructive' });
        return;
      }

      const participantsVal =
        appt.participants_count
        || (appt.extra && appt.extra.participants)
        || 1;

      const quantityVal =
        (appt.quantity != null ? Number(appt.quantity) : NaN);
      const extraQuantity =
        appt.extra && appt.extra.quantity != null
          ? Number(appt.extra.quantity)
          : NaN;
      const qty = !Number.isNaN(quantityVal)
        ? Math.max(1, quantityVal)
        : (!Number.isNaN(extraQuantity) ? Math.max(1, extraQuantity) : 1);

      const finalPriceVal =
        (appt.price != null ? Number(appt.price) : NaN);
      const extraFullPrice =
        appt.extra && appt.extra.full_price != null
          ? Number(appt.extra.full_price)
          : NaN;
      const finalPrice = !Number.isNaN(finalPriceVal)
        ? finalPriceVal
        : (!Number.isNaN(extraFullPrice) ? extraFullPrice : 0);

      const prepaidVal =
        (appt.prepayment != null ? Number(appt.prepayment) : NaN);
      const extraPrepaid =
        appt.extra && appt.extra.prepaid != null
          ? Number(appt.extra.prepaid)
          : NaN;
      const prepaid = !Number.isNaN(prepaidVal)
        ? prepaidVal
        : (!Number.isNaN(extraPrepaid) ? extraPrepaid : 0);

      const discountVal =
        (appt.discount != null ? Number(appt.discount) : NaN);
      const extraDiscount =
        appt.extra && appt.extra.discount != null
          ? Number(appt.extra.discount)
          : NaN;
      const discount = !Number.isNaN(discountVal)
        ? discountVal
        : (!Number.isNaN(extraDiscount) ? extraDiscount : 0);

      const comment = appt.comment || (appt.extra && appt.extra.comment) || null;
      const status = appt.status || (appt.extra && appt.extra.status) || 'waiting';

      const fromMinutes = startMinutes;
      const toMinutes = endMinutes != null && endMinutes > fromMinutes
        ? endMinutes
        : fromMinutes + 30;

      // Формируем даты в зоне Asia/Almaty
      const dateObj = selectedDate || (() => {
        const branchTimezone = TIMEZONE_NAME();
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: branchTimezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          });
          const parts = formatter.formatToParts(now);
          const year = parseInt(parts.find(p => p.type === 'year').value, 10);
          const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
          const day = parseInt(parts.find(p => p.type === 'day').value, 10);
          return new Date(year, month, day, 0, 0, 0, 0);
        } catch {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return today;
        }
      })();
      const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      startDate.setMinutes(fromMinutes);
      const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      endDate.setMinutes(toMinutes);
      // Не показываем alert-диалог по времени, только по зонам
      // Формируем ISO-строки в Asia/Almaty
      const newStartISO = toISO(startDate);
      const newEndISO = toISO(endDate);
      const body = {
        branch_id: Number(branchId),
        zone_ids: newZoneIds,
        start_time: newStartISO,
        end_time: newEndISO,
        service_id: serviceId,
        participants: participantsVal,
        quantity: qty,
        final_price: finalPrice,
        prepaid,
        discount,
        comment,
        status,
        is_paid: typeof appt.is_paid === 'boolean' ? appt.is_paid : false,
        payment_method: appt.payment_method || null,
      };

      // Оптимистично обновляем только зоны записи
      setBranchJournal(prev =>
        Array.isArray(prev)
          ? prev.map(item => {
              const itemId = item && (item.id || item.appointment_id);
              if (!itemId || String(itemId) !== String(appointmentId)) return item;
              return {
                ...item,
                zone_ids: newZoneIds,
              };
            })
          : prev
      );

 
      // use API_URL for all API requests

      (async () => {
        try {
          const res = await fetch(`${API_URL}/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error('Update appointment (zone-resize) error:', text);
            toast({ title: 'Ошибка', description: 'Ошибка при изменении зон записи', variant: 'destructive' });
            return;
          }

          toast({ title: 'Успешно', description: 'Зоны записи изменены' });
          setJournalReloadKey(k => k + 1);
        } catch (err) {
          console.error('Update appointment (zone-resize) exception:', err);
          toast({ title: 'Ошибка', description: 'Не удалось изменить зоны записи', variant: 'destructive' });
        }
      })();
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoneResizing, branchId, selectedDate, zonesList, setBranchJournal, setJournalReloadKey]);

  // Determine whether the current app theme/background is dark and respond to changes
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

  // Service filter handlers
  const handleToggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleResetFilter = () => {
    setSelectedServices([]);
    setShowFilterDropdown(false);
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div className={`timetable-wrapper`} style={{ position: 'relative' }}> 
      {/* ЛЕВАЯ ПАНЕЛЬ */}
      <Sidebar
        calendarDate={calendarDate}
        setCalendarDate={setCalendarDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        loadingUser={loadingUser}
        userError={userError}
        selectedServices={selectedServices}
      />

      {/* ПРАВАЯ ЧАСТЬ */}
      <div className={`timetable-content ${isDarkTheme ? 'dark-theme' : ''}`} style={{ position: 'relative' }}>
        {/* Overlay для заблокированных дат */}
        {branchAccessDenied && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkTheme ? 'rgba(0,0,0,0.6)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all',
            cursor: 'not-allowed'
          }}>
            <div style={{
              background: isDarkTheme ? '#0b1228' : '#FEF2F2',
              border: isDarkTheme ? '1px solid rgba(255,255,255,0.06)' : '2px solid #FCA5A5',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              boxShadow: isDarkTheme ? '0 8px 24px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>📅</div>
              <h2 style={{ color: isDarkTheme ? '#ffb4b4' : '#DC2626', marginBottom: '12px', textAlign: 'center' }}>Эта дата недоступна</h2>
              <p style={{ color: isDarkTheme ? '#d1d5db' : '#374151', textAlign: 'center', lineHeight: '1.5' }}>
                {branchValidUntil 
                  ? (() => {
                    const formattedValidUntil = new Date(branchValidUntil).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
                    return `Лицензия для этого филиала действительна до ${formattedValidUntil}. Выбранная дата находится за пределами периода действия лицензии.`;
                  })()
                  : 'Выбранная дата недоступна. Пожалуйста, выберите другую дату или обратитесь к администратору.'}
              </p>
            </div>
          </div>
        )}
        
        {/* ВЕРХНЯЯ ПАНЕЛЬ */}
        <header className="topbar">
          <button
            className="btn"
            onClick={() => {
              // Получаем текущую дату в timezone филиала
              const branchTimezone = TIMEZONE_NAME();
              try {
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: branchTimezone,
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric'
                });
                const parts = formatter.formatToParts(now);
                const year = parseInt(parts.find(p => p.type === 'year').value, 10);
                const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
                const day = parseInt(parts.find(p => p.type === 'day').value, 10);
                const nowInBranchTZ = new Date(year, month, day, 0, 0, 0, 0);
                setSelectedDate(new Date(nowInBranchTZ));
                setCalendarDate(new Date(year, month, 1));
                // Update ?date= in URL
                const yyyy = year;
                const mm = String(month + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const params = new URLSearchParams(location.search);
                params.set('date', `${yyyy}-${mm}-${dd}`);
                navigate({ search: params.toString() }, { replace: true });
              } catch (e) {
                console.error('Error in today button:', e);
              }
            }}
          >
            Сегодня
          </button>

          <div className="date-title">{today}</div>

          <div className="topbar-right">
            {/* Active filter info (left of filter button) */}
            {selectedServiceNames && selectedServiceNames.length > 0 && (
              <div className="filter-active-info">
                <span className="filter-active-label">Фильтр:</span>
                {selectedServiceNames.map(s => (
                  <span key={s.id} className="filter-tag">{s.name}</span>
                ))}
              </div>
            )}
            {/* Service Filter Button */}
            {branchServices.length > 0 && (
              <div className="filter-container" ref={filterDropdownRef}>
                <button 
                  className={`btn ${selectedServices.length > 0 ? 'btn-active' : ''}`}
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  Фильтр по услугам {selectedServices.length > 0 && `(${selectedServices.length})`}
                </button>
                
                {showFilterDropdown && (
                  <div className="filter-dropdown">
                    <div className="filter-header">Выберите услуги</div>
                    <div className="filter-services">
                      {branchServices.map(service => (
                        <label key={service.service_id} className="filter-service-item">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.service_id)}
                            onChange={() => handleToggleService(service.service_id)}
                          />
                          <span>{service.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reset Filter Button */}
            {selectedServices.length > 0 && (
              <button 
                className="btn btn-reset"
                onClick={handleResetFilter}
              >
                Сброс
              </button>
            )}

            <button className="btn">Продать</button>
            <button className="btn">0 тг</button>
          </div>

        </header>

        <div className="timetable-grid">
          {/* Zones header row — show zones horizontally */}
          {zonesList && zonesList.length > 0 && (
            <div className="timetable-zones">
              {zonesList.map((z) => (
                <div key={z.zone_id || z.id || z.name} className="tzone">
                  {/* <div className="tzone-avatar" /> */}
                  <div className="tzone-info">
                    <div className="tzone-name">{z.name}</div>
                    {z.description && <div className="tzone-sub">{z.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show branch schedule if available */}
          {branchSchedule && (
            <div className="branch-schedule">График филиала: {branchSchedule}</div>
          )}
          {branchId && !loadingJournal && !journalError && !branchSchedule && (
            <div className="clients-empty">
              У этого филиала не задан график работы. Добавьте график в настройках филиала.
            </div>
          )}

          {!branchId && (
            <div className="clients-empty">Выберите филиал слева, чтобы открыть журнал записи</div>
          )}

          {branchId && loadingJournal && (
            <div className="clients-empty">Загрузка журнала филиала...</div>
          )}

          {branchId && journalError && (
            <div className="clients-empty">{journalError}</div>
          )}

          {branchId && !loadingJournal && !journalError && branchSchedule && (
            (() => {
              // backend уже отдаёт записи только за выбранную дату,
              // поэтому на фронте берём их как есть
              const entries = branchJournal || [];
              const hasEntries = entries.length > 0;

              function parseSchedule(s) {
                if (!s || typeof s !== 'string') return { start: '10:00', end: '22:00' };
                const m = s.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
                if (!m) return { start: '10:00', end: '22:00' };
                return { start: m[1], end: m[2] };
              }

              function generateTimeSlots(startStr, endStr, stepMinutes = 15) {
                const [sh, sm] = startStr.split(':').map(n => Number(n));
                const [eh, em] = endStr.split(':').map(n => Number(n));
                const slots = [];
                const now = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), sh, sm, 0, 0);
                const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), eh, em, 0, 0);
                while (now < end) {
                  slots.push(new Date(now));
                  now.setMinutes(now.getMinutes() + stepMinutes);
                }
                return slots;
              }

              const sch = parseSchedule(branchSchedule);

              // Базовые границы графика в минутах
              let scheduleStartMinutes = parseTimeToMinutes(sch.start);
              let scheduleEndMinutes = parseTimeToMinutes(sch.end);

              // Если есть записи, которые выходят за пределы графика,
              // расширяем конец графика до времени последней записи
              if (entries.length > 0 && scheduleStartMinutes != null && scheduleEndMinutes != null) {
                let maxEnd = scheduleEndMinutes;
                for (const r of entries) {
                  const endStr = r.end_time || r.ends_at || r.end || r.time_to;
                  const em = parseTimeToMinutes(endStr);
                  if (em != null && em > maxEnd) maxEnd = em;
                }
                if (maxEnd > scheduleEndMinutes) {
                  scheduleEndMinutes = maxEnd + 30;
                }
              }

              const effectiveEndStr = (scheduleEndMinutes != null)
                ? minutesToHHMM(scheduleEndMinutes)
                : sch.end;

              const slots = generateTimeSlots(sch.start, effectiveEndStr, 15);
              const cols = (zonesList && zonesList.length > 0) ? zonesList.length : 1;

              // Позиция линии "текущее время", если выбран сегодняшний день

              let nowLineTop = null;
              let nowLabel = '';

              if (selectedDate && now && scheduleStartMinutes != null && scheduleEndMinutes != null) {
                // Получаем текущее время в timezone филиала
                const branchTimezone = TIMEZONE_NAME();
                try {
                  const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: branchTimezone,
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: false
                  });
                  const parts = formatter.formatToParts(now);
                  const year = parseInt(parts.find(p => p.type === 'year').value, 10);
                  const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
                  const day = parseInt(parts.find(p => p.type === 'day').value, 10);
                  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
                  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
                  
                  const todayMidnight = new Date(year, month, day, 0, 0, 0, 0);
                  const selectedMidnight = new Date(selectedDate);
                  selectedMidnight.setHours(0, 0, 0, 0);

                  const isToday = selectedMidnight.getTime() === todayMidnight.getTime();

                  if (isToday) {
                    // Используем время в timezone филиала
                    const nowMinutes = hour * 60 + minute;

                    if (nowMinutes >= scheduleStartMinutes && nowMinutes <= scheduleEndMinutes) {
                      const offsetNow = nowMinutes - scheduleStartMinutes;
                      nowLineTop = (offsetNow / 15) * ROW_HEIGHT;
                      nowLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    }
                  }
                } catch (e) {
                  console.error('Error calculating now line:', e);
                }
              }

              function formatTimeRange(r) {
                const start = r.start_time || r.starts_at || r.start || r.time_from;
                const end = r.end_time || r.ends_at || r.end || r.time_to;

                const fmt = (v) => {
                  if (!v) return '';
                  // Если это уже Date
                  if (v instanceof Date) {
                    return `${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`;
                  }
                  if (typeof v === 'string') {
                    // Если ISO строка с timezone offset, извлекаем локальное время напрямую
                    // "2026-02-01T14:00:00+05:00" → "14:00"
                    const isoMatch = v.match(/(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})(?::(\d{2}))?([+-]\d{2}:\d{2}|Z)?/);
                    if (isoMatch) {
                      const h = String(isoMatch[4]).padStart(2, '0');
                      const m = String(isoMatch[5]).padStart(2, '0');
                      return `${h}:${m}`;
                    }
                    // Fallback: простой поиск HH:MM в строке
                    const m = v.match(/(\d{1,2}):(\d{2})/);
                    if (m) {
                      return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
                    }
                  }
                  return '';
                };

                const s = fmt(start);
                const e = fmt(end);
                if (s && e) return `${s}–${e}`;
                return s || '';
              }

              function parseTimeToMinutes(value) {
                if (!value) return null;

                // Если пришёл уже объект Date
                if (value instanceof Date) {
                  const h = value.getHours();
                  const mi = value.getMinutes();
                  if (Number.isNaN(h) || Number.isNaN(mi)) return null;
                  return h * 60 + mi;
                }

                if (typeof value === 'string') {
                  const str = value.trim();

                  // Если строка содержит ISO с timezone offset, извлекаем локальное время напрямую
                  // Например: "2026-02-01T14:00:00+05:00" → 14:00 (локальное время в timezone +05:00)
                  // ВАЖНО: НЕ используем new Date() + Intl API, т.к. это вызывает двойную конвертацию
                  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})(?::(\d{2}))?([+-]\d{2}:\d{2}|Z)?/);
                  if (isoMatch) {
                    const h = parseInt(isoMatch[4], 10);
                    const mi = parseInt(isoMatch[5], 10);
                    if (!Number.isNaN(h) && !Number.isNaN(mi)) {
                      return h * 60 + mi;
                    }
                  }
                  
                  // Fallback: простой поиск HH:MM в строке
                  const m = str.match(/(\d{1,2}):(\d{2})/);
                  if (m) {
                    const h = Number(m[1]);
                    const mi = Number(m[2]);
                    if (!Number.isNaN(h) && !Number.isNaN(mi)) return h * 60 + mi;
                  }
                }

                return null;
              }

              function minutesToHHMM(totalMinutes) {
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              }

              // function formatTimeRange(r) {
              //   const start = r.start_time || r.starts_at || r.start || r.time_from;
              //   const end = r.end_time || r.ends_at || r.end || r.time_to;
              //   const fmt = (v) => {
              //     if (!v || typeof v !== 'string') return '';
              //     // ожидаем формат 'YYYY-MM-DDTHH:MM' или 'YYYY-MM-DD HH:MM'
              //     const m = v.match(/\d{2}:\d{2}/);
              //     return m ? m[0] : '';
              //   };
              //   const s = fmt(start);
              //   const e = fmt(end);
              //   if (s && e) return `${s}–${e}`;
              //   return s || '';
              // }

              return (
                <div
                  className="timetable-body"
                  data-has-entries={hasEntries ? 'true' : 'false'}
                  style={{ position: 'relative', paddingBottom: 300 }}
                  ref={bodyRef}
                >
                  <div className="time-column">
                    {slots.map((dt, idx) => {
                      const minutes = dt.getMinutes();
                      const isHidden = minutes === 15 || minutes === 45;
                      return (
                        <div key={idx} className={`time-cell ${isHidden ? 'time-cell-hidden' : ''}`}>
                          {minutes === 0
                            ? <span className="hour">{String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}</span>
                            : (!isHidden && <span className="minutes">{String(minutes).padStart(2, '0')}</span>)
                          }
                        </div>
                      );
                    })}
                  </div>

                  <div className="zones-scroll">
                    <div className="zones-columns" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                      {slots.map((slotTime, r) => (
                        <div key={`row-${r}`} style={{ display: 'contents' }}>
                          {Array.from({ length: cols }).map((_, c) => (
                            <div
                              key={`slot-${r}-${c}`}
                              className="slot"
                              onDragOver={e => {
                                if (!draggingAppointment) return;
                                e.preventDefault();
                                try {
                                  if (e.dataTransfer) {
                                    e.dataTransfer.dropEffect = 'move';
                                  }
                                } catch {}
                                setDragOverSlot({ row: r, col: c });
                              }}
                              onDragLeave={e => {
                                if (!draggingAppointment) return;
                                setDragOverSlot(s =>
                                  s.row === r && s.col === c ? { row: null, col: null } : s
                                );
                              }}
                              onDrop={e => {
                                if (!draggingAppointment) return;
                                e.preventDefault();
                                setDragOverSlot({ row: null, col: null });

                                const targetZone = Array.isArray(zonesList) && zonesList.length
                                  ? zonesList[c] || zonesList[0]
                                  : null;
                                if (!targetZone) {
                                  setDraggingAppointment(null);
                                  dragMovedRef.current = false;
                                  return;
                                }

                                const dateObj = selectedDate || (() => {
                                  const branchTimezone = TIMEZONE_NAME();
                                  try {
                                    const now = new Date();
                                    const formatter = new Intl.DateTimeFormat('en-US', {
                                      timeZone: branchTimezone,
                                      year: 'numeric',
                                      month: 'numeric',
                                      day: 'numeric'
                                    });
                                    const parts = formatter.formatToParts(now);
                                    const year = parseInt(parts.find(p => p.type === 'year').value, 10);
                                    const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
                                    const day = parseInt(parts.find(p => p.type === 'day').value, 10);
                                    const today = new Date(year, month, day, 0, 0, 0, 0);
                                    return today;
                                  } catch {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return today;
                                  }
                                })();

                                const startRaw = draggingAppointment.start_time
                                  || draggingAppointment.starts_at
                                  || draggingAppointment.start
                                  || draggingAppointment.time_from;
                                const endRaw = draggingAppointment.end_time
                                  || draggingAppointment.ends_at
                                  || draggingAppointment.end
                                  || draggingAppointment.time_to;

                                const startM = parseTimeToMinutes(startRaw);
                                const endM = parseTimeToMinutes(endRaw);
                                const durationMinutes = (startM != null && endM != null && endM > startM)
                                  ? (endM - startM)
                                  : 60;

                                const startDate = new Date(
                                  dateObj.getFullYear(),
                                  dateObj.getMonth(),
                                  dateObj.getDate(),
                                  slotTime.getHours(),
                                  slotTime.getMinutes(),
                                  0,
                                  0,
                                );
                                const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

                                const toISO = (d) => {
                                  const y = d.getFullYear();
                                  const m = String(d.getMonth() + 1).padStart(2, '0');
                                  const day = String(d.getDate()).padStart(2, '0');
                                  const hh = String(d.getHours()).padStart(2, '0');
                                  const mm = String(d.getMinutes()).padStart(2, '0');
                                  return `${y}-${m}-${day}T${hh}:${mm}:00`;
                                };

                                const newStartISO = toISO(startDate);
                                const newEndISO = toISO(endDate);
                                // Подтверждение переноса через alert dialog вместо открытия формы
                                const hhmm = (d) => {
                                  const h = String(d.getHours()).padStart(2, '0');
                                  const m = String(d.getMinutes()).padStart(2, '0');
                                  return `${h}:${m}`;
                                };

                                const newFrom = hhmm(startDate);
                                const newTo = hhmm(endDate);

                                const confirmMove = window.confirm(
                                  `Перенести запись в зону "${targetZone.name || ''}" на ${newFrom}–${newTo}?`
                                );

                                if (!confirmMove) {
                                  setDraggingAppointment(null);
                                  dragMovedRef.current = false;
                                  return;
                                }

                                const appt = draggingAppointment;
                                const appointmentId = appt && (appt.id || appt.appointment_id);

                                if (!appointmentId || !branchId) {
                                  console.error('Не удалось определить id записи или филиал для переноса');
                                  toast({ title: 'Ошибка', description: 'Не удалось перенести запись', variant: 'destructive' });
                                  setDraggingAppointment(null);
                                  dragMovedRef.current = false;
                                  return;
                                }

                                // Сохраняем ширину блока по зонам: сдвигаем его так,
                                // чтобы количество объединённых зон осталось тем же.
                                // Если у услуги/записи вообще нет zone_ids (услуга не связана с зонами),
                                // просто назначаем одну целевую зону без попытки сохранять ширину.
                                let newZoneIds = [];
                                if (Array.isArray(zonesList) && zonesList.length > 0) {
                                  const originalZoneIds =
                                    Array.isArray(appt.zone_ids) && appt.zone_ids.length > 0
                                      ? appt.zone_ids
                                      : (appt.zone_id ? [appt.zone_id] : []);

                                  if (!originalZoneIds || originalZoneIds.length === 0) {
                                    // Услуга/запись не была привязана к зонам — просто ставим одну зону
                                    newZoneIds = [targetZone.zone_id || targetZone.id];
                                  } else {
                                    let span = 1;
                                    const indices = originalZoneIds
                                      .map(zid => zonesList.findIndex(z => String(z.zone_id) === String(zid)))
                                      .filter(i => i >= 0);
                                    if (indices.length > 0) {
                                      const minIdx = Math.min(...indices);
                                      const maxIdx = Math.max(...indices);
                                      span = Math.max(1, maxIdx - minIdx + 1);
                                    }

                                    let colsCount = zonesList.length;
                                    if (span > colsCount) span = colsCount;

                                    let startCol = c;
                                    if (startCol + span > colsCount) {
                                      startCol = Math.max(0, colsCount - span);
                                    }

                                    newZoneIds = zonesList
                                      .slice(startCol, startCol + span)
                                      .map(z => z.zone_id || z.id)
                                      .filter(Boolean);
                                  }
                                }

                                if (!newZoneIds || newZoneIds.length === 0) {
                                  newZoneIds = [targetZone.zone_id || targetZone.id];
                                }

                                const serviceId =
                                  appt.service_id
                                  || (appt.service && appt.service.service_id)
                                  || (appt.extra
                                    && Array.isArray(appt.extra.services)
                                    && appt.extra.services.length > 0
                                    && appt.extra.services[0].service_id)
                                  || null;

                                if (!serviceId) {
                                  console.error('У записи отсутствует service_id, перенос невозможен');
                                  toast({ title: 'Ошибка', description: 'Не удалось перенести запись: не указана услуга', variant: 'destructive' });
                                  setDraggingAppointment(null);
                                  dragMovedRef.current = false;
                                  return;
                                }

                                const participantsVal =
                                  appt.participants_count
                                  || (appt.extra && appt.extra.participants)
                                  || 1;

                                const quantityVal =
                                  (appt.quantity != null ? Number(appt.quantity) : NaN);
                                const extraQuantity =
                                  appt.extra && appt.extra.quantity != null
                                    ? Number(appt.extra.quantity)
                                    : NaN;
                                const qty = !Number.isNaN(quantityVal)
                                  ? Math.max(1, quantityVal)
                                  : (!Number.isNaN(extraQuantity) ? Math.max(1, extraQuantity) : 1);

                                const finalPriceVal =
                                  (appt.price != null ? Number(appt.price) : NaN);
                                const extraFullPrice =
                                  appt.extra && appt.extra.full_price != null
                                    ? Number(appt.extra.full_price)
                                    : NaN;
                                const finalPrice = !Number.isNaN(finalPriceVal)
                                  ? finalPriceVal
                                  : (!Number.isNaN(extraFullPrice) ? extraFullPrice : 0);

                                const prepaidVal =
                                  (appt.prepayment != null ? Number(appt.prepayment) : NaN);
                                const extraPrepaid =
                                  appt.extra && appt.extra.prepaid != null
                                    ? Number(appt.extra.prepaid)
                                    : NaN;
                                const prepaid = !Number.isNaN(prepaidVal)
                                  ? prepaidVal
                                  : (!Number.isNaN(extraPrepaid) ? extraPrepaid : 0);

                                const discountVal =
                                  (appt.discount != null ? Number(appt.discount) : NaN);
                                const extraDiscount =
                                  appt.extra && appt.extra.discount != null
                                    ? Number(appt.extra.discount)
                                    : NaN;
                                const discount = !Number.isNaN(discountVal)
                                  ? discountVal
                                  : (!Number.isNaN(extraDiscount) ? extraDiscount : 0);

                                const comment = appt.comment || (appt.extra && appt.extra.comment) || null;
                                const status = appt.status || (appt.extra && appt.extra.status) || 'waiting';

                                const body = {
                                  branch_id: Number(branchId),
                                  zone_ids: newZoneIds,
                                  start_time: newStartISO,
                                  end_time: newEndISO,
                                  service_id: serviceId,
                                  participants: participantsVal,
                                  quantity: qty,
                                  final_price: finalPrice,
                                  prepaid,
                                  discount,
                                  comment,
                                  status,
                                  is_paid: typeof appt.is_paid === 'boolean' ? appt.is_paid : false,
                                  payment_method: appt.payment_method || null,
                                };

                                // Оптимистично обновляем локальный список записей, чтобы блок
                                // сразу остался на новом месте после отпускания мыши
                                setBranchJournal(prev =>
                                  Array.isArray(prev)
                                    ? prev.map(item => {
                                        const itemId = item && (item.id || item.appointment_id);
                                        if (!itemId || String(itemId) !== String(appointmentId)) return item;
                                        return {
                                          ...item,
                                          start_time: newStartISO,
                                          end_time: newEndISO,
                                          zone_ids: newZoneIds,
                                        };
                                      })
                                    : prev
                                );

                                
                                // use API_URL for all API requests

                                (async () => {
                                  try {
                                    const res = await fetch(`${API_URL}/appointments/${appointmentId}`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify(body),
                                    });

                                    if (!res.ok) {
                                      const text = await res.text();
                                      console.error('Update appointment (drag) error:', text);
                                      toast({ title: 'Ошибка', description: 'Ошибка при переносе записи', variant: 'destructive' });
                                      return;
                                    }

                                    // Подсвечиваем исходное положение записи после успешного переноса
                                    if (dragOriginRef.current) {
                                      setDragOriginHighlight({ ...dragOriginRef.current });
                                    }

                                    toast({ title: 'Успешно', description: 'Запись перенесена' });
                                    // Успешно перенесли запись, перезагружаем журнал
                                    setJournalReloadKey(k => k + 1);
                                  } catch (err) {
                                    console.error('Update appointment (drag) exception:', err);
                                    toast({ title: 'Ошибка', description: 'Не удалось перенести запись', variant: 'destructive' });
                                  } finally {
                                    setDraggingAppointment(null);
                                    dragMovedRef.current = false;
                                  }
                                })();
                              }}
                              onMouseEnter={e => {
                                setSlotHover({
                                  visible: true,
                                  row: r,
                                  col: c,
                                  time: `${String(slotTime.getHours()).padStart(2, '0')}:${String(slotTime.getMinutes()).padStart(2, '0')}`,
                                });
                              }}
                              onMouseLeave={() => {
                                setSlotHover(h => ({ ...h, visible: false }));
                              }}
                              onClick={e => {
                                const container = bodyRef.current;
                                if (!container) return;

                                // Если клик по уже выбранному слоту — снимаем выделение и закрываем popup
                                if (selectedSlot && selectedSlot.row === r && selectedSlot.col === c) {
                                  setSelectedSlot({ row: null, col: null, time: '' });
                                  setPopup(p => ({ ...p, visible: false }));
                                  return;
                                }

                                const slotRect = e.currentTarget.getBoundingClientRect();
                                const bodyRect = container.getBoundingClientRect();

                                // Скролл внутри timetable-body (вертикальный)
                                const scrollY = container.scrollTop || 0;

                                // Центр слота относительно контейнера timetable-body
                                const centerX = (slotRect.left - bodyRect.left) + slotRect.width / 2;
                                // Корректируем по scrollTop, чтобы внизу не "подпрыгивал" вверх
                                const belowY = (slotRect.bottom - bodyRect.top) + scrollY;

                                setPopup({
                                  visible: true,
                                  x: centerX,
                                  y: belowY,
                                  slotIdx: r,
                                  zoneIdx: c,
                                });

                                // Зафиксировать выбранный слот с его временем
                                setSelectedSlot({
                                  row: r,
                                  col: c,
                                  time: `${String(slotTime.getHours()).padStart(2, '0')}:${String(slotTime.getMinutes()).padStart(2, '0')}`,
                                });
                              }}
                              style={{
                                cursor: 'pointer',
                                position: 'relative',
                                backgroundColor:
                                  dragOverSlot && dragOverSlot.row === r && dragOverSlot.col === c
                                    ? '#dbeafe'
                                    : (selectedSlot && selectedSlot.row === r && selectedSlot.col === c
                                        ? '#e6f4ff'
                                        : 'transparent'),
                              }}
                            >
                              {(() => {
                                const isHover = slotHover.visible && slotHover.row === r && slotHover.col === c;
                                const isSelected = selectedSlot && selectedSlot.row === r && selectedSlot.col === c;
                                if (!isHover && !isSelected) return null;
                                const label = isSelected && selectedSlot.time ? selectedSlot.time : slotHover.time;
                                if (!label) return null;
                                return (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    color: '#4b5563',
                                    pointerEvents: 'none',
                                  }}
                                >
                                  {label}
                                </div>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Линия текущего времени (только если выбран сегодняшний день) */}
                    {nowLineTop !== null && (
                      <div
                        className="current-time-indicator"
                        style={{ top: nowLineTop }}
                      >
                        <div className="current-time-line" />
                        <div className="current-time-label">{nowLabel}</div>
                      </div>
                    )}

                    {/* Слой с прямоугольниками записей */}
                    <div
                      className="appointments-layer"
                      style={{
                        height: slots.length * ROW_HEIGHT,
                      }}
                    >
                      {dragOriginHighlight && (
                        <div
                          className="appointment-origin-highlight"
                          style={{
                            position: 'absolute',
                            top: dragOriginHighlight.slotStart * ROW_HEIGHT,
                            height: dragOriginHighlight.slotSpan * ROW_HEIGHT,
                            left: `${(dragOriginHighlight.colStart / cols) * 100}%`,
                            width: `${(dragOriginHighlight.spanCols / cols) * 100}%`,
                            border: '2px dashed rgba(59,130,246,0.7)',
                            borderRadius: 8,
                            backgroundColor: 'rgba(59,130,246,0.08)',
                            pointerEvents: 'none',
                            boxSizing: 'border-box',
                            zIndex: 1,
                          }}
                        />
                      )}
                      {[...entries]
                        // Сортируем: сначала многозонные, потом однозонные, чтобы однозонные были "выше"
                        .sort((a, b) => {
                          const az = Array.isArray(a.zone_ids) ? a.zone_ids.length : (a.zone_id ? 1 : 0);
                          const bz = Array.isArray(b.zone_ids) ? b.zone_ids.length : (b.zone_id ? 1 : 0);
                          // Однозонные должны быть позже (выше)
                          if (az === 1 && bz > 1) return 1;
                          if (az > 1 && bz === 1) return -1;
                          return 0;
                        })
                        .map((r, idx) => {
                        // определяем диапазон колонок по зонам (если есть zone_ids или zone_id)
                        const zoneIds = r.zone_ids || (r.zone_id ? [r.zone_id] : []);
                        // let colStart = 0;
                        // let colEnd = 0;
                        // if (Array.isArray(zoneIds) && zoneIds.length > 0 && Array.isArray(zonesList) && zonesList.length > 0) {
                        //   const indices = zoneIds
                        //     .map(zid => zonesList.findIndex(z => String(z.zone_id) === String(zid)))
                        //     .filter(i => i >= 0);
                        //   if (indices.length > 0) {
                        //     colStart = Math.min(...indices);
                        //     colEnd = Math.max(...indices);
                        //   }
                        // }
                        let colStart = 0;
                        let colEnd = 0;
                        // Показываем запись только в тех зонах, к которым она привязана
                        if (Array.isArray(zoneIds) && zoneIds.length > 0 && Array.isArray(zonesList) && zonesList.length > 0) {
                          const indices = zoneIds
                            .map(zid => zonesList.findIndex(z => String(z.zone_id) === String(zid)))
                            .filter(i => i >= 0);
                          if (indices.length > 0) {
                            colStart = Math.min(...indices);
                            colEnd = Math.max(...indices);
                            // Если текущая зона не входит в zoneIds, не отображаем запись
                            // (colStart и colEnd определяют диапазон, но если запись не должна быть в этой зоне — return null)
                            // Но здесь map идёт по entries, а не по зонам, поэтому ничего не меняем
                          } else {
                            return null;
                          }
                        } else {
                          return null;
                        }

                        const appointmentId = r.id || r.appointment_id;

                        // Во время горизонтального ресайза используем временный диапазон колонок
                        if (
                          zoneResizing
                          && zoneResizing.appointmentId
                          && appointmentId
                          && String(zoneResizing.appointmentId) === String(appointmentId)
                          && zoneResizing.colStart != null
                          && zoneResizing.colEnd != null
                        ) {
                          colStart = zoneResizing.colStart;
                          colEnd = zoneResizing.colEnd;
                        }

                        const startStr = r.start_time || r.starts_at || r.start || r.time_from;
                        const endStr = r.end_time || r.ends_at || r.end || r.time_to;
                        const startMinutes = parseTimeToMinutes(startStr);
                        let endMinutes = parseTimeToMinutes(endStr);

                        // Во время ресайза используем временное значение конца
                        if (
                          resizing
                          && resizing.appointmentId
                          && appointmentId
                          && String(resizing.appointmentId) === String(appointmentId)
                          && resizing.endMinutes != null
                        ) {
                          endMinutes = resizing.endMinutes;
                        }
                        if (startMinutes == null || scheduleStartMinutes == null) return null;

                        const offsetMinutes = Math.max(0, startMinutes - scheduleStartMinutes);
                        const durationMinutes = (endMinutes != null && endMinutes > startMinutes)
                          ? (endMinutes - startMinutes)
                          : 15;
                        const slotStart = offsetMinutes / 15; // кол-во 15-минуток от начала графика
                        const slotSpan = Math.max(1, Math.ceil(durationMinutes / 15));
                        const spanCols = Math.max(1, (colEnd - colStart + 1));

                        // Во время перетаскивания оставляем запись визуально на исходном месте,
                        // а перенос фактически происходит только по drop.
                        const top = slotStart * ROW_HEIGHT;
                        const height = slotSpan * ROW_HEIGHT; // заполняем слот по высоте
                        const leftPercent = (colStart / cols) * 100;
                        const widthPercent = (spanCols / cols) * 100;

                        let timeLabel = formatTimeRange(r);
                        if (
                          resizing
                          && resizing.appointmentId
                          && appointmentId
                          && String(resizing.appointmentId) === String(appointmentId)
                          && endMinutes != null
                        ) {
                          const sLabel = minutesToHHMM(startMinutes);
                          const eLabel = minutesToHHMM(endMinutes);
                          if (sLabel && eLabel) {
                            timeLabel = `${sLabel}–${eLabel}`;
                          }
                        }
                        const serviceTitle = r.service_name || r.service || r.name || `Без названия услуги`;
                        const clientName = r.client_name || (r.client && r.client.name);
                        const clientPhone = r.client_phone || (r.client && r.client.phone);
                        const comment = r.comment;
                        const bgColor = r.color || '#e0f9f3';

                        const participantsCount = r.participants_count;
                        let prepaidAmount = null;
                        let remainingAmount = null;

                        // Предоплата: в приоритете колонка prepayment, затем meta.extra.prepaid
                        if (r.prepayment != null) {
                          const val = Number(r.prepayment);
                          prepaidAmount = Number.isNaN(val) ? null : val;
                        } else if (r.extra && typeof r.extra === 'object' && r.extra.prepaid != null) {
                          const val = Number(r.extra.prepaid);
                          prepaidAmount = Number.isNaN(val) ? null : val;
                        }

                        // Остаток: сначала считаем как price - prepayment, при отсутствии — берём из meta.extra.final_price
                        if (r.price != null && prepaidAmount != null) {
                          const p = Number(r.price);
                          if (!Number.isNaN(p)) {
                            remainingAmount = p - prepaidAmount;
                          }
                        } else if (r.extra && typeof r.extra === 'object' && r.extra.final_price != null) {
                          const val = Number(r.extra.final_price);
                          remainingAmount = Number.isNaN(val) ? null : val;
                        }

                        const formatMoney = (val) => {
                          const n = Number(val);
                          if (Number.isNaN(n)) return '';
                          return n.toLocaleString('ru-RU');
                        };

                        const totalAmount = (() => {
                          if (r.price != null) {
                            const n = Number(r.price);
                            if (!Number.isNaN(n)) return n;
                          }
                          if (r.extra && typeof r.extra === 'object' && r.extra.full_price != null) {
                            const n = Number(r.extra.full_price);
                            if (!Number.isNaN(n)) return n;
                          }
                          return null;
                        })();

                        const status = r.status || (r.extra && r.extra.status) || 'pending';

                        const quantity = (() => {
                          if (r.quantity != null) {
                            const n = Number(r.quantity);
                            if (!Number.isNaN(n)) return n;
                          }
                          if (r.extra && typeof r.extra === 'object' && r.extra.quantity != null) {
                            const n = Number(r.extra.quantity);
                            if (!Number.isNaN(n)) return n;
                          }
                          return null;
                        })();

                        const discountValue = (() => {
                          if (r.discount != null) {
                            const n = Number(r.discount);
                            if (!Number.isNaN(n)) return n;
                          }
                          if (r.extra && typeof r.extra === 'object' && r.extra.discount != null) {
                            const n = Number(r.extra.discount);
                            if (!Number.isNaN(n)) return n;
                          }
                          return null;
                        })();

                        return (
                          <div
                            key={appointmentId || idx}
                            className="timetable-appointment"
                            style={{
                              top,
                              height,
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            draggable
                            onDragStart={e => {
                              // Не начинаем dnd, если сейчас идёт ресайз этой записи
                              if (
                                resizing
                                && resizing.appointmentId
                                && appointmentId
                                && String(resizing.appointmentId) === String(appointmentId)
                              ) {
                                e.preventDefault();
                                return;
                              }
                              if (
                                zoneResizing
                                && zoneResizing.appointmentId
                                && appointmentId
                                && String(zoneResizing.appointmentId) === String(appointmentId)
                              ) {
                                e.preventDefault();
                                return;
                              }
                              // Начинаем перетаскивание записи по сетке
                              dragMovedRef.current = false;
                              try {
                                e.dataTransfer.effectAllowed = 'move';
                                // Некоторые браузеры требуют хотя бы какие-то данные, чтобы dnd корректно работал
                                e.dataTransfer.setData('text/plain', 'appointment');
                              } catch {}
                              // Запоминаем исходную позицию для последующей подсветки
                              dragOriginRef.current = {
                                slotStart,
                                slotSpan,
                                colStart,
                                spanCols,
                              };
                              setDraggingAppointment({
                                ...r,
                                zone_ids: zoneIds,
                              });
                            }}
                            onDrag={e => {
                              if (!draggingAppointment) return;
                              dragMovedRef.current = true;
                            }}
                            onDragEnd={e => {
                              setDraggingAppointment(null);
                              setDragOverSlot({ row: null, col: null });
                              // Сбросим флаг после завершения dnd, чтобы следующий клик работал как обычно
                              setTimeout(() => {
                                dragMovedRef.current = false;
                              }, 0);
                            }}
                            onMouseEnter={e => {
                              // Отключаем показ hover card при наведении на всю запись
                              // Карточка будет показываться только при наведении на иконку информации
                            }}
                            onMouseLeave={() => {
                              // Hover card управляется через иконку информации
                            }}
                            onClick={e => {
                              // Если только что меняли длительность через нижний хэндл, не открываем диалог
                              if (resizeClickRef.current) {
                                resizeClickRef.current = false;
                                return;
                              }
                              // Если только что был drag, не открываем диалог по клику
                              if (dragMovedRef.current) {
                                dragMovedRef.current = false;
                                return;
                              }
                              e.stopPropagation();

                              // Определяем основную зону по первой колонке, которую занимает запись
                              const mainZone = Array.isArray(zonesList) && zonesList.length
                                ? zonesList[colStart] || zonesList[0]
                                : null;

                              // Дата записи в формате DD.MM.YYYY
                              const editDate = selectedDate
                                ? selectedDate.toLocaleDateString('ru-RU')
                                : '';

                              // Исходное время из записи (форматируем в HH:MM–HH:MM для отображения, 
                              // а реальные значения timeFrom/timeTo выставим внутри BookingDialog по полям start_time/end_time)
                              const timeLabelForDialog = formatTimeRange(r) || '';

                              setHoverCard(h => ({ ...h, visible: false }));

                              setBookingDialog({
                                open: true,
                                mode: 'edit',
                                zone: mainZone,
                                date: editDate,
                                time: timeLabelForDialog,
                                appointment: {
                                  ...r,
                                  zone_ids: zoneIds,
                                },
                              });
                            }}
                          >
                            {/* Хэндлы слева/справа для объединения/сжатия зон */}
                            <div
                              className="timetable-appointment-resize-zone-left"
                              onMouseDown={e => {
                                e.preventDefault();
                                e.stopPropagation();

                                if (!Array.isArray(zonesList) || zonesList.length === 0) return;
                                if (colStart == null || colEnd == null) return;
                                if (!appointmentId) return;

                                const parent = e.currentTarget.parentElement;
                                if (!parent) return;
                                const rect = parent.getBoundingClientRect();
                                const span = Math.max(1, (colEnd - colStart + 1));
                                const colWidth = span > 0 ? rect.width / span : 0;
                                if (!colWidth) return;

                                resizeClickRef.current = true;

                                setZoneResizing({
                                  appointmentId,
                                  appt: r,
                                  originalZoneIds: zoneIds,
                                  originalColStart: colStart,
                                  originalColEnd: colEnd,
                                  colStart,
                                  colEnd,
                                  totalCols: cols,
                                  side: 'left',
                                  startClientX: e.clientX,
                                  colWidth,
                                  startMinutes,
                                  endMinutes,
                                });
                              }}
                            />
                            <div
                              className="timetable-appointment-resize-zone-right"
                              onMouseDown={e => {
                                e.preventDefault();
                                e.stopPropagation();

                                if (!Array.isArray(zonesList) || zonesList.length === 0) return;
                                if (colStart == null || colEnd == null) return;
                                if (!appointmentId) return;

                                const parent = e.currentTarget.parentElement;
                                if (!parent) return;
                                const rect = parent.getBoundingClientRect();
                                const span = Math.max(1, (colEnd - colStart + 1));
                                const colWidth = span > 0 ? rect.width / span : 0;
                                if (!colWidth) return;

                                resizeClickRef.current = true;

                                setZoneResizing({
                                  appointmentId,
                                  appt: r,
                                  originalZoneIds: zoneIds,
                                  originalColStart: colStart,
                                  originalColEnd: colEnd,
                                  colStart,
                                  colEnd,
                                  totalCols: cols,
                                  side: 'right',
                                  startClientX: e.clientX,
                                  colWidth,
                                  startMinutes,
                                  endMinutes,
                                });
                              }}
                            />
                            {/* Хэндл в нижней части записи для быстрого продления по времени */}
                            <div
                              className="timetable-appointment-resize-handle-bottom"
                              onMouseDown={e => {
                                e.preventDefault();
                                e.stopPropagation();

                                if (startMinutes == null || endMinutes == null) return;
                                if (!appointmentId) return;

                                resizeClickRef.current = true;

                                setResizing({
                                  appointmentId,
                                  appt: r,
                                  zoneIds,
                                  startMinutes,
                                  originalEndMinutes: endMinutes,
                                  endMinutes,
                                  startClientY: e.clientY,
                                });
                              }}
                            />
                            <div className="timetable-appointment-header">
                              {timeLabel && (
                                <div className="timetable-appointment-time">{timeLabel}</div>
                              )}
                              <div className="timetable-appointment-title">{serviceTitle}</div>
                              {/* Иконка информации справа сверху */}
                              <div
                                className="timetable-appointment-info-icon"
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: '#fff',
                                  color: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  zIndex: 10,
                                  userSelect: 'none',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}
                                onMouseEnter={e => {
                                  e.stopPropagation();
                                  const container = bodyRef.current;
                                  if (!container) return;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const bodyRect = container.getBoundingClientRect();
                                  const scrollY = container.scrollTop || 0;

                                  const bodyWidth = bodyRect.width;
                                  const cardWidth = 380;

                                  let x = rect.right - bodyRect.left + 12;

                                  if (x + cardWidth > bodyWidth) {
                                    x = rect.left - bodyRect.left - cardWidth - 12;
                                    if (x < 8) x = 8;
                                  }

                                  let y = rect.top - bodyRect.top + scrollY;
                                  
                                  // Проверка границ по вертикали
                                  const cardHeight = 350; // примерная высота карточки с запасом
                                  const visibleHeight = bodyRect.height;
                                  const relativeY = y - scrollY;
                                  
                                  // Если карточка не помещается внизу, поднимаем её
                                  if (relativeY + cardHeight > visibleHeight) {
                                    // Позиционируем так, чтобы нижний край карточки был виден
                                    y = visibleHeight - cardHeight + scrollY;
                                  }
                                  
                                  // Если карточка выходит за верхнюю границу
                                  if (y < scrollY) {
                                    y = scrollY + 8;
                                  }

                                  setHoverCard({
                                    visible: true,
                                    x,
                                    y,
                                    appointment: {
                                      ...r,
                                      timeLabel,
                                      serviceTitle,
                                      clientName,
                                      clientPhone,
                                      participantsCount,
                                      prepaidAmount,
                                      remainingAmount,
                                      totalAmount,
                                      quantity,
                                      discountValue,
                                      status,
                                    }
                                  });
                                }}
                                onMouseLeave={e => {
                                  e.stopPropagation();
                                  setHoverCard({ visible: false, x: 0, y: 0, appointment: null });
                                }}
                                onClick={e => {
                                  e.stopPropagation();
                                  
                                  // Определяем основную зону
                                  const mainZone = Array.isArray(zonesList) && zonesList.length
                                    ? zonesList[colStart] || zonesList[0]
                                    : null;

                                  // Дата записи в формате DD.MM.YYYY
                                  const editDate = selectedDate
                                    ? selectedDate.toLocaleDateString('ru-RU')
                                    : '';

                                  const timeLabelForDialog = formatTimeRange(r) || '';

                                  setHoverCard({ visible: false, x: 0, y: 0, appointment: null });

                                  setBookingDialog({
                                    open: true,
                                    mode: 'edit',
                                    zone: mainZone,
                                    date: editDate,
                                    time: timeLabelForDialog,
                                    appointment: {
                                      ...r,
                                      zone_ids: zoneIds,
                                    },
                                  });
                                }}
                              >
                                i
                              </div>
                            </div>
                            {(comment || clientName || clientPhone || (participantsCount && participantsCount > 0) || (prepaidAmount !== null)) && (
                              <div
                                className="timetable-appointment-body"
                                style={{ background: bgColor }}
                              >
                                {participantsCount && participantsCount > 0 && (
                                  <div className="timetable-appointment-meta">Участники: {participantsCount}</div>
                                )}
                                {prepaidAmount !== null && (
                                  <div className="timetable-appointment-meta">
                                    Предоплата: {formatMoney(prepaidAmount)} тг
                                    {remainingAmount !== null && (
                                      <span> / Остаток: {formatMoney(remainingAmount)} тг</span>
                                    )}
                                  </div>
                                )}
                                {comment && (
                                  <div className="timetable-appointment-comment">{comment}</div>
                                )}
                                {clientName && (
                                  <div className="timetable-appointment-client-name">{clientName}</div>
                                )}
                                {clientPhone && (
                                  <div className="timetable-appointment-client-phone">{formatPhoneNumber(clientPhone)}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="time-column time-column-right">
                    {slots.map((dt, idx) => {
                      const minutes = dt.getMinutes();
                      const isHidden = minutes === 15 || minutes === 45;
                      return (
                        <div key={idx} className={`time-cell ${isHidden ? 'time-cell-hidden' : ''}`}>
                          {minutes === 0
                            ? <span className="hour">{String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}</span>
                            : (!isHidden && <span className="minutes">{String(minutes).padStart(2, '0')}</span>)
                          }
                        </div>
                      );
                    })}
                  </div>

                  {/* Hover‑карточка существующей записи */}
                  {hoverCard.visible && hoverCard.appointment && (
                    <div
                      ref={hoverRef}
                      className="appointment-hover-card"
                      style={{
                        position: 'absolute',
                        left: hoverCard.x,
                        top: hoverCard.y,
                        zIndex: 60,
                      }}
                    >
                      {(() => {
                        const a = hoverCard.appointment;
                        const money = (v) => {
                          const n = Number(v);
                          if (Number.isNaN(n)) return '0';
                          return n.toLocaleString('ru-RU');
                        };

                        const total = a.totalAmount != null ? money(a.totalAmount) : (a.price != null ? money(a.price) : '0');
                        const prepaid = a.prepaidAmount != null ? money(a.prepaidAmount) : '0';
                        const rest = a.remainingAmount != null ? money(a.remainingAmount) : '0';

                        const visits = a.visits_count || a.visits || 1;
                        const participants = a.participantsCount || 0;
                        const qty = a.quantity || 1;
                        const discount = (a.discountValue != null ? a.discountValue : (a.discount != null ? a.discount : 0)) || 0;

                        const zoneNames = (() => {
                          if (!Array.isArray(a.zone_ids) || !Array.isArray(zonesList) || zonesList.length === 0) return null;
                          const idsSet = new Set(a.zone_ids.map(id => String(id)));
                          const names = zonesList
                            .filter(z => idsSet.has(String(z.zone_id)))
                            .map(z => z.name)
                            .filter(Boolean);
                          if (names.length === 0) return null;
                          if (names.length === zonesList.length) return 'Все зоны';
                          return names.join(', ');
                        })();

                        return (
                          <div className="appointment-hover-card-inner">
                            <div className="ahc-header">
                              <div className="ahc-name">{a.clientName || a.client_name || 'Без имени'}</div>
                              {a.clientPhone && (
                                <div className="ahc-phone">{formatPhoneNumber(a.clientPhone)}</div>
                              )}
                            </div>

                            <div className="ahc-stats-row">
                              <div className="ahc-stat">
                                <div className="ahc-stat-label">Визитов</div>
                                <div className="ahc-stat-value">{visits}</div>
                              </div>
                              <div className="ahc-stat">
                                <div className="ahc-stat-label">Не пришел</div>
                                <div className="ahc-stat-value">0</div>
                              </div>
                              <div className="ahc-stat">
                                <div className="ahc-stat-label">Потратил</div>
                                <div className="ahc-stat-value">0 тг</div>
                              </div>
                            </div>

                            <div className="ahc-stats-row">
                              <div className="ahc-stat">
                                <div className="ahc-stat-label">Участники</div>
                                <div className="ahc-stat-value">{participants}</div>
                              </div>
                              <div className="ahc-stat">
                                <div className="ahc-stat-label">Кол-во сеансов</div>
                                <div className="ahc-stat-value">{qty}</div>
                              </div>
                              <div className="ahc-stat">
                                <div className="ahc-stat-label">Скидка</div>
                                <div className="ahc-stat-value">{discount ? `${discount} тг` : '0 тг'}</div>
                              </div>
                            </div>

                            <div className="ahc-status-buttons">
                              {(() => {
                                const s = a.status || 'pending';
                                const btnClass = (key) =>
                                  'ahc-status-btn' + (s === key ? ' active' : '');
                                return (
                                  <>
                                    <button className={btnClass('pending')}>Ожидание</button>
                                    <button className={btnClass('arrived')}>Пришел</button>
                                    <button className={btnClass('no_show')}>Не пришел</button>
                                    <button className={btnClass('confirmed')}>Подтвердил</button>
                                  </>
                                );
                              })()}
                            </div>

                            <div className="ahc-summary">
                              <div>
                                <div className="ahc-summary-label">Итого</div>
                                <div className="ahc-summary-value">{total} тг</div>
                              </div>
                              <div>
                                <div className="ahc-summary-label">К оплате</div>
                                <div className="ahc-summary-value">{rest || total} тг</div>
                              </div>
                            </div>

                            <div className="ahc-summary-extra">
                              <div className="ahc-summary-label">Предоплата</div>
                              <div className="ahc-summary-value">{prepaid} тг</div>
                            </div>

                            <div className="ahc-pay-row">
                              <button
                                className="ahc-pay-btn"
                                style={{
                                  background: a.is_paid && a.payment_method === 'card' ? '#27ae60' : '#f3f4f6',
                                  color: a.is_paid && a.payment_method === 'card' ? '#fff' : '#888',
                                  fontWeight: a.is_paid && a.payment_method === 'card' ? 700 : 400,
                                  border: a.is_paid && a.payment_method === 'card' ? '2px solid #27ae60' : '1px solid #e0e0e0',
                                  opacity: a.is_paid && a.payment_method === 'card' ? 1 : 0.7,
                                }}
                              >
                                Банковские карты
                              </button>
                              <button
                                className="ahc-pay-btn"
                                style={{
                                  background: a.is_paid && a.payment_method === 'cash' ? '#27ae60' : '#f3f4f6',
                                  color: a.is_paid && a.payment_method === 'cash' ? '#fff' : '#888',
                                  fontWeight: a.is_paid && a.payment_method === 'cash' ? 700 : 400,
                                  border: a.is_paid && a.payment_method === 'cash' ? '2px solid #27ae60' : '1px solid #e0e0e0',
                                  opacity: a.is_paid && a.payment_method === 'cash' ? 1 : 0.7,
                                }}
                              >
                                Наличные
                              </button>
                            </div>

                            <div className="ahc-detail-block">
                              <div className="ahc-detail-time">{a.timeLabel}</div>
                              <div className="ahc-detail-service">{a.serviceTitle}</div>
                              {zoneNames && (
                                <div className="ahc-detail-zones">Зоны: {zoneNames}</div>
                              )}
                              {a.is_paid && (
                                <div className="ahc-detail-paid" style={{marginTop: 6, color: '#27ae60', fontWeight: 600, fontSize: 15}}>
                                  Оплачено{a.payment_method ? ` (${a.payment_method === 'card' ? 'Картой' : a.payment_method === 'cash' ? 'Наличными' : a.payment_method})` : ''}
                                </div>
                              )}
                            </div>

                            {a.comment && (
                              <div className="ahc-comment-block">
                                <div className="ahc-comment-label">Комментарий</div>
                                <div className="ahc-comment-text">{a.comment}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Popup menu */}
                  {popup.visible && (
                    <div
                      ref={popupRef}
                      style={{
                        position: 'absolute',
                        left: popup.x,
                        top: popup.y + 4, // чуть ниже выбранного слота
                        transform: 'translateX(-50%)', // по центру слота
                        zIndex: 50, // поверх сетки, линий и записей
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
                        padding: 0,
                        minWidth: 180,
                        border: 'none',
                      }}
                    >
                      <div style={{
                        display: 'flex', flexDirection: 'column',
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #4cc9f3ff',
                        background: '#fff',
                      }}>
                        <button
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 20px', fontSize: 18, background: '#ffffffff', border: 'none', borderBottom: '0px solid #4cc9f3ff', cursor: 'pointer', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
                          }}
                          onClick={() => {
                            // Проверка доступа к филиалу для user/vip-user
                            if (branchAccessDenied) {
                              toast({
                                title: 'Доступ ограничен',
                                description: `Лицензия филиала истекла ${branchValidUntil ? new Date(branchValidUntil).toLocaleDateString('ru-RU') : ''}. Обратитесь к администратору для продления.`,
                                variant: 'destructive',
                              });
                              setPopup(p => ({ ...p, visible: false }));
                              setSelectedSlot({ row: null, col: null, time: '' });
                              return;
                            }
                            
                            // Открыть BookingDialog
                            setPopup(p => ({ ...p, visible: false }));
                            setSelectedSlot({ row: null, col: null, time: '' });
                            const slotIdx = popup.slotIdx;
                            const zoneIdx = popup.zoneIdx;
                            const slotTime = (() => {
                              if (slotIdx == null) return '';
                              const sch = branchSchedule ? branchSchedule : '10:00-22:00';
                              const [start] = sch.split('-');
                              const [sh, sm] = start.split(':').map(Number);
                              const dt = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), sh, sm, 0, 0);
                              dt.setMinutes(dt.getMinutes() + 15 * slotIdx);
                              return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
                            })();
                            setBookingDialog({
                              open: true,
                              mode: 'create',
                              zone: zonesList[zoneIdx] || null,
                              date: selectedDate.toLocaleDateString('ru-RU'),
                              time: slotTime,
                              appointment: null,
                            });
                          }}
                        >
                          <span style={{display:'inline-flex',alignItems:'center',height:22}}>
                            <img src={require('../assets/icons/user.svg').default} alt="user" width={22} height={22} />
                          </span>
                          Запись
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* BookingDialog */}
      <BookingDialog
        open={bookingDialog.open}
        onClose={() => setBookingDialog(d => ({ ...d, open: false }))}
        zone={bookingDialog.zone}
        date={bookingDialog.date}
        time={bookingDialog.time}
        zones={zonesList}
        mode={bookingDialog.mode}
        appointment={bookingDialog.appointment}
        onClientUpdate={() => {
          // Перезагружаем журнал после обновления данных клиента
          setJournalReloadKey(k => k + 1);
        }}
        onDelete={async ({ appointmentId }) => {
          try {
            if (!appointmentId) return;
            if (!branchId) {
              alert('Не выбран филиал (branchId)');
              return;
            }


            // use API_URL for all API requests

            const res = await fetch(`${API_URL}/appointments/${appointmentId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (!res.ok) {
              const text = await res.text();
              console.error('Delete appointment error:', text);
              toast({ title: 'Ошибка', description: 'Ошибка при удалении записи', variant: 'destructive' });
              return;
            }

            toast({ title: 'Успешно', description: 'Запись удалена' });
            setJournalReloadKey(k => k + 1);
            setBookingDialog(d => ({ ...d, open: false }));
            
            // Уведомляем об обновлении записей для обновления точек на календаре
            window.dispatchEvent(new CustomEvent('appointmentUpdated'));
          } catch (e) {
            console.error('Delete appointment exception:', e);
            toast({ title: 'Ошибка', description: 'Не удалось удалить запись', variant: 'destructive' });
          }
        }}
        onSubmit={async data => {
          try {
            if (!branchId) {
              alert('Не выбран филиал (branchId)');
              return;
            }

    
            // use API_URL for all API requests

            // Формируем start_time и end_time (ISO, Asia/Almaty)
            const timeStr = data.time || '';
            const [time_from, time_to] = timeStr.split('—');
            let zoneIds = [];
            if (Array.isArray(data.zones) && data.zones.length > 0) {
              zoneIds = data.zones.map(z => z.zone_id);
            } else if (data.zone && data.zone.zone_id) {
              zoneIds = [data.zone.zone_id];
            }
            // Формируем ISO строку БЕЗ timezone offset
            // Backend сам добавит правильный offset на основе timezone филиала
            function toBranchISO(dateStr, timeStr) {
              // dateStr: DD.MM.YYYY, timeStr: HH:MM
              if (!dateStr || !timeStr) return null;
              const [d, m, y] = dateStr.split('.').map(Number);
              const [hh, mm] = timeStr.split(':').map(Number);
              
              const year = String(y).padStart(4, '0');
              const month = String(m).padStart(2, '0');
              const day = String(d).padStart(2, '0');
              const hour = String(hh).padStart(2, '0');
              const minute = String(mm).padStart(2, '0');
              
              // Возвращаем ISO БЕЗ Z и БЕЗ offset - backend добавит сам
              return `${year}-${month}-${day}T${hour}:${minute}:00`;
            }
            const start_time = toBranchISO(data.date, time_from);
            const end_time = toBranchISO(data.date, time_to);
            const body = {
              branch_id: Number(branchId),
              zone_ids: zoneIds,
              start_time,
              end_time,
              service_id: data.service?.service_id,
              participants: data.participants,
              quantity: data.quantity,
              final_price: data.finalPrice,
              prepaid: data.prepaid,
              discount: data.discount,
              comment: data.comment,
              status: data.status,
              client: data.client,
              color: data.color,
              is_paid:
                typeof data.is_paid === 'boolean'
                  ? data.is_paid
                  : (data.payment_method === 'card' || data.payment_method === 'cash')
                  ? true
                  : false,
              payment_method:
                data.payment_method === 'card'
                  ? 'card'
                  : data.payment_method === 'cash'
                  ? 'cash'
                  : null,
            };

            const isEdit = bookingDialog.mode === 'edit' && data.appointmentId;

            if (!isEdit) {
              // Создание новой записи: сначала проверяем, свободны ли зоны на это время
              try {
                const checkRes = await fetch(`${API_URL}/appointments/check`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });

                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  if (!checkData.available) {
                    toast({ title: 'Конфликт', description: 'На это время уже есть записи в выбранных зонах. Выберите другое время или зону.', variant: 'destructive' });
                    return;
                  }
                } else {
                  console.warn('Не удалось проверить занятость зон');
                }
              } catch (e) {
                console.warn('Ошибка при проверке занятости зон', e);
              }

              const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
              });

              if (!res.ok) {
                const text = await res.text();
                console.error('Create appointment error:', text);
                toast({ title: 'Ошибка', description: 'Ошибка при создании записи', variant: 'destructive' });
                return;
              }
            } else {
              // Редактирование существующей записи
              const res = await fetch(`${API_URL}/appointments/${data.appointmentId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
              });

              if (!res.ok) {
                const text = await res.text();
                console.error('Update appointment error:', text);
                toast({ title: 'Ошибка', description: 'Ошибка при обновлении записи', variant: 'destructive' });
                return;
              }
            }

            // Успешно создали/обновили запись — перезагружаем журнал и закрываем диалог.
            setJournalReloadKey(k => k + 1);
            // При следующем открытии BookingDialog локальный стейт клиента и других полей будет сброшен.
            setBookingDialog(d => ({ ...d, open: false }));
            
            // Уведомляем об обновлении записей для обновления точек на календаре
            window.dispatchEvent(new CustomEvent('appointmentUpdated'));
          } catch (e) {
            console.error('Create appointment exception:', e);
            toast({ title: 'Ошибка', description: 'Не удалось создать запись', variant: 'destructive' });
          }
        }}
      />
    </div>
  );
}

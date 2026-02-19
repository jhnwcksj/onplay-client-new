
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { toast } from '../hooks/use-toast';
import './Services.css';
// Declare API_URL once at the top
const API_URL = process.env.REACT_APP_API_URL;

export default function Services() {
  useEffect(() => { document.title = 'Услуги'; }, []);

  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zonesList, setZonesList] = useState([]);
  const [serviceZonesMap, setServiceZonesMap] = useState({});
  const [expandedCat, setExpandedCat] = useState(null);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryPricingType, setNewCategoryPricingType] = useState('per_person');
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState(null);
  const [extraPersonEnabled, setExtraPersonEnabled] = useState(false);
  const [extraPersonPrice, setExtraPersonPrice] = useState('');
  const [newCategoryMaxParticipants, setNewCategoryMaxParticipants] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [togglingServiceId, setTogglingServiceId] = useState(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [serviceDialogCategory, setServiceDialogCategory] = useState(null);
  const [serviceDialogSelectedServiceId, setServiceDialogSelectedServiceId] = useState(null);
  const [serviceDialogSelectedCategoryId, setServiceDialogSelectedCategoryId] = useState(null);
  const [serviceDialogName, setServiceDialogName] = useState('');
  const [serviceDialogPricingType, setServiceDialogPricingType] = useState('standard');
  const [serviceDialogHours, setServiceDialogHours] = useState(1);
  const [serviceDialogMinutes, setServiceDialogMinutes] = useState(0);
  const [serviceDialogBasePrice, setServiceDialogBasePrice] = useState('');
  const [serviceDialogUseRange, setServiceDialogUseRange] = useState(false);
  const [serviceDialogPriceRules, setServiceDialogPriceRules] = useState(() => ({
    weekday: { enabled: true, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
    weekend: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
    holiday: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }
  }));
  const [serviceDialogSelectedZoneIds, setServiceDialogSelectedZoneIds] = useState([]);
  const [serviceDialogSaving, setServiceDialogSaving] = useState(false);
  const [serviceDialogWeekOverrides, setServiceDialogWeekOverrides] = useState({});
  // weekOverrides format: { 0: 'weekday', 6: 'weekend', ... } где ключ - weekday (0-6)

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const urlBranchId = query.get('branchId');

  const resolveBranchId = useCallback(() => {
    const saved = localStorage.getItem('selectedBranchId');
    return urlBranchId || saved || '';
  }, [urlBranchId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const branchId = resolveBranchId();
        
        // ВАЖНО: Если branchId не указан, не загружаем услуги - это предотвращает
        // показ всех услуг пользователям без доступа к филиалам
        if (!branchId) {
          if (!mounted) return;
          setCategories([]);
          setError('Необходимо создать Сеть и Филиал для доступа к услугам');
          setLoading(false);
          return;
        }

        // Дополнительная проверка: проверяем доступ пользователя к филиалу
        const stored = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
        const uid = stored?.id || localStorage.getItem('userId');
        
        // Admin bypass: allow access to any branch
        const userRole = stored?.role || 'user';
        if (userRole !== 'admin' && uid) {
          // Загружаем филиалы пользователя для проверки доступа
          const branchesEndpoints = [
            `${API_URL}/users/${uid}/branches`,
            `${API_URL}/branches?userId=${uid}`,
            `${API_URL}/branches?user_id=${uid}`,
          ];
          
          let userHasAccess = false;
          for (const endpoint of branchesEndpoints) {
            try {
              const res = await fetch(endpoint, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
              if (res.ok) {
                const data = await res.json();
                const branches = Array.isArray(data) ? data : (data.branches || data.rows || []);
                const found = branches.find(b => String(b.branch_id || b.id || b.branchId) === String(branchId));
                if (found) {
                  userHasAccess = true;
                  break;
                }
              }
            } catch {}
          }
          
          if (!userHasAccess) {
            if (!mounted) return;
            setCategories([]);
            setError('');
            setLoading(false);
            return;
          }
        }
        
        const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';

        // Получаем категории услуг для филиала
        const url = `${API_URL}/service-categories${q}`;

        const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ошибка при загрузке: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
        }

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        let data;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error('Сервер вернул неожиданный ответ (не JSON). Ответ: ' + text.slice(0,200));
        }

        if (!mounted) return;
        // Для каждой категории загружаем услуги
        const cats = Array.isArray(data) ? data : [];
        // Получаем услуги для каждой категории
        for (const cat of cats) {
          try {
            const servicesRes = await fetch(`${API_URL}/services?categoryId=${cat.category_id}&branchId=${encodeURIComponent(branchId)}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            if (servicesRes.ok) {
              const servicesData = await servicesRes.json();
              // Для каждой услуги загружаем цены
              for (const srv of servicesData) {
                try {
                  const pricesRes = await fetch(`${API_URL}/service-prices?serviceId=${srv.service_id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                  if (pricesRes.ok) {
                    const pricesData = await pricesRes.json();
                    srv.prices = Array.isArray(pricesData) ? pricesData : [];
                  } else {
                    srv.prices = [];
                  }
                } catch {
                  srv.prices = [];
                }
              }
              cat.services = Array.isArray(servicesData) ? servicesData : [];
            } else {
              cat.services = [];
            }
          } catch {
            cat.services = [];
          }
        }
        setCategories(cats);

        // Try to load zones for the branch so we can display zone names per service
        try {
          const zonesUrl = `${API_URL}/zones${q}`;
          const zr = await fetch(zonesUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
          if (zr.ok) {
            const zdata = await zr.json();
            if (mounted) setZonesList(Array.isArray(zdata) ? zdata : []);
          }
        } catch (e) {
          // ignore
        }

        // Try to load service-zone relations in bulk
        try {
          const szUrlCandidates = [`${API_URL}/service-zones${q}`, `${API_URL}/service-zones`];
          let sz = null;
          for (const u of szUrlCandidates) {
            try {
              const r = await fetch(u, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
              if (!r.ok) continue;
              const j = await r.json();
              if (Array.isArray(j)) { sz = j; break; }
              if (j && j.rows) { sz = j.rows; break; }
            } catch (e) { }
          }
          if (sz && mounted) {
            // sz expected to be array of { service_id, zone_id }
            const map = {};
            sz.forEach(item => {
              const sid = item.service_id || item.serviceId || item.serviceId;
              const zid = item.zone_id || item.zoneId || item.zoneId;
              if (!sid || !zid) return;
              if (!map[sid]) map[sid] = [];
              if (!map[sid].includes(zid)) map[sid].push(zid);
            });
            setServiceZonesMap(map);
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        if (!mounted) return;
        // fallback: provide small mock so UI isn't empty when backend missing
        const mock = [
          {
            category_id: 1,
            name: 'VR',
            description: 'Виртуальная реальность',
            services: [
              { service_id: 1, name: 'VR - 30 минут', duration: 30, is_online_available: true, price: 5000 },
              { service_id: 2, name: 'VR - 1 час', duration: 60, is_online_available: true, price: 10000 }
            ]
          }
        ];
        setError(err.message || 'Unknown error');
        setCategories(mock);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [urlBranchId, resolveBranchId]);

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryPricingType('per_person');
    setAddCategoryError(null);
    setExtraPersonEnabled(false);
    setExtraPersonPrice('');
    setNewCategoryMaxParticipants('');
    setShowAddCategoryDialog(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name || '');
    setNewCategoryDescription(cat.description || '');
    setNewCategoryPricingType(cat.pricing_type || 'per_person');
    setNewCategoryMaxParticipants(
      cat.max_participants != null ? String(cat.max_participants) : ''
    );
    if (cat.extra_person_price != null) {
      setExtraPersonEnabled(true);
      setExtraPersonPrice(String(cat.extra_person_price));
    } else {
      setExtraPersonEnabled(false);
      setExtraPersonPrice('');
    }
    setAddCategoryError(null);
    setShowAddCategoryDialog(true);
  };

  const handleCloseAddCategory = () => {
    if (addCategoryLoading) return;
    setEditingCategory(null);
    setShowAddCategoryDialog(false);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      setAddCategoryError('Укажите название категории');
      return;
    }

    const isEdit = !!editingCategory;
    const branchId = resolveBranchId();
    if (!isEdit && !branchId) {
      setAddCategoryError('Не выбран филиал для категории');
      return;
    }

    try {
      setAddCategoryLoading(true);
      setAddCategoryError(null);
      const token = localStorage.getItem('token');


      let extraPriceValue = null;
      if (extraPersonEnabled && extraPersonPrice.trim() !== '') {
        let maxParticipantsValue = null;
        if (newCategoryMaxParticipants.trim() !== '') {
          const parsedMax = parseInt(newCategoryMaxParticipants, 10);
          if (Number.isNaN(parsedMax) || parsedMax <= 0) {
            setAddCategoryError('Введите корректное максимальное количество участников');
            setAddCategoryLoading(false);
            return;
          }
          maxParticipantsValue = parsedMax;
        }

        const parsed = parseFloat(extraPersonPrice.replace(',', '.'));
        if (Number.isNaN(parsed) || parsed < 0) {
          setAddCategoryError('Введите корректную сумму доплаты за каждого');
          setAddCategoryLoading(false);
          return;
        }
        if (!maxParticipantsValue) {
          setAddCategoryError('Укажите максимальное количество участников, чтобы применять доплату свыше лимита');
          setAddCategoryLoading(false);
          return;
        }
        extraPriceValue = parsed;
      }

      const url = isEdit
        ? `${API_URL}/service-categories/${editingCategory.category_id}`
        : `${API_URL}/service-categories`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || null,
        pricing_type: newCategoryPricingType,
        max_participants: extraPersonEnabled && newCategoryMaxParticipants.trim() !== ''
          ? parseInt(newCategoryMaxParticipants, 10)
          : null,
        extra_person_price: extraPriceValue
      };

      if (!isEdit) {
        payload.branchId = branchId;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        const action = isEdit ? 'сохранении' : 'создании';
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: `Не удалось ${isEdit ? 'сохранить' : 'создать'} категорию`
        });
        throw new Error(`Ошибка при ${action}: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      const saved = await res.json();
      setCategories(prev => {
        const list = Array.isArray(prev) ? prev : [];
        if (isEdit) {
          return list.map(cat =>
            cat.category_id === saved.category_id
              ? { ...cat, ...saved }
              : cat
          );
        }
        const withServices = { ...saved, services: [] };
        return [...list, withServices];
      });

      toast({
        variant: 'success',
        title: 'Успешно',
        description: `Категория ${isEdit ? 'обновлена' : 'создана'}`
      });

      setEditingCategory(null);
      setShowAddCategoryDialog(false);
    } catch (e) {
      setAddCategoryError(e.message || (editingCategory ? 'Не удалось сохранить категорию' : 'Не удалось создать категорию'));
    } finally {
      setAddCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    const confirmed = window.confirm('Удалить эту категорию и связанные услуги?');
    if (!confirmed) return;

    try {
      setAddCategoryLoading(true);
      setAddCategoryError(null);
      const token = localStorage.getItem('token');

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/service-categories/${editingCategory.category_id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const text = await res.text();
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось удалить категорию'
        });
        throw new Error(`Ошибка при удалении: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      setCategories(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.filter(cat => cat.category_id !== editingCategory.category_id);
      });

      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Категория удалена'
      });

      setEditingCategory(null);
      setShowAddCategoryDialog(false);
    } catch (e) {
      setAddCategoryError(e.message || 'Не удалось удалить категорию');
    } finally {
      setAddCategoryLoading(false);
    }
  };

  const handleOpenServiceDialog = (category) => {
    setServiceDialogCategory(category);
    setServiceDialogSelectedCategoryId(category?.category_id ?? null);
    setServiceDialogSelectedServiceId(null);
    setServiceDialogName('');
    setServiceDialogPricingType(category?.pricing_type || 'standard');
    setServiceDialogBasePrice('');
    setServiceDialogUseRange(false);
    setServiceDialogPriceRules({
      weekday: { enabled: true, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
      weekend: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
      holiday: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }
    });
    setServiceDialogSelectedZoneIds([]);
    setServiceDialogSaving(false);
    setServiceDialogWeekOverrides({});
    setShowServiceDialog(true);
  };

  const handleCloseServiceDialog = () => {
    setShowServiceDialog(false);
    setServiceDialogCategory(null);
    setServiceDialogSelectedServiceId(null);
    setServiceDialogSelectedCategoryId(null);
    setServiceDialogName('');
    setServiceDialogHours(1);
    setServiceDialogMinutes(0);
    setServiceDialogBasePrice('');
    setServiceDialogUseRange(false);
    setServiceDialogPriceRules({
      weekday: { enabled: true, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
      weekend: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
      holiday: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }
    });
    setServiceDialogSelectedZoneIds([]);
    setServiceDialogSaving(false);
    setServiceDialogPricingType('standard');
  };

  // Форматирование ввода времени в формате ЧЧ:ММ с автодобавлением двоеточия
  const formatTimeInput = (raw, isEnd = false) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';

    // 1–2 цифры — считаем, что пользователь вводит часы
    if (digits.length === 1 || digits.length === 2) {
      return digits;
    }

    // 3 цифры — ЧЧ:М (пользователь только начал вводить минуты)
    if (digits.length === 3) {
      let h = parseInt(digits.slice(0, 2), 10);
      const m1 = digits.slice(2, 3);
      if (!Number.isFinite(h)) h = 0;
      if (h < 0) h = 0;
      if (h > 24) h = 24;
      // Для 24 часов минуты могут быть только 00 — пока показываем "24:0"
      if (h === 24) {
        return '24:0';
      }
      const hh = String(h).padStart(2, '0');
      return `${hh}:${m1}`;
    }

    // 4 цифры — полноценное ЧЧ:ММ
    let h = parseInt(digits.slice(0, 2), 10);
    let m = parseInt(digits.slice(2, 4), 10);
    if (!Number.isFinite(h)) h = 0;
    if (!Number.isFinite(m)) m = 0;
    if (h < 0) h = 0;
    if (h > 24) h = 24;
    if (h === 24) {
      // 24:00 — специальное значение "до конца дня"
      m = 0;
    } else {
      if (m < 0) m = 0;
      if (m > 59) m = 59;
    }
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const buildServicePriceRulesPayload = () => {
    const result = [];
    const dayKeys = ['weekday', 'weekend', 'holiday'];

    const parseTime = (raw, isEnd = false) => {
      const v = (raw || '').trim();
      if (!v) return null;
      // 24:00 трактуем как "до конца дня" (NULL в БД)
      if (v === '24:00') return null;
      const m = v.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      let hh = parseInt(m[1], 10);
      let mm = parseInt(m[2], 10);
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
      if (hh < 0 || hh > 23) return null;
      if (mm < 0 || mm > 59) return null;
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };

    if (serviceDialogUseRange) {
      dayKeys.forEach(dayKey => {
        const rule = serviceDialogPriceRules[dayKey];
        if (!rule || !rule.enabled) return;
        const rows = Array.isArray(rule.rows) ? rule.rows : [];
        rows.forEach(r => {
          let price = r.price;
          if (typeof price === 'string') {
            price = parseInt(price, 10);
          }
          if (!Number.isFinite(price) || price <= 0) return;
          const rawFrom = (r.timeFrom || '').trim();
          const rawTo = (r.timeTo || '').trim();
          // 24:00 для конца интервала трактуем как "до конца дня" (time_to = NULL)
          const timeFrom = rawFrom === '24:00' ? null : parseTime(rawFrom, false);
          const timeTo = rawTo === '24:00' ? null : parseTime(rawTo, true);
          result.push({
            day_type: dayKey,
            time_from: timeFrom,
            time_to: timeTo,
            price
          });
        });
      });
    } else if (serviceDialogBasePrice) {
      let base = serviceDialogBasePrice;
      if (typeof base === 'string') {
        base = parseInt(base.replace(',', '.'), 10);
      }
      if (Number.isFinite(base) && base > 0) {
        dayKeys.forEach(dayKey => {
          result.push({
            day_type: dayKey,
            time_from: null,
            time_to: null,
            price: base
          });
        });
      }
    }

    return result;
  };

  const openServiceEditor = async (category, service) => {
    if (!service) return;

    const serviceId = service.service_id;

    setServiceDialogCategory(category || null);
    const baseCategoryId = (category && category.category_id) || service.category_id || null;
    setServiceDialogSelectedCategoryId(baseCategoryId);
    setServiceDialogSelectedServiceId(serviceId);
    setServiceDialogName(service.name || '');
    setServiceDialogPricingType(service.pricing_type || (category && category.pricing_type) || 'standard');

    const rawDuration = typeof service.duration === 'number'
      ? service.duration
      : parseInt(service.duration, 10) || 0;
    const hours = Math.floor(rawDuration / 60);
    const minutes = rawDuration % 60;
    setServiceDialogHours(hours);
    setServiceDialogMinutes(minutes);

    let initialZoneIds = [];
    if (Array.isArray(service.zones) && service.zones.length) {
      initialZoneIds = service.zones
        .map(z => z.zone_id || z.id)
        .filter(Boolean);
    } else if (serviceZonesMap && serviceZonesMap[serviceId]) {
      initialZoneIds = serviceZonesMap[serviceId];
    }
    setServiceDialogSelectedZoneIds(Array.isArray(initialZoneIds) ? initialZoneIds : []);

    setServiceDialogSaving(false);

    // Базовое состояние цен до загрузки правил
    setServiceDialogUseRange(false);
    setServiceDialogBasePrice('');
    setServiceDialogPriceRules({
      weekday: { enabled: true, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
      weekend: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
      holiday: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }
    });

    setShowServiceDialog(true);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/service-prices?serviceId=${serviceId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) return;
      const rules = await res.json();
      if (!Array.isArray(rules) || !rules.length) return;

      const numericPrices = rules
        .map(r => (typeof r.price === 'number' ? r.price : parseFloat(String(r.price).replace(',', '.'))))
        .filter(v => !Number.isNaN(v));
      const hasTime = rules.some(r => r.time_from || r.timeTo || r.time_from || r.time_to);
      const uniquePrices = Array.from(new Set(numericPrices));

      // Если нет разбивки по времени и цена везде одна и та же — считаем это базовой ценой
      if (!hasTime && uniquePrices.length === 1) {
        const basePrice = uniquePrices[0];
        setServiceDialogBasePrice(String(basePrice));
        setServiceDialogUseRange(false);
        setServiceDialogPriceRules({
          weekday: { enabled: true, rows: [{ price: basePrice, timeFrom: '', timeTo: '' }] },
          weekend: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
          holiday: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }
        });
        return;
      }

      const nextRules = {
        weekday: { enabled: false, rows: [] },
        weekend: { enabled: false, rows: [] },
        holiday: { enabled: false, rows: [] }
      };

      const normalizeTime = (t, isEnd = false) => {
        if (!t) {
          // Для интервала "до конца дня" храним NULL, но в UI показываем 24:00
          return isEnd ? '24:00' : '';
        }
        const str = String(t);
        const [hh, mm] = str.split(':');
        if (hh != null && mm != null) {
          return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        }
        return str;
      };

      rules.forEach(r => {
        const dayRaw = r.day_type || r.dayType;
        if (!dayRaw) return;
        const dayKey = String(dayRaw).toLowerCase();
        if (!(dayKey in nextRules)) return;

        let price = r.price;
        if (typeof price !== 'number') {
          price = parseFloat(String(price).replace(',', '.'));
        }
        if (!Number.isFinite(price)) return;

        nextRules[dayKey].enabled = true;
        nextRules[dayKey].rows.push({
          price: String(price),
          timeFrom: normalizeTime(r.time_from || r.timeFrom || null, false),
          timeTo: normalizeTime(r.time_to || r.timeTo || null, true)
        });
      });

      ['weekday', 'weekend', 'holiday'].forEach(key => {
        if (!nextRules[key].rows.length) {
          nextRules[key].rows.push({ price: '', timeFrom: '', timeTo: '' });
        }
      });

      setServiceDialogUseRange(true);
      setServiceDialogPriceRules(nextRules);
      
      // Загружаем week overrides для услуги
      try {
        const overridesRes = await fetch(`${API_URL}/services/${serviceId}/week-overrides`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (overridesRes.ok) {
          const overridesData = await overridesRes.json();
          const overrides = {};
          if (Array.isArray(overridesData.overrides)) {
            overridesData.overrides.forEach(o => {
              overrides[o.weekday] = o.override_day_type;
            });
          }
          setServiceDialogWeekOverrides(overrides);
        }
      } catch (err) {
        console.error('Error loading week overrides:', err);
      }
    } catch (e) {
      // Если не удалось загрузить правила — оставляем базовое состояние
    }
  };

  const handleCreateService = async () => {
    if (serviceDialogSaving) return;
    const name = (serviceDialogName || '').trim();
    if (!name) return;

    const currentCatId = serviceDialogSelectedCategoryId || (serviceDialogCategory && serviceDialogCategory.category_id);
    if (!currentCatId) {
      toast({ title: 'Ошибка', description: 'Не выбрана категория услуги', variant: 'destructive' });
      return;
    }

    const branchId = resolveBranchId();
    const durationMinutes = (Number(serviceDialogHours) || 0) * 60 + (Number(serviceDialogMinutes) || 0);
    const priceRulesPayload = buildServicePriceRulesPayload();

    try {
      setServiceDialogSaving(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          categoryId: currentCatId,
          name,
          description: null,
          durationMinutes,
          is_online_available: true,
          zoneIds: serviceDialogSelectedZoneIds,
          priceRules: priceRulesPayload,
          branchId,
          pricing_type: serviceDialogPricingType
        })
      });

      if (!res.ok) {
        const text = await res.text();
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось создать услугу'
        });
        throw new Error(`Ошибка при создании услуги: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      const created = await res.json();

      // Сохраняем переопределения дней недели для новой услуги
      const serviceIdForOverrides = created.service_id;
      if (serviceIdForOverrides) {
        try {
          // Проходим по всем дням недели (0-6)
          for (let weekday = 0; weekday <= 6; weekday++) {
            if (serviceDialogWeekOverrides[weekday]) {
              // Есть переопределение - сохраняем
              await fetch(`${API_URL}/services/${serviceIdForOverrides}/week-overrides`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ weekday, override_day_type: serviceDialogWeekOverrides[weekday] })
              });
            } else {
              // Нет переопределения - удаляем если есть
              await fetch(`${API_URL}/services/${serviceIdForOverrides}/week-overrides/${weekday}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              }).catch(() => {}); // Игнорируем ошибку если записи нет
            }
          }
        } catch (err) {
          console.error('Error saving week overrides:', err);
        }
      }

      setCategories(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(cat => {
          if (cat.category_id !== currentCatId) return cat;
          const prices = Array.isArray(priceRulesPayload)
            ? priceRulesPayload.map(r => ({ price: r.price }))
            : [];
          const newService = { ...created, prices };
          const services = Array.isArray(cat.services) ? [...cat.services, newService] : [newService];
          return { ...cat, services };
        });
      });

      // Обновляем карту связей услуга–зоны, чтобы сразу видеть зоны без перезагрузки страницы
      setServiceZonesMap(prev => ({
        ...(prev || {}),
        [created.service_id]: Array.isArray(serviceDialogSelectedZoneIds)
          ? [...serviceDialogSelectedZoneIds]
          : []
      }));

      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Услуга создана'
      });

      handleCloseServiceDialog();
    } catch (e) {
      toast({ title: 'Ошибка', description: e.message || 'Не удалось создать услугу', variant: 'destructive' });
      setServiceDialogSaving(false);
    }
  };

  const handleUpdateService = async () => {
    if (serviceDialogSaving) return;

    const serviceId = serviceDialogSelectedServiceId;
    if (!serviceId) return;

    const name = (serviceDialogName || '').trim();
    if (!name) return;

    const originalCatId = serviceDialogCategory && serviceDialogCategory.category_id;
    const currentCatId = serviceDialogSelectedCategoryId || originalCatId;

    if (!currentCatId) {
      toast({ title: 'Ошибка', description: 'Не выбрана категория услуги', variant: 'destructive' });
      return;
    }

    const branchId = resolveBranchId();
    const durationMinutes = (Number(serviceDialogHours) || 0) * 60 + (Number(serviceDialogMinutes) || 0);
    const priceRulesPayload = buildServicePriceRulesPayload();

    try {
      setServiceDialogSaving(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          categoryId: currentCatId,
          name,
          description: null,
          durationMinutes,
          is_online_available: true,
          zoneIds: serviceDialogSelectedZoneIds,
          priceRules: priceRulesPayload,
          branchId,
          pricing_type: serviceDialogPricingType
        })
      });

      if (!res.ok) {
        const text = await res.text();
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось сохранить услугу'
        });
        throw new Error(`Ошибка при сохранении услуги: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      const updated = await res.json();

      // Сохраняем переопределения дней недели для услуги
      // Проходим по всем дням недели (0-6)
      for (let weekday = 0; weekday <= 6; weekday++) {
        if (serviceDialogWeekOverrides[weekday]) {
          // Есть переопределение - сохраняем
          await fetch(`${API_URL}/services/${serviceId}/week-overrides`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ weekday, override_day_type: serviceDialogWeekOverrides[weekday] })
          });
        } else {
          // Нет переопределения - удаляем если есть
          await fetch(`${API_URL}/services/${serviceId}/week-overrides/${weekday}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          }).catch(() => {}); // Игнорируем ошибку если записи нет
        }
      }

      setCategories(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(cat => {
          const catId = cat.category_id;
          let services = Array.isArray(cat.services) ? [...cat.services] : [];

          // Если категория изменилась — удаляем из старой
          if (originalCatId && catId === originalCatId && originalCatId !== currentCatId) {
            services = services.filter(s => s.service_id !== serviceId);
          }

          if (catId === currentCatId) {
            const prices = Array.isArray(priceRulesPayload)
              ? priceRulesPayload.map(r => ({ price: r.price }))
              : [];
            const updatedService = { ...updated, prices };
            const index = services.findIndex(s => s.service_id === serviceId);
            if (index !== -1) {
              services[index] = { ...services[index], ...updatedService };
            } else {
              services.push(updatedService);
            }
            return { ...cat, services };
          }

          return { ...cat, services };
        });
      });

      setServiceZonesMap(prev => ({
        ...(prev || {}),
        [serviceId]: Array.isArray(serviceDialogSelectedZoneIds)
          ? [...serviceDialogSelectedZoneIds]
          : []
      }));

      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Услуга обновлена'
      });

      handleCloseServiceDialog();
    } catch (e) {
      toast({ title: 'Ошибка', description: e.message || 'Не удалось сохранить услугу', variant: 'destructive' });
      setServiceDialogSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (serviceDialogSaving) return;
    const serviceId = serviceDialogSelectedServiceId;
    if (!serviceId) return;

    const confirmed = window.confirm('Удалить эту услугу? Это действие нельзя отменить.');
    if (!confirmed) return;

    try {
      setServiceDialogSaving(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const text = await res.text();
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось удалить услугу'
        });
        throw new Error(`Ошибка при удалении услуги: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      setCategories(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(cat => {
          const services = Array.isArray(cat.services)
            ? cat.services.filter(s => s.service_id !== serviceId)
            : cat.services;
          return { ...cat, services };
        });
      });

      setServiceZonesMap(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });

      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Услуга удалена'
      });

      handleCloseServiceDialog();
    } catch (e) {
      toast({ title: 'Ошибка', description: e.message || 'Не удалось удалить услугу', variant: 'destructive' });
      setServiceDialogSaving(false);
    }
  };

  const updateServicePriceRule = (dayKey, patch) => {
    setServiceDialogPriceRules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        ...patch
      }
    }));
  };

  const updateServicePriceRow = (dayKey, rowIndex, patch) => {
    setServiceDialogPriceRules(prev => {
      const current = prev[dayKey] || { enabled: false, rows: [] };
      const rows = Array.isArray(current.rows) && current.rows.length
        ? current.rows.map((r, i) => (i === rowIndex ? { ...r, ...patch } : r))
        : [{ ...patch }];
      return {
        ...prev,
        [dayKey]: {
          ...current,
          rows
        }
      };
    });
  };

  const addServicePriceRow = (dayKey) => {
    setServiceDialogPriceRules(prev => {
      const current = prev[dayKey] || { enabled: false, rows: [] };
      const rows = Array.isArray(current.rows) && current.rows.length
        ? [...current.rows, { price: '', timeFrom: '', timeTo: '' }]
        : [{ price: '', timeFrom: '', timeTo: '' }];
      return {
        ...prev,
        [dayKey]: {
          ...current,
          rows
        }
      };
    });
  };

  const removeServicePriceRow = (dayKey, rowIndex) => {
    setServiceDialogPriceRules(prev => {
      const current = prev[dayKey] || { enabled: false, rows: [] };
      const rows = Array.isArray(current.rows) ? current.rows.slice() : [];
      if (rows.length <= 1) return prev;
      rows.splice(rowIndex, 1);
      return {
        ...prev,
        [dayKey]: {
          ...current,
          rows
        }
      };
    });
  };

  const handleToggleServiceOnline = async (catId, service) => {
    const current = !!service.is_online_available;
    const next = !current;

    try {
      setTogglingServiceId(service.service_id);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/services/${service.service_id}/online`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_online_available: next })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Не удалось изменить онлайн-запись: ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
      }

      const updated = await res.json();
      setCategories(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(cat => {
          if (cat.category_id !== catId) return cat;
          const services = Array.isArray(cat.services) ? cat.services.map(s =>
            s.service_id === service.service_id
              ? { ...s, is_online_available: updated.is_online_available }
              : s
          ) : cat.services;
          return { ...cat, services };
        });
      });
    } catch (e) {
      setError(e.message || 'Не удалось изменить онлайн-запись');
    } finally {
      setTogglingServiceId(null);
    }
  };

  const isCreateDisabled =
    !serviceDialogName ||
    !serviceDialogName.trim() ||
    serviceDialogSaving;

  // Determine whether the current app theme/background is dark and respond to changes
  const darkThemeKeys = React.useMemo(() => new Set(['dark', 'purple', 'ocean', 'sunset']), []);
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
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = (e) => {
      try {
        if (e && e.detail && typeof e.detail.isDark !== 'undefined') {
          setIsDarkTheme(Boolean(e.detail.isDark));
          return;
        }
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

  const userName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Пользователь';
  const userEmail = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'email@example.com';
  const userRole = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role || 'user' : 'user';

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

      <div className={`services-content ${isDarkTheme ? 'dark-theme' : ''}`}>
        {!resolveBranchId() ? (
          <div className="services-no-branch">
            <h2>Необходимо создать сеть и филиал</h2>
            <p>Для работы с услугами требуется сначала создать сеть и филиал.</p>
            <p>Перейдите в настройки для создания сети и филиала.</p>
          </div>
        ) : (
          <>
        <div className="services-header">
          <div className="services-burger">☰</div>
          <h1>Услуги</h1>
          <div className="services-actions">
            <button
              className="btn-primary"
              type="button"
              onClick={handleOpenAddCategory}
            >
              + Добавить категорию
            </button>
          </div>
        </div>

        <div className="services-search-bar">
          {/* <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Введите название услуги" />
          </div> */}
          {/* <button className="create-btn">Создать</button> */}
        </div>
        <div className="services-list">
          {loading && <div className="services-empty">Загрузка...</div>}
          {error && <div className="services-empty error">{error}</div>}

          {!loading && !error && categories && categories.length === 0 && (
            <div className="services-empty">Категории услуг не найдены.</div>
          )}

          {!loading && !error && categories && categories.map((cat) => (
            <div key={cat.category_id} className="service-category-card">
              <div className="service-category-header" onClick={() => setExpandedCat(expandedCat === cat.category_id ? null : cat.category_id)}>
                <span className="drag-handle">⋮⋮</span>
                <span className="service-category-title">{cat.name}</span>
                <button
                  type="button"
                  className="service-category-edit-btn"
                  onClick={(e) => { e.stopPropagation(); handleOpenEditCategory(cat); }}
                >
                  Изменить
                </button>
                <span className="service-category-count">Содержит услуг: {cat.services ? cat.services.length : 0}</span>
                <span className="expand-arrow">{expandedCat === cat.category_id ? '▲' : '▼'}</span>
              </div>
              {expandedCat === cat.category_id && (
                <div className="service-table">
                  <div className="service-table-head">
                    <div>Имя</div>
                    <div>Онлайн-запись</div>
                    <div>Цена</div>
                    <div>Длительность</div>
                    <div>Зоны</div>
                  </div>
                  {cat.services && cat.services.map(s => {
                    let zoneNames = [];
                    if (s.zones && Array.isArray(s.zones) && s.zones.length) {
                      zoneNames = s.zones.map(z => z.name || z.zone_name || z.name);
                    } else if (serviceZonesMap && serviceZonesMap[s.service_id]) {
                      const ids = serviceZonesMap[s.service_id];
                      zoneNames = ids.map(id => {
                        const z = zonesList.find(x => x.zone_id === id || x.id === id);
                        return z ? (z.name || z.zone_name) : String(id);
                      });
                    }
                    // Форматируем цену как диапазон
                    let priceText = '—';
                    if (s.prices && s.prices.length) {
                      const values = s.prices
                        .map(p => (typeof p.price === 'number' ? p.price : parseFloat(p.price)))
                        .filter(v => !Number.isNaN(v));
                      if (values.length) {
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const fmt = (v) => `${v.toLocaleString()} ₸`;
                        priceText = (min === max) ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
                      }
                    }
                    return (
                      <div key={s.service_id} className="service-row">
                        <div className="service-name">{s.name}</div>
                        <div
                          className={`service-online ${togglingServiceId === s.service_id ? 'is-busy' : ''}`}
                          onClick={() => handleToggleServiceOnline(cat.category_id, s)}
                        >
                          <span
                            className={`toggle ${s.is_online_available ? 'on' : 'off'}`}
                          >
                            <span className="toggle-knob" />
                          </span>
                          <span className="service-online-label">
                            {s.is_online_available ? 'Вкл' : 'Выкл'}
                          </span>
                        </div>
                        <div className="service-price">{priceText}</div>
                        <div className="service-duration">{s.duration ? `${Math.floor(s.duration/60)}ч ${s.duration%60}мин.` : '-'}</div>
                        <div className="service-zones">
                          {zoneNames.length ? zoneNames.join(', ') : '—'}
                          <button
                            type="button"
                            className="service-zones-edit-btn"
                            title="Редактировать услугу"
                            onClick={() => openServiceEditor(cat, s)}
                          >
                            ✎
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="service-row service-add-row">
                    <button
                      type="button"
                      className="service-add-button"
                      onClick={() => handleOpenServiceDialog(cat)}
                    >
                      <span className="service-add-icon">+</span>
                      Добавить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {showAddCategoryDialog && (
          <div className="services-dialog-backdrop" onClick={handleCloseAddCategory}>
            <div
              className="services-dialog"
              role="dialog"
              aria-modal="true"
              onClick={e => e.stopPropagation()}
            >
              <div className="services-dialog-header">
                <h2>{editingCategory ? 'Настройки категории' : 'Новая категория услуг'}</h2>
                <button
                  type="button"
                  className="services-dialog-close"
                  onClick={handleCloseAddCategory}
                  disabled={addCategoryLoading}
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>
              <div className="services-dialog-body">
                <label className="services-dialog-field">
                  <span>Название категории</span>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Например, VR-зона"
                  />
                </label>

                <label className="services-dialog-field">
                  <span>Описание (необязательно)</span>
                  <textarea
                    rows={3}
                    value={newCategoryDescription}
                    onChange={e => setNewCategoryDescription(e.target.value)}
                    placeholder="Краткое описание категории"
                  />
                </label>

                <label className="services-dialog-field">
                  <span>Тип цены</span>
                  <select
                    value={newCategoryPricingType}
                    onChange={e => setNewCategoryPricingType(e.target.value)}
                  >
                    <option value="standard">Обычный</option>
                    <option value="per_person">С человека</option>
                    <option value="package">Пакет</option>
                  </select>
                </label>

                {extraPersonEnabled ? (
                  <div className="services-dialog-section">
                    <div className="services-dialog-section-header">
                      <div className="services-dialog-section-title">Лимит и доплата</div>
                      <div className="services-dialog-section-subtitle">
                        Максимум участников и доплата за каждого сверх лимита.
                      </div>
                    </div>
                    <div className="services-dialog-two-cols">
                      <label className="services-dialog-field">
                        <span>Макс кол-во участников</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={newCategoryMaxParticipants}
                          onChange={e => setNewCategoryMaxParticipants(e.target.value)}
                          placeholder="Например, 4"
                        />
                      </label>
                      <label className="services-dialog-field">
                        <span>Доплата за каждого сверх (тг)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={extraPersonPrice}
                          onChange={e => setExtraPersonPrice(e.target.value)}
                          placeholder="Например, 5000"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="services-dialog-link services-dialog-link-remove"
                      onClick={() => { setExtraPersonEnabled(false); setExtraPersonPrice(''); }}
                      disabled={addCategoryLoading}
                    >
                      Убрать доплату
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="services-dialog-link"
                    onClick={() => setExtraPersonEnabled(true)}
                    disabled={addCategoryLoading}
                  >
                    + Доплата за каждого сверх лимита
                  </button>
                )}

                {addCategoryError && (
                  <div className="services-dialog-error">{addCategoryError}</div>
                )}
              </div>
              <div className="services-dialog-actions">
                {editingCategory && (
                  <button
                    type="button"
                    className="services-dialog-btn danger"
                    onClick={handleDeleteCategory}
                    disabled={addCategoryLoading}
                  >
                    Удалить
                  </button>
                )}
                <button
                  type="button"
                  className="services-dialog-btn secondary"
                  onClick={handleCloseAddCategory}
                  disabled={addCategoryLoading}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="services-dialog-btn primary"
                  onClick={handleSaveCategory}
                  disabled={addCategoryLoading}
                >
                  {addCategoryLoading
                    ? (editingCategory ? 'Сохранение...' : 'Создание...')
                    : (editingCategory ? 'Сохранить' : 'Создать')}
                </button>
              </div>
            </div>
          </div>
        )}
        {showServiceDialog && serviceDialogCategory && (
          <div className="service-editor-backdrop" onClick={handleCloseServiceDialog}>
            <div
              className="service-editor-dialog"
              role="dialog"
              aria-modal="true"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const priceDayTypes = [
                  { key: 'weekday', label: 'Будние' },
                  { key: 'weekend', label: 'Выходные' },
                  { key: 'holiday', label: 'Праздничные дни' }
                ];
                const allRangePrices = Object.values(serviceDialogPriceRules || {}).flatMap(rule => {
                  if (!rule || !Array.isArray(rule.rows)) return [];
                  return rule.rows
                    .map(r => (typeof r.price === 'number' ? r.price : parseFloat(r.price)))
                    .filter(v => !Number.isNaN(v));
                });
                let basePriceSummary = '';
                if (allRangePrices.length) {
                  const min = Math.min(...allRangePrices);
                  const max = Math.max(...allRangePrices);
                  const fmt = (v) => v.toLocaleString('ru-RU');
                  basePriceSummary = (min === max) ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
                }
                const currentCatId = serviceDialogSelectedCategoryId || (serviceDialogCategory && serviceDialogCategory.category_id);
                const currentCategory = (Array.isArray(categories) && currentCatId)
                  ? categories.find(c => c.category_id === currentCatId) || serviceDialogCategory
                  : serviceDialogCategory;
                const currentServices = currentCategory && Array.isArray(currentCategory.services)
                  ? currentCategory.services
                  : [];

                return (
              <div className="service-editor-layout">
                <aside className="service-editor-sidebar">
                  <div className="service-editor-sidebar-title">
                    {currentCategory ? currentCategory.name : ''}
                  </div>
                  <div className="service-editor-list">
                    {currentServices.length > 0 ? (
                      currentServices.map(s => (
                        <button
                          key={s.service_id}
                          type="button"
                          className={
                            `service-editor-list-item ${serviceDialogSelectedServiceId === s.service_id ? 'active' : ''}`
                          }
                          onClick={() => openServiceEditor(currentCategory, s)}
                        >
                          {s.name}
                        </button>
                      ))
                    ) : (
                      <div className="service-editor-list-empty">
                        В этой категории пока нет услуг.
                      </div>
                    )}

                    {currentCategory && (
                      <button
                        type="button"
                        className="service-editor-create-btn"
                        onClick={() => handleOpenServiceDialog(currentCategory)}
                      >
                        + Создать услугу
                      </button>
                    )}
                  </div>
                </aside>
                <section className="service-editor-main">
                  <div className="service-editor-main-header">
                    <h2>{serviceDialogSelectedServiceId ? 'Редактирование услуги' : 'Новая услуга'}</h2>
                    <button
                      type="button"
                      className="service-editor-close"
                      onClick={handleCloseServiceDialog}
                      aria-label="Закрыть"
                    >
                      ×
                    </button>
                  </div>
                  <div className="service-editor-tabs">
                    <button type="button" className="service-editor-tab active">Основные настройки</button>
                    <button type="button" className="service-editor-tab" disabled>Онлайн-запись</button>
                    <button type="button" className="service-editor-tab" disabled>Расширенные настройки</button>
                  </div>
                  <div className="service-editor-form">
                    <div className="service-editor-form-row">
                      <label className="service-editor-field">
                        <span>Название</span>
                          <input
                            type="text"
                            placeholder="Например, VR"
                            value={serviceDialogName}
                            onChange={e => setServiceDialogName(e.target.value)}
                          />
                      </label>
                    </div>
                    <div className="service-editor-form-row">
                      <label className="service-editor-field">
                        <span>Категория</span>
                        <select
                          value={currentCatId || ''}
                          onChange={e => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : null;
                            setServiceDialogSelectedCategoryId(Number.isNaN(val) ? null : val);
                            setServiceDialogSelectedServiceId(null);
                          }}
                        >
                          {Array.isArray(categories) && categories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="service-editor-form-row">
                      <label className="service-editor-field">
                        <span>Тип услуги</span>
                        <select
                          value={serviceDialogPricingType}
                          onChange={e => setServiceDialogPricingType(e.target.value)}
                        >
                          <option value="standard">Обычный</option>
                          <option value="per_person">С человека</option>
                          <option value="package">Пакет</option>
                        </select>
                      </label>
                    </div>
                    <div className="service-editor-form-row service-editor-form-row-price">
                      <div className="service-editor-field service-editor-price-field">
                        <div className="service-editor-label-row">
                          <span>Базовая цена</span>
                          
                        </div>
                        <div className="service-editor-price-input-wrap">
                          <input
                            type={serviceDialogUseRange ? 'text' : 'number'}
                            min={serviceDialogUseRange ? undefined : "0"}
                            placeholder={serviceDialogUseRange ? (basePriceSummary || '0 тг') : '0 тг'}
                            value={serviceDialogUseRange ? (basePriceSummary || '') : serviceDialogBasePrice}
                            onChange={e => {
                              if (!serviceDialogUseRange) {
                                setServiceDialogBasePrice(e.target.value);
                              }
                            }}
                            disabled={serviceDialogUseRange}
                          />
                          {/* <span className="service-editor-price-suffix">₸</span> */}
                        </div>
                        <button
                          type="button"
                          className={`service-editor-price-toggle ${serviceDialogUseRange ? 'active' : ''}`}
                          onClick={() => {
                            const checked = !serviceDialogUseRange;
                            setServiceDialogUseRange(checked);
                            if (checked && serviceDialogBasePrice) {
                              setServiceDialogPriceRules(prev => {
                                const bp = serviceDialogBasePrice;
                                return {
                                  weekday: {
                                    ...(prev.weekday || { enabled: true, rows: [{ price: '', timeFrom: '', timeTo: '' }] }),
                                    enabled: true,
                                    rows: (prev.weekday?.rows && prev.weekday.rows.length
                                      ? [{
                                          ...prev.weekday.rows[0],
                                          price: prev.weekday.rows[0].price || bp
                                        },
                                        ...prev.weekday.rows.slice(1)]
                                      : [{ price: bp, timeFrom: '', timeTo: '' }])
                                  },
                                  weekend: {
                                    ...(prev.weekend || { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }),
                                    rows: (prev.weekend?.rows && prev.weekend.rows.length
                                      ? prev.weekend.rows
                                      : [{ price: '', timeFrom: '', timeTo: '' }])
                                  },
                                  holiday: {
                                    ...(prev.holiday || { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }),
                                    rows: (prev.holiday?.rows && prev.holiday.rows.length
                                      ? prev.holiday.rows
                                      : [{ price: '', timeFrom: '', timeTo: '' }])
                                  }
                                };
                              });
                            }
                            if (!checked) {
                              setServiceDialogPriceRules({
                                weekday: { enabled: true, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
                                weekend: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] },
                                holiday: { enabled: false, rows: [{ price: '', timeFrom: '', timeTo: '' }] }
                              });
                            }
                          }}
                        >
                          <span className="service-editor-price-toggle-checkbox">
                            {serviceDialogUseRange && <span className="service-editor-price-toggle-check" />}
                          </span>
                          <span className="service-editor-price-toggle-label">Указать цену в диапазоне</span>
                        </button>
                      </div>
                      {serviceDialogUseRange && (
                        <div className="service-editor-price-range-block">
                          <div className="service-editor-price-range-header">
                            <div className="service-editor-price-range-title">Диапазон цен по дням</div>
                            <div className="service-editor-price-range-subtitle">
                              Задайте разные цены для будней, выходных и праздничных дней.
                            </div>
                          </div>
                          <div className="service-editor-price-range-grid">
                            {priceDayTypes.map(dt => {
                              const rule = serviceDialogPriceRules[dt.key] || {
                                enabled: false,
                                rows: [{ price: '', timeFrom: '', timeTo: '' }]
                              };
                              const rows = Array.isArray(rule.rows) && rule.rows.length
                                ? rule.rows
                                : [{ price: '', timeFrom: '', timeTo: '' }];
                              return (
                                <div key={dt.key} className="service-editor-price-range-item">
                                  <label className="service-editor-price-range-day">
                                    <input
                                      type="checkbox"
                                      checked={!!rule.enabled}
                                      onChange={e => {
                                        const checked = e.target.checked;
                                        if (!checked) {
                                          updateServicePriceRule(dt.key, {
                                            enabled: false,
                                            rows: [{ price: '', timeFrom: '', timeTo: '' }]
                                          });
                                        } else {
                                          updateServicePriceRule(dt.key, { enabled: true });
                                        }
                                      }}
                                    />
                                    <span>{dt.label}</span>
                                  </label>
                                  <div className="service-editor-price-range-rows">
                                    {rows.map((row, rowIndex) => (
                                      <div key={rowIndex} className="service-editor-price-range-row">
                                        <div className="service-editor-price-range-input-wrap">
                                          <input
                                            type="number"
                                            min="0"
                                            placeholder={serviceDialogBasePrice || '0 тг'}
                                            value={row.price}
                                            onChange={e => updateServicePriceRow(dt.key, rowIndex, { price: e.target.value })}
                                            disabled={!rule.enabled}
                                          />
                                          {/* <span className="service-editor-price-suffix">₸</span> */}
                                        </div>
                                        <div className="service-editor-price-range-time">
                                          <span className="service-editor-price-range-time-label">с</span>
                                          <input
                                            type="text"
                                            placeholder="00:00"
                                            value={row.timeFrom || ''}
                                            onChange={e => {
                                              const v = formatTimeInput(e.target.value, false);
                                              updateServicePriceRow(dt.key, rowIndex, { timeFrom: v });
                                            }}
                                            disabled={!rule.enabled}
                                            list="service-editor-time-presets"
                                          />
                                          <span className="service-editor-price-range-time-label">до</span>
                                          <input
                                            type="text"
                                            placeholder="24:00"
                                            value={row.timeTo || ''}
                                            onChange={e => {
                                              const v = formatTimeInput(e.target.value, true);
                                              updateServicePriceRow(dt.key, rowIndex, { timeTo: v });
                                            }}
                                            disabled={!rule.enabled}
                                            list="service-editor-time-presets"
                                          />
                                        </div>
                                        {rowIndex === 0 ? (
                                          <button
                                            type="button"
                                            className="service-editor-price-range-add"
                                            onClick={() => addServicePriceRow(dt.key)}
                                            disabled={!rule.enabled}
                                          >
                                            +
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            className="service-editor-price-range-remove"
                                            onClick={() => removeServicePriceRow(dt.key, rowIndex)}
                                            disabled={!rule.enabled}
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <datalist id="service-editor-time-presets">
                            {Array.from({ length: 25 }, (_, i) => {
                              const h = String(i).padStart(2, '0');
                              return <option key={h} value={`${h}:00`} />;
                            })}
                          </datalist>
                        </div>
                      )}
                    </div>
                    {/* Исключения для дней недели */}
                    {serviceDialogUseRange && (
                      <div className="service-editor-week-overrides-block">
                        <div className="service-editor-price-range-header">
                          <div className="service-editor-price-range-title">Исключения по дням недели</div>
                          <div className="service-editor-price-range-subtitle">
                            Переопределите тип дня для конкретных дней недели (например, услуга работает в выходные как в будни)
                          </div>
                        </div>
                        <div className="service-editor-week-overrides-grid">
                          {['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'].map((dayName, idx) => {
                            const weekday = idx === 6 ? 0 : idx + 1; // 0=вс, 1=пн, ..., 6=сб
                            const override = serviceDialogWeekOverrides[weekday];
                            
                            return (
                              <div key={weekday} className="service-editor-week-override-item">
                                <div className="service-editor-week-override-day">{dayName}</div>
                                <select
                                  className="service-editor-week-override-select"
                                  value={override || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setServiceDialogWeekOverrides(prev => {
                                      const next = { ...prev };
                                      if (!val) {
                                        delete next[weekday];
                                      } else {
                                        next[weekday] = val;
                                      }
                                      return next;
                                    });
                                  }}
                                >
                                  <option value="">По умолчанию (филиал)</option>
                                  <option value="weekday">Будний день</option>
                                  <option value="weekend">Выходной</option>
                                  <option value="holiday">Праздник</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="service-editor-form-row">
                      <label className="service-editor-field service-editor-duration-field">
                        <span>Длительность</span>
                        <div className="service-editor-duration-inputs">
                          <select
                            value={serviceDialogHours}
                            onChange={e => setServiceDialogHours(parseInt(e.target.value, 10) || 0)}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{i} ч</option>
                            ))}
                          </select>
                          <select
                            value={serviceDialogMinutes}
                            onChange={e => setServiceDialogMinutes(parseInt(e.target.value, 10) || 0)}
                          >
                            {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                              <option key={m} value={m}>{m} м</option>
                            ))}
                          </select>
                        </div>
                      </label>
                    </div>
                    <div className="service-editor-zones-block">
                      <div className="service-editor-zones-inner">
                        <div className="service-editor-zones-header">
                          <div className="service-editor-zones-title">Зоны, оказывающие услугу</div>
                          <div className="service-editor-zones-subtitle">
                            Выберите зоны, в которых доступна эта услуга. Можно не выбирать ни одной зоны.
                          </div>
                        </div>
                        <div className="service-editor-zones-body">
                          <div className="service-editor-zones-list">
                            {zonesList && zonesList.length ? (
                              zonesList.map(z => {
                                const id = z.zone_id || z.id;
                                const checked = serviceDialogSelectedZoneIds.includes(id);
                                return (
                                  <label key={id} className="service-editor-zones-item">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={e => {
                                        const isChecked = e.target.checked;
                                        setServiceDialogSelectedZoneIds(prev => {
                                          if (isChecked) {
                                            return prev.includes(id) ? prev : [...prev, id];
                                          }
                                          return prev.filter(x => x !== id);
                                        });
                                      }}
                                    />
                                    <span className="service-editor-zones-name">{z.name}</span>
                                  </label>
                                );
                              })
                            ) : (
                              <div className="service-editor-zones-empty">
                                Для текущего филиала ещё не созданы зоны.
                              </div>
                            )}
                          </div>
                          {zonesList && zonesList.length > 0 && (
                            <button
                              type="button"
                              className="service-editor-zones-add-btn"
                              onClick={() => {
                                setServiceDialogSelectedZoneIds(prev => {
                                  if (!prev || prev.length === 0) {
                                    return zonesList.map(z => z.zone_id || z.id);
                                  }
                                  return [];
                                });
                              }}
                            >
                              {serviceDialogSelectedZoneIds && serviceDialogSelectedZoneIds.length
                                ? 'Снять выбор со всех'
                                : '+ Добавить все зоны'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="service-editor-actions">
                    {serviceDialogSelectedServiceId && (
                      <button
                        type="button"
                        className="service-editor-btn danger"
                        onClick={handleDeleteService}
                      >
                        Удалить
                      </button>
                    )}
                    <button
                      type="button"
                      className="service-editor-btn secondary"
                      onClick={handleCloseServiceDialog}
                    >
                      Отменить
                    </button>
                    <button
                      type="button"
                      className="service-editor-btn primary"
                      onClick={serviceDialogSelectedServiceId ? handleUpdateService : handleCreateService}
                      disabled={isCreateDisabled}
                    >
                      {serviceDialogSaving
                        ? (serviceDialogSelectedServiceId ? 'Сохранение...' : 'Создание...')
                        : (serviceDialogSelectedServiceId ? 'Сохранить' : 'Создать')}
                    </button>
                  </div>
                </section>
              </div>
                );
              })()}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

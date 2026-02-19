import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { toast } from '../hooks/use-toast';
import './NetworksSettings.css';

// Справочники стран и телефонов (скопировано из Sidebar для единообразия)
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
  KZ: '+7',
  RU: '+7',
  UA: '+380',
  BY: '+375',
  KG: '+996',
  UZ: '+998',
  TJ: '+992',
  TM: '+993',
  AZ: '+994',
  AM: '+374',
  GE: '+995',
  LV: '+371',
  LT: '+370',
  EE: '+372',
  US: '+1',
  CA: '+1',
  GB: '+44',
  DE: '+49',
  FR: '+33',
  IT: '+39',
  ES: '+34',
  PT: '+351',
  NL: '+31',
  BE: '+32',
  CH: '+41',
  AT: '+43',
  PL: '+48',
  CZ: '+420',
  SK: '+421',
  HU: '+36',
  RO: '+40',
  BG: '+359',
  TR: '+90',
  CN: '+86',
  JP: '+81',
  KR: '+82',
  IN: '+91',
  AE: '+971',
  SA: '+966',
  IL: '+972',
  EG: '+20',
  TH: '+66',
  VN: '+84',
  SG: '+65',
  MY: '+60',
  ID: '+62',
  BR: '+55',
  MX: '+52',
  AR: '+54',
  CL: '+56',
  AU: '+61',
  NZ: '+64',
};

const COUNTRY_PHONE_NATIONAL_DIGITS = {
  KZ: 10,
  RU: 10,
  US: 10,
  CA: 10,
  GB: 10,
  DE: 10,
  FR: 10,
  IT: 10,
  ES: 10,
  PT: 10,
  NL: 10,
  BE: 10,
  CH: 10,
  AT: 10,
  PL: 10,
  CZ: 10,
  SK: 10,
  HU: 10,
  RO: 10,
  BG: 10,
  TR: 10,
  BR: 10,
  MX: 10,
  AR: 10,
  CL: 10,
  AU: 10,
  NZ: 10,
  UA: 9,
  BY: 9,
  KG: 9,
  UZ: 9,
  TJ: 9,
  TM: 9,
  AZ: 9,
  AM: 9,
  GE: 9,
  LV: 9,
  LT: 9,
  EE: 9,
};

const COUNTRY_PHONE_EXAMPLE_LOCAL = {
  KZ: '701 575-50-50',
  RU: '901 123-45-67',
  UA: '50 1234567',
  BY: '29 1234567',
  KG: '555 123456',
  UZ: '90 1234567',
  US: '555 123 4567',
  CA: '416 555 1234',
  GB: '20 7123 4567',
};

const TIMEZONES = [
  // Азия - СНГ
  { value: 'Asia/Almaty', label: 'Алматы (UTC+5)' },
  { value: 'Asia/Astana', label: 'Астана (UTC+5)' },
  { value: 'Asia/Aqtau', label: 'Актау (UTC+5)' },
  { value: 'Asia/Aqtobe', label: 'Актобе (UTC+5)' },
  { value: 'Asia/Atyrau', label: 'Атырау (UTC+5)' },
  { value: 'Asia/Oral', label: 'Уральск (UTC+5)' },
  { value: 'Asia/Qostanay', label: 'Костанай (UTC+5)' },
  { value: 'Asia/Qyzylorda', label: 'Кызылорда (UTC+5)' },
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
  { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
  { value: 'Asia/Magadan', label: 'Магадан (UTC+11)' },
  { value: 'Asia/Kamchatka', label: 'Камчатка (UTC+12)' },
  { value: 'Europe/Kyiv', label: 'Киев (UTC+2)' },
  { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
  { value: 'Asia/Bishkek', label: 'Бишкек (UTC+6)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
  { value: 'Asia/Dushanbe', label: 'Душанбе (UTC+5)' },
  { value: 'Asia/Ashgabat', label: 'Ашхабад (UTC+5)' },
  { value: 'Asia/Baku', label: 'Баку (UTC+4)' },
  { value: 'Asia/Yerevan', label: 'Ереван (UTC+4)' },
  { value: 'Asia/Tbilisi', label: 'Тбилиси (UTC+4)' },
  // Европа
  { value: 'Europe/London', label: 'Лондон (UTC+0)' },
  { value: 'Europe/Paris', label: 'Париж (UTC+1)' },
  { value: 'Europe/Berlin', label: 'Берлин (UTC+1)' },
  { value: 'Europe/Rome', label: 'Рим (UTC+1)' },
  { value: 'Europe/Madrid', label: 'Мадрид (UTC+1)' },
  { value: 'Europe/Amsterdam', label: 'Амстердам (UTC+1)' },
  { value: 'Europe/Brussels', label: 'Брюссель (UTC+1)' },
  { value: 'Europe/Zurich', label: 'Цюрих (UTC+1)' },
  { value: 'Europe/Vienna', label: 'Вена (UTC+1)' },
  { value: 'Europe/Warsaw', label: 'Варшава (UTC+1)' },
  { value: 'Europe/Prague', label: 'Прага (UTC+1)' },
  { value: 'Europe/Budapest', label: 'Будапешт (UTC+1)' },
  { value: 'Europe/Bucharest', label: 'Бухарест (UTC+2)' },
  { value: 'Europe/Sofia', label: 'София (UTC+2)' },
  { value: 'Europe/Athens', label: 'Афины (UTC+2)' },
  { value: 'Europe/Istanbul', label: 'Стамбул (UTC+3)' },
  { value: 'Europe/Riga', label: 'Рига (UTC+2)' },
  { value: 'Europe/Vilnius', label: 'Вильнюс (UTC+2)' },
  { value: 'Europe/Tallinn', label: 'Таллин (UTC+2)' },
  // Азия - Восток
  { value: 'Asia/Dubai', label: 'Дубай (UTC+4)' },
  { value: 'Asia/Jerusalem', label: 'Иерусалим (UTC+2)' },
  { value: 'Asia/Shanghai', label: 'Шанхай (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: 'Гонконг (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Токио (UTC+9)' },
  { value: 'Asia/Seoul', label: 'Сеул (UTC+9)' },
  { value: 'Asia/Singapore', label: 'Сингапур (UTC+8)' },
  { value: 'Asia/Bangkok', label: 'Бангкок (UTC+7)' },
  { value: 'Asia/Kolkata', label: 'Калькутта (UTC+5:30)' },
  { value: 'Asia/Karachi', label: 'Карачи (UTC+5)' },
  // Америка
  { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
  { value: 'America/Chicago', label: 'Чикаго (UTC-6)' },
  { value: 'America/Denver', label: 'Денвер (UTC-7)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)' },
  { value: 'America/Toronto', label: 'Торонто (UTC-5)' },
  { value: 'America/Vancouver', label: 'Ванкувер (UTC-8)' },
  { value: 'America/Mexico_City', label: 'Мехико (UTC-6)' },
  { value: 'America/Sao_Paulo', label: 'Сан-Паулу (UTC-3)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Буэнос-Айрес (UTC-3)' },
  { value: 'America/Santiago', label: 'Сантьяго (UTC-3)' },
  // Австралия и Океания
  { value: 'Australia/Sydney', label: 'Сидней (UTC+10)' },
  { value: 'Australia/Melbourne', label: 'Мельбурн (UTC+10)' },
  { value: 'Australia/Brisbane', label: 'Брисбен (UTC+10)' },
  { value: 'Australia/Perth', label: 'Перт (UTC+8)' },
  { value: 'Pacific/Auckland', label: 'Окленд (UTC+12)' },
];

export default function NetworksSettings() {
  useEffect(() => { document.title = 'Настройки сетей и филиалов'; }, []);

  const [networks, setNetworks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [networkDialogName, setNetworkDialogName] = useState('');
  const [networkDialogDescription, setNetworkDialogDescription] = useState('');
  const [networkDialogError, setNetworkDialogError] = useState(null);
  const [networkDialogSaving, setNetworkDialogSaving] = useState(false);

  const [editingBranch, setEditingBranch] = useState(null);
  const [branchDialogName, setBranchDialogName] = useState('');
  const [branchDialogCountryCode, setBranchDialogCountryCode] = useState('');
  const [branchDialogCity, setBranchDialogCity] = useState('');
  const [branchDialogAddress, setBranchDialogAddress] = useState('');
  const [branchDialogPostalCode, setBranchDialogPostalCode] = useState('');
  const [branchDialogPhone, setBranchDialogPhone] = useState('');
  const [branchDialogWebsite, setBranchDialogWebsite] = useState('');
  const [branchDialogSchedule, setBranchDialogSchedule] = useState('');
  const [branchDialogDescription, setBranchDialogDescription] = useState('');
  const [branchDialogPhotoUrl, setBranchDialogPhotoUrl] = useState('');
  const [branchDialogTimezone, setBranchDialogTimezone] = useState('Asia/Almaty');
  const [branchDialogRequisitesType, setBranchDialogRequisitesType] = useState('');
  const [branchDialogLegalCompanyName, setBranchDialogLegalCompanyName] = useState('');
  const [branchDialogLegalAddress, setBranchDialogLegalAddress] = useState('');
  const [branchDialogActualAddress, setBranchDialogActualAddress] = useState('');
  const [branchDialogInn, setBranchDialogInn] = useState('');
  const [branchDialogKpp, setBranchDialogKpp] = useState('');
  const [branchDialogBik, setBranchDialogBik] = useState('');
  const [branchDialogBankName, setBranchDialogBankName] = useState('');
  const [branchDialogCorrAccount, setBranchDialogCorrAccount] = useState('');
  const [branchDialogCheckingAccount, setBranchDialogCheckingAccount] = useState('');
  const [branchDialogNetworkId, setBranchDialogNetworkId] = useState('');
  const [branchDialogError, setBranchDialogError] = useState(null);
  const [branchDialogSaving, setBranchDialogSaving] = useState(false);
  const [branchDialogActiveSection, setBranchDialogActiveSection] = useState('main');

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Не найден токен авторизации');
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Загружаем сети
        let loadedNetworks = [];
        try {
          const API_URL = process.env.REACT_APP_API_URL;
          const res = await fetch(`${API_URL}/networks`, { headers });
          if (res.ok) {
            const data = await res.json();
            loadedNetworks = Array.isArray(data) ? data : (data.networks || []);
          }
        } catch (e) {
          // игнорируем, ниже всё равно покажем ошибку если совсем пусто
        }

        // Находим пользователя для загрузки филиалов
        const storedUser = (() => {
          try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
        })();
        const uid = storedUser?.id || localStorage.getItem('userId');
        if (!uid) {
          throw new Error('Не удалось определить пользователя для загрузки филиалов');
        }

        const API_URL = process.env.REACT_APP_API_URL;
        const branchEndpoints = [
          `${API_URL}/users/${uid}/branches`,
          `${API_URL}/branches?userId=${uid}`,
          `${API_URL}/branches?user_id=${uid}`,
          `/api/users/${uid}/branches`,
          `/api/branches?userId=${uid}`,
          `/api/branches?user_id=${uid}`,
        ];

        let loadedBranches = [];
        for (const url of branchEndpoints) {
          try {
            const res = await fetch(url, { headers });
            if (!res.ok) continue;
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.branches || data.rows || data);
            loadedBranches = list || [];
            break;
          } catch (e) {
            // пробуем следующий endpoint
          }
        }

        if (!loadedNetworks.length && !loadedBranches.length) {
          throw new Error('Сети и филиалы не найдены');
        }

        if (!mounted) return;
        setNetworks(loadedNetworks);
        setBranches(loadedBranches);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Ошибка при загрузке настроек сетей и филиалов');
        setNetworks([]);
        setBranches([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, []);

  const networkById = React.useMemo(() => {
    const map = {};
    (networks || []).forEach((n) => {
      const id = n.network_id || n.id || n.networkId;
      if (id == null) return;
      map[id] = n;
    });
    return map;
  }, [networks]);

  const groupedBranches = React.useMemo(() => {
    const groups = {};
    (branches || []).forEach((b) => {
      const nid = b.network_id || b.networkId || 'no-network';
      if (!groups[nid]) groups[nid] = [];
      groups[nid].push(b);
    });
    return groups;
  }, [branches]);

  const hasData = Object.keys(groupedBranches).length > 0 || (networks && networks.length > 0);
  const [expandedNetworkId, setExpandedNetworkId] = useState(null);

  const openNetworkDialog = (net) => {
    if (!net) return;
    setEditingNetwork(net);
    setNetworkDialogName(net.name || '');
    setNetworkDialogDescription(net.description || '');
    setNetworkDialogError(null);
  };

  const closeNetworkDialog = () => {
    if (networkDialogSaving) return;
    setEditingNetwork(null);
    setNetworkDialogName('');
    setNetworkDialogDescription('');
    setNetworkDialogError(null);
  };

  const handleSaveNetwork = async () => {
    if (!editingNetwork) return;
    if (!networkDialogName.trim()) {
      setNetworkDialogError('Введите название сети');
      return;
    }

    try {
      setNetworkDialogSaving(true);
      setNetworkDialogError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setNetworkDialogError('Токен авторизации не найден');
        return;
      }
      const API_URL = process.env.REACT_APP_API_URL;
      const id = editingNetwork.network_id || editingNetwork.id || editingNetwork.networkId;
      const res = await fetch(`${API_URL}/networks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: networkDialogName.trim(),
          description: networkDialogDescription.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить изменения'
        });
        setNetworkDialogError(data.error || 'Не удалось сохранить изменения');
        return;
      }

      const updated = data.network || null;
      if (updated) {
        setNetworks((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map((n) =>
            (n.network_id || n.id || n.networkId) === (updated.network_id || updated.id || updated.networkId)
              ? { ...n, ...updated }
              : n
          );
        });
      }
      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Сеть обновлена'
      });
      try { window.location.reload(); } catch {}
    } catch (e) {
      setNetworkDialogError('Ошибка при сохранении');
    } finally {
      setNetworkDialogSaving(false);
    }
  };

  const handleDeleteNetwork = async () => {
    if (!editingNetwork) return;
    if (!window.confirm('Удалить сеть? Это действие нельзя отменить.')) return;

    try {
      setNetworkDialogSaving(true);
      setNetworkDialogError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setNetworkDialogError('Токен авторизации не найден');
        return;
      }
      const API_URL = process.env.REACT_APP_API_URL;
      const id = editingNetwork.network_id || editingNetwork.id || editingNetwork.networkId;
      const res = await fetch(`${API_URL}/networks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить сеть'
        });
        setNetworkDialogError(data.error || 'Не удалось удалить сеть');
        return;
      }

      setNetworks((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.filter((n) => (n.network_id || n.id || n.networkId) !== (editingNetwork.network_id || editingNetwork.id || editingNetwork.networkId));
      });
      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Сеть удалена'
      });
      try { window.location.reload(); } catch {}
    } catch (e) {
      setNetworkDialogError('Ошибка при удалении');
    } finally {
      setNetworkDialogSaving(false);
    }
  };

  const openBranchDialog = (branch) => {
    if (!branch) return;
    setEditingBranch(branch);
    setBranchDialogName(branch.branch_name || branch.name || '');
    setBranchDialogCountryCode(branch.country_code || 'KZ');
    setBranchDialogCity(branch.city || '');
    setBranchDialogAddress(branch.address || '');
    setBranchDialogPostalCode(branch.postal_code || '');
    setBranchDialogPhone(branch.phone || branch.phone_number || '');
    setBranchDialogWebsite(branch.website || branch.site || '');
    setBranchDialogSchedule(branch.schedule || '');
    setBranchDialogDescription(branch.description || '');
    setBranchDialogPhotoUrl(branch.photo_url || '');
    setBranchDialogTimezone(branch.timezone || 'Asia/Almaty');
    setBranchDialogRequisitesType(branch.requisites_type || '');
    setBranchDialogLegalCompanyName(branch.legal_company_name || '');
    setBranchDialogLegalAddress(branch.legal_address || '');
    setBranchDialogActualAddress(branch.actual_address || '');
    setBranchDialogInn(branch.inn || '');
    setBranchDialogKpp(branch.kpp || '');
    setBranchDialogBik(branch.bik || '');
    setBranchDialogBankName(branch.bank_name || '');
    setBranchDialogCorrAccount(branch.correspondent_account || '');
    setBranchDialogCheckingAccount(branch.checking_account || '');
    const nid = branch.network_id || branch.networkId || '';
    setBranchDialogNetworkId(nid != null ? String(nid) : '');
    setBranchDialogError(null);
    setBranchDialogActiveSection('main');
  };

  const closeBranchDialog = () => {
    if (branchDialogSaving) return;
    setEditingBranch(null);
    setBranchDialogName('');
    setBranchDialogCountryCode('');
    setBranchDialogCity('');
    setBranchDialogAddress('');
    setBranchDialogPostalCode('');
    setBranchDialogPhone('');
    setBranchDialogWebsite('');
    setBranchDialogSchedule('');
    setBranchDialogDescription('');
    setBranchDialogPhotoUrl('');
    setBranchDialogTimezone('Asia/Almaty');
    setBranchDialogRequisitesType('');
    setBranchDialogLegalCompanyName('');
    setBranchDialogLegalAddress('');
    setBranchDialogActualAddress('');
    setBranchDialogInn('');
    setBranchDialogKpp('');
    setBranchDialogBik('');
    setBranchDialogBankName('');
    setBranchDialogCorrAccount('');
    setBranchDialogCheckingAccount('');
    setBranchDialogNetworkId('');
    setBranchDialogError(null);
    setBranchDialogActiveSection('main');
  };

  const handleSaveBranch = async () => {
    if (!editingBranch) return;
    if (!branchDialogName.trim()) {
      setBranchDialogError('Введите название филиала');
      return;
    }

    try {
      setBranchDialogSaving(true);
      setBranchDialogError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setBranchDialogError('Токен авторизации не найден');
        return;
      }
      const API_URL = process.env.REACT_APP_API_URL;
      const id = editingBranch.branch_id || editingBranch.id || editingBranch.branchId;

      const payload = {
        branch_name: branchDialogName.trim(),
        country_code: branchDialogCountryCode.trim() || null,
        city: branchDialogCity.trim() || null,
        address: branchDialogAddress.trim() || null,
        postal_code: branchDialogPostalCode.trim() || null,
        phone: branchDialogPhone ? branchDialogPhone.replace(/\s+/g, '') : null,
        website: branchDialogWebsite.trim() || null,
        schedule: branchDialogSchedule.trim() || null,
        description: branchDialogDescription.trim() || null,
        photo_url: branchDialogPhotoUrl.trim() || null,
        timezone: branchDialogTimezone || 'Asia/Almaty',
        requisites_type: branchDialogRequisitesType.trim() || null,
        legal_company_name: branchDialogLegalCompanyName.trim() || null,
        legal_address: branchDialogLegalAddress.trim() || null,
        actual_address: branchDialogActualAddress.trim() || null,
        inn: branchDialogInn.trim() || null,
        kpp: branchDialogKpp.trim() || null,
        bik: branchDialogBik.trim() || null,
        bank_name: branchDialogBankName.trim() || null,
        correspondent_account: branchDialogCorrAccount.trim() || null,
        checking_account: branchDialogCheckingAccount.trim() || null,
      };
      if (branchDialogNetworkId === '') {
        payload.network_id = null;
      } else {
        const parsed = parseInt(branchDialogNetworkId, 10);
        if (!Number.isNaN(parsed)) payload.network_id = parsed;
      }

      const res = await fetch(`${API_URL}/branches/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить филиал'
        });
        setBranchDialogError(data.error || 'Не удалось сохранить изменения филиала');
        return;
      }

      const updated = data.branch || null;
      if (updated) {
        setBranches((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map((b) =>
            (b.branch_id || b.id || b.branchId) === (updated.branch_id || updated.id || updated.branchId)
              ? { ...b, ...updated }
              : b
          );
        });
      }
      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Филиал обновлён'
      });
      try { window.location.reload(); } catch {}
    } catch (e) {
      setBranchDialogError('Ошибка при сохранении филиала');
    } finally {
      setBranchDialogSaving(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!editingBranch) return;
    if (!window.confirm('Удалить филиал? Это действие нельзя отменить.')) return;

    try {
      setBranchDialogSaving(true);
      setBranchDialogError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setBranchDialogError('Токен авторизации не найден');
        return;
      }
      const API_URL = process.env.REACT_APP_API_URL;
      const id = editingBranch.branch_id || editingBranch.id || editingBranch.branchId;

      const res = await fetch(`${API_URL}/branches/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить филиал'
        });
        setBranchDialogError(data.error || 'Не удалось удалить филиал');
        return;
      }

      setBranches((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.filter((b) => (b.branch_id || b.id || b.branchId) !== (editingBranch.branch_id || editingBranch.id || editingBranch.branchId));
      });

      // Если удаляем выбранный филиал, очищаем localStorage, дальше Timetable сам обработает
      try {
        const selected = localStorage.getItem('selectedBranchId');
        const bid = editingBranch.branch_id || editingBranch.id || editingBranch.branchId;
        if (selected && String(selected) === String(bid)) {
          localStorage.removeItem('selectedBranchId');
        }
      } catch {}

      toast({
        variant: 'success',
        title: 'Успешно',
        description: 'Филиал удалён'
      });

      try { window.location.reload(); } catch {}
    } catch (e) {
      setBranchDialogError('Ошибка при удалении филиала');
    } finally {
      setBranchDialogSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="networks-empty">Загрузка сетей и филиалов...</div>;
    }
    if (error) {
      return <div className="networks-empty networks-error">{error}</div>;
    }
    if (!hasData) {
      return <div className="networks-empty">Сети и филиалы не найдены.</div>;
    }

    const groups = [];

    // Сначала все сети (даже если у них пока нет филиалов)
    (networks || []).forEach((n) => {
      const nid = n.network_id || n.id || n.networkId;
      if (nid == null) return;
      const list = groupedBranches[nid] || [];
      groups.push({ nid, net: n, list });
    });

    // Филиалы без сети
    if (groupedBranches['no-network'] && groupedBranches['no-network'].length) {
      groups.push({ nid: 'no-network', net: null, list: groupedBranches['no-network'] });
    }

    // Группы по network_id, для которых нет записи сети (на всякий случай)
    Object.keys(groupedBranches).forEach((nid) => {
      if (nid === 'no-network') return;
      const exists = (networks || []).some((n) => {
        const id = n.network_id || n.id || n.networkId;
        return String(id) === String(nid);
      });
      if (!exists) {
        groups.push({ nid, net: null, list: groupedBranches[nid] || [] });
      }
    });

    return (
      <div className="networks-groups">
        {groups.map(({ nid, net, list }) => {
          const title = net?.name || (nid === 'no-network' ? 'Без сети' : `Сеть #${nid}`);
          const subtitle = net?.description || '';
          const isExpanded = expandedNetworkId === nid;

          const handleToggle = () => {
            setExpandedNetworkId((prev) => (prev === nid ? null : nid));
          };

          return (
            <div key={nid} className="service-category-card">
              <div className="service-category-header" onClick={handleToggle}>
                <span className="service-category-title">{title}</span>
                <button
                  type="button"
                  className="service-category-edit-btn"
                  onClick={(e) => { e.stopPropagation(); if (net) openNetworkDialog(net); }}
                >
                  Изменить
                </button>
                <span className="service-category-count">Филиалов: {list.length}</span>
                <span className="expand-arrow">{isExpanded ? '▲' : '▼'}</span>
              </div>
              {isExpanded && (
                <div className="service-table">
                  <div className="service-table-head">
                    <div>{nid === 'no-network' ? 'Филиалы без привязки к сети' : 'Филиал'}</div>
                    <div>Город</div>
                    <div>Адрес</div>
                    <div>Телефон</div>
                    <div>Сайт</div>
                  </div>
                  <div className="service-category-body">
                    {/* {subtitle && nid !== 'no-network' && (
                      <div className="service-row">
                        <div className="service-name" style={{ gridColumn: '1 / -1', color: '#6b7280' }}>
                          {subtitle}
                        </div>
                      </div>
                    )} */}
                    {list.map((b) => (
                      <div key={b.branch_id || b.id || b.branchId} className="service-row">
                        <div className="service-name">
                          {b.branch_name || b.name}
                          {b.category && (
                            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                              {b.category === 'VR' ? '🎮 VR Арена' : b.category === 'Бильярд' ? '🎱 Бильярд' : b.category === 'Техосмотр' ? '🔧 Техосмотр' : b.category}
                            </div>
                          )}
                        </div>
                        <div className="service-duration">{b.city || ''}</div>
                        <div className="service-duration">{b.address || ''}</div>
                        <div className="service-duration">{b.phone || b.phone_number || ''}</div>
                        <div className="service-duration">
                          <div className="service-zones">
                            <span>{b.website || b.site || ''}</span>
                            <button
                              type="button"
                              className="service-zones-edit-btn"
                              onClick={() => openBranchDialog(b)}
                            >
                              Изменить
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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

      <div className="networks-content">
        <div className="services-header">
          <div className="services-burger">☰</div>
          <h1>Настройки сетей и филиалов</h1>
        </div>

        <div className="services-panel">
          {renderContent()}
        </div>
      </div>

      {editingNetwork && (
        <div className="service-editor-backdrop" onClick={closeNetworkDialog}>
          <div className="service-editor-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="service-editor-layout">
              <div className="service-editor-sidebar">
                <h2 className="service-editor-title">Редактирование сети</h2>
                <p className="service-editor-subtitle">Измените название и описание сети или удалите её.</p>
              </div>
              <div className="service-editor-main">
                <div className="service-editor-top">
                  <div className="service-editor-top-title">
                    Сеть: {editingNetwork.name || `Сеть #${editingNetwork.network_id || editingNetwork.id || editingNetwork.networkId}`}
                  </div>
                  <button
                    type="button"
                    className="service-editor-top-close"
                    onClick={closeNetworkDialog}
                    aria-label="Закрыть редактирование сети"
                  >
                    ×
                  </button>
                </div>
                <div className="service-editor-section">
                  <label className="service-editor-field-label">
                    Название сети
                    <input
                      type="text"
                      className="service-editor-input"
                      value={networkDialogName}
                      onChange={(e) => setNetworkDialogName(e.target.value)}
                    />
                  </label>
                  <label className="service-editor-field-label">
                    Описание
                    <textarea
                      className="service-editor-input service-editor-textarea"
                      rows={3}
                      value={networkDialogDescription}
                      onChange={(e) => setNetworkDialogDescription(e.target.value)}
                    />
                  </label>
                  {networkDialogError && (
                    <div className="services-empty error" style={{ marginTop: 8 }}>
                      {networkDialogError}
                    </div>
                  )}
                </div>
                <div className="service-editor-footer">
                  <button
                    type="button"
                    className="service-editor-btn danger"
                    onClick={handleDeleteNetwork}
                    disabled={networkDialogSaving}
                  >
                    Удалить сеть
                  </button>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="service-zones-edit-btn"
                      onClick={closeNetworkDialog}
                      disabled={networkDialogSaving}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveNetwork}
                      disabled={networkDialogSaving}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingBranch && (
        <div className="service-editor-backdrop" onClick={closeBranchDialog}>
          <div className="service-editor-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="service-editor-layout">
              <div className="service-editor-sidebar">
                <h2 className="service-editor-title">Редактирование филиала</h2>
                <p className="service-editor-subtitle">Измените информацию о филиале по разделам или удалите его.</p>
                <div className="branch-editor-nav">
                  <button
                    type="button"
                    className={`branch-editor-nav-item ${branchDialogActiveSection === 'main' ? 'active' : ''}`}
                    onClick={() => setBranchDialogActiveSection('main')}
                  >
                    Основная информация
                  </button>
                  <button
                    type="button"
                    className={`branch-editor-nav-item ${branchDialogActiveSection === 'contacts' ? 'active' : ''}`}
                    onClick={() => setBranchDialogActiveSection('contacts')}
                  >
                    Контакты
                  </button>
                  <button
                    type="button"
                    className={`branch-editor-nav-item ${branchDialogActiveSection === 'description' ? 'active' : ''}`}
                    onClick={() => setBranchDialogActiveSection('description')}
                  >
                    Описание
                  </button>
                  <button
                    type="button"
                    className={`branch-editor-nav-item ${branchDialogActiveSection === 'photo' ? 'active' : ''}`}
                    onClick={() => setBranchDialogActiveSection('photo')}
                  >
                    Фото
                  </button>
                  <button
                    type="button"
                    className={`branch-editor-nav-item ${branchDialogActiveSection === 'requisites' ? 'active' : ''}`}
                    onClick={() => setBranchDialogActiveSection('requisites')}
                  >
                    Реквизиты
                  </button>
                </div>
              </div>
              <div className="service-editor-main">
                <div className="service-editor-top">
                  <div className="service-editor-top-title">
                    Филиал: {branchDialogName || editingBranch.branch_name || editingBranch.name}
                  </div>
                  <button
                    type="button"
                    className="service-editor-top-close"
                    onClick={closeBranchDialog}
                    aria-label="Закрыть редактирование филиала"
                  >
                    ×
                  </button>
                </div>
                <div className="branch-editor-content">
                    {branchDialogActiveSection === 'main' && (
                      <div className="service-editor-section">
                        <label className="service-editor-field-label">
                          Название филиала
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogName}
                            onChange={(e) => setBranchDialogName(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Сеть
                          <select
                            className="service-editor-input"
                            value={branchDialogNetworkId}
                            onChange={(e) => setBranchDialogNetworkId(e.target.value)}
                          >
                            <option value="">Без сети</option>
                            {(networks || []).map((n) => (
                              <option key={n.network_id || n.id || n.networkId} value={n.network_id || n.id || n.networkId}>
                                {n.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="service-editor-field-label">
                          Страна
                          <select
                            className="service-editor-input"
                            value={branchDialogCountryCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              setBranchDialogCountryCode(code);
                              // при смене страны сбрасываем телефон, чтобы не было старого кода
                              setBranchDialogPhone('');
                            }}
                          >
                            <option value="">Выберите страну</option>
                            {COUNTRIES.map((c) => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="service-editor-field-label">
                          Город
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogCity}
                            onChange={(e) => setBranchDialogCity(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Телефон
                          <input
                            type="tel"
                            className="service-editor-input"
                            value={branchDialogPhone}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const code = COUNTRY_PHONE_CODES[branchDialogCountryCode] || '+7';
                              const numericCode = code.replace(/\D/g, '');
                              const digits = raw.replace(/\D/g, '');

                              if (!digits) {
                                setBranchDialogPhone('');
                                return;
                              }

                              let localDigits;
                              if (digits.startsWith(numericCode)) {
                                localDigits = digits.slice(numericCode.length);
                              } else {
                                localDigits = digits;
                              }

                              const maxLocal = COUNTRY_PHONE_NATIONAL_DIGITS[branchDialogCountryCode] || 10;
                              if (localDigits.length > maxLocal) {
                                localDigits = localDigits.slice(0, maxLocal);
                              }

                              const formatted = localDigits ? `${code} ${localDigits}` : `${code} `;
                              setBranchDialogPhone(formatted);
                            }}
                            onFocus={() => {
                              if (!branchDialogPhone) {
                                const code = COUNTRY_PHONE_CODES[branchDialogCountryCode] || '+7';
                                setBranchDialogPhone(`${code} `);
                              }
                            }}
                            placeholder={(() => {
                              const code = COUNTRY_PHONE_CODES[branchDialogCountryCode] || '+7';
                              const local = COUNTRY_PHONE_EXAMPLE_LOCAL[branchDialogCountryCode] || '701 575-50-50';
                              return `Например, ${code} ${local}`;
                            })()}
                            pattern="^[+0-9 ()-]{6,20}$"
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Сайт
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogWebsite}
                            onChange={(e) => setBranchDialogWebsite(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Режим работы
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogSchedule}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const prev = branchDialogSchedule || '';
                              const prevDigits = prev.replace(/\D/g, '').slice(0, 8);

                              let digits = raw.replace(/\D/g, '').slice(0, 8);

                              const isDeleting = raw.length < prev.length;
                              if (isDeleting && digits === prevDigits && digits.length > 0) {
                                digits = digits.slice(0, -1);
                              }

                              const len = digits.length;

                              if (!len) {
                                setBranchDialogSchedule('');
                                return;
                              }

                              let formatted = '';

                              if (len <= 2) {
                                formatted = digits;
                                if (len === 2) formatted += ':';
                              } else if (len === 3) {
                                formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
                              } else {
                                const h1 = digits.slice(0, 2);
                                const m1 = digits.slice(2, 4);
                                formatted = `${h1}:${m1}-`;

                                if (len === 4) {
                                  // только первая часть, показываем дефис
                                } else if (len === 5) {
                                  formatted += digits.slice(4, 5);
                                } else if (len === 6) {
                                  formatted += `${digits.slice(4, 6)}:`;
                                } else if (len === 7) {
                                  formatted += `${digits.slice(4, 6)}:${digits.slice(6, 7)}`;
                                } else if (len === 8) {
                                  formatted += `${digits.slice(4, 6)}:${digits.slice(6, 8)}`;
                                }
                              }

                              setBranchDialogSchedule(formatted);
                            }}
                            placeholder="Например, 10:00-22:00"
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Часовой пояс
                          <select
                            className="service-editor-input"
                            value={branchDialogTimezone}
                            onChange={(e) => setBranchDialogTimezone(e.target.value)}
                          >
                            {TIMEZONES.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}

                    {branchDialogActiveSection === 'description' && (
                      <div className="service-editor-section">
                        <label className="service-editor-field-label">
                          Описание филиала
                          <textarea
                            className="service-editor-input service-editor-textarea"
                            rows={4}
                            value={branchDialogDescription}
                            onChange={(e) => setBranchDialogDescription(e.target.value)}
                          />
                        </label>
                      </div>
                    )}

                    {branchDialogActiveSection === 'contacts' && (
                      <div className="service-editor-section">
                        <label className="service-editor-field-label">
                          Адрес
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogAddress}
                            onChange={(e) => setBranchDialogAddress(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Почтовый индекс
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogPostalCode}
                            onChange={(e) => setBranchDialogPostalCode(e.target.value)}
                          />
                        </label>
                      </div>
                    )}

                    {branchDialogActiveSection === 'photo' && (
                      <div className="service-editor-section">
                        <label className="service-editor-field-label">
                          Ссылка на фото филиала
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogPhotoUrl}
                            onChange={(e) => setBranchDialogPhotoUrl(e.target.value)}
                            placeholder="https://..."
                          />
                        </label>
                      </div>
                    )}

                    {branchDialogActiveSection === 'requisites' && (
                      <div className="service-editor-section">
                        <label className="service-editor-field-label">
                          Тип реквизитов
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogRequisitesType}
                            onChange={(e) => setBranchDialogRequisitesType(e.target.value)}
                            placeholder="Например, ТОО / ИП"
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Юридическое название компании
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogLegalCompanyName}
                            onChange={(e) => setBranchDialogLegalCompanyName(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Юридический адрес
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogLegalAddress}
                            onChange={(e) => setBranchDialogLegalAddress(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Фактический адрес
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogActualAddress}
                            onChange={(e) => setBranchDialogActualAddress(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          ИНН
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogInn}
                            onChange={(e) => setBranchDialogInn(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          КПП
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogKpp}
                            onChange={(e) => setBranchDialogKpp(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          БИК
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogBik}
                            onChange={(e) => setBranchDialogBik(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Банк
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogBankName}
                            onChange={(e) => setBranchDialogBankName(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Корреспондентский счёт
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogCorrAccount}
                            onChange={(e) => setBranchDialogCorrAccount(e.target.value)}
                          />
                        </label>
                        <label className="service-editor-field-label">
                          Расчётный счёт
                          <input
                            type="text"
                            className="service-editor-input"
                            value={branchDialogCheckingAccount}
                            onChange={(e) => setBranchDialogCheckingAccount(e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                </div>

                {branchDialogError && (
                  <div className="services-empty error" style={{ marginTop: 8 }}>
                    {branchDialogError}
                  </div>
                )}
                <div className="service-editor-footer">
                  <button
                    type="button"
                    className="service-editor-btn danger"
                    onClick={handleDeleteBranch}
                    disabled={branchDialogSaving}
                  >
                    Удалить филиал
                  </button>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="service-zones-edit-btn"
                      onClick={closeBranchDialog}
                      disabled={branchDialogSaving}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSaveBranch}
                      disabled={branchDialogSaving}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

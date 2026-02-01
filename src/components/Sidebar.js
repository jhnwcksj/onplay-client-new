import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clientIcon from '../assets/icons/client_data.svg';
import summaryIcon from '../assets/icons/summary.svg';
import bookingIcon from '../assets/icons/online-booking.svg';
import settingsIcon from '../assets/icons/settings.svg';
import avatarImg from '../assets/images/avatar.png';
import './Sidebar.css';

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

const COUNTRY_CITIES = {
  KZ: ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе'],
  RU: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'],
  UA: ['Киев', 'Харьков', 'Одесса', 'Днепр', 'Львов'],
  BY: ['Минск', 'Гомель', 'Могилёв', 'Витебск', 'Гродно'],
  KG: ['Бишкек', 'Ош'],
  UZ: ['Ташкент', 'Самарканд', 'Бухара'],
  TJ: ['Душанбе'],
  TM: ['Ашхабад'],
  AZ: ['Баку'],
  AM: ['Ереван'],
  GE: ['Тбилиси', 'Батуми'],
  LV: ['Рига'],
  LT: ['Вильнюс'],
  EE: ['Таллин'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
  CA: ['Toronto', 'Vancouver', 'Montreal'],
  GB: ['London', 'Manchester', 'Birmingham'],
  DE: ['Berlin', 'Munich', 'Hamburg'],
  FR: ['Paris', 'Lyon', 'Marseille'],
  IT: ['Rome', 'Milan', 'Naples'],
  ES: ['Madrid', 'Barcelona', 'Valencia'],
  TR: ['Стамбул', 'Анкара', 'Анталья'],
  CN: ['Beijing', 'Shanghai', 'Guangzhou'],
  JP: ['Tokyo', 'Osaka', 'Kyoto'],
  KR: ['Seoul', 'Busan'],
  AE: ['Dubai', 'Abu Dhabi'],
  EG: ['Cairo', 'Alexandria'],
  TH: ['Bangkok', 'Phuket'],
  BR: ['São Paulo', 'Rio de Janeiro'],
  MX: ['Mexico City', 'Cancún'],
  AU: ['Sydney', 'Melbourne'],
  NZ: ['Auckland', 'Wellington'],
};

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
  // большинство стран — 10 цифр после кода
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
  // ряд стран СНГ обычно 9 цифр после кода
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
  KZ: '700 123-45-67',
  RU: '901 123-45-67',
  UA: '50 1234567',
  BY: '29 1234567',
  KG: '555 123456',
  UZ: '90 1234567',
  US: '555 123 4567',
  CA: '416 555 1234',
  GB: '20 7123 4567',
};

export default function Sidebar(props) {
  const {
    calendarDate,
    setCalendarDate,
    selectedDate,
    setSelectedDate,
    userName,
    userEmail,
    loadingUser,
    userError,
  } = props;

  const todayDate = new Date();
  const navigate = useNavigate();
  const loc = useLocation();

  const [branchesOpen, setBranchesOpen] = React.useState(false);
  const [branches, setBranches] = React.useState([]);
  const [networks, setNetworks] = React.useState([]);
  const [networkDialogOpen, setNetworkDialogOpen] = React.useState(false);
  const [networkName, setNetworkName] = React.useState('');
  const [networkDescription, setNetworkDescription] = React.useState('');
  const [branchDialogOpen, setBranchDialogOpen] = React.useState(false);
  const [branchNetworkId, setBranchNetworkId] = React.useState('');
  const [branchName, setBranchName] = React.useState('');
  const [branchCity, setBranchCity] = React.useState('');
  const [branchAddress, setBranchAddress] = React.useState('');
  const [branchPhone, setBranchPhone] = React.useState('');
  const [branchWebsite, setBranchWebsite] = React.useState('');
  const [branchSchedule, setBranchSchedule] = React.useState('');
    const [branchCountry, setBranchCountry] = React.useState('KZ');

  // load branches for the currently-logged-in user (best-effort)
  React.useEffect(() => {
    let mounted = true;

    async function loadBranches() {
      // get uid and token from localStorage
      let uid = null;
      try {
        const s = localStorage.getItem('user');
        if (s) uid = JSON.parse(s).id;
      } catch {}
      if (!uid) uid = localStorage.getItem('userId');

      const token = localStorage.getItem('token');
      if (!uid) return; // nothing to do without user id

      // Try a few likely endpoints — backend may vary; fail silently
      const API_URL = process.env.REACT_APP_API_URL;
      const endpoints = [
        `${API_URL}/users/${uid}/branches`,
        `${API_URL}/branches?userId=${uid}`,
        `${API_URL}/branches?user_id=${uid}`,
        `/api/users/${uid}/branches`,
        `/api/branches?userId=${uid}`,
        `/api/branches?user_id=${uid}`,
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (!res.ok) continue;
          const data = await res.json();
          // data may be { branches: [...] } or an array
          // Some APIs return { rows: [...] }, or { branches: [...] }, or the array directly
          const list = Array.isArray(data) ? data : (data.branches || data.rows || data);
          if (mounted) setBranches(list || []);
          break;
        } catch (err) {
          // try next endpoint
        }
      }
    }

    async function loadNetworks() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await fetch(`${API_URL}/networks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setNetworks(Array.isArray(data) ? data : (data.networks || []));
      } catch (err) {
        // ignore
      }
    }

    loadBranches();
    loadNetworks();
    return () => { mounted = false; };
  }, []);

  // close dropdown when clicking elsewhere
  React.useEffect(() => {
    function onDocClick(e) {
      const el = e.target;
      // if click happened inside the branch-menu or branch-toggle, ignore
      // search up the DOM tree for .branch-menu or .branch-toggle
      let node = el;
      let inside = false;
      while (node) {
        if (node.classList && (node.classList.contains('branch-menu') || node.classList.contains('branch-toggle') || node.classList.contains('logo-branch'))) { inside = true; break; }
        node = node.parentElement;
      }
      if (!inside) setBranchesOpen(false);
    }

    if (branchesOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [branchesOpen]);

  // Build calendar matrix (same logic as before) — returns an array of Date objects
  function buildCalendarMatrix(baseDate) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const matrix = [];

    for (let i = firstWeekday - 1; i >= 0; i--) {
      matrix.push(new Date(year, month - 1, prevMonthDays - i));
    }

    for (let d = 1; d <= daysInMonth; d++) matrix.push(new Date(year, month, d));

    let nextDay = 1;
    while (matrix.length % 7 !== 0) {
      matrix.push(new Date(year, month + 1, nextDay++));
    }

    return matrix;
  }

  const calendarMatrix = buildCalendarMatrix(calendarDate);

  // track selected branch id in component state (don't use localStorage)
  const [selectedBranchId, setSelectedBranchId] = React.useState(null);
  // sync selectedBranchId from the URL query param if present
  // fall back to previously-saved selection in localStorage
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(loc.search);
      const bid = params.get('branchId');
      if (bid) {
        setSelectedBranchId(bid);
        try { localStorage.setItem('selectedBranchId', String(bid)); } catch {}
        return;
      }
    } catch {}

    try {
      const saved = localStorage.getItem('selectedBranchId');
      if (saved) setSelectedBranchId(saved);
    } catch {}
  }, [loc.search]);

  // после загрузки филиалов проверяем, существует ли сохранённый/запрошенный филиал
  // если нет — переключаемся на первый доступный и поправляем URL/LocalStorage
  React.useEffect(() => {
    if (!branches || branches.length === 0) return;

    const all = branches;

    // текущий branchId из URL, если есть
    let paramBid = null;
    try {
      const params = new URLSearchParams(loc.search || '');
      paramBid = params.get('branchId');
    } catch {}

    const findById = (id) =>
      all.find(b => String(b.branch_id || b.id || b.branchId) === String(id));

    // если в URL указан филиал и он существует — просто синхронизируем состояние
    if (paramBid && findById(paramBid)) {
      if (String(selectedBranchId || '') !== String(paramBid)) {
        setSelectedBranchId(paramBid);
        try { localStorage.setItem('selectedBranchId', String(paramBid)); } catch {}
      }
      return;
    }

    // если URL не содержит валидного branchId, пробуем saved selectedBranchId
    if (selectedBranchId && findById(selectedBranchId)) {
      const validId = String(selectedBranchId);
      try {
        const params = new URLSearchParams(loc.search || '');
        if (params.get('branchId') !== validId) {
          params.set('branchId', validId);
          navigate(`${loc.pathname}?${params.toString()}`, { replace: true });
        }
        localStorage.setItem('selectedBranchId', validId);
      } catch {}
      return;
    }

    // выбранный филиал удалён или не задан — берём первый доступный
    const first = all[0];
    if (!first) return;
    const firstId = String(first.branch_id || first.id || first.branchId);

    setSelectedBranchId(firstId);
    try { localStorage.setItem('selectedBranchId', firstId); } catch {}

    try {
      const params = new URLSearchParams(loc.search || '');
      if (params.get('branchId') !== firstId) {
        params.set('branchId', firstId);
        navigate(`${loc.pathname}?${params.toString()}`, { replace: true });
      }
    } catch {}
  }, [branches, loc.pathname, loc.search, navigate, selectedBranchId]);
  // Prefer selected branch (from state) if set; otherwise the first fetched branch
  const currentBranch = (() => {
    if (branches && branches.length > 0) {
      if (selectedBranchId) {
        const found = branches.find(b => String(b.branch_id || b.id || b.branchId) === String(selectedBranchId));
        if (found) return found;
      }
      // choose first branch by default
      return branches[0];
    }
    return null;
  })();

  const currentBranchName = currentBranch?.branch_name || currentBranch?.branchName || 'Нет Филиалов';

  return (
    <aside className="sidebar">
      <div className="logo-branch">
        <button
          className="branch-toggle"
          onClick={() => setBranchesOpen(open => !open)}
          aria-haspopup="true"
          aria-expanded={branchesOpen}
          title="Выбрать филиал"
        >
          <img src={avatarImg} alt="branch" className="logo-avatar" />
          <span className="logo">{currentBranchName}</span>
        </button>

        {branchesOpen && (
          <div className="branch-menu">
            <div className="branch-menu-section">
              <div className="branch-menu-header">
                <strong className="branch-menu-title">Сети</strong>
                <button
                  type="button"
                  className="link-add"
                  onClick={() => {
                    setNetworkDialogOpen(true);
                  }}
                >
                  + Добавить сеть
                </button>
              </div>

              <div className="branch-list">
                {branches.length === 0 && (
                  <div className="branch-empty">Здесь пока нет филиалов</div>
                )}

                {(() => {
                  // если есть отдельный список сетей, рендерим их и их филиалы
                  if (networks && networks.length > 0) {
                    const orphanBranches = [];

                    const networkBlocks = networks.map((net) => {
                      const list = branches.filter((b) => (b.network_id || b.networkId) === net.network_id);
                      if (!list.length) {
                        return (
                          <div key={net.network_id} className="network-group">
                            <div className="network-name">{net.name}</div>
                            <div className="branch-small">Здесь пока нет филиалов</div>
                          </div>
                        );
                      }

                      return (
                        <div key={net.network_id} className="network-group">
                          <div className="network-name">{net.name}</div>
                          {list.map((b) => (
                            <button
                              key={b.branch_id || b.id}
                              className="branch-item"
                              onClick={() => {
                                const bidValue = b.branch_id || b.id || b.branchId || null;
                                try { setSelectedBranchId(bidValue); } catch {}
                                try { if (bidValue) localStorage.setItem('selectedBranchId', String(bidValue)); else localStorage.removeItem('selectedBranchId'); } catch {}
                                setBranchesOpen(false);

                                let uid = null;
                                try {
                                  const s = localStorage.getItem('user');
                                  if (s) uid = JSON.parse(s).id;
                                } catch {}
                                if (!uid) uid = localStorage.getItem('userId');

                                const bid = b.branch_id || b.id || b.branchId;
                                if (uid) navigate(`/timetable/${uid}?branchId=${encodeURIComponent(bid)}`);
                                else navigate(`/timetable?branchId=${encodeURIComponent(bid)}`);
                              }}
                            >
                              <div className="branch-name">{b.branch_name}</div>
                              <div className="branch-small">{b.city || b.company_name || ''}</div>
                            </button>
                          ))}
                        </div>
                      );
                    });

                    // филиалы без сети
                    branches.forEach((b) => {
                      const nid = b.network_id || b.networkId;
                      if (!nid) orphanBranches.push(b);
                    });

                    return (
                      <>
                        {networkBlocks}
                        {orphanBranches.length > 0 && (
                          <div className="network-group" key="no-network">
                            <div className="network-name">Без сети</div>
                            {orphanBranches.map((b) => (
                              <button
                                key={b.branch_id || b.id}
                                className="branch-item"
                                onClick={() => {
                                  const bidValue = b.branch_id || b.id || b.branchId || null;
                                  try { setSelectedBranchId(bidValue); } catch {}
                                  try { if (bidValue) localStorage.setItem('selectedBranchId', String(bidValue)); else localStorage.removeItem('selectedBranchId'); } catch {}
                                  setBranchesOpen(false);

                                  let uid = null;
                                  try {
                                    const s = localStorage.getItem('user');
                                    if (s) uid = JSON.parse(s).id;
                                  } catch {}
                                  if (!uid) uid = localStorage.getItem('userId');

                                  const bid = b.branch_id || b.id || b.branchId;
                                  if (uid) navigate(`/timetable/${uid}?branchId=${encodeURIComponent(bid)}`);
                                  else navigate(`/timetable?branchId=${encodeURIComponent(bid)}`);
                                }}
                              >
                                <div className="branch-name">{b.branch_name}</div>
                                <div className="branch-small">{b.city || b.company_name || ''}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  }

                  // fallback: старое группирование по network_id из самих филиалов
                  const grouped = branches.reduce((acc, b) => {
                    const nid = b.network_id || b.networkId || 'no-network';
                    if (!acc[nid]) acc[nid] = [];
                    acc[nid].push(b);
                    return acc;
                  }, {});

                  return Object.keys(grouped).map((nid) => {
                    const list = grouped[nid];
                    const sample = list[0] || {};
                    const networkLabel = sample.network_name || sample.networkName || sample.network || (nid === 'no-network' ? 'Без сети' : `Сеть #${nid}`);

                    return (
                      <div key={nid} className="network-group">
                        <div className="network-name">{networkLabel}</div>
                        {list.map((b) => (
                          <button
                            key={b.branch_id || b.id}
                            className="branch-item"
                            onClick={() => {
                              const bidValue = b.branch_id || b.id || b.branchId || null;
                              try { setSelectedBranchId(bidValue); } catch {}
                              try { if (bidValue) localStorage.setItem('selectedBranchId', String(bidValue)); else localStorage.removeItem('selectedBranchId'); } catch {}
                              setBranchesOpen(false);

                              let uid = null;
                              try {
                                const s = localStorage.getItem('user');
                                if (s) uid = JSON.parse(s).id;
                              } catch {}
                              if (!uid) uid = localStorage.getItem('userId');

                              const bid = b.branch_id || b.id || b.branchId;
                              if (uid) navigate(`/timetable/${uid}?branchId=${encodeURIComponent(bid)}`);
                              else navigate(`/timetable?branchId=${encodeURIComponent(bid)}`);
                            }}
                          >
                            <div className="branch-name">{b.branch_name}</div>
                            <div className="branch-small">{b.city || b.company_name || ''}</div>
                          </button>
                        ))}
                      </div>
                    );
                  });
                })()}

                <button
                  className="branch-add-line"
                  type="button"
                  onClick={() => {
                    if (!networks || networks.length === 0) {
                      alert('Сначала создайте сеть');
                      return;
                    }
                    // по умолчанию создаём филиал "Без сети"
                    setBranchNetworkId('');
                    setBranchCountry('KZ');
                    setBranchName('');
                    setBranchCity('');
                    setBranchAddress('');
                    setBranchPhone('');
                    setBranchWebsite('');
                    setBranchSchedule('');
                    setBranchDialogOpen(true);
                  }}
                >
                  + Добавить филиал
                </button>
              </div>
            </div>

            {/* networks removed — not needed */}
          </div>
        )}
      </div>

          <div className="mini-calendar" aria-hidden={false}>
        <div className="month-header">
          <button
            className="month-nav ui-datepicker-prev"
            onClick={() => setCalendarDate(prev => {
              const d = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
              return d;
            })}
            aria-label="Previous month"
          >
            ‹
          </button>

          <div className="month-label">
            {(() => {
              const monthName = calendarDate.toLocaleDateString('ru-RU', { month: 'long' });
              const year = calendarDate.getFullYear();
              return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
            })()}
          </div>

          <button
            className="month-nav ui-datepicker-next"
            onClick={() => setCalendarDate(prev => {
              const d = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
              return d;
            })}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="mini-calendar-datepicker">
          <table className="ui-datepicker-calendar">
            <thead>
              <tr>
                {['пн','вт','ср','чт','пт','сб','вс'].map((wd) => (
                  <th key={wd}><span title={wd}>{wd}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                for (let r = 0; r < calendarMatrix.length; r += 7) rows.push(calendarMatrix.slice(r, r + 7));

                return rows.map((week, rIdx) => (
                  <tr key={rIdx} className={"work"}>
                    {week.map((cell, cIdx) => {
                      const cellMonth = cell.getMonth();
                      const isOtherMonth = cellMonth !== calendarDate.getMonth();
                      const isToday = cell.getFullYear() === todayDate.getFullYear() &&
                                      cell.getMonth() === todayDate.getMonth() &&
                                      cell.getDate() === todayDate.getDate();
                      const isSelected = cell.getFullYear() === selectedDate.getFullYear() &&
                                         cell.getMonth() === selectedDate.getMonth() &&
                                         cell.getDate() === selectedDate.getDate();

                      const isWeekend = cIdx === 5 || cIdx === 6;

                      const tdClasses = [isOtherMonth ? 'ui-datepicker-other-month' : '', isToday ? 'ui-datepicker-current-day ui-datepicker-today' : '', isWeekend ? 'ui-datepicker-week-end' : '', isSelected ? 'ui-datepicker-current-day ui-datepicker-selected' : ''].filter(Boolean).join(' ');
                      const aClasses = ['ui-state-default', isOtherMonth ? 'ui-priority-secondary' : '', isToday ? 'ui-state-highlight ui-state-active ui-state-hover' : ''].filter(Boolean).join(' ');

                      return (
                        <td key={cIdx} className={tdClasses} data-month={cell.getMonth()} data-year={cell.getFullYear()}>
                          <button
                            type="button"
                            className={aClasses}
                            onClick={() => {
                              // update parent states
                              const picked = new Date(cell.getFullYear(), cell.getMonth(), cell.getDate());
                              setSelectedDate(picked);
                              setCalendarDate(new Date(cell.getFullYear(), cell.getMonth(), 1));

                              // navigate to timetable for this user with date query param
                              // try to get userId from localStorage (login saves it)
                              let uid = null;
                              try {
                                const stored = localStorage.getItem('user');
                                if (stored) uid = JSON.parse(stored).id;
                              } catch {}
                              if (!uid) {
                                uid = localStorage.getItem('userId');
                              }

                              if (uid) {
                                // craft a local YYYY-MM-DD string (avoid toISOString which converts to UTC)
                                const y = picked.getFullYear();
                                const m = String(picked.getMonth() + 1).padStart(2, '0');
                                const d = String(picked.getDate()).padStart(2, '0');
                                const isoLocal = `${y}-${m}-${d}`;
                                try { localStorage.setItem('selectedDate', isoLocal); } catch {}
                                // include branch context when available
                                const bid = currentBranch ? (currentBranch.branch_id || currentBranch.id || currentBranch.branchId) : null;
                                const branchParam = bid ? `&branchId=${encodeURIComponent(bid)}` : '';
                                navigate(`/timetable/${uid}?date=${isoLocal}${branchParam}`);
                              }
                              else {
                                // no uid: still include branchId if available
                                const y = picked.getFullYear();
                                const m = String(picked.getMonth() + 1).padStart(2, '0');
                                const d = String(picked.getDate()).padStart(2, '0');
                                const isoLocal = `${y}-${m}-${d}`;
                                try { localStorage.setItem('selectedDate', isoLocal); } catch {}
                                const bid = currentBranch ? (currentBranch.branch_id || currentBranch.id || currentBranch.branchId) : null;
                                const branchParam = bid ? `?branchId=${encodeURIComponent(bid)}` : '';
                                navigate(`/timetable${branchParam ? `${branchParam}&date=${isoLocal}` : `?date=${isoLocal}`}`);
                              }
                            }}
                          >
                            {cell.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="menu">
        {(() => {
          const items = [
            { to: '/clients', label: 'Клиентская база', icon: clientIcon },
            { to: '/dashboard', label: 'Сводка', icon: summaryIcon },
            { to: '/onlinebooking', label: 'Онлайн-запись', icon: bookingIcon },
            { to: '/settings', label: 'Настройки', icon: settingsIcon },
          ];

          return items.map(it => {
            // append branchId query param to menu links when a branch is selected
            const branchIdParam = currentBranch ? `?branchId=${encodeURIComponent(currentBranch.branch_id || currentBranch.id || currentBranch.branchId)}` : '';
            const to = `${it.to}${branchIdParam}`;
            return (
            <Link
              key={it.to}
              to={to}
              className={`menu-item ${loc.pathname === it.to ? 'active' : ''}`}
              aria-current={loc.pathname === it.to ? 'page' : undefined}
            >
              <img src={it.icon} alt="" aria-hidden className="menu-icon" />
              <span className="menu-label">{it.label}</span>
            </Link>
          );
          });
        })()}
      </div>

      <div className="profile">
        <button
          type="button"
          className="profile-button"
          onClick={() => {
            // переход в раздел личных данных
            navigate('/profile');
          }}
        >
          <div className="profile-name">{loadingUser ? 'Загрузка...' : userName}</div>
          <div className="profile-email" title={userError || ''}>{loadingUser ? 'Загрузка...' : userEmail}</div>
        </button>
      </div>

      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            window.location.href = '/login';
          }}
        >
          <span className="logout-icon" aria-hidden></span>
          Выйти из аккаунта
        </button>
      </div>

      {networkDialogOpen && (
        <div className="network-dialog-backdrop" onClick={() => setNetworkDialogOpen(false)}>
          <div
            className="network-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="network-dialog-header">
              <h2 className="network-dialog-title">Создать сеть</h2>
              <button
                type="button"
                className="network-dialog-close"
                onClick={() => setNetworkDialogOpen(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="network-dialog-body">
              <label className="network-field-label">
                Название сети
                <input
                  type="text"
                  className="network-field-input"
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  placeholder="Например, AW FORUM"
                />
              </label>
              <label className="network-field-label">
                Описание (необязательно)
                <textarea
                  className="network-field-input network-field-textarea"
                  rows={3}
                  value={networkDescription}
                  onChange={(e) => setNetworkDescription(e.target.value)}
                  placeholder="Короткое описание сети"
                />
              </label>
            </div>
            <div className="network-dialog-footer">
              <button
                type="button"
                className="network-btn network-btn-secondary"
                onClick={() => setNetworkDialogOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="network-btn network-btn-primary"
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    alert('Нет токена авторизации');
                    return;
                  }
                  if (!networkName) {
                    alert('Введите название сети');
                    return;
                  }
                  const baseSlug = networkName
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9а-яё\s-]/gi, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');
                  const slug = baseSlug || `network-${Date.now()}`;
                  try {
                    const API_URL = process.env.REACT_APP_API_URL;
                    const res = await fetch(`${API_URL}/networks`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        name: networkName,
                        slug,
                        description: networkDescription,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data.error || 'Не удалось создать сеть');
                      return;
                    }
                    // добавить новую сеть в конец списка, чтобы она была снизу
                    if (data && data.network) {
                      setNetworks(prev => {
                        const list = Array.isArray(prev) ? prev : [];
                        const exists = list.some(n => n.network_id === data.network.network_id);
                        return exists ? list : [...list, data.network];
                      });
                    }
                    setNetworkDialogOpen(false);
                    setNetworkName('');
                    setNetworkDescription('');
                  } catch (e) {
                    alert('Ошибка запроса');
                  }
                }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {branchDialogOpen && (
        <div className="network-dialog-backdrop" onClick={() => setBranchDialogOpen(false)}>
          <div
            className="network-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="network-dialog-header">
              <h2 className="network-dialog-title">Создать филиал</h2>
              <button
                type="button"
                className="network-dialog-close"
                onClick={() => setBranchDialogOpen(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="network-dialog-body">
              <label className="network-field-label">
                Сеть
                <select
                  className="network-field-input"
                  value={branchNetworkId}
                  onChange={(e) => setBranchNetworkId(e.target.value)}
                >
                  <option value="">Без сети</option>
                  {networks.map(net => (
                    <option key={net.network_id} value={net.network_id}>{net.name}</option>
                  ))}
                </select>
              </label>
              <label className="network-field-label">
                Название филиала
                <input
                  type="text"
                  className="network-field-input"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Например, АЛМАТЫ СЕЙФУЛЛИНА"
                />
              </label>
              <label className="network-field-label">
                Страна
                <select
                  className="network-field-input"
                  value={branchCountry}
                  onChange={(e) => {
                    const code = e.target.value;
                    setBranchCountry(code);
                    // при смене страны сбрасываем телефон, чтобы не было старого кода
                    setBranchPhone('');
                  }}
                >
                  <option value="">Выберите страну</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="network-field-label">
                Город
                <input
                  type="text"
                  className="network-field-input"
                  value={branchCity}
                  onChange={(e) => setBranchCity(e.target.value)}
                  placeholder={(() => {
                    const list = COUNTRY_CITIES[branchCountry] || [];
                    const example = list.length ? list[0] : 'Алматы';
                    return `Например, ${example}`;
                  })()}
                />
              </label>
              <div className="network-field-hint">
                {(COUNTRY_CITIES[branchCountry] || []).slice(0, 5).map(city => (
                  <button
                    key={city}
                    type="button"
                    className="network-field-hint-chip"
                    onClick={() => setBranchCity(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
              <label className="network-field-label">
                Адрес
                <input
                  type="text"
                  className="network-field-input"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Например, пр-т. Сейфуллина, 617"
                />
              </label>
              <label className="network-field-label">
                Телефон
                <input
                  type="tel"
                  className="network-field-input"
                  value={branchPhone}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const code = COUNTRY_PHONE_CODES[branchCountry] || '+7';
                    const numericCode = code.replace(/\D/g, '');
                    const digits = raw.replace(/\D/g, '');

                    if (!digits) {
                      setBranchPhone('');
                      return;
                    }

                    // отделяем местный номер от кода страны, даже если пользователь переписал начало
                    let localDigits;
                    if (digits.startsWith(numericCode)) {
                      localDigits = digits.slice(numericCode.length);
                    } else {
                      localDigits = digits;
                    }

                    // ограничиваем длину местного номера по стране
                    const maxLocal = COUNTRY_PHONE_NATIONAL_DIGITS[branchCountry] || 10;
                    if (localDigits.length > maxLocal) {
                      localDigits = localDigits.slice(0, maxLocal);
                    }

                    const formatted = localDigits ? `${code} ${localDigits}` : `${code} `;
                    setBranchPhone(formatted);
                  }}
                  onFocus={() => {
                    if (!branchPhone) {
                      const code = COUNTRY_PHONE_CODES[branchCountry] || '+7';
                      setBranchPhone(`${code} `);
                    }
                  }}
                  placeholder={(() => {
                    const code = COUNTRY_PHONE_CODES[branchCountry] || '+7';
                    const local = COUNTRY_PHONE_EXAMPLE_LOCAL[branchCountry] || '701 575-50-50';
                    return `Например, ${code} ${local}`;
                  })()}
                  pattern="^[+0-9 ()-]{6,20}$"
                />
              </label>
              <label className="network-field-label">
                Сайт
                <input
                  type="text"
                  className="network-field-input"
                  value={branchWebsite}
                  onChange={(e) => setBranchWebsite(e.target.value)}
                  placeholder="Например, almaty.another-world.com"
                />
              </label>
              <label className="network-field-label">
                Режим работы
                <input
                  type="text"
                  className="network-field-input"
                  value={branchSchedule}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const prev = branchSchedule || '';
                    const prevDigits = prev.replace(/\D/g, '').slice(0, 8);

                    // Оставляем только цифры и ограничиваем до 8 (ЧЧММЧЧММ)
                    let digits = raw.replace(/\D/g, '').slice(0, 8);

                    const isDeleting = raw.length < prev.length;
                    // Если пользователь стёр только символ (: или -), а цифры не изменились,
                    // уберём ещё одну цифру с конца, чтобы символ тоже "ушёл".
                    if (isDeleting && digits === prevDigits && digits.length > 0) {
                      digits = digits.slice(0, -1);
                    }

                    const len = digits.length;

                    if (!len) {
                      setBranchSchedule('');
                      return;
                    }

                    let formatted = '';

                    if (len <= 2) {
                      // вводим первые часы
                      formatted = digits;
                      if (len === 2) formatted += ':';
                    } else if (len === 3) {
                      // ЧЧ:М
                      formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
                    } else {
                      // есть полные ЧЧММ
                      const h1 = digits.slice(0, 2);
                      const m1 = digits.slice(2, 4);
                      formatted = `${h1}:${m1}-`;

                      if (len === 4) {
                        // только первая часть, показываем дефис
                      } else if (len === 5) {
                        // ЧЧ:ММ-H
                        formatted += digits.slice(4, 5);
                      } else if (len === 6) {
                        // ЧЧ:ММ-ЧЧ:
                        formatted += `${digits.slice(4, 6)}:`;
                      } else if (len === 7) {
                        // ЧЧ:ММ-ЧЧ:М
                        formatted += `${digits.slice(4, 6)}:${digits.slice(6, 7)}`;
                      } else if (len === 8) {
                        // ЧЧ:ММ-ЧЧ:ММ
                        formatted += `${digits.slice(4, 6)}:${digits.slice(6, 8)}`;
                      }
                    }

                    setBranchSchedule(formatted);
                  }}
                  placeholder="Например, 10:00-22:00"
                />
              <div className="network-field-hint">
                {['10:00-22:00', '09:00-18:00', '11:00-20:00'].map(time => (
                  <button
                    key={time}
                    type="button"
                    className="network-field-hint-chip"
                    onClick={() => setBranchSchedule(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              </label>
            </div>
            <div className="network-dialog-footer">
              <button
                type="button"
                className="network-btn network-btn-secondary"
                onClick={() => setBranchDialogOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="network-btn network-btn-primary"
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    alert('Нет токена авторизации');
                    return;
                  }
                  if (!branchName) {
                    alert('Введите название филиала');
                    return;
                  }
                  try {
                    const API_URL = process.env.REACT_APP_API_URL;
                    const res = await fetch(`${API_URL}/branches`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        network_id: branchNetworkId ? Number(branchNetworkId) : null,
                        branch_name: branchName,
                        country_code: branchCountry || 'KZ',
                        city: branchCity,
                        address: branchAddress,
                        // в базу отправляем телефон без пробелов
                        phone: branchPhone ? branchPhone.replace(/\s+/g, '') : '',
                        website: branchWebsite,
                        schedule: branchSchedule,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data.error || 'Не удалось создать филиал');
                      return;
                    }
                    if (data && data.branch) {
                      setBranches(prev => {
                        const list = Array.isArray(prev) ? prev : [];
                        const exists = list.some(b => b.branch_id === data.branch.branch_id);
                        return exists ? list : [...list, data.branch];
                      });
                      try {
                        if (data.branch.branch_id) {
                          localStorage.setItem('selectedBranchId', String(data.branch.branch_id));
                        }
                      } catch {}
                    }
                    setBranchDialogOpen(false);
                    // Полная перезагрузка, чтобы все страницы/состояния подтянули новый филиал
                    window.location.reload();
                  } catch (e) {
                    alert('Ошибка запроса');
                  }
                }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

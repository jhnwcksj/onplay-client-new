import { useEffect } from 'react';

import { useState } from "react";
import { toast } from '../hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizePhoneNumber } from '../utils/phoneFormatter';
import { TIMEZONE_NAME, TIMEZONE_OFFSET_HOURS } from '../utils/timezone';
import "./Login.css";

function Login() {
  const [activeTab, setActiveTab] = useState("login"); // "login" или "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState('+7');
  const [showPassword, setShowPassword] = useState(false);

  // Список кодов стран (display / code)
  const COUNTRY_CODES = [
    { name: 'Казахстан', code: '+7' },
    { name: 'Россия', code: '+7' },
    { name: 'США', code: '+1' },
    { name: 'Великобритания', code: '+44' },
    { name: 'Германия', code: '+49' },
    { name: 'Франция', code: '+33' },
    { name: 'Италия', code: '+39' },
    { name: 'Испания', code: '+34' },
    { name: 'Португалия', code: '+351' },
    { name: 'Нидерланды', code: '+31' },
    { name: 'Бельгия', code: '+32' },
    { name: 'Швейцария', code: '+41' },
    { name: 'Австрия', code: '+43' },
    { name: 'Польша', code: '+48' },
    { name: 'Чехия', code: '+420' },
    { name: 'Словакия', code: '+421' },
    { name: 'Венгрия', code: '+36' },
    { name: 'Румыния', code: '+40' },
    { name: 'Болгария', code: '+359' },
    { name: 'Турция', code: '+90' },
    { name: 'Китай', code: '+86' },
    { name: 'Япония', code: '+81' },
    { name: 'Южная Корея', code: '+82' },
    { name: 'Индия', code: '+91' },
    { name: 'ОАЭ', code: '+971' },
    { name: 'Саудовская Аравия', code: '+966' },
    { name: 'Израиль', code: '+972' },
    { name: 'Египет', code: '+20' },
    { name: 'Таиланд', code: '+66' },
    { name: 'Вьетнам', code: '+84' },
    { name: 'Сингапур', code: '+65' },
    { name: 'Малайзия', code: '+60' },
    { name: 'Индонезия', code: '+62' },
    { name: 'Бразилия', code: '+55' },
    { name: 'Мексика', code: '+52' },
    { name: 'Аргентина', code: '+54' },
    { name: 'Чили', code: '+56' },
    { name: 'Австралия', code: '+61' },
    { name: 'Новая Зеландия', code: '+64' }
  ];

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = activeTab === "login" ? 'Авторизация' : 'Регистрация';
  }, [activeTab]);

  // Попытка угадать код страны по часовому поясу филиала
  useEffect(() => {
    try {
      const tz = TIMEZONE_NAME();
      const hours = TIMEZONE_OFFSET_HOURS();
      let code = '+7';
      if (typeof tz === 'string' && tz.toLowerCase().includes('london')) code = '+44';
      else if (hours >= 9) code = '+81';
      else if (hours <= -3) code = '+1';
      else if (hours >= 5) code = '+7';
      setCountryCode(code);
    } catch (e) {
      // fallback оставляем +7
    }
  }, []);

  const handleLogin = async () => {
    const API_URL = process.env.REACT_APP_API_URL;
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      // Save the whole user object so we can read name/email for the UI
      try { localStorage.setItem("user", JSON.stringify(data.user)); } catch {}
      localStorage.setItem("userId", data.user.id);

      // After logging in, query which branches the user has and pick the best branchId
      let branchParam = '';
      try {
        const token = data.token;
        // try likely endpoints (similar to Sidebar)
        const endpoints = [
          `${API_URL}/users/${data.user.id}/branches`,
          `${API_URL}/branches?userId=${data.user.id}`,
          `${API_URL}/branches?user_id=${data.user.id}`,
          `/api/users/${data.user.id}/branches`,
          `/api/branches?userId=${data.user.id}`,
          `/api/branches?user_id=${data.user.id}`,
        ];

        let branches = null;
        for (const url of endpoints) {
          try {
            const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (!res.ok) continue;
            const d = await res.json();
            branches = Array.isArray(d) ? d : (d.branches || d.rows || d);
            if (branches && branches.length >= 0) break;
          } catch (e) {
            // try next endpoint
          }
        }

        // pick branchId preference order:
        // 1) branchId passed in current URL
        // 2) previously-saved selectedBranchId in localStorage
        // 3) prefer a branch from fetched branches (first one)
        let chosen = null;
        const params = new URLSearchParams(location.search);
        const urlBid = params.get('branchId');
        if (urlBid) {
          // only honor urlBid if user actually has it (if we have branch list)
          if (!branches || branches.find(b => String(b.branch_id || b.id || b.branchId) === String(urlBid))) {
            chosen = urlBid;
          }
        }

        if (!chosen) {
          const saved = localStorage.getItem('selectedBranchId');
          if (saved && (!branches || branches.find(b => String(b.branch_id || b.id || b.branchId) === String(saved)))) {
            chosen = saved;
          }
        }

        if (!chosen && branches && branches.length > 0) {
          const b = branches[0];
          chosen = b.branch_id || b.id || b.branchId || null;
        }

        if (chosen) {
          branchParam = `?branchId=${encodeURIComponent(chosen)}`;
          try { localStorage.setItem('selectedBranchId', String(chosen)); } catch {}
        }
      } catch (e) {
        // non-fatal — fall back to whatever was in the URL/localStorage
        try {
          const params = new URLSearchParams(location.search);
          let bid = params.get('branchId');
          if (!bid) bid = localStorage.getItem('selectedBranchId');
          if (bid) branchParam = `?branchId=${encodeURIComponent(bid)}`;
        } catch {}
      }

      // показываем toast об успешном входе, затем переходим
      toast({ title: 'Успешно', description: 'Вход выполнен', variant: 'success' });
      // navigate to timetable for this user and include branchId when available
      navigate(`/timetable/${data.user.id}${branchParam}`, { replace: true });
    } else {
      toast({ title: 'Ошибка', description: data.error || 'Не удалось войти', variant: 'destructive' });
    }
  };

  const getPhonePlaceholder = (code) => {
    switch (code) {
      case '+7': return '(912) 345-67-89';
      case '+1': return '(555) 555-5555';
      case '+44': return '07123 456789';
      case '+49': return '0151 23456789';
      case '+33': return '06 12 34 56 78';
      case '+39': return '331 234 5678';
      case '+61': return '0412 345 678';
      case '+52': return '55 1234 5678';
      default: return '9012345678';
    }
  };

  // Format phone for display (only local part, no country code)
  const formatLocalPhone = (digits) => {
    if (!digits) return '';
    // Simple formatting for +7 countries
    if (countryCode === '+7') {
      // Format: (XXX) XXX-XX-XX
      let formatted = '';
      if (digits.length > 0) formatted += '(' + digits.slice(0, 3);
      if (digits.length > 3) formatted += ') ' + digits.slice(3, 6);
      if (digits.length > 6) formatted += '-' + digits.slice(6, 8);
      if (digits.length > 8) formatted += '-' + digits.slice(8, 10);
      return formatted;
    }
    return digits;
  };

  const cleanPhoneNumber = (value) => {
    return value.replace(/[^0-9]/g, '');
  };

  const handlePhoneChange = (e) => {
    // Remove all non-digit characters
    let val = cleanPhoneNumber(e.target.value);
    // Limit length to 10 digits for local number
    if (val.length > 10) val = val.slice(0, 10);
    setPhone(val);
  };

  const handleRegister = async () => {
    const API_URL = process.env.REACT_APP_API_URL;

    if (!name || !email || !password || !phone) {
      toast({ title: 'Ошибка', description: 'Пожалуйста, заполните все поля', variant: 'destructive' });
      return;
    }

    // Combine country code + local phone (phone already contains only digits)
    const code = countryCode.replace('+', '');
    const fullPhone = code + phone;
    const normalizedPhone = normalizePhoneNumber(fullPhone);

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone: normalizedPhone })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      try { localStorage.setItem("user", JSON.stringify(data.user)); } catch {}
      localStorage.setItem("userId", data.user.id);

      toast({ title: 'Успешно', description: 'Регистрация прошла успешно', variant: 'success' });
      // После регистрации переходим на расписание
      navigate(`/timetable/${data.user.id}`, { replace: true });
    } else {
      toast({ title: 'Ошибка', description: data.error || 'Не удалось зарегистрироваться', variant: 'destructive' });
    }
  };

  return (
    
    <div className="login-wrapper">
      <div className="login-container">

        <h1 className="login-brand">Авторизация</h1>
        <p className="login-subtitle">Войдите или зарегистрируйтесь в системе</p>

        {/* Вкладки */}
        <div className="login-tabs">
          <button
            className={`login-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Вход
          </button>
          <button
            className={`login-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Регистрация
          </button>
        </div>

        {/* Форма входа */}
        {activeTab === "login" && (
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                className="login-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Пароль</label>
              <div className="login-password-wrapper">
                <input
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Показать пароль"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button className="login-button" type="submit">
              Войти
            </button>
          </form>
        )}

        {/* Форма регистрации */}
        {activeTab === "register" && (
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <div className="login-field">
              <label className="login-label">Имя</label>
              <input
                className="login-input"
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                className="login-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Телефон</label>
              <div className="phone-row">
                <div className="code-select-wrapper">
                  <select
                    className="login-input login-input-code native-select"
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={`${c.code}-${c.name}`} value={c.code}>{`${c.code} ${c.name}`}</option>
                    ))}
                  </select>
                  <div className="code-only" aria-hidden>
                    {countryCode}
                  </div>
                </div>
                <input
                  className="login-input login-input-phone visible"
                  type="tel"
                  placeholder={getPhonePlaceholder(countryCode)}
                  value={formatLocalPhone(phone)}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Пароль</label>
              <div className="login-password-wrapper">
                <input
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Показать пароль"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button className="login-button" type="submit">
              Зарегистрироваться
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default Login;

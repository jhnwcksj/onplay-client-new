import { useEffect } from 'react';

import { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // состояние для показа пароля

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Авторизация';
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

      // navigate to timetable for this user and include branchId when available
      navigate(`/timetable/${data.user.id}${branchParam}`, { replace: true });
    } else {
      alert(data.error);
    }
  };

  return (
    
    <div className="login-wrapper">
      <div className="login-container">

        <h1 className="login-title">Вход</h1>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>

        <div className="login-email">
        <label className="login-label">Почта</label>
        <input
          className="login-input"
          onChange={e => setEmail(e.target.value)}
        />
        </div>
        <div className="login-password">
        <label className="login-label">Пароль</label>
        <input
          className="login-input"
          type={showPassword ? "text" : "password"} // меняем тип инпута
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <div className="login-extra">
        <input
          type="checkbox"
          checked={showPassword}
          onChange={e => setShowPassword(e.target.checked)} // меняем состояние
        />
        <span
          style={{ cursor: "pointer" }}
          onClick={() => setShowPassword(prev => !prev)} // можно кликать по тексту
        >
          Показать пароль
        </span>
        <span className="login-forgot">Не помню пароль</span>
      </div>
      
        <button className="login-button" onClick={handleLogin}>
          Войти
        </button>

        </form>
      </div>
    </div>
  );
}

export default Login;

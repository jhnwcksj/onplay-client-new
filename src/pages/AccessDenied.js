import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AccessDenied.css";

export default function AccessDenied() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChooseAnotherBranch = () => {
    try {
      localStorage.removeItem('selectedBranchId');
    } catch {}

    try {
      const params = new URLSearchParams(location.search || '');
      params.delete('branchId');
      const qs = params.toString();
      navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
    } catch {
      navigate(-1);
    }
  };

  return (
    <div className="access-denied-ui">
      <div className="ad-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#f44336"/><path d="M32 18v20" stroke="#fff" strokeWidth="4" strokeLinecap="round"/><circle cx="32" cy="44" r="3" fill="#fff"/></svg>
      </div>
      <h2>Филиал недоступен</h2>
      <div className="ad-desc">
        Возможно, этот филиал был закрыт или удалён,<br/>
        либо у вас больше нет к нему доступа.<br/>
        Выберите другой филиал, чтобы продолжить работу.
      </div>
      <div className="ad-actions">
        <button className="ad-btn primary" onClick={handleChooseAnotherBranch}>
          Выбрать другой филиал
        </button>
        <button className="ad-btn secondary" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>
    </div>
  );
}

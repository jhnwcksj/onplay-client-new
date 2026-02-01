import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <h1 className="nf-code">404</h1>
        <div className="nf-title">Страница не найдена</div>
        <div className="nf-desc">Похоже, эта ссылка пуста или путь неправильный.</div>
        <div className="nf-actions">
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Назад</button>
          <Link to="/" className="btn btn-primary">На главную</Link>
          {/* <Link to="/login" className="btn">Войти</Link> */}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import noAvatarImg from '../images/no_image.png';
import './Profile.css';

export default function Profile() {
  useEffect(() => {
    document.title = 'Настройки личных данных';
  }, []);

  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  })();

  const [userName, setUserName] = useState(storedUser.name || 'Пользователь');
  const [userEmail, setUserEmail] = useState(storedUser.email || 'email@example.com');
  const [userPhone, setUserPhone] = useState(storedUser.phone || '+7 ___ ___-__-__');
  const avatarUrl = storedUser.avatar || noAvatarImg;

  const [nameInput, setNameInput] = useState(storedUser.name || '');
  const [aboutInput] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');

  const [calendarDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate] = React.useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });

  const token = localStorage.getItem('token');

  async function updateLocalUser(updated) {
    try {
      const raw = localStorage.getItem('user');
      const base = raw ? JSON.parse(raw) : {};
      const merged = { ...base, ...updated };
      localStorage.setItem('user', JSON.stringify(merged));
    } catch {}
  }

  const handleUpdateProfile = async () => {
    if (!token) {
      alert('Нет токена авторизации');
      return;
    }
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nameInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Не удалось обновить данные');
        return;
      }
      setUserName(data.user.name || 'Пользователь');
      await updateLocalUser({ name: data.user.name });
      alert('Данные обновлены');
    } catch (e) {
      alert('Ошибка запроса');
    }
  };

  const handleChangePassword = async () => {
    if (!token) {
      alert('Нет токена авторизации');
      return;
    }
    if (!oldPassword || !newPassword || !newPasswordRepeat) {
      alert('Заполните все поля пароля');
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      alert('Новый пароль и подтверждение не совпадают');
      return;
    }
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Не удалось изменить пароль');
        return;
      }
      setOldPassword('');
      setNewPassword('');
      setNewPasswordRepeat('');
      alert('Пароль изменён');
    } catch (e) {
      alert('Ошибка запроса');
    }
  };

  const handleChangePhone = async () => {
    if (!token) {
      alert('Нет токена авторизации');
      return;
    }
    const nextPhone = window.prompt('Введите новый номер телефона', userPhone || '');
    if (!nextPhone) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/auth/phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: nextPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Не удалось изменить номер');
        return;
      }
      setUserPhone(data.user.phone || nextPhone);
      await updateLocalUser({ phone: data.user.phone || nextPhone });
      alert('Номер обновлён');
    } catch (e) {
      alert('Ошибка запроса');
    }
  };

  const handleResendEmailCode = async () => {
    if (!token) {
      alert('Нет токена авторизации');
      return;
    }
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/auth/email/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Не удалось отправить код');
        return;
      }
      alert(data.message || 'Код отправлен');
    } catch (e) {
      alert('Ошибка запроса');
    }
  };

  const handleChangeEmail = async () => {
    if (!token) {
      alert('Нет токена авторизации');
      return;
    }
    if (!newEmailInput) {
      alert('Введите новый email');
      return;
    }
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/auth/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: newEmailInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Не удалось изменить email');
        return;
      }
      setUserEmail(data.user.email || newEmailInput);
      await updateLocalUser({ email: data.user.email || newEmailInput });
      alert('Email обновлён');
    } catch (e) {
      alert('Ошибка запроса');
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) {
      alert('Нет токена авторизации');
      return;
    }
    if (!window.confirm('Вы уверены, что хотите удалить аккаунт?')) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/auth/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Не удалось удалить аккаунт');
        return;
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    } catch (e) {
      alert('Ошибка запроса');
    }
  };

  return (
    <div className="timetable-wrapper">
      <Sidebar
        calendarDate={calendarDate}
        setCalendarDate={() => {}}
        selectedDate={selectedDate}
        setSelectedDate={() => {}}
        userName={userName}
        userEmail={userEmail}
        loadingUser={false}
        userError={null}
      />

      <div className="profile-page">
        <div className="profile-page-header">
          <div className="profile-page-breadcrumb">Личный кабинет</div>
          <h1 className="profile-page-title">Настройки личных данных</h1>
        </div>

        <div className="profile-page-layout">
          <aside className="profile-sidecard">
            <div className="profile-sidecard-block">
              <img
                src={avatarUrl}
                alt="Аватар"
                className="profile-avatar"
                onError={(e) => {
                  if (e.target.src !== noAvatarImg) {
                    e.target.src = noAvatarImg;
                  }
                }}
              />
              <div className="profile-side-name">{userName}</div>
              <div className="profile-side-phone">{userPhone}</div>
              <div className="profile-side-email">{userEmail}</div>
            </div>

            <div className="profile-sidecard-block">
              <div className="profile-side-title">Управление персональными данными</div>
              <button type="button" className="btn btn-secondary-full">
                Выгрузить мои данные
              </button>
            </div>
          </aside>

          <main className="profile-main">
            <section className="profile-section">
              <h2 className="profile-section-title">Настройки</h2>

              <div className="profile-form-grid">
                <div className="form-row">
                  <label className="form-label">Имя</label>
                  <input
                    className="form-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">Язык</label>
                  <select className="form-input">
                    <option>Русский</option>
                    <option>Казахский</option>
                    <option>English</option>
                  </select>
                </div>
                <div className="form-row">
                  {/* <label className="form-label">Город</label> */}
                  {/* <input className="form-input" type="text" placeholder="Город" /> */}
                </div>
                <div className="form-row form-row-full">
                  <label className="form-label">Информация о себе</label>
                  <textarea className="form-input form-textarea" rows={5} />
                </div>
              </div>

              <button type="button" className="btn btn-primary" onClick={handleUpdateProfile}>
                Изменить данные
              </button>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">Изменить пароль</h2>
              <div className="profile-form-grid">
                <div className="form-row">
                  <label className="form-label">Старый пароль</label>
                  <input
                    className="form-input"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">Новый пароль</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label className="form-label">Подтвердите пароль</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPasswordRepeat}
                    onChange={(e) => setNewPasswordRepeat(e.target.value)}
                  />
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleChangePassword}>
                Изменить пароль
              </button>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">Изменить номер мобильного</h2>
              <div className="profile-form-grid">
                <div className="form-row">
                  <label className="form-label">Текущий номер</label>
                  <div className="form-static">{userPhone}</div>
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleChangePhone}>
                Изменить номер
              </button>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">Изменить Email</h2>
              <div className="profile-form-grid">
                <div className="form-row">
                  <label className="form-label">Текущий Email</label>
                  <div className="form-static">{userEmail} Email не подтвержден</div>
                </div>
                <div className="form-row">
                  <button type="button" className="btn btn-secondary" onClick={handleResendEmailCode}>
                    Отправить повторно код подтверждения
                  </button>
                </div>
                <div className="form-row">
                  <label className="form-label">Новый Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                  />
                </div>
                <div className="form-row form-row-full">
                  <div className="form-hint">
                    На новый Email будет выслано письмо со ссылкой для подтверждения
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleChangeEmail}>
                Изменить Email
              </button>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">Управление аккаунтом</h2>
              <div className="profile-form-grid">
                <div className="form-row">
                  <label className="form-label">Удаление аккаунта</label>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
                    Удалить аккаунт
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

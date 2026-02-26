import React, { useState, useEffect } from 'react';
import './Portfolio.css';
import { toast } from '../hooks/use-toast';

function Portfolio() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = 'Портфолио';
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: 'Сообщение отправлено',
      description: 'Спасибо — я свяжусь с вами в ближайшее время.'
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const scrollToContact = () => {
    const el = document.getElementById('portfolio-contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };

  return (
    <div className="portfolio-container">
      {/* Mobile Overlay */}
      {sidebarOpen && <div className="portfolio-sidebar-overlay" onClick={closeSidebar}></div>}
      
      {/* Sidebar */}
      <aside className={`portfolio-sidebar ${sidebarOpen ? 'portfolio-open' : ''}`}>
        <button className="portfolio-sidebar-close" onClick={closeSidebar}>✕</button>
        <div className="portfolio-sidebar-header">
          <div className="portfolio-logo">
            <span className="portfolio-logo-icon">📋</span>
            <span className="portfolio-logo-text">DevPortfolio</span>
          </div>
        </div>
        
        <nav className="portfolio-sidebar-nav">
          <div className="portfolio-nav-section-title">МЕНЮ</div>
          <a href="#portfolio-overview" className="portfolio-nav-item portfolio-active" onClick={closeSidebar}>
            <span className="portfolio-nav-icon">📊</span>
            <span>Обзор</span>
          </a>
          <a href="#portfolio-tech-stack" className="portfolio-nav-item" onClick={closeSidebar}>
            <span className="portfolio-nav-icon">💻</span>
            <span>Технологии</span>
          </a>
          <a href="#portfolio-projects" className="portfolio-nav-item" onClick={closeSidebar}>
            <span className="portfolio-nav-icon">📁</span>
            <span>Проекты</span>
          </a>
          
          <div className="portfolio-nav-section-title">ПРОЕКТЫ</div>
          <a href="#portfolio-crm" className="portfolio-nav-item" onClick={closeSidebar}>
            <span className="portfolio-nav-icon">🔧</span>
            <span>CRM Система</span>
          </a>
          <a href="#portfolio-finance" className="portfolio-nav-item" onClick={closeSidebar}>
            <span className="portfolio-nav-icon">💰</span>
            <span>Финансовый Трекер</span>
          </a>
          <a href="#portfolio-telegram-bot" className="portfolio-nav-item" onClick={closeSidebar}>
            <span className="portfolio-nav-icon">🤖</span>
            <span>Телеграм Бот</span>
          </a>
          
          <div className="portfolio-nav-section-title">СВЯЗЬ</div>
          <a href="#portfolio-contact" className="portfolio-nav-item" onClick={closeSidebar}>
            <span className="portfolio-nav-icon">✉️</span>
            <span>Связаться</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="portfolio-main">
        <header className="portfolio-header">
          <button className="portfolio-mobile-menu-btn" onClick={toggleSidebar}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="portfolio-header-title">Портфолио</div>
          <div className="portfolio-header-right">
            <span className="portfolio-available-badge">🟢 Доступен для работы</span>
            {/* <div className="portfolio-user-avatar">👤</div> */}
          </div>
        </header>

        <div className="portfolio-content">
          {/* Hero Section */}
          <section id="portfolio-overview" className="portfolio-hero-section">
            <div className="portfolio-hero-card">
              <h1 className="portfolio-hero-name">Бейсембек Абзал</h1>
              <span className="portfolio-hero-badge">FULLSTACK DEVELOPER</span>
              <p className="portfolio-hero-description">
                Разрабатываю масштабируемые и высокопроизводительные приложения с использованием современных технологий: React, Node.js, Java, Python и PostgreSQL. Увлечён созданием инновационных решений и построением надёжной, эффективной backend-архитектуры.
              </p>
              
              <div className="portfolio-hero-links">
                <div className="portfolio-link-item">
                  <span className="portfolio-link-icon">🌐</span>
                  <span>Казахстан</span>
                </div>
                <div className="portfolio-link-item">
                  <span className="portfolio-link-icon">📧</span>
                  <span>abzik.kz.04@gmail.com</span>
                </div>
                {/* <div className="portfolio-link-item">
                  <span className="portfolio-link-icon">💼</span>
                  <span>alex-portfolio.dev</span>
                </div> */}
              </div>
              
              <button type="button" className="portfolio-btn-contact" onClick={scrollToContact}>📞 Связаться</button>
            </div>

            {/* Project Proficiency */}
            <div className="portfolio-proficiency-card">
              <h3 className="portfolio-card-title">ПРОЕКТНАЯ КОМПЕТЕНТНОСТЬ</h3>
              <div className="portfolio-proficiency-list">
                <div className="portfolio-proficiency-item">
                  <div className="portfolio-proficiency-label">
                    <span>React JS</span>
                    <span className="portfolio-proficiency-percent">90%</span>
                  </div>
                  <div className="portfolio-proficiency-bar">
                    <div className="portfolio-proficiency-fill" style={{width: '90%', backgroundColor: '#3b82f6'}}></div>
                  </div>
                </div>
                <div className="portfolio-proficiency-item">
                  <div className="portfolio-proficiency-label">
                    <span>Java</span>
                    <span className="portfolio-proficiency-percent">80%</span>
                  </div>
                  <div className="portfolio-proficiency-bar">
                    <div className="portfolio-proficiency-fill" style={{width: '80%', backgroundColor: '#3b82f6'}}></div>
                  </div>
                </div>
                <div className="portfolio-proficiency-item">
                  <div className="portfolio-proficiency-label">
                    <span>Python</span>
                    <span className="portfolio-proficiency-percent">85%</span>
                  </div>
                  <div className="portfolio-proficiency-bar">
                    <div className="portfolio-proficiency-fill" style={{width: '85%', backgroundColor: '#3b82f6'}}></div>
                  </div>
                </div>
                <div className="portfolio-proficiency-item">
                  <div className="portfolio-proficiency-label">
                    <span>Node.js/API</span>
                    <span className="portfolio-proficiency-percent">85%</span>
                  </div>
                  <div className="portfolio-proficiency-bar">
                    <div className="portfolio-proficiency-fill" style={{width: '85%', backgroundColor: '#8b5cf6'}}></div>
                  </div>
                </div>
                <div className="portfolio-proficiency-item">
                  <div className="portfolio-proficiency-label">
                    <span>Database Design</span>
                    <span className="portfolio-proficiency-percent">80%</span>
                  </div>
                  <div className="portfolio-proficiency-bar">
                    <div className="portfolio-proficiency-fill" style={{width: '80%', backgroundColor: '#10b981'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technical Stack */}
          <section id="portfolio-tech-stack" className="portfolio-tech-stack-section">
            <h2 className="portfolio-section-title">Технический Стек</h2>
            <div className="portfolio-tech-grid">
              <div className="portfolio-tech-card">
                <div className="portfolio-tech-icon blue">⚛️</div>
                <h3 className="portfolio-tech-title">Frontend Core</h3>
                <p className="portfolio-tech-description">Современная разработка интерфейсов с использованием реактивных фреймворков.</p>
                <div className="portfolio-tech-tags">
                  <span className="portfolio-tech-tag">React JS</span>
                  <span className="portfolio-tech-tag">Modern CSS</span>
                </div>
              </div>

              <div className="portfolio-tech-card">
                <div className="portfolio-tech-icon green">🔌</div>
                <h3 className="portfolio-tech-title">Backend & API</h3>
                <p className="portfolio-tech-description">Надежная серверная логика и REST/GraphQL.</p>
                <div className="portfolio-tech-tags">
                  <span className="portfolio-tech-tag">Node.js</span>
                  <span className="portfolio-tech-tag">Express</span>
                  <span className="portfolio-tech-tag">REST API</span>
                </div>
              </div>

              <div className="portfolio-tech-card">
                <div className="portfolio-tech-icon yellow">💬</div>
                <h3 className="portfolio-tech-title">Языки программирования</h3>
                <p className="portfolio-tech-description">Универсальное программирование в различных средах.</p>
                <div className="portfolio-tech-tags">
                  <span className="portfolio-tech-tag">Python</span>
                  <span className="portfolio-tech-tag">Java</span>
                  <span className="portfolio-tech-tag">JavaScript</span>
                </div>
              </div>

              <div className="portfolio-tech-card">
                <div className="portfolio-tech-icon purple">💾</div>
                <h3 className="portfolio-tech-title">Data Storage</h3>
                <p className="portfolio-tech-description">Эффективное проектирование схем и оптимизация запросов.</p>
                <div className="portfolio-tech-tags">
                  <span className="portfolio-tech-tag">PostgreSQL</span>
                  {/* <span className="portfolio-tech-tag">MySQL</span> */}
                </div>
              </div>
            </div>
          </section>

          {/* Projects */}
          <section id="portfolio-projects" className="portfolio-projects-section">
            <h2 className="portfolio-section-title">Рекомендуемые Проекты</h2>
            
            {/* CRM System */}
            <div id="portfolio-crm" className="portfolio-project-card">
              <div className="portfolio-project-header">
                <div className="portfolio-project-icon blue">🔧</div>
                <div className="portfolio-project-info">
                  <h3 className="portfolio-project-title">CRM Система</h3>
                  <p className="portfolio-project-subtitle">Онлайн управление записями и клиентами</p>
                </div>
                <div className="portfolio-project-actions">
                  <button className="portfolio-btn-icon">❤️</button>
                  <button className="portfolio-btn-icon">🔗</button>
                </div>
              </div>

              <div className="portfolio-project-status">
                <div className="portfolio-status-indicator"></div>
                <span>CRM Веб Сервис</span>
              </div>

              <div className="portfolio-project-metrics">
                <div className="portfolio-metric">
                  <div className="portfolio-metric-icon green">🔵</div>
                  <div className="portfolio-metric-data">
                    <div className="portfolio-metric-label">Новые Лиды</div>
                    <div className="portfolio-metric-value">142</div>
                  </div>
                </div>
                <div className="portfolio-metric">
                  <div className="portfolio-metric-icon purple">🟣</div>
                  <div className="portfolio-metric-data">
                    <div className="portfolio-metric-label">Назначения</div>
                    <div className="portfolio-metric-value">8</div>
                  </div>
                </div>
                <div className="portfolio-metric">
                  <div className="portfolio-metric-icon orange">🟠</div>
                  <div className="portfolio-metric-data">
                    <div className="portfolio-metric-label">Конверсия</div>
                    <div className="portfolio-metric-value">24%</div>
                  </div>
                </div>
              </div>

              <div className="portfolio-project-features">
                <h4 className="portfolio-features-title">Ключевые функции</h4>
                <ul className="portfolio-features-list">
                  <li>✓ Планирование встреч
                    <span className="portfolio-feature-desc">Система бронирования в реальном времени с интеграцией календаря</span>
                  </li>
                  <li>✓ Управление клиентами
                    <span className="portfolio-feature-desc">Подробные профили с историей и отслеживанием взаимодействий</span>
                  </li>
                  <li>✓ Панель аналитики
                    <span className="portfolio-feature-desc">Визуальные данные о продажах и генерации лидов</span>
                  </li>
                </ul>
              </div>

              <div className="portfolio-project-activity">
                <h4 className="portfolio-activity-title">Недавняя активность</h4>
                <div className="portfolio-activity-list">
                  <div className="portfolio-activity-item">
                    <div className="portfolio-activity-avatar">👤</div>
                    <div className="portfolio-activity-details">
                      <div className="portfolio-activity-text">Игра на VR Арене</div>
                      <div className="portfolio-activity-time">Пн, 11 дек • 10:00</div>
                    </div>
                    <span className="portfolio-activity-badge portfolio-completed">Завершено</span>
                  </div>
                  <div className="portfolio-activity-item">
                    <div className="portfolio-activity-avatar">👤</div>
                    <div className="portfolio-activity-details">
                      <div className="portfolio-activity-text">Аренда лаундж-зоны</div>
                      <div className="portfolio-activity-time">Пн, 11 дек • 14:00</div>
                    </div>
                    <span className="portfolio-activity-badge portfolio-pending">В ожидании</span>
                  </div>
                </div>
              </div>

              <div className="portfolio-project-tech">
                <div className="portfolio-tech-label">ИСПОЛЬЗУЕМЫЕ ТЕХНОЛОГИИ</div>
                <div className="portfolio-project-tags">
                  <span className="portfolio-project-tag">React</span>
                  <span className="portfolio-project-tag">Node.js</span>
                  <span className="portfolio-project-tag">PostgreSQL</span>
                  <span className="portfolio-project-tag">Express</span>
                </div>
              </div>

              <a className="portfolio-btn-view-project" href="https://onplay.kz/" target="_blank" rel="noopener noreferrer">Просмотр</a>
            </div>

            {/* Finance Tracker */}
            <div id="portfolio-finance" className="portfolio-project-card">
              <div className="portfolio-project-header">
                <div className="portfolio-project-icon green">💰</div>
                <div className="portfolio-project-info">
                  <h3 className="portfolio-project-title">Мой Кошелек</h3>
                  <p className="portfolio-project-subtitle">Приложение для управления личными финансами и расходами</p>
                </div>
                <div className="portfolio-project-actions">
                  <button className="portfolio-btn-icon">❤️</button>
                  <button className="portfolio-btn-icon">🔗</button>
                </div>
              </div>

              <div className="portfolio-project-status">
                <div className="portfolio-status-indicator"></div>
                <span>Сервис личных финансов</span>
              </div>

              <div className="portfolio-finance-header">
                <div className="portfolio-finance-balance">
                  <div className="portfolio-balance-label">ТЕКУЩИЙ БАЛАНС</div>
                  <div className="portfolio-balance-amount">12,450 тг</div>
                </div>
                {/* <button className="portfolio-btn-add-transaction">+ Добавить транзакцию</button> */}
              </div>

              <div className="portfolio-finance-chart">
                <svg viewBox="0 0 600 200" className="portfolio-chart-svg">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
                    </linearGradient>
                  </defs>
                  <path d="M 0 150 L 100 140 L 200 120 L 300 100 L 400 90 L 500 60 L 600 40 L 600 200 L 0 200 Z" 
                        fill="url(#chartGradient)" stroke="none"/>
                  <path d="M 0 150 L 100 140 L 200 120 L 300 100 L 400 90 L 500 60 L 600 40" 
                        fill="none" stroke="#10b981" strokeWidth="2"/>
                </svg>
                <div className="portfolio-chart-labels">
                  <span>Янв</span>
                  <span>Фев</span>
                  <span>Мар</span>
                  <span>Апр</span>
                  <span>Май</span>
                  <span>Июн</span>
                </div>
              </div>

              <div className="portfolio-project-features">
                <h4 className="portfolio-features-title">Основные функции</h4>
                <ul className="portfolio-features-list">
                  <li>✓ Ведение транзакций
                    <span className="portfolio-feature-desc">Отслеживайте все входящие и исходящие платежи с категориями</span>
                  </li>
                  <li>✓ Планирование бюджета
                    <span className="portfolio-feature-desc">Устанавливайте цели и лимиты расходов на любой период времени</span>
                  </li>
                  <li>✓ Визуальные отчеты
                    <span className="portfolio-feature-desc">Интерактивные графики, отображающие привычки и тенденции расходов</span>
                  </li>
                </ul>
              </div>

              <div className="portfolio-transactions-section">
                <h4 className="portfolio-transactions-title">ПОСЛЕДНИЕ ТРАНЗАКЦИИ</h4>
                <div className="portfolio-transaction-list">
                  <div className="portfolio-transaction-item portfolio-expense">
                    <div className="portfolio-transaction-icon">🛒</div>
                    <div className="portfolio-transaction-details">
                      <div className="portfolio-transaction-name">Покупка в магазине</div>
                      <div className="portfolio-transaction-date">Вчера, 3:42</div>
                    </div>
                    <div className="portfolio-transaction-amount portfolio-negative">-12,450 тг</div>
                  </div>
                  <div className="portfolio-transaction-item portfolio-income">
                    <div className="portfolio-transaction-icon">💵</div>
                    <div className="portfolio-transaction-details">
                      <div className="portfolio-transaction-name">Бонус</div>
                      <div className="portfolio-transaction-date">Вчера, 4:26</div>
                    </div>
                    <div className="portfolio-transaction-amount portfolio-positive">+82,000 тг</div>
                  </div>
                </div>
              </div>

              <div className="portfolio-project-tech">
                <div className="portfolio-tech-label">ИСПОЛЬЗУЕМЫЕ ТЕХНОЛОГИИ</div>
                <div className="portfolio-project-tags">
                  <span className="portfolio-project-tag">Java</span>
                  <span className="portfolio-project-tag">Android</span>
                </div>
              </div>

              <div className="portfolio-project-action-row">
                <a className="portfolio-btn-view-project" href="https://github.com/jhnwcksj/android-my-wallet" target="_blank" rel="noopener noreferrer">Просмотр</a>
                <a className="portfolio-btn-download" href="https://github.com/jhnwcksj/android-my-wallet/releases/download/MyWallet/mywallet-1.0.zip" target="_blank" rel="noopener noreferrer">Скачать</a>
              </div>
            </div>

            {/* Telegram Bot */}
            <div id="portfolio-telegram-bot" className="portfolio-project-card">
              <div className="portfolio-project-header">
                <div className="portfolio-project-icon blue">🤖</div>
                <div className="portfolio-project-info">
                  <h3 className="portfolio-project-title">Телеграм бот</h3>
                  <p className="portfolio-project-subtitle">Управляемый помощник и бот для автоматизации</p>
                </div>
                <div className="portfolio-project-actions">
                  <button className="portfolio-btn-icon">❤️</button>
                  <button className="portfolio-btn-icon">🔗</button>
                </div>
              </div>

              <div className="portfolio-project-status">
                <div className="portfolio-status-indicator"></div>
                <span>Сервис автоматизации Telegram</span>
              </div>

              <div className="portfolio-project-metrics">
                <div className="portfolio-metric">
                  <div className="portfolio-metric-icon blue">🔵</div>
                  <div className="portfolio-metric-data">
                    <div className="portfolio-metric-label">Активные пользователи</div>
                    <div className="portfolio-metric-value">2.5K</div>
                  </div>
                </div>
                <div className="portfolio-metric">
                  <div className="portfolio-metric-icon green">🟢</div>
                  <div className="portfolio-metric-data">
                    <div className="portfolio-metric-label">Ежедневные сообщения</div>
                    <div className="portfolio-metric-value">15K</div>
                  </div>
                </div>
                <div className="portfolio-metric">
                  <div className="portfolio-metric-icon purple">🟣</div>
                  <div className="portfolio-metric-data">
                    <div className="portfolio-metric-label">Время отклика</div>
                    <div className="portfolio-metric-value">0.2s</div>
                  </div>
                </div>
              </div>

              <div className="portfolio-project-features">
                <h4 className="portfolio-features-title">Ключевые функции</h4>
                <ul className="portfolio-features-list">
                  {/* <li>✓ AI-Powered Responses
                    <span className="portfolio-feature-desc">Обработка естественного языка с контекстно-зависимыми ответами</span>
                  </li> */}
                  <li>✓ Автоматизация задач
                    <span className="portfolio-feature-desc">Планирование задач, напоминания и автоматизация рабочих процессов</span>
                  </li>
                  <li>✓ Многоязычная поддержка
                    <span className="portfolio-feature-desc">Бесшовная коммуникация на более чем 20 языках</span>
                  </li>
                  <li>✓ Панель администратора
                    <span className="portfolio-feature-desc">Мониторинг и аналитика в реальном времени для производительности бота</span>
                  </li>
                </ul>
              </div>

              <div className="portfolio-bot-stats-section">
                <h4 className="portfolio-activity-title">Статистика бота</h4>
                <div className="portfolio-bot-stats-grid portfolio-full-width">
                  <div className="portfolio-bot-stat-item">
                    <div className="portfolio-stat-icon">📊</div>
                    <div className="portfolio-stat-info">
                      <div className="portfolio-stat-value">98.5%</div>
                      <div className="portfolio-stat-label">Время работы</div>
                    </div>
                  </div>
                  <div className="portfolio-bot-stat-item">
                    <div className="portfolio-stat-icon">⚡</div>
                    <div className="portfolio-stat-info">
                      <div className="portfolio-stat-value">500K+</div>
                      <div className="portfolio-stat-label">Обработанные команды</div>
                    </div>
                  </div>
                  <div className="portfolio-bot-stat-item">
                    <div className="portfolio-stat-icon">👥</div>
                    <div className="portfolio-stat-info">
                      <div className="portfolio-stat-value">85%</div>
                      <div className="portfolio-stat-label">Удовлетворенность пользователей</div>
                    </div>
                  </div>
                  <div className="portfolio-bot-stat-item">
                    <div className="portfolio-stat-icon">🔔</div>
                    <div className="portfolio-stat-info">
                      <div className="portfolio-stat-value">24/7</div>
                      <div className="portfolio-stat-label">Доступность</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="portfolio-activity-section">
                <h4 className="portfolio-activity-title">Недавние команды</h4>
                <div className="portfolio-activity-list">
                  <div className="portfolio-activity-item">
                    <div className="portfolio-activity-avatar">🤖</div>
                    <div className="portfolio-activity-details">
                      <div className="portfolio-activity-text">/weather - Получить прогноз погоды</div>
                      <div className="portfolio-activity-time">2 минуты назад</div>
                    </div>
                    <span className="portfolio-activity-badge portfolio-completed">Успешно</span>
                  </div>
                  <div className="portfolio-activity-item">
                    <div className="portfolio-activity-avatar">🤖</div>
                    <div className="portfolio-activity-details">
                      <div className="portfolio-activity-text">/remind - Установить ежедневное напоминание</div>
                      <div className="portfolio-activity-time">5 минут назад</div>
                    </div>
                    <span className="portfolio-activity-badge portfolio-completed">Успешно</span>
                  </div>
                  <div className="portfolio-activity-item">
                    <div className="portfolio-activity-avatar">🤖</div>
                    <div className="portfolio-activity-details">
                      <div className="portfolio-activity-text">/translate - Перевод сообщения</div>
                      <div className="portfolio-activity-time">8 минут назад</div>
                    </div>
                    <span className="portfolio-activity-badge portfolio-completed">Успешно</span>
                  </div>
                </div>
              </div>

              <div className="portfolio-project-tech">
                <div className="portfolio-tech-label">ИСПОЛЬЗУЕМЫЕ ТЕХНОЛОГИИ</div>
                <div className="portfolio-project-tags">
                  <span className="portfolio-project-tag">Python</span>
                  <span className="portfolio-project-tag">aiogram</span>
                  <span className="portfolio-project-tag">PostgreSQL</span>
                  {/* <span className="portfolio-project-tag">Redis</span>
                  <span className="portfolio-project-tag">asyncio</span> */}
                </div>
              </div>

              <a className="portfolio-btn-view-project" href="https://t.me/itdeals_bot" target="_blank" rel="noopener noreferrer">Просмотр</a>
            </div>
          </section>

          {/* Education & Experience */}
          {/* <div className="portfolio-bottom-sections">
            <section className="portfolio-education-section">
              <h2 className="portfolio-section-title">📚 Образование</h2>
              <div className="portfolio-education-list">
                <div className="portfolio-education-item">
                  <div className="portfolio-education-icon">🎓</div>
                  <div className="portfolio-education-content">
                    <h3 className="portfolio-education-title">Международный университет информационных технологий</h3>
                    <div className="portfolio-education-school">ВТИПО • 2021 - 2023</div>
                    <div className="portfolio-education-school">Програмная инженерия • 2023 - 2025</div>
                    <p className="portfolio-education-desc">
                      Специализация: разработка программного обеспечения и системы баз данных.
                    </p>
                  </div>
                </div>
                
              </div>
            </section>

            <section className="portfolio-experience-section">
              <h2 className="portfolio-section-title">💼 Work Experience</h2>
              <div className="portfolio-experience-list">
                <div className="portfolio-experience-item">
                  <div className="portfolio-experience-icon">👔</div>
                  <div className="portfolio-experience-content">
                    <h3 className="portfolio-experience-title">Senior Fullstack Developer</h3>
                    <div className="portfolio-experience-company">Tech Innovations Inc.</div>
                    <p className="portfolio-experience-desc">
                      Leading a team of 5+ developers building enterprise SaaS products using React and Node.js.
                    </p>
                  </div>
                </div>
                <div className="portfolio-experience-item">
                  <div className="portfolio-experience-icon">💻</div>
                  <div className="portfolio-experience-content">
                    <h3 className="portfolio-experience-title">Freelance Developer</h3>
                    <div className="portfolio-experience-company">Self-employed</div>
                    <p className="portfolio-experience-desc">
                      Delivered 50+ web projects for international clients, focusing on e-commerce and CRM systems.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div> */}

          {/* Contact Section */}
          <section id="portfolio-contact" className="portfolio-contact-section">
            <div className="portfolio-contact-content">
              <h2 className="portfolio-contact-title">Давайте работать вместе</h2>
              <p className="portfolio-contact-description">
                Есть проект на примете? Я открыт для предложений на полную занятость.
              </p>
              
              <div className="portfolio-contact-info">
                <div className="portfolio-contact-item">
                  <span className="portfolio-contact-icon">📧</span>
                  <div>
                    <div className="portfolio-contact-label">Email</div>
                    <div className="portfolio-contact-value">abzik.kz.04@gmail.com</div>
                  </div>
                </div>
                <div className="portfolio-contact-item">
                  <span className="portfolio-contact-icon">📞</span>
                  <div>
                    <div className="portfolio-contact-label">Номер телефона</div>
                    <div className="portfolio-contact-value">+7 (771) 889-0029</div>
                  </div>
                </div>
                <div className="portfolio-contact-item">
                  <span className="portfolio-contact-icon">📍</span>
                  <div>
                    <div className="portfolio-contact-label">Местоположение</div>
                    <div className="portfolio-contact-value">Алматы, Казахстан</div>
                  </div>
                </div>
              </div>
            </div>

            <form className="portfolio-contact-form" onSubmit={handleSubmit}>
              <div className="portfolio-form-group">
                <label htmlFor="name">ИМЯ</label>
                <input
                  className="portfolio-input-field"
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Иван Иванов"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="portfolio-form-group">
                <label htmlFor="email">EMAIL</label>
                <input
                  className="portfolio-input-field"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="ivan@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="portfolio-form-group">
                <label htmlFor="subject">ТЕМА</label>
                <input
                  className="portfolio-input-field"
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="Запрос по проекту"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="portfolio-form-group">
                <label htmlFor="message">СООБЩЕНИЕ</label>
                <textarea
                  className="portfolio-input-field"
                  id="message"
                  name="message"
                  rows="4"
                  placeholder="Расскажите о вашем проекте..."
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              <button type="submit" className="portfolio-btn-send-message">
                Отправить сообщение
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Portfolio;

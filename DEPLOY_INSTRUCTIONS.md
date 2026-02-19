# Инструкция по деплою приложения на сервер

## Проблема
При деплое проекта на сервер возникает ошибка:
```
GET http://localhost:5000/api/calendar/12 net::ERR_CONNECTION_REFUSED
```

Это происходит потому, что приложение пытается обращаться к `localhost:5000`, что не работает на production сервере.

## Решение

### 1. Настройка переменных окружения

В проекте уже настроено использование переменных окружения. Вам нужно:

#### Для локальной разработки
Файл `.env` уже настроен:
```env
REACT_APP_API_URL=http://localhost:5000
```

#### Для production
Отредактируйте файл `.env.production` и укажите URL вашего API сервера:

```env
# Замените на URL вашего сервера
REACT_APP_API_URL=https://yourdomain.com

# Если API на отдельном домене или порту:
# REACT_APP_API_URL=https://api.yourdomain.com
# или
# REACT_APP_API_URL=https://yourdomain.com:5000
```

### 2. Сборка проекта для production

После настройки `.env.production`, выполните сборку:

```bash
npm run build
```

React автоматически использует `.env.production` при сборке production версии.

### 3. Деплой на сервер

После выполнения `npm run build`, загрузите содержимое папки `build/` на ваш сервер.

### 4. Настройка бэкенд сервера

Убедитесь, что ваш бэкенд-сервер (Node.js API) запущен и доступен по указанному URL.

#### Проверка CORS
Убедитесь, что в `crm-backend/server.js` настроены правильные CORS заголовки для вашего домена:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com'], // Ваш фронтенд домен
  credentials: true
}));
```

### 5. Важные замечания

- ❗ **НЕ** коммитьте `.env.production` с реальными данными в Git
- ✅ Используйте HTTPS для production
- ✅ Убедитесь, что API сервер доступен по указанному URL
- ✅ Проверьте настройки firewall и открытые порты на сервере

### 6. Проверка

После деплоя:
1. Откройте Developer Tools (F12) в браузере
2. Перейдите на вкладку Network
3. Проверьте, что запросы идут на правильный URL (не localhost)
4. Убедитесь, что сервер отвечает статус-кодом 200

## Примеры настройки для разных вариантов деплоя

### Вариант 1: Фронтенд и бэкенд на одном домене
```env
REACT_APP_API_URL=https://yourdomain.com
```
Backend должен слушать на порту 80/443

### Вариант 2: Фронтенд и бэкенд на разных доменах
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

### Вариант 3: API на определенном порту
```env
REACT_APP_API_URL=https://yourdomain.com:5000
```

## Troubleshooting

### Ошибка: "Mixed content" (HTTP/HTTPS)
- Убедитесь, что и фронтенд, и бэкенд используют HTTPS

### Ошибка: CORS
- Проверьте настройки CORS в файле `crm-backend/server.js`
- Убедитесь, что origin включает ваш фронтенд домен

### API запросы идут на localhost
- Проверьте, что правильно собрали проект: `npm run build`
- Убедитесь, что используете правильный `.env.production` файл
- Очистите кеш браузера (Ctrl+Shift+Del)

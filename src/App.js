import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Timetable from "./pages/Timetable";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NetworksSettings from "./pages/NetworksSettings";
import BackgroundSettings from "./pages/BackgroundSettings";
import Profile from "./pages/Profile";
import Zones from "./pages/Zones";
import Services from "./pages/Services";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import BookingSettings from "./pages/BookingSettings";
import OnlineBooking from "./pages/OnlineBooking";
import BookingDetails from "./pages/BookingDetails";
import Management from "./pages/Management";
import License from "./pages/License";
import Portfolio from "./pages/Portfolio";
import ProtectedRoute from "./routes/ProtectedRoute";
import BranchProtectedRoute from "./routes/BranchProtectedRoute";
import HomeRedirect from "./components/HomeRedirect";
import { Toaster } from "./components/ui/toaster";
import { checkAndUpdateAppVersion, checkServerDataVersion } from "./utils/storageVersion";
        
  
function RedirectToUserTimetable() {
  // prefer stored user object then userId; redirect to /login if none
  const location = useLocation();
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  let uid = null;
  try {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored && stored.id) uid = stored.id;
  } catch {}
  if (!uid) uid = localStorage.getItem('userId');

  if (!uid) return <Navigate to="/login" replace />;

  // preserve branchId if present on the current location
  let target = `/timetable/${uid}`;
  try {
    const params = new URLSearchParams(location.search);
    const bid = params.get('branchId');
    if (bid) target += `?branchId=${encodeURIComponent(bid)}`;
    else {
      // fall back to previously-selected branch if any
      try {
        const saved = localStorage.getItem('selectedBranchId');
        if (saved) target += `?branchId=${encodeURIComponent(saved)}`;
      } catch {}
    }
  } catch {}

  return <Navigate to={target} replace />;
}

function App() {
  // Проверка версии приложения при запуске
  useEffect(() => {
    // Проверка версии приложения (клиентская версия)
    const wasUpdated = checkAndUpdateAppVersion();
    
    if (wasUpdated) {
      console.log('[App] Приложение было обновлено, данные синхронизированы');
    }
    
    // Проверка версии данных на сервере (если пользователь авторизован)
    const checkServerVersion = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        if (!API_URL) return;
        
        const needsUpdate = await checkServerDataVersion(API_URL, token);
        
        if (needsUpdate) {
          console.log('[App] Обнаружены обновления данных на сервере');
          // Можно показать уведомление пользователю
          // toast({ title: 'Данные обновлены', description: 'Обнаружены новые данные' });
        }
      } catch (error) {
        console.error('[App] Ошибка проверки версии на сервере:', error);
      }
    };
    
    checkServerVersion();
    
    // Периодическая проверка версии на сервере (каждые 30 минут)
    const intervalId = setInterval(checkServerVersion, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        
        {/* Публичные маршруты для онлайн-записи */}
        <Route path="/booking/:slug" element={<OnlineBooking />} />
        <Route path="/booking/:slug/:publicCode" element={<OnlineBooking />} />
        <Route path="/booking-direct/:publicCode" element={<OnlineBooking />} />
        <Route path="/booking-details/:publicCode" element={<BookingDetails />} />
        
        {/* Публичный маршрут портфолио */}
        <Route path="/user45926473/portfolio" element={<Portfolio />} />
        
        <Route path="/clients" element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <BranchProtectedRoute>
              <Dashboard />
            </BranchProtectedRoute>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <BranchProtectedRoute>
              <Analytics />
            </BranchProtectedRoute>
          </ProtectedRoute>
        } />

        <Route path="/*" element={<NotFound />} />

        <Route path="/timetable" element={
          <ProtectedRoute>
            {/* redirect to user's own timetable (or login) */}
            <RedirectToUserTimetable />
          </ProtectedRoute>
        } />

        <Route path="/timetable/:userId" element={
          <ProtectedRoute>
            <BranchProtectedRoute>
              <Timetable />
            </BranchProtectedRoute>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/license" element={
          <ProtectedRoute>
            <License />
          </ProtectedRoute>
        } />

        <Route path="/management" element={
          <ProtectedRoute>
            <Management />
          </ProtectedRoute>
        } />

        <Route path="/settings/networks" element={
          <ProtectedRoute>
            <NetworksSettings />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/settings/zones" element={
          <ProtectedRoute>
            <Zones />
          </ProtectedRoute>
        } />

        <Route path="/settings/services" element={
          <ProtectedRoute>
            <Services />
          </ProtectedRoute>
        } />

        <Route path="/settings/background" element={
          <ProtectedRoute>
            <BackgroundSettings />
          </ProtectedRoute>
        } />

        <Route path="/settings/calendar" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />

        <Route path="/onlinebooking" element={
          <ProtectedRoute>
            <BookingSettings />
          </ProtectedRoute>
        } />

        {/* catch-all 404 (keep last) */}
        <Route path="*" element={<NotFound />} />

      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;

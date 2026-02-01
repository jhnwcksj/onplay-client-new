<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Timetable from "./pages/Timetable";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NetworksSettings from "./pages/NetworksSettings";
import Profile from "./pages/Profile";
import Zones from "./pages/Zones";
import Services from "./pages/Services";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import ProtectedRoute from "./routes/ProtectedRoute";
import BranchProtectedRoute from "./routes/BranchProtectedRoute";
import HomeRedirect from "./components/HomeRedirect";
        
  
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
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

        {/* catch-all 404 (keep last) */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
=======
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
>>>>>>> 8941728 (Initialize project using Create React App)
  );
}

export default App;

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AccessDenied from "../pages/AccessDenied";

export default function BranchProtectedRoute({ children }) {
  const location = useLocation();
  // cached current user (may be null)
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const currentRole = storedUser?.role;
  const [userBranches, setUserBranches] = useState(null);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchAccessDenied, setBranchAccessDenied] = useState(false);

  useEffect(() => {
    const uid = storedUser?.id || localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!uid) return;

    // Admins bypass branch-level checks
    if (currentRole === 'admin') {
      setUserBranches([]);
      setLoadingBranches(false);
      setBranchAccessDenied(false);
      return;
    }

    let mounted = true;
    setLoadingBranches(true);
    setUserBranches(null);

    async function load() {
      const API_URL = process.env.REACT_APP_API_URL;
      const endpoints = [
        `${API_URL}/users/${uid}/branches`,
        `${API_URL}/branches?userId=${uid}`,
        `${API_URL}/branches?user_id=${uid}`,
        `/api/users/${uid}/branches`,
        `/api/branches?userId=${uid}`,
        `/api/branches?user_id=${uid}`,
      ];

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) continue;
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.branches || data.rows || data);
          if (mounted) setUserBranches(list || []);
          break;
        } catch (err) {}
      }

      if (mounted) setLoadingBranches(false);
    }

    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const branchId = params.get('branchId');
      if (!branchId) { setBranchAccessDenied(false); return; }
      // Admin bypass: always allow
      if (currentRole === 'admin') { setBranchAccessDenied(false); return; }
      if (userBranches === null) return; // not yet loaded
      const found = userBranches.find(b => String(b.branch_id || b.id || b.branchId) === String(branchId));
      setBranchAccessDenied(!Boolean(found));
    } catch { setBranchAccessDenied(false); }
  }, [location.search, userBranches]);

  if (loadingBranches) return null;
  if (branchAccessDenied) return <AccessDenied />;
  return children;
}


import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function HomeRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    let userId = null;
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored && stored.id) userId = stored.id;
    } catch {}
    if (!userId) userId = localStorage.getItem("userId");

    // branchId из url или из localStorage
    let branchId = null;
    try {
      const params = new URLSearchParams(location.search);
      branchId = params.get("branchId");
      if (!branchId) branchId = localStorage.getItem("selectedBranchId");
    } catch {}

    // сегодняшняя дата в формате YYYY-MM-DD
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;

    if (token && userId) {
      let url = `/timetable/${userId}?date=${today}`;
      if (branchId) url += `&branchId=${encodeURIComponent(branchId)}`;
      navigate(url, { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate, location.search]);

  return null;
}

import { createContext, useContext, useState, useCallback } from "react";

function loadToken() {
  const t = localStorage.getItem("cc_admin_token");
  if (!t) return null;
  try {
    const { exp } = JSON.parse(atob(t.split(".")[1]));
    if (exp * 1000 < Date.now()) { localStorage.removeItem("cc_admin_token"); return null; }
    return t;
  } catch { localStorage.removeItem("cc_admin_token"); return null; }
}

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(loadToken);

  const login = useCallback((t) => {
    localStorage.setItem("cc_admin_token", t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cc_admin_token");
    setToken(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.jsx";
import { useAdminAuth } from "./hooks/useAdminAuth.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import About from "./pages/About.jsx";
import FAQ from "./pages/FAQ.jsx";
import Contact from "./pages/Contact.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminMessages from "./pages/admin/AdminMessages.jsx";

const FULL_SCREEN = ["/login", "/signup", "/dashboard", "/forgot-password", "/admin"];

function RequireAuth({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { token } = useAdminAuth();
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  const { token, login, logout } = useAuth();
  const { token: adminToken, login: adminLogin, logout: adminLogout } = useAdminAuth();
  const location = useLocation();
  const isFullScreen = FULL_SCREEN.some(p => location.pathname.startsWith(p));

  return (
    <>
      {!isFullScreen && <Navbar token={token} onLogout={logout} />}

      <Routes>
        {/* Public */}
        <Route path="/"        element={<Home />} />
        <Route path="/about"   element={<About />} />
        <Route path="/faq"     element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />

        {/* Auth */}
        <Route path="/login"           element={token ? <Navigate to="/dashboard" replace /> : <Login onLogin={login} />} />
        <Route path="/signup"          element={token ? <Navigate to="/dashboard" replace /> : <Signup onLogin={login} />} />
        <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />

        {/* User dashboard */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard token={token} onLogout={logout} /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin/login" element={
          adminToken ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin onLogin={adminLogin} />
        } />
        <Route path="/admin/dashboard" element={
          <RequireAdmin><AdminLayout onLogout={adminLogout}><AdminDashboard token={adminToken} /></AdminLayout></RequireAdmin>
        } />
        <Route path="/admin/users" element={
          <RequireAdmin><AdminLayout onLogout={adminLogout}><AdminUsers token={adminToken} /></AdminLayout></RequireAdmin>
        } />
        <Route path="/admin/messages" element={
          <RequireAdmin><AdminLayout onLogout={adminLogout}><AdminMessages token={adminToken} /></AdminLayout></RequireAdmin>
        } />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isFullScreen && <Footer />}
    </>
  );
}

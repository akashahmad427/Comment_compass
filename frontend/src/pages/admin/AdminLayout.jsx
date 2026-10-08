import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, LayoutDashboard, Users, MessageSquare, LogOut, Shield } from "lucide-react";

const links = [
  { to: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/admin/users",     icon: <Users size={18} />,           label: "Users" },
  { to: "/admin/messages",  icon: <MessageSquare size={18} />,   label: "Messages" },
];

export default function AdminLayout({ children, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  function logout() {
    onLogout();
    navigate("/admin/login");
  }

  return (
    <div className="dash-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Shield size={18} style={{ color: "var(--accent)" }} />
          Admin Panel
        </div>
        <div style={{ fontSize: ".72rem", color: "var(--ink3)", padding: "0 .85rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Comment Compass
        </div>
        <nav className="sidebar-nav">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`sidebar-link${location.pathname === l.to ? " active" : ""}`}>
              {l.icon} {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-link" onClick={logout}>
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>
      <main className="dash-main">{children}</main>
    </div>
  );
}

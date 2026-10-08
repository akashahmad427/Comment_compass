import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, Menu, X } from "lucide-react";

export default function Navbar({ token, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link";

  function handleLogout() {
    onLogout();
    navigate("/");
  }

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="container">
        <Link to="/" className="nav-logo">
          <Compass size={22} />
          Comment Compass
        </Link>

        <div className={`nav-links${open ? " open" : ""}`}>
          <Link to="/" className={isActive("/")}>Home</Link>
          <Link to="/about" className={isActive("/about")}>About</Link>
          <Link to="/faq" className={isActive("/faq")}>FAQ</Link>
          <Link to="/contact" className={isActive("/contact")}>Contact</Link>
        </div>

        <div className="nav-actions">
          {token ? (
            <>
              <Link to="/dashboard" className="btn btn-outline" style={{ padding: ".5rem 1rem", fontSize: ".9rem" }}>Dashboard</Link>
              <button className="btn-ghost" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost" style={{ fontWeight: 600, fontSize: ".9rem" }}>Log in</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: ".55rem 1.1rem", fontSize: ".9rem" }}>Get started</Link>
            </>
          )}
          <button className="nav-mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}

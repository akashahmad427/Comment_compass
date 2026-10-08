import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="nav-logo" style={{ marginBottom: ".75rem" }}>
              <Compass size={20} style={{ color: "var(--accent)" }} />
              <span>Comment Compass</span>
            </div>
            <p>Turn YouTube comments into actionable creator insights. Grow smarter, not harder.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/#features">Features</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/#how-it-works">How it works</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/faq">FAQ</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Comment Compass. All rights reserved.</span>
          <span>Built for creators, by creators.</span>
        </div>
      </div>
    </footer>
  );
}

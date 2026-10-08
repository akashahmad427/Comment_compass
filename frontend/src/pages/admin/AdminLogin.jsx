import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Eye, EyeOff, Shield } from "lucide-react";
import { api } from "../../api.js";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const { token } = await api.adminLogin(email, password);
      onLogin(token);
      navigate("/admin/dashboard");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Shield size={28} color="var(--accent2)" />
          </div>
          <div className="nav-logo" style={{ justifyContent: "center", marginBottom: ".5rem" }}>
            <Compass size={20} /> Comment Compass
          </div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: ".25rem" }}>Admin Panel</h2>
          <p style={{ fontSize: ".88rem" }}>Restricted access only</p>
        </div>

        <div className="card">
          {err && <div className="alert alert-error mb-3">{err}</div>}
          <form style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} onSubmit={submit}>
            <div className="input-wrap">
              <label>Admin email</label>
              <input className="input" type="email" required placeholder="admin@commentcompass.app"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-wrap">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showPw ? "text" : "password"} required
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: "2.75rem" }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ink3)", cursor: "pointer", padding: 0 }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
              {busy ? <span className="spinner" /> : "Sign in to Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

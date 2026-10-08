import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Compass, Eye, EyeOff, ArrowRight } from "lucide-react";
import { api } from "../api.js";

export default function Login({ onLogin }) {
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
      const { token } = await api.login(email, password);
      onLogin(token);
      navigate("/dashboard");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle(credentialResponse) {
    setBusy(true); setErr("");
    try {
      const { token } = await api.googleAuth(credentialResponse.credential);
      onLogin(token);
      navigate("/dashboard");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <Link to="/" className="nav-logo" style={{ marginBottom: "3rem" }}>
          <Compass size={24} />
          Comment Compass
        </Link>
        <h2 style={{ marginBottom: "1rem" }}>
          Turn comments into <span className="grad">growth.</span>
        </h2>
        <p style={{ marginBottom: "2.5rem", fontSize: "1.05rem" }}>
          Analyze sentiment, discover what your audience wants, and get actionable tips — all from one YouTube link.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {["Sentiment breakdown in seconds", "Audience request mining", "Prioritized improvement tips", "Free to start"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: ".75rem", fontSize: ".95rem" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(99,102,241,.2)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowRight size={11} color="var(--accent2)" />
              </div>
              <span style={{ color: "var(--ink2)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h2 style={{ marginBottom: ".4rem" }}>Welcome back</h2>
          <p style={{ marginBottom: "2rem" }}>Log in to your account to continue.</p>

          {/* Google */}
          <div style={{ marginBottom: "1.25rem" }}>
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setErr("Google sign-in failed. Please try again.")}
              theme="filled_black"
              shape="rectangular"
              size="large"
              width="100%"
              text="signin_with"
            />
          </div>

          <div className="divider-text">or continue with email</div>

          {err && <div className="alert alert-error mt-2">{err}</div>}

          <form className="auth-form mt-3" onSubmit={submit}>
            <div className="input-wrap">
              <label>Email address</label>
              <input className="input" type="email" required placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-wrap">
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Password
                <Link to="/forgot-password" style={{ fontSize: ".8rem", color: "var(--accent2)", fontWeight: 500 }}>Forgot password?</Link>
              </label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showPw ? "text" : "password"} required minLength={8}
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: "2.75rem" }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ink3)", cursor: "pointer", padding: 0 }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary w-full" style={{ justifyContent: "center", marginTop: ".25rem" }} disabled={busy}>
              {busy ? <span className="spinner" /> : "Log in"}
            </button>
          </form>

          <p className="auth-switch mt-3">
            Don't have an account? <Link to="/signup">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

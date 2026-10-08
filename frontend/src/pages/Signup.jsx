import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Compass, Eye, EyeOff, ArrowRight, Mail } from "lucide-react";
import { api } from "../api.js";
import OtpInput from "../components/OtpInput.jsx";

export default function Signup({ onLogin }) {
  const [step, setStep] = useState("form"); // form | otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [channelLink, setChannelLink] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submitForm(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api.sendOtp(email);
      setStep("otp");
      setInfo(`We sent a 6-digit code to ${email}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e) {
    e.preventDefault();
    const code = otp;
    if (code.length < 6) { setErr("Please enter the full 6-digit code."); return; }
    setBusy(true); setErr("");
    try {
      await api.verifyOtp(email, code);
      const { token } = await api.register(email, password, channelLink, phone, dob);
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

  async function resendOtp() {
    setErr(""); setInfo("");
    try {
      await api.sendOtp(email);
      setInfo("A new code has been sent.");
    } catch (e) {
      setErr(e.message);
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
          Your audience is <span className="grad">already talking.</span>
        </h2>
        <p style={{ marginBottom: "2.5rem", fontSize: "1.05rem" }}>
          Are you listening? Join 10,000+ creators who use Comment Compass to make smarter videos.
        </p>
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: ".25rem", marginBottom: ".75rem" }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: "var(--gold)", fontSize: "1rem" }}>★</span>)}
          </div>
          <p style={{ fontSize: ".92rem", fontStyle: "italic", marginBottom: "1rem" }}>
            "I fixed my audio quality after Comment Compass showed 23 negative comments mentioning it. My next video got 2x the watch time."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".9rem", color: "#fff" }}>JK</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: ".88rem" }}>Jamie K.</div>
              <div style={{ fontSize: ".78rem", color: "var(--ink3)" }}>@jamietech · 84K subscribers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-box">
          {step === "form" ? (
            <>
              <h2 style={{ marginBottom: ".4rem" }}>Create your account</h2>
              <p style={{ marginBottom: "2rem" }}>Free forever. No credit card required.</p>

              <div style={{ marginBottom: "1.25rem" }}>
                <GoogleLogin
                  onSuccess={handleGoogle}
                  onError={() => setErr("Google sign-in failed. Please try again.")}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  width="100%"
                  text="signup_with"
                />
              </div>

              <div className="divider-text">or sign up with email</div>

              {err && <div className="alert alert-error mt-2">{err}</div>}

              <form className="auth-form mt-3" onSubmit={submitForm}>
                <div className="input-wrap">
                  <label>Email address</label>
                  <input className="input" type="email" required placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="input-wrap">
                  <label>Password</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={showPw ? "text" : "password"} required minLength={8}
                      placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: "2.75rem" }} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ink3)", cursor: "pointer", padding: 0 }}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div className="input-wrap">
                  <label>YouTube channel link <span style={{ color: "var(--ink3)", fontWeight: 400 }}>(optional)</span></label>
                  <input className="input" type="url" placeholder="https://youtube.com/@yourchannel"
                    value={channelLink} onChange={e => setChannelLink(e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="input-wrap">
                    <label>Phone number <span style={{ color: "var(--ink3)", fontWeight: 400 }}>(optional)</span></label>
                    <input className="input" type="tel" placeholder="+1 234 567 8900"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <label>Date of birth <span style={{ color: "var(--ink3)", fontWeight: 400 }}>(optional)</span></label>
                    <input className="input" type="date"
                      value={dob} onChange={e => setDob(e.target.value)} />
                  </div>
                </div>
                <span style={{ fontSize: ".78rem", color: "var(--ink3)" }}>We'll send a verification code to your email.</span>
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
                  {busy ? <span className="spinner" /> : <>Continue <ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="auth-switch mt-3">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <Mail size={26} color="var(--accent2)" />
              </div>
              <h2 style={{ marginBottom: ".4rem" }}>Check your email</h2>
              <p style={{ marginBottom: "2rem" }}>{info || `Enter the 6-digit code sent to ${email}`}</p>

              {err && <div className="alert alert-error mb-3">{err}</div>}
              {info && step === "otp" && !err && <div className="alert alert-info mb-3">{info}</div>}

              <form onSubmit={submitOtp}>
                <OtpInput value={otp} onChange={setOtp} disabled={busy} />
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
                  {busy ? <span className="spinner" /> : "Verify & create account"}
                </button>
              </form>

              <p className="auth-switch mt-3">
                Didn't receive it?{" "}
                <a onClick={resendOtp} style={{ cursor: "pointer" }}>Resend code</a>
                {" · "}
                <a onClick={() => { setStep("form"); setErr(""); setOtp(""); }}>Change email</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
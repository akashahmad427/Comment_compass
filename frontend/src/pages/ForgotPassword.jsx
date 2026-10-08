import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Mail, Eye, EyeOff, ArrowRight, KeyRound, CheckCircle } from "lucide-react";
import { api } from "../api.js";
import OtpInput from "../components/OtpInput.jsx";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // email | otp | password | done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submitEmail(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api.forgotPassword(email);
      setStep("otp");
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
      await api.verifyResetOtp(email, code);
      setStep("password");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setErr("Passwords do not match."); return; }
    setBusy(true); setErr("");
    try {
      await api.resetPassword(email, newPassword);
      setStep("done");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    setErr("");
    try {
      await api.forgotPassword(email);
      setErr("");
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
          Reset your <span className="grad">password.</span>
        </h2>
        <p style={{ marginBottom: "2.5rem", fontSize: "1.05rem" }}>
          No worries — it happens to everyone. We'll send a verification code to your email to confirm it's you.
        </p>

        {/* Steps indicator */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { id: "email", label: "Enter your email" },
            { id: "otp", label: "Verify with OTP" },
            { id: "password", label: "Set new password" },
          ].map((s, i) => {
            const steps = ["email", "otp", "password", "done"];
            const currentIdx = steps.indexOf(step);
            const stepIdx = steps.indexOf(s.id);
            const done = currentIdx > stepIdx;
            const active = currentIdx === stepIdx;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ".8rem", fontWeight: 700,
                  background: done ? "var(--good)" : active ? "var(--accent)" : "var(--panel2)",
                  border: `1px solid ${done ? "var(--good)" : active ? "var(--accent)" : "var(--border)"}`,
                  color: done || active ? "#fff" : "var(--ink3)",
                }}>
                  {done ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: ".9rem", color: active ? "var(--ink)" : done ? "var(--good)" : "var(--ink3)", fontWeight: active ? 600 : 400 }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-box">

          {/* Step 1: Email */}
          {step === "email" && (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <KeyRound size={26} color="var(--accent2)" />
              </div>
              <h2 style={{ marginBottom: ".4rem" }}>Forgot password?</h2>
              <p style={{ marginBottom: "2rem" }}>Enter your email and we'll send you a reset code.</p>

              {err && <div className="alert alert-error mb-3">{err}</div>}

              <form className="auth-form" onSubmit={submitEmail}>
                <div className="input-wrap">
                  <label>Email address</label>
                  <input className="input" type="email" required placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
                  {busy ? <span className="spinner" /> : <>Send reset code <ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="auth-switch mt-3">
                Remember it? <Link to="/login">Back to login</Link>
              </p>
            </>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <Mail size={26} color="var(--accent2)" />
              </div>
              <h2 style={{ marginBottom: ".4rem" }}>Check your email</h2>
              <p style={{ marginBottom: "2rem" }}>Enter the 6-digit code sent to <strong style={{ color: "var(--ink)" }}>{email}</strong></p>

              {err && <div className="alert alert-error mb-3">{err}</div>}

              <form onSubmit={submitOtp}>
                <OtpInput value={otp} onChange={setOtp} disabled={busy} />
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
                  {busy ? <span className="spinner" /> : <>Verify code <ArrowRight size={16} /></>}
                </button>
              </form>

              <p className="auth-switch mt-3">
                Didn't receive it? <a onClick={resendOtp} style={{ cursor: "pointer" }}>Resend code</a>
                {" · "}
                <a onClick={() => { setStep("email"); setErr(""); setOtp(""); }} style={{ cursor: "pointer" }}>Change email</a>
              </p>
            </>
          )}

          {/* Step 3: New password */}
          {step === "password" && (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <KeyRound size={26} color="var(--accent2)" />
              </div>
              <h2 style={{ marginBottom: ".4rem" }}>Set new password</h2>
              <p style={{ marginBottom: "2rem" }}>Choose a strong password for your account.</p>

              {err && <div className="alert alert-error mb-3">{err}</div>}

              <form className="auth-form" onSubmit={submitPassword}>
                <div className="input-wrap">
                  <label>New password</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={showPw ? "text" : "password"} required minLength={8}
                      placeholder="Min. 8 characters" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: "2.75rem" }} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ink3)", cursor: "pointer", padding: 0 }}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div className="input-wrap">
                  <label>Confirm new password</label>
                  <input className="input" type="password" required minLength={8}
                    placeholder="Repeat your password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} disabled={busy}>
                  {busy ? <span className="spinner" /> : "Reset password"}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <CheckCircle size={34} color="var(--good)" />
              </div>
              <h2 style={{ marginBottom: ".5rem" }}>Password reset!</h2>
              <p style={{ marginBottom: "2rem" }}>Your password has been updated successfully. You can now log in with your new password.</p>
              <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={() => navigate("/login")}>
                Go to login <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
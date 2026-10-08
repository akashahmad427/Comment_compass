import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle, AlertCircle, Save, Lock } from "lucide-react";
import { api } from "../api.js";

const FIELDS = ["name", "channel_link", "phone", "date_of_birth"];

export default function ProfilePanel({ token, onUnauthorized, onSaved }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", channel_link: "", phone: "", date_of_birth: "" });
  const [loadErr, setLoadErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // {type, text}

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    api.getProfile(token)
      .then((p) => {
        setProfile(p);
        setForm(Object.fromEntries(FIELDS.map((f) => [f, p[f] || ""])));
      })
      .catch((e) => {
        if (e.status === 401) onUnauthorized?.();
        else setLoadErr(e.message);
      });
  }, [token]); // eslint-disable-line

  const dirty = profile && FIELDS.some((f) => (form[f] || "") !== (profile[f] || ""));
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSaveMsg(null); };

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    try {
      const p = await api.updateProfile(form, token);
      setProfile(p);
      onSaved?.(p);
      setForm(Object.fromEntries(FIELDS.map((f) => [f, p[f] || ""])));
      setSaveMsg({ type: "success", text: "Profile updated." });
    } catch (e) {
      if (e.status === 401) return onUnauthorized?.();
      setSaveMsg({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 8) return setPwMsg({ type: "error", text: "New password must be at least 8 characters." });
    if (pw.next !== pw.confirm) return setPwMsg({ type: "error", text: "New passwords do not match." });
    setPwBusy(true);
    try {
      await api.changePassword(pw.current, pw.next, token);
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg({ type: "success", text: "Password changed successfully." });
    } catch (e) {
      if (e.status === 401) return onUnauthorized?.();
      setPwMsg({ type: "error", text: e.message });
    } finally {
      setPwBusy(false);
    }
  }

  const Msg = ({ m }) => m && (
    <div className={`alert alert-${m.type === "success" ? "success" : "error"}`}
      style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
      {m.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {m.text}
    </div>
  );

  if (loadErr) return <div className="alert alert-error">{loadErr}</div>;
  if (!profile) return <div className="card" style={{ textAlign: "center", padding: "3rem" }}><span className="spinner" /></div>;

  const initial = (profile.name || profile.email || "?").trim().charAt(0).toUpperCase();
  const since = profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : null;
  const isGoogle = profile.auth_provider === "google";

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Summary */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ marginBottom: ".15rem", overflowWrap: "anywhere" }}>{profile.name || "Your profile"}</h3>
          <p style={{ fontSize: ".88rem", margin: 0, overflowWrap: "anywhere" }}>{profile.email}</p>
          <p style={{ fontSize: ".8rem", margin: ".25rem 0 0", color: "var(--ink3)" }}>
            {since && <>Member since {since} · </>}{profile.analyses_count} {profile.analyses_count === 1 ? "analysis" : "analyses"}
            {isGoogle && " · Signed in with Google"}
          </p>
        </div>
      </div>

      {/* Personal details */}
      <form className="card" onSubmit={saveProfile}>
        <h3 style={{ marginBottom: "1.25rem" }}>Personal details</h3>
        <Msg m={saveMsg} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="input-wrap">
            <label>Email</label>
            <input className="input" value={profile.email} disabled style={{ opacity: .6, cursor: "not-allowed" }} />
          </div>
          <div className="input-wrap">
            <label>Full name</label>
            <input className="input" placeholder="Your name" maxLength={100} value={form.name} onChange={set("name")} />
          </div>
          <div className="input-wrap">
            <label>YouTube channel link</label>
            <input className="input" type="url" placeholder="https://youtube.com/@yourchannel" maxLength={500} value={form.channel_link} onChange={set("channel_link")} />
          </div>
          <div className="input-wrap">
            <label>Phone</label>
            <input className="input" type="tel" placeholder="+92 300 1234567" maxLength={30} value={form.phone} onChange={set("phone")} />
          </div>
          <div className="input-wrap">
            <label>Date of birth</label>
            <input className="input" type="date" max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={set("date_of_birth")} />
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: "1.25rem" }} disabled={!dirty || saving}>
          {saving ? <span className="spinner" /> : <><Save size={15} /> Save changes</>}
        </button>
      </form>

      {/* Password */}
      <form className="card" onSubmit={changePassword}>
        <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: ".5rem" }}><Lock size={16} /> Password</h3>
        {isGoogle ? (
          <p style={{ fontSize: ".9rem", margin: 0 }}>You signed in with Google, so there is no password to manage here.</p>
        ) : (
          <>
            <Msg m={pwMsg} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-wrap">
                <label>Current password</label>
                <input className="input" type={showPw ? "text" : "password"} autoComplete="current-password" maxLength={72}
                  value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
              </div>
              <div className="input-wrap">
                <label>New password</label>
                <div style={{ position: "relative" }}>
                  <input className="input" style={{ paddingRight: "2.8rem" }} type={showPw ? "text" : "password"} autoComplete="new-password"
                    placeholder="At least 8 characters" maxLength={72}
                    value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
                  <button type="button" className="btn-ghost" aria-label="Show or hide passwords" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: ".4rem", top: "50%", transform: "translateY(-50%)", padding: ".35rem" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="input-wrap">
                <label>Confirm new password</label>
                <input className="input" type={showPw ? "text" : "password"} autoComplete="new-password" maxLength={72}
                  value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: "1.25rem" }} disabled={pwBusy}>
              {pwBusy ? <span className="spinner" /> : "Update password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
import { useState } from "react";
import { api } from "../api.js";
import { Mail, MessageSquare, Clock, Send, CheckCircle } from "lucide-react";

const contactInfo = [
  { icon: <Mail size={20} />, title: "Message us", desc: "Use the form on this page", sub: "Every message is read by the founder" },
  { icon: <Clock size={20} />, title: "Response time", desc: "Usually within 1 to 2 days", sub: "We are an early beta, thank you for your patience" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api.submitContact(form);
      setSent(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="badge badge-accent mb-3">Contact</div>
          <h1 style={{ marginBottom: "1rem" }}>Get in <span className="grad">touch</span></h1>
          <p style={{ maxWidth: "44ch", margin: "0 auto", fontSize: "1.05rem" }}>
            Have a question, feature request, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container">
          <div className="contact-grid">
            {/* Left: info */}
            <div>
              <h3 style={{ marginBottom: "1.5rem" }}>Contact information</h3>
              {contactInfo.map(c => (
                <div key={c.title} className="contact-info-item">
                  <div className="contact-icon">{c.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: ".2rem" }}>{c.title}</div>
                    <div style={{ fontSize: ".9rem", color: "var(--ink)" }}>{c.desc}</div>
                    <div style={{ fontSize: ".82rem", color: "var(--ink3)" }}>{c.sub}</div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 14 }}>
                <h4 style={{ marginBottom: ".5rem" }}>Found a bug?</h4>
                <p style={{ fontSize: ".88rem" }}>Please include your video URL, browser, and a screenshot if possible. We take bugs seriously and fix them fast.</p>
              </div>
            </div>

            {/* Right: form */}
            <div className="card">
              {sent ? (
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                    <CheckCircle size={28} color="var(--good)" />
                  </div>
                  <h3 style={{ marginBottom: ".5rem" }}>Message sent!</h3>
                  <p style={{ fontSize: ".9rem" }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ marginBottom: "1.5rem" }}>Send us a message</h3>
                  {err && <div className="alert alert-error mb-3">{err}</div>}
                  <form className="contact-form" onSubmit={submit}>
                    <div className="grid-2">
                      <div className="input-wrap">
                        <label>Your name</label>
                        <input className="input" required placeholder="Jane Smith" value={form.name} onChange={set("name")} />
                      </div>
                      <div className="input-wrap">
                        <label>Email address</label>
                        <input className="input" type="email" required placeholder="jane@example.com" value={form.email} onChange={set("email")} />
                      </div>
                    </div>
                    <div className="input-wrap">
                      <label>Subject</label>
                      <input className="input" required placeholder="How can we help?" value={form.subject} onChange={set("subject")} />
                    </div>
                    <div className="input-wrap">
                      <label>Message</label>
                      <textarea className="input" required placeholder="Tell us more…" value={form.message} onChange={set("message")} />
                    </div>
                    <button className="btn btn-primary" style={{ justifyContent: "center" }} disabled={busy}>
                      {busy ? <span className="spinner" /> : <><Send size={16} /> Send message</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

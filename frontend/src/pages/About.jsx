import { Link } from "react-router-dom";
import { Heart, Target, Zap, ArrowRight } from "lucide-react";

const stats = [
  { num: "10K+", desc: "Creators using Comment Compass" },
  { num: "2M+", desc: "Comments analyzed to date" },
  { num: "99.9%", desc: "Uptime SLA" },
  { num: "< 60s", desc: "Average analysis time" },
];

const values = [
  { icon: <Heart size={22} />, color: "#ef4444", bg: "rgba(239,68,68,.15)", title: "Creator-first", desc: "Every feature is built around what creators actually need — not what looks good on a pitch deck." },
  { icon: <Target size={22} />, color: "#6366f1", bg: "rgba(99,102,241,.15)", title: "Actionable insights", desc: "We don't just show you data. We tell you exactly what to do with it." },
  { icon: <Zap size={22} />, color: "#f59e0b", bg: "rgba(245,158,11,.15)", title: "Fast & lightweight", desc: "No heavy ML models. VADER sentiment runs in milliseconds so you get results in under a minute." },
];

const team = [
  { name: "Alex Morgan", role: "Founder & CEO", avatar: "AM", color: "#6366f1", bio: "Ex-YouTube creator with 200K subs. Built this after spending 3 hours reading comments every week." },
  { name: "Sam Lee", role: "Lead Engineer", avatar: "SL", color: "#10b981", bio: "Full-stack engineer obsessed with performance. Keeps the API under 100ms." },
  { name: "Jordan Kim", role: "Product Designer", avatar: "JK", color: "#f59e0b", bio: "Designed for 5M+ users at previous startups. Makes complex data feel simple." },
];

export default function About() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="badge badge-accent mb-3">About us</div>
          <h1 style={{ marginBottom: "1rem" }}>Built by creators, <span className="grad">for creators.</span></h1>
          <p style={{ maxWidth: "52ch", margin: "0 auto", fontSize: "1.1rem" }}>
            We got tired of spending hours reading comments to figure out what our audience wanted.
            So we built Comment Compass to do it in 60 seconds.
          </p>
        </div>
      </div>

      {/* Stats */}
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
            {stats.map(s => (
              <div key={s.num} className="stat-highlight card">
                <div className="num grad">{s.num}</div>
                <div className="desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <div>
              <div className="badge badge-gold mb-3">Our mission</div>
              <h2 style={{ marginBottom: "1.25rem" }}>Help every creator make <span className="grad">data-driven videos.</span></h2>
              <p style={{ marginBottom: "1rem", fontSize: "1rem" }}>
                The best creators don't just make content — they listen to their audience and iterate. But reading thousands of comments is exhausting and time-consuming.
              </p>
              <p style={{ fontSize: "1rem" }}>
                Comment Compass automates the listening part so you can focus on what you do best: creating. We surface the signal from the noise so your next video is always better than your last.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {values.map(v => (
                <div key={v.title} style={{ display: "flex", gap: "1rem", padding: "1.25rem", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: v.bg, color: v.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{v.icon}</div>
                  <div>
                    <h3 style={{ marginBottom: ".3rem" }}>{v.title}</h3>
                    <p style={{ fontSize: ".88rem", margin: 0 }}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-4">
            <div className="badge badge-accent mb-2">The team</div>
            <h2>The people behind <span className="grad">Comment Compass</span></h2>
          </div>
          <div className="team-grid">
            {team.map(t => (
              <div key={t.name} className="team-card">
                <div className="team-avatar" style={{ background: t.color }}>{t.avatar}</div>
                <h3 style={{ marginBottom: ".2rem" }}>{t.name}</h3>
                <div style={{ fontSize: ".82rem", color: "var(--accent2)", fontWeight: 600, marginBottom: ".75rem" }}>{t.role}</div>
                <p style={{ fontSize: ".88rem" }}>{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div className="cta-section">
            <h2 style={{ marginBottom: "1rem" }}>Ready to grow <span className="grad">smarter?</span></h2>
            <p style={{ maxWidth: "40ch", margin: "0 auto 2rem" }}>Join thousands of creators who make better videos with Comment Compass.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get started free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

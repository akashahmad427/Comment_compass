import { Link } from "react-router-dom";
import {
  BarChart2, MessageSquare, Lightbulb, TrendingUp, Shield, Zap,
  CheckCircle, ArrowRight, Star, Play, Users, Youtube
} from "lucide-react";

const features = [
  { icon: <MessageSquare size={22} />, color: "#6366f1", bg: "rgba(99,102,241,.15)", title: "Sentiment Analysis", desc: "Instantly see what percentage of your audience feels positive, neutral, or negative about your content." },
  { icon: <TrendingUp size={22} />, color: "#10b981", bg: "rgba(16,185,129,.15)", title: "Topic Discovery", desc: "Find the exact words and phrases your viewers repeat most — fuel for your next title and thumbnail." },
  { icon: <Lightbulb size={22} />, color: "#f59e0b", bg: "rgba(245,158,11,.15)", title: "Actionable Tips", desc: "Get prioritized suggestions to fix audio, pacing, clarity, and more — based on real viewer feedback." },
  { icon: <BarChart2 size={22} />, color: "#a78bfa", bg: "rgba(167,139,250,.15)", title: "Complaint Themes", desc: "Automatically group negative comments into themes so you know exactly what to fix first." },
  { icon: <Users size={22} />, color: "#f472b6", bg: "rgba(244,114,182,.15)", title: "Audience Requests", desc: "Surface what your viewers are asking you to make next — never run out of video ideas again." },
  { icon: <Shield size={22} />, color: "#34d399", bg: "rgba(52,211,153,.15)", title: "Quota Safe", desc: "Smart caching and daily limits protect your YouTube API quota. Analyses are reused for 24 hours." },
];

const steps = [
  { num: "01", title: "Paste a YouTube link", desc: "Drop any YouTube video URL into the analyzer. We support all formats including shorts and live streams." },
  { num: "02", title: "We read the comments", desc: "Our engine fetches up to 500 top comments and runs VADER sentiment analysis in seconds." },
  { num: "03", title: "Get your insights", desc: "Receive a full breakdown: sentiment, topics, requests, complaint themes, and improvement tips." },
];

const testimonials = [
  { name: "Alex Rivera", handle: "@alexcreates", avatar: "AR", color: "#6366f1", stars: 5, text: "I used to spend hours reading comments. Comment Compass gives me the same insights in 30 seconds. My last video got 40% more engagement after following the tips." },
  { name: "Priya Sharma", handle: "@priyatech", avatar: "PS", color: "#f59e0b", stars: 5, text: "The complaint themes feature is a game changer. Found out my audio was the #1 issue — fixed it, and my retention jumped from 38% to 61%." },
  { name: "Marcus Chen", handle: "@marcusgaming", avatar: "MC", color: "#10b981", stars: 5, text: "The audience requests section alone is worth it. I had 47 people asking for a follow-up video I didn't even know about. Made it, got 3x my usual views." },
];

const plans = [
  { name: "Free", price: "$0", period: "", desc: "Perfect to try it out", features: ["5 analyses per day", "Up to 500 comments", "Sentiment breakdown", "Topic discovery", "7-day history"], cta: "Get started free", href: "/signup", featured: false },
  { name: "Pro", price: "$12", period: "/mo", desc: "For serious creators", features: ["Unlimited analyses", "Up to 2,000 comments", "Everything in Free", "Priority processing", "30-day history", "CSV export"], cta: "Start Pro", href: "/signup", featured: true },
  { name: "Agency", price: "$39", period: "/mo", desc: "For teams & agencies", features: ["Everything in Pro", "10 team seats", "API access", "White-label reports", "Dedicated support", "Custom limits"], cta: "Contact us", href: "/contact", featured: false },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid-bg" />
        <div className="container">
          <div className="hero-content">
            <div className="badge badge-accent" style={{ marginBottom: "1.5rem" }}>
              <Zap size={13} /> Free to start · No credit card required
            </div>
            <h1>
              Know what your viewers think{" "}
              <span className="grad">before you hit record.</span>
            </h1>
            <p>
              Paste a YouTube link. Get sentiment analysis, what your audience is asking for,
              and clear steps to improve your next video — in under 60 seconds.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Analyze your first video <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn btn-outline btn-lg">
                <Play size={16} /> See how it works
              </Link>
            </div>

            {/* Demo card */}
            <div className="hero-demo">
              <div className="hero-demo-inner">
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ marginLeft: "auto", fontSize: ".8rem", color: "var(--ink3)" }}>comment-compass.app</span>
                </div>
                <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
                  <div style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: ".7rem 1rem", fontSize: ".85rem", color: "var(--ink3)" }}>
                    https://youtube.com/watch?v=...
                  </div>
                  <div className="btn btn-primary" style={{ padding: ".7rem 1.25rem", fontSize: ".85rem" }}>Analyze</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".75rem" }}>
                  {[["😊 Positive", "68%", "var(--good)"], ["😐 Neutral", "21%", "var(--ink3)"], ["😞 Negative", "11%", "var(--bad)"]].map(([label, val, color]) => (
                    <div key={label} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: ".85rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--ink3)", marginTop: ".2rem" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "1.25rem 0", background: "var(--bg2)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3rem", flexWrap: "wrap" }}>
          {[["10,000+", "Creators"], ["2M+", "Comments analyzed"], ["4.9★", "Average rating"], ["< 60s", "Per analysis"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--ink)" }}>{val}</div>
              <div style={{ fontSize: ".8rem", color: "var(--ink3)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="section" id="features">
        <div className="container">
          <div className="text-center mb-4">
            <div className="badge badge-accent mb-2">Features</div>
            <h2>Everything you need to <span className="grad">grow faster</span></h2>
            <p style={{ maxWidth: "48ch", margin: ".75rem auto 0" }}>Stop guessing what your audience wants. Let the data tell you.</p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                <h3 style={{ marginBottom: ".5rem" }}>{f.title}</h3>
                <p style={{ fontSize: ".9rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how-it-works" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div className="text-center mb-4">
            <div className="badge badge-gold mb-2">How it works</div>
            <h2>From link to insights in <span className="grad">3 steps</span></h2>
          </div>
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.num}>
                <div className="step-num">{s.num}</div>
                <h3 style={{ marginBottom: ".5rem" }}>{s.title}</h3>
                <p style={{ fontSize: ".9rem" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section" id="testimonials">
        <div className="container">
          <div className="text-center mb-4">
            <div className="badge badge-good mb-2">Testimonials</div>
            <h2>Loved by <span className="grad">creators worldwide</span></h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div style={{ display: "flex", gap: ".25rem", marginBottom: "1rem" }}>
                  {Array(t.stars).fill(0).map((_, i) => <Star key={i} size={15} fill="var(--gold)" color="var(--gold)" />)}
                </div>
                <p style={{ fontSize: ".92rem", marginBottom: "1.25rem", fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <div className="testimonial-avatar" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{t.name}</div>
                    <div style={{ fontSize: ".8rem", color: "var(--ink3)" }}>{t.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section" id="pricing" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div className="text-center mb-4">
            <div className="badge badge-accent mb-2">Pricing</div>
            <h2>Simple, <span className="grad">transparent pricing</span></h2>
            <p style={{ maxWidth: "40ch", margin: ".75rem auto 0" }}>Start free. Upgrade when you're ready to go deeper.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((p) => (
              <div key={p.name} className={`pricing-card${p.featured ? " featured" : ""}`}>
                {p.featured && <div className="badge badge-accent mb-2">Most popular</div>}
                <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{p.name}</div>
                <div className="pricing-price">{p.price}<span>{p.period}</span></div>
                <p style={{ fontSize: ".88rem", marginBottom: "1.5rem" }}>{p.desc}</p>
                <ul className="pricing-features">
                  {p.features.map((f) => (
                    <li key={f}><CheckCircle size={15} color="var(--good)" />{f}</li>
                  ))}
                </ul>
                <Link to={p.href} className={`btn w-full ${p.featured ? "btn-primary" : "btn-outline"}`} style={{ justifyContent: "center" }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-section">
            <div className="badge badge-accent mb-3" style={{ margin: "0 auto 1.5rem" }}>
              <Youtube size={13} /> Free forever plan available
            </div>
            <h2 style={{ marginBottom: "1rem" }}>Ready to understand your <span className="grad">audience?</span></h2>
            <p style={{ maxWidth: "44ch", margin: "0 auto 2rem" }}>Join 10,000+ creators who use Comment Compass to make better videos, faster.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start for free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

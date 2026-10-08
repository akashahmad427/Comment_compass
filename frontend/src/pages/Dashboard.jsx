import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Compass, LayoutDashboard, History, Settings, LogOut,
  Youtube, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown,
  Loader2, AlertCircle, CheckCircle, ChevronRight, Menu, X, BarChart2, User, Link2, Sparkles, Lightbulb, ArrowRight
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api.js";
import ProfilePanel from "../components/ProfilePanel.jsx";

const SENT_COLORS = { positive: "#10b981", neutral: "#6366f1", negative: "#ef4444" };

function Sidebar({ active, onSetView, onLogout, mobileOpen, onClose, user }) {
  const links = [
    { id: "analyze", icon: <LayoutDashboard size={18} />, label: "Analyze" },
    { id: "history", icon: <History size={18} />, label: "History" },
    { id: "profile", icon: <User size={18} />, label: "Profile" },
  ];

  function go(id) {
    onSetView(id);
    onClose?.();
  }

  return (
    <aside className={`sidebar${mobileOpen ? " open" : ""}`}>
      <Link to="/" className="sidebar-logo">
        <Compass size={20} />
        Comment Compass
      </Link>
      <nav className="sidebar-nav">
        {links.map(l => (
          <button key={l.id} className={`sidebar-link${active === l.id ? " active" : ""}`} onClick={() => go(l.id)}>
            {l.icon} {l.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {user && (
          <button className="sidebar-user" onClick={() => go("profile")} title="Open profile">
            <span className="avatar">{(user.name || user.email).trim().charAt(0).toUpperCase()}</span>
            <span className="who">
              <strong>{user.name || user.email.split("@")[0]}</strong>
              <small>{user.email}</small>
            </span>
          </button>
        )}
        <button className="sidebar-link" onClick={onLogout}>
          <LogOut size={18} /> Log out
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: color || "var(--ink)" }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function Results({ a }) {
  const r = a.result || {};
  const cov = r.coverage;
  const pie = ["positive", "neutral", "negative"].map(k => ({ name: k, value: a[k] || 0 }));
  const pct = k => a.total ? Math.round(((a[k] || 0) / a.total) * 100) : 0;
  const themes = Object.entries(r.themes || {}).map(([name, v]) => ({ name, ...v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", marginBottom: ".3rem" }}>{a.video_title || a.video_id}</h2>
            <p style={{ fontSize: ".88rem", margin: 0 }}>
              {a.channel} · {a.total} comments analyzed{cov?.on_youtube ? ` of ${cov.on_youtube.toLocaleString()} on YouTube` : ""}
            </p>
            {cov && (
              <p style={{ fontSize: ".8rem", margin: ".35rem 0 0", color: "var(--ink3)" }}>
                Includes {cov.top_level} top-level comments and {cov.replies} replies.
                {cov.on_youtube && cov.on_youtube > a.total
                  ? " YouTube's total counts every reply, and we analyze the most relevant comments up to your plan limit, so the two numbers can differ."
                  : ""}
              </p>
            )}
          </div>
          <div className="badge badge-good"><CheckCircle size={13} /> Analysis complete</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stat-grid">
        <StatCard label="Total Comments" value={a.total} sub="analyzed" />
        <StatCard label="Positive" value={`${pct("positive")}%`} sub={`${a.positive} comments`} color="var(--good)" />
        <StatCard label="Negative" value={`${pct("negative")}%`} sub={`${a.negative} comments`} color="var(--bad)" />
        <StatCard label="Neutral" value={`${pct("neutral")}%`} sub={`${a.neutral} comments`} color="var(--ink3)" />
      </div>

      {/* Sentiment + Topics */}
      <div className="results-grid">
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Sentiment Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pie} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {pie.map(p => <Cell key={p.name} fill={SENT_COLORS[p.name]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} comments`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginTop: ".75rem" }}>
            {pie.map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: ".6rem", fontSize: ".88rem" }}>
                <div className="legend-dot" style={{ background: SENT_COLORS[p.name] }} />
                <span style={{ textTransform: "capitalize", flex: 1 }}>{p.name}</span>
                <span style={{ fontWeight: 700 }}>{pct(p.name)}%</span>
                <span style={{ color: "var(--ink3)" }}>({p.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Top Topics</h3>
          {r.topics?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={r.topics.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="term" width={100} tick={{ fontSize: 12, fill: "var(--ink2)" }} />
                <Tooltip contentStyle={{ background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ fontSize: ".88rem" }}>Not enough data to find topics.</p>}
        </div>
      </div>

      {/* Suggestions */}
      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Improvement Suggestions</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {(r.suggestions || []).map((s, i) => (
            <div key={i} className={`tip-item ${s.priority}`}>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requests + Questions */}
      <div className="results-grid">
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>
            Audience Requests <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: ".85rem" }}>({r.request_count || 0})</span>
          </h3>
          {r.requests?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {r.requests.map((q, i) => <div key={i} className="quote-item">{q}</div>)}
            </div>
          ) : <p style={{ fontSize: ".88rem" }}>No clear requests found.</p>}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>
            Viewer Questions <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: ".85rem" }}>({r.question_count || 0})</span>
          </h3>
          {r.questions?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {r.questions.map((q, i) => <div key={i} className="quote-item">{q}</div>)}
            </div>
          ) : <p style={{ fontSize: ".88rem" }}>No questions found.</p>}
        </div>
      </div>

      {/* Complaint themes */}
      {themes.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Complaint Themes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {themes.sort((a, b) => b.negative - a.negative).map(t => (
              <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".65rem .85rem", background: "var(--panel2)", borderRadius: 10, fontSize: ".88rem" }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{t.name}</span>
                <span style={{ color: "var(--bad)", fontWeight: 700 }}>{t.negative} negative</span>
                <span style={{ color: "var(--ink3)" }}>{t.all} total</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top comments */}
      <div className="results-grid">
        <div className="card">
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
            <ThumbsUp size={16} color="var(--good)" /> Top Praise
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {(r.top_positive || []).map((c, i) => (
              <div key={i} className="quote-item">{c.text}<small>👍 {c.likes} likes</small></div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
            <ThumbsDown size={16} color="var(--bad)" /> Top Criticism
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {(r.top_negative || []).map((c, i) => (
              <div key={i} className="quote-item">{c.text}<small>👍 {c.likes} likes</small></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: <Link2 size={18} />, title: "Paste a link", text: "Drop in any public YouTube video URL." },
  { icon: <Sparkles size={18} />, title: "We read the comments", text: "Sentiment, topics, questions and requests are analyzed for you." },
  { icon: <Lightbulb size={18} />, title: "Get clear next steps", text: "See what your audience loves and what to improve next." },
];

function EmptyState({ history, totalCount, onOpen }) {
  const done = history.filter(h => h.status === "done");
  const comments = done.reduce((s, h) => s + (h.total || 0), 0);
  const positive = done.reduce((s, h) => s + (h.positive || 0), 0);
  const posPct = comments ? Math.round((positive / comments) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {done.length > 0 && (
        <div className="stat-grid three" style={{ marginBottom: 0 }}>
          <StatCard label="Analyses run" value={totalCount ?? done.length} sub="all time" />
          <StatCard label="Comments analyzed" value={comments.toLocaleString()} sub={`across your latest ${done.length}`} />
          <StatCard label="Positive sentiment" value={`${posPct}%`} sub="average, recent videos" color="var(--good)" />
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: "1.1rem" }}>How it works</h3>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div key={s.title} className="step-card">
              <div className="step-icon">{s.icon}</div>
              <div>
                <div className="step-title"><span>{i + 1}.</span> {s.title}</div>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {done.length > 0 && (
        <div>
          <h3 style={{ marginBottom: ".85rem" }}>Recent analyses</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {done.slice(0, 3).map(h => (
              <div key={h.id} className="history-item" onClick={() => onOpen(h.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.video_title || h.video_id}</div>
                  <div className="meta">{h.channel} · {new Date(h.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexShrink: 0 }}>
                  <span className="badge badge-good" style={{ fontSize: ".75rem" }}>{h.positive}+</span>
                  <span className="badge badge-bad" style={{ fontSize: ".75rem" }}>{h.negative}-</span>
                  <ChevronRight size={16} color="var(--ink3)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UpgradeCard() {
  return (
    <div className="card" style={{ borderColor: "var(--accent)", textAlign: "center", padding: "2rem 1.5rem" }}>
      <h3 style={{ marginBottom: ".5rem" }}>You've used your free analyses</h3>
      <p style={{ maxWidth: 460, margin: "0 auto 1.25rem" }}>
        Your past results stay available in History. Paid plans are coming soon, and early users get first access.
      </p>
      <Link to="/contact" className="btn btn-primary">Get early access <ArrowRight size={16} /></Link>
    </div>
  );
}

export default function Dashboard({ token, onLogout }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("analyze");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [limitHit, setLimitHit] = useState(false);
  const navigate = useNavigate();

  const loadHistory = useCallback(async () => {
    try { setHistory(await api.listAnalyses(1, token)); }
    catch (e) { if (e.status === 401) { onLogout(); navigate("/login"); } }
  }, [token, onLogout, navigate]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const loadUsage = useCallback(() => {
    api.getUsage(token).then(setUsage).catch(() => {});
  }, [token]);

  useEffect(() => { loadUsage(); }, [loadUsage]);

  useEffect(() => {
    api.getProfile(token).then(setUser).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!current || !["pending", "processing"].includes(current.status)) return;
    const t = setInterval(async () => {
      try {
        const a = await api.getAnalysis(current.id, token);
        setCurrent(a);
        if (a.status === "done" || a.status === "failed") { setBusy(false); loadHistory(); loadUsage(); }
      } catch { setBusy(false); }
    }, 2000);
    return () => clearInterval(t);
  }, [current, token, loadHistory, loadUsage]);

  async function analyze(e) {
    e.preventDefault();
    setErr(""); setLimitHit(false); setBusy(true); setCurrent(null);
    try {
      const a = await api.createAnalysis(url, token); loadUsage();
      if (a.status === "done") { setCurrent(await api.getAnalysis(a.id, token)); setBusy(false); }
      else setCurrent(a);
    } catch (e) {
      setErr(e.message); setBusy(false);
      if (e.status === 402) setLimitHit(true);
      if (e.status === 401) { onLogout(); navigate("/login"); }
    }
  }

  async function openHistory(id) {
    setErr(""); setView("analyze");
    setCurrent(await api.getAnalysis(id, token));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isProcessing = current && ["pending", "processing"].includes(current.status);

  return (
    <div className="dash-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 49 }} />}

      <Sidebar active={view} onSetView={setView} onLogout={() => { onLogout(); navigate("/"); }} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <main className="dash-main">
        <div className="dash-content">
        <div className="dash-header">
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <button className="btn-ghost menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div>
              <h1>{{ analyze: "Analyze Video", history: "History", profile: "Profile" }[view]}</h1>
              <p className="sub">{{
                analyze: user ? `Welcome back, ${(user.name || user.email.split("@")[0]).split(" ")[0]}` : "Paste a YouTube link to get insights",
                history: "Your past analyses",
                profile: "Manage your account details",
              }[view]}</p>
            </div>
          </div>
        </div>

        {view === "analyze" && (
          <>
            {/* Analyze bar */}
            <form onSubmit={analyze} className="dash-hero">
              <div>
                <h2>Understand your audience in seconds</h2>
                <p>Paste a YouTube link to get sentiment, top topics, viewer requests and ideas for your next video.</p>
              </div>
              <div className="hero-row">
                <div className="hero-input">
                  <Youtube size={17} />
                  <input className="input" value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..." required aria-label="YouTube video URL" />
                </div>
                <button className="btn btn-primary hero-btn" disabled={busy || !url.trim()}>
                  {busy ? <><span className="spinner" /> Analyzing…</> : <>Analyze comments <ArrowRight size={16} /></>}
                </button>
              </div>
            </form>

            {usage && (
              <p className="usage-note">
                {usage.period === "lifetime"
                  ? `${usage.remaining} of ${usage.limit} free analyses left`
                  : `${usage.remaining} of ${usage.limit} analyses left this month`}
              </p>
            )}

            {limitHit && <UpgradeCard />}
            {err && !limitHit && <div className="alert alert-error mb-3"><AlertCircle size={15} /> {err}</div>}

            {isProcessing && (
              <div className="card processing-card">
                <div className="progress-track"><div className="progress-bar" /></div>
                <h3>Analyzing your video…</h3>
                <p>Reading comments and finding patterns. This usually takes under a minute.</p>
              </div>
            )}

            {current?.status === "failed" && (
              <div className="alert alert-error mb-3"><AlertCircle size={15} /> {current.error}</div>
            )}

            {current?.status === "done" && <Results a={current} />}

            {!current && !busy && (
              <EmptyState history={history} totalCount={user?.analyses_count} onOpen={openHistory} />
            )}
          </>
        )}

        {view === "profile" && (
          <ProfilePanel token={token} onSaved={setUser} onUnauthorized={() => { onLogout(); navigate("/login"); }} />
        )}

        {view === "history" && (
          <div>
            <h3 style={{ marginBottom: "1rem" }}>Past Analyses <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: ".85rem" }}>({history.length})</span></h3>
            {history.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                <p style={{ marginBottom: "1rem" }}>No analyses yet. Analyze your first video to see it here.</p>
                <button className="btn btn-primary" onClick={() => setView("analyze")}>Analyze a video</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                {history.map(h => (
                  <div key={h.id} className="history-item" onClick={() => h.status === "done" && openHistory(h.id)}
                    style={{ opacity: h.status !== "done" ? .6 : 1, cursor: h.status === "done" ? "pointer" : "default" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.video_title || h.video_id}</div>
                      <div className="meta">{h.channel} · {new Date(h.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexShrink: 0 }}>
                      {h.status === "done" && (
                        <div style={{ display: "flex", gap: ".4rem" }}>
                          <span className="badge badge-good" style={{ fontSize: ".75rem" }}>{h.positive}+</span>
                          <span className="badge badge-bad" style={{ fontSize: ".75rem" }}>{h.negative}-</span>
                        </div>
                      )}
                      <span className={`badge ${h.status === "done" ? "badge-good" : h.status === "failed" ? "badge-bad" : "badge-accent"}`} style={{ fontSize: ".75rem" }}>
                        {h.status}
                      </span>
                      {h.status === "done" && <ChevronRight size={16} color="var(--ink3)" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
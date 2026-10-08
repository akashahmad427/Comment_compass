import { useEffect, useState } from "react";
import { Search, Ban, CheckCircle, Trash2, Mail, ChevronLeft, ChevronRight, X } from "lucide-react";
import { api } from "../../api.js";

function EmailModal({ user, token, onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function send(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api.adminEmailUser({ user_id: user.id, subject, body }, token);
      setDone(true);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: 500, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--ink3)", cursor: "pointer" }}><X size={18} /></button>
        <h3 style={{ marginBottom: ".25rem" }}>Email User</h3>
        <p style={{ fontSize: ".85rem", marginBottom: "1.25rem" }}>{user.email}</p>
        {done ? (
          <div className="alert alert-success">Email sent successfully!</div>
        ) : (
          <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={send}>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="input-wrap">
              <label>Subject</label>
              <input className="input" required value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line" />
            </div>
            <div className="input-wrap">
              <label>Message</label>
              <textarea className="input" required rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" style={{ resize: "vertical" }} />
            </div>
            <button className="btn btn-primary" style={{ justifyContent: "center" }} disabled={busy}>
              {busy ? <span className="spinner" /> : <><Mail size={15} /> Send email</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers({ token }) {
  const [data, setData] = useState({ users: [], total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [err, setErr] = useState("");

  async function load(p = page, q = query) {
    setBusy(true);
    try { setData(await api.adminUsers(p, q, token)); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  useEffect(() => { load(); }, [page]);

  function handleSearch(e) {
    e.preventDefault();
    setQuery(search); setPage(1);
    load(1, search);
  }

  async function toggleBlock(user) {
    try {
      user.is_blocked
        ? await api.adminUnblockUser(user.id, token)
        : await api.adminBlockUser(user.id, token);
      load();
    } catch (e) { setErr(e.message); }
  }

  async function deleteUser(user) {
    if (!confirm(`Permanently delete ${user.email} and all their data?`)) return;
    try { await api.adminDeleteUser(user.id, token); load(); }
    catch (e) { setErr(e.message); }
  }

  const totalPages = Math.ceil(data.total / 20);

  return (
    <div>
      {emailTarget && <EmailModal user={emailTarget} token={token} onClose={() => { setEmailTarget(null); load(); }} />}

      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: "1.4rem" }}>Users</h1>
          <p style={{ fontSize: ".85rem", margin: 0 }}>{data.total} total users</p>
        </div>
      </div>

      {err && <div className="alert alert-error mb-3">{err}</div>}

      <form onSubmit={handleSearch} style={{ display: "flex", gap: ".75rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: ".85rem", top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }} />
          <input className="input" style={{ paddingLeft: "2.5rem" }} placeholder="Search by email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
        {busy && <p style={{ color: "var(--ink3)", fontSize: ".9rem" }}>Loading…</p>}
        {data.users.map(u => (
          <div key={u.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: ".9rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
                {u.email}
                {u.is_blocked && <span className="badge badge-bad" style={{ fontSize: ".7rem" }}>Blocked</span>}
              </div>
              <div style={{ fontSize: ".78rem", color: "var(--ink3)", marginTop: ".2rem" }}>
                Joined {new Date(u.created_at).toLocaleDateString()} ·
                Last login: {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
              </div>
            </div>
            <div style={{ display: "flex", gap: ".5rem", flexShrink: 0 }}>
              <button className="btn btn-outline" style={{ padding: ".45rem .8rem", fontSize: ".8rem" }}
                onClick={() => setEmailTarget(u)} title="Send email">
                <Mail size={14} />
              </button>
              <button className={`btn ${u.is_blocked ? "btn-outline" : "btn-outline"}`}
                style={{ padding: ".45rem .8rem", fontSize: ".8rem", color: u.is_blocked ? "var(--good)" : "var(--warn)", borderColor: u.is_blocked ? "var(--good)" : "var(--warn)" }}
                onClick={() => toggleBlock(u)} title={u.is_blocked ? "Unblock" : "Block"}>
                {u.is_blocked ? <CheckCircle size={14} /> : <Ban size={14} />}
              </button>
              <button className="btn btn-outline" style={{ padding: ".45rem .8rem", fontSize: ".8rem", color: "var(--bad)", borderColor: "var(--bad)" }}
                onClick={() => deleteUser(u)} title="Delete user">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1.5rem" }}>
          <button className="btn btn-outline" style={{ padding: ".5rem .85rem" }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: ".9rem", color: "var(--ink2)" }}>Page {page} of {totalPages}</span>
          <button className="btn btn-outline" style={{ padding: ".5rem .85rem" }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

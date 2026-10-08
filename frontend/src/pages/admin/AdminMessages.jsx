import { useEffect, useState } from "react";
import { MessageSquare, Send, X, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { api } from "../../api.js";

function ReplyModal({ msg, token, onClose }) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function send(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api.adminReply({ message_id: msg.id, reply }, token);
      setDone(true);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: 560, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={() => { onClose(done); }} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--ink3)", cursor: "pointer" }}><X size={18} /></button>
        <h3 style={{ marginBottom: ".25rem" }}>Reply to {msg.name}</h3>
        <p style={{ fontSize: ".82rem", color: "var(--ink3)", marginBottom: "1.25rem" }}>{msg.email}</p>

        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: ".78rem", color: "var(--ink3)", marginBottom: ".4rem", textTransform: "uppercase", letterSpacing: ".05em" }}>Original message</div>
          <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: ".4rem" }}>{msg.subject}</div>
          <p style={{ fontSize: ".88rem", margin: 0 }}>{msg.message}</p>
        </div>

        {done ? (
          <div className="alert alert-success" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <CheckCircle size={16} /> Reply sent successfully!
          </div>
        ) : (
          <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={send}>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="input-wrap">
              <label>Your reply</label>
              <textarea className="input" required rows={6} value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write your reply…" style={{ resize: "vertical" }} />
            </div>
            <button className="btn btn-primary" style={{ justifyContent: "center" }} disabled={busy}>
              {busy ? <span className="spinner" /> : <><Send size={15} /> Send reply</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const STATUS_FILTERS = ["", "open", "replied", "closed"];
const STATUS_LABELS  = { "": "All", open: "Open", replied: "Replied", closed: "Closed" };

export default function AdminMessages({ token }) {
  const [data, setData] = useState({ messages: [], total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load(p = page, s = status) {
    setBusy(true);
    try { setData(await api.adminMessages(p, s, token)); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  useEffect(() => { load(); }, [page, status]);

  async function closeMsg(id) {
    try { await api.adminCloseMessage(id, token); load(); }
    catch (e) { setErr(e.message); }
  }

  const totalPages = Math.ceil(data.total / 20);

  const statusColor = { open: "badge-accent", replied: "badge-good", closed: "badge-bad" };

  return (
    <div>
      {replyTarget && (
        <ReplyModal msg={replyTarget} token={token} onClose={(refreshed) => { setReplyTarget(null); if (refreshed) load(); }} />
      )}

      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: "1.4rem" }}>Contact Messages</h1>
          <p style={{ fontSize: ".85rem", margin: 0 }}>{data.total} total messages</p>
        </div>
      </div>

      {err && <div className="alert alert-error mb-3">{err}</div>}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`btn ${status === s ? "btn-primary" : "btn-outline"}`}
            style={{ padding: ".45rem .9rem", fontSize: ".85rem" }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
        {busy && <p style={{ color: "var(--ink3)", fontSize: ".9rem" }}>Loading…</p>}
        {!busy && data.messages.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <MessageSquare size={32} style={{ color: "var(--ink3)", margin: "0 auto 1rem" }} />
            <p>No messages found.</p>
          </div>
        )}
        {data.messages.map(m => (
          <div key={m.id} className="card" style={{ padding: "1.1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{m.subject}</div>
                <div style={{ fontSize: ".8rem", color: "var(--ink3)", marginTop: ".2rem" }}>
                  {m.name} · {m.email} · {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge ${statusColor[m.status] || "badge-accent"}`} style={{ fontSize: ".75rem", flexShrink: 0 }}>
                {m.status}
              </span>
            </div>
            <p style={{ fontSize: ".88rem", marginBottom: "1rem", background: "var(--bg3)", padding: ".75rem 1rem", borderRadius: 8 }}>
              {m.message}
            </p>
            {m.reply && (
              <div style={{ fontSize: ".85rem", color: "var(--good)", background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 8, padding: ".75rem 1rem", marginBottom: "1rem" }}>
                <strong>Your reply:</strong> {m.reply}
              </div>
            )}
            <div style={{ display: "flex", gap: ".5rem" }}>
              {m.status !== "replied" && m.status !== "closed" && (
                <button className="btn btn-primary" style={{ padding: ".45rem .9rem", fontSize: ".82rem" }}
                  onClick={() => setReplyTarget(m)}>
                  <Send size={13} /> Reply
                </button>
              )}
              {m.status === "replied" && (
                <button className="btn btn-outline" style={{ padding: ".45rem .9rem", fontSize: ".82rem" }}
                  onClick={() => setReplyTarget(m)}>
                  <Send size={13} /> Reply again
                </button>
              )}
              {m.status !== "closed" && (
                <button className="btn btn-outline" style={{ padding: ".45rem .9rem", fontSize: ".82rem", color: "var(--ink3)" }}
                  onClick={() => closeMsg(m.id)}>
                  <CheckCircle size={13} /> Close
                </button>
              )}
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

import { useEffect, useState } from "react";
import { Users, BarChart2, MessageSquare, UserX, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../../api.js";

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color }}>
        {icon}
      </div>
      <div>
        <div className="label">{label}</div>
        <div className="value" style={{ fontSize: "1.6rem", color }}>{value ?? "—"}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.adminStats(token)
      .then(setStats)
      .catch(e => setErr(e.message));
  }, [token]);

  if (err) return <div className="alert alert-error">{err}</div>;
  if (!stats) return <div style={{ color: "var(--ink3)" }}>Loading…</div>;

  const chartData = [
    { name: "Total Users",    value: stats.total_users,      color: "#6366f1" },
    { name: "Active (30d)",   value: stats.active_users_30d, color: "#10b981" },
    { name: "Engaged (7d)",   value: stats.engaged_users_7d, color: "#f59e0b" },
    { name: "Blocked",        value: stats.blocked_users,    color: "#ef4444" },
  ];

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: "1.4rem" }}>Dashboard</h1>
          <p style={{ fontSize: ".85rem", margin: 0 }}>System overview</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "1.5rem" }}>
        <StatCard icon={<Users size={20} />}       label="Total Users"       value={stats.total_users}       sub={`+${stats.new_users_30d} this month`}  color="var(--accent2)" />
        <StatCard icon={<Activity size={20} />}    label="Active (30 days)"  value={stats.active_users_30d}  sub="Logged in recently"                    color="var(--good)" />
        <StatCard icon={<TrendingUp size={20} />}  label="Engaged (7 days)"  value={stats.engaged_users_7d}  sub="Ran an analysis"                       color="var(--gold)" />
        <StatCard icon={<BarChart2 size={20} />}   label="Total Analyses"    value={stats.total_analyses}    sub={`${stats.done_analyses} completed`}    color="var(--accent)" />
        <StatCard icon={<MessageSquare size={20} />} label="Open Messages"   value={stats.open_messages}     sub="Need your reply"                       color={stats.open_messages > 0 ? "var(--warn)" : "var(--ink3)"} />
        <StatCard icon={<UserX size={20} />}       label="Blocked Users"     value={stats.blocked_users}     sub="Suspended accounts"                    color="var(--bad)" />
      </div>

      {/* Chart */}
      <div className="card">
        <h3 style={{ marginBottom: "1.25rem" }}>User Activity Overview</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ left: 0, right: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--ink2)" }} />
            <YAxis tick={{ fontSize: 12, fill: "var(--ink2)" }} />
            <Tooltip contentStyle={{ background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Bar dataKey="value" radius={6}>
              {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

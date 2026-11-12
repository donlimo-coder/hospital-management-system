import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Banknote, CalendarCheck, Users, Clock } from "lucide-react";
import api from "../services/api";
import StatCard from "../components/ui/StatCard";
import Skeleton from "../components/ui/Skeleton";

const GENDER_COLORS = { male: "#3b82f6", female: "#f59e0b", other: "#12a594", unknown: "#b6c4d2" };
const BILLING_COLORS = { paid: "#12a594", pending: "#f59e0b", overdue: "#e5484d" };
const FALLBACK = "#7c93a8";

const RANGE_OPTIONS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "All time", value: "all" },
];

const tick = { fontSize: 12, fill: "#5b7590" };
const grid = { vertical: false, stroke: "rgba(120,150,180,0.25)" };
const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 10px 30px rgba(6,20,38,0.2)",
  fontSize: 13,
};

function formatHour(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${h}${period}`;
}

const AnCard = ({ title, sub, empty, span, index = 0, children }) => (
  <motion.div
    className={`glass-card an-card${span ? " an-span" : ""}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.15 + index * 0.06 }}
  >
    <h3>{title}</h3>
    {sub && <p className="sub">{sub}</p>}
    {!sub && <div style={{ height: 12 }} />}
    {empty ? <div className="empty-state">No data yet for this period.</div> : children}
  </motion.div>
);

const Donut = ({ data, colors, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <>
      <div className="chart-box" style={{ height: 190, marginTop: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              animationDuration={900}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={colors[d.name] || FALLBACK} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <div>
            <strong>{total}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>
      </div>
      <div className="legend-list">
        {data.map((d) => (
          <div className="legend-row" key={d.name}>
            <span>
              <i className="legend-dot" style={{ background: colors[d.name] || FALLBACK }} />
              {d.name}
            </span>
            <strong>{d.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
};

const Analytics = () => {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/analytics/dashboard", { params: { days: range } })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load analytics. Please try again."))
      .finally(() => setLoading(false));
  }, [range]);

  const billingPieData = data
    ? Object.entries(data.billingStatus)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({ name: status, value: count }))
    : [];

  const genderPieData = data
    ? data.demographics.gender.map((g) => ({ name: g.gender, value: g.count }))
    : [];

  // Summary numbers are calculated from the real data returned above
  const summary = useMemo(() => {
    if (!data) return null;
    const revenue = data.revenueTrend.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
    const online = data.appointmentsVsWalkins.reduce((s, r) => s + (Number(r.online) || 0), 0);
    const walkIn = data.appointmentsVsWalkins.reduce((s, r) => s + (Number(r.walkIn) || 0), 0);
    const peak = data.peakHours.reduce((best, h) => (!best || h.count > best.count ? h : best), null);
    return { revenue, visits: online + walkIn, walkIn, peak: peak ? formatHour(peak.hour) : "—" };
  }, [data]);

  const showCharts = !loading && !error && data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Revenue, visits and patient insights for the selected period.</p>
        </div>
        <div className="seg" role="tablist" aria-label="Date range">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={range === opt.value ? "active" : ""}
              onClick={() => setRange(opt.value)}
            >
              {range === opt.value && (
                <motion.span
                  layoutId="range-pill"
                  className="seg-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="stat-grid-v2">
        <StatCard index={0} loading={loading} title="Revenue in period" prefix="KSh " value={summary?.revenue} icon={Banknote} tone="success" />
        <StatCard index={1} loading={loading} title="Total visits" value={summary?.visits} icon={CalendarCheck} />
        <StatCard index={2} loading={loading} title="Walk-in visits" value={summary?.walkIn} icon={Users} />
        <StatCard index={3} loading={loading} title="Busiest hour" value={summary?.peak} icon={Clock} tone="warning" />
      </div>

      {loading && !error && (
        <div className="an-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`glass-card${i === 0 ? " an-span" : ""}`}>
              <Skeleton height={16} width="30%" />
              <Skeleton height={200} style={{ marginTop: 16 }} />
            </div>
          ))}
        </div>
      )}

      {showCharts && (
        <div className="an-grid">
          <AnCard index={0} span title="Revenue trend" sub="Daily revenue (KSh)" empty={data.revenueTrend.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRevenueLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#12a594" />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={tick} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`KSh ${Number(v).toLocaleString()}`, "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#gRevenueLine)"
                  fill="url(#gRevenueFill)"
                  strokeWidth={2.5}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </AnCard>

          <AnCard index={1} title="Appointments vs walk-ins" sub="Booked online compared with walk-in visits" empty={data.appointmentsVsWalkins.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.appointmentsVsWalkins} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBooked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="gWalk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(34,150,200,0.08)" }} contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="online" name="Booked" fill="url(#gBooked)" radius={[6, 6, 0, 0]} animationDuration={900} />
                <Bar dataKey="walkIn" name="Walk-in" fill="url(#gWalk)" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </AnCard>

          <AnCard index={2} title="Doctor workload" sub="Appointments per doctor" empty={data.doctorWorkload.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.doctorWorkload} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDoctor" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} stroke="rgba(120,150,180,0.25)" />
                <XAxis type="number" tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="doctor" tick={tick} tickLine={false} axisLine={false} width={120} />
                <Tooltip cursor={{ fill: "rgba(34,150,200,0.08)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Appointments" fill="url(#gDoctor)" radius={[0, 6, 6, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </AnCard>

          <AnCard index={3} title="Billing status" sub="Invoices by payment status" empty={billingPieData.length === 0}>
            <Donut data={billingPieData} colors={BILLING_COLORS} centerLabel="invoices" />
            {data.billingAmounts && (
              <div className="chip-row">
                {Object.entries(data.billingAmounts)
                  .filter(([, amt]) => amt > 0)
                  .map(([status, amt]) => (
                    <span key={status} className={`amount-chip amount-${status}`}>
                      {status}: KSh {amt.toLocaleString()}
                    </span>
                  ))}
              </div>
            )}
          </AnCard>

          <AnCard index={4} title="Patient demographics: gender" empty={genderPieData.length === 0}>
            <Donut data={genderPieData} colors={GENDER_COLORS} centerLabel="patients" />
          </AnCard>

          <AnCard index={5} title="Patient demographics: age groups" empty={data.demographics.ageGroups.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.demographics.ageGroups} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="group" tick={tick} tickLine={false} axisLine={false} />
                <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(245,158,11,0.08)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Patients" fill="url(#gAge)" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </AnCard>

          <AnCard index={6} span title="Peak hours" sub="When appointments are busiest" empty={data.peakHours.length === 0}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data.peakHours.map((h) => ({ ...h, label: formatHour(h.hour) }))}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gPeak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#12a594" />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
                <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(18,165,148,0.08)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Appointments" fill="url(#gPeak)" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </AnCard>
        </div>
      )}
    </div>
  );
};

export default Analytics;
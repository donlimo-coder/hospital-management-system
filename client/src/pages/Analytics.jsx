import React, { useEffect, useState } from "react";
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
import api from "../services/api";
import "./Analytics.css";

const COLORS = {
  navy: "#0f4c81",
  amber: "#e3a548",
  teal: "#2a9d8f",
  ink: "#0b2540",
  muted: "#5b6b7a",
  danger: "#e94560",
};

const GENDER_COLORS = { male: "#0f4c81", female: "#e3a548", other: "#2a9d8f", unknown: "#c8d0d8" };
const BILLING_COLORS = { paid: "#2a9d8f", pending: "#e3a548", overdue: "#e94560" };

const RANGE_OPTIONS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "All time", value: "all" },
];

function formatHour(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${h}${period}`;
}

const ChartCard = ({ title, children, empty }) => (
  <div className="analytics-card">
    <h3>{title}</h3>
    {empty ? <p className="analytics-empty">No data yet for this period.</p> : children}
  </div>
);

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

  return (
    <div className="page analytics-page">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <div className="analytics-range-picker">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={range === opt.value ? "active" : ""}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Loading analytics...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && data && (
        <div className="analytics-grid">
          <ChartCard title="Revenue Trend" empty={data.revenueTrend.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueTrend}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`KSh ${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.teal} fill="url(#revenueFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Appointments vs Walk-ins" empty={data.appointmentsVsWalkins.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.appointmentsVsWalkins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="online" name="Booked" fill={COLORS.navy} radius={[4, 4, 0, 0]} />
                <Bar dataKey="walkIn" name="Walk-in" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Doctor Workload" empty={data.doctorWorkload.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.doctorWorkload} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf0" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="doctor" tick={{ fontSize: 12 }} width={130} />
                <Tooltip />
                <Bar dataKey="count" name="Appointments" fill={COLORS.navy} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Billing Status"
            empty={billingPieData.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={billingPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {billingPieData.map((entry) => (
                    <Cell key={entry.name} fill={BILLING_COLORS[entry.name] || COLORS.muted} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            {data.billingAmounts && (
              <div className="analytics-billing-amounts">
                {Object.entries(data.billingAmounts)
                  .filter(([, amt]) => amt > 0)
                  .map(([status, amt]) => (
                    <span key={status} className={`billing-amount billing-${status}`}>
                      {status}: KSh {amt.toLocaleString()}
                    </span>
                  ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Patient Demographics — Gender" empty={genderPieData.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={genderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {genderPieData.map((entry) => (
                    <Cell key={entry.name} fill={GENDER_COLORS[entry.name] || COLORS.muted} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Patient Demographics — Age Groups" empty={data.demographics.ageGroups.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.demographics.ageGroups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Peak Hours" empty={data.peakHours.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.peakHours.map((h) => ({ ...h, label: formatHour(h.hour) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Appointments" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default Analytics;
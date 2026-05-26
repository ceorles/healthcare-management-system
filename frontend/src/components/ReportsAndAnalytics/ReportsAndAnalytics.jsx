import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
    BarChart3,
    Clock,
    Calendar,
    Download,
    User,
    Users,
    ClipboardList,
    FileText,
    TrendingUp,
    MapPin,
    Activity,
    Zap,
    PieChart as PieChartIcon,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { getDiseaseColor, getTopDiseaseLegendPayload } from '../../utils/diseaseChart.js';
import '../../assets/css/ReportsAndAnalytics.css';
import '../../assets/css/Patients.css';

const API = 'http://127.0.0.1:8000/api/analytics/dashboard/';

const CHART_ANIM = {
    isAnimationActive: true,
    animationDuration: 900,
    animationEasing: 'ease-out',
};

const LINE_COLOR = '#2d6a4f';
const SEX_COLORS = { Male: '#3b82f6', Female: '#ec4899' };
const ROLE_COLORS = { Admin: '#7c3aed', Doctor: '#3b82f6', Nurse: '#ec4899' };

function formatReportDate(isoDate) {
    if (!isoDate) return '—';
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function SectionLabel({ icon: Icon, children }) {
    return (
        <h2 className="reports-section-label">
            {Icon && <Icon size={14} />}
            {children}
        </h2>
    );
}

function SummaryCard({ value, label, iconClass, Icon }) {
    return (
        <div className="reports-summary-card">
            <div>
                <strong>{value}</strong>
                <span>{label}</span>
            </div>
            <div className={`reports-summary-icon ${iconClass}`}>
                <Icon size={22} />
            </div>
        </div>
    );
}

function EmptyChart({ message }) {
    return <div className="reports-empty-chart">{message}</div>;
}

function DiseaseLegend({ diseases }) {
    const payload = getTopDiseaseLegendPayload(diseases);

    return (
        <ul className="recharts-default-legend" style={{ padding: 0, margin: 0, textAlign: 'center' }}>
            {payload.map((entry) => (
                <li
                    key={entry.value}
                    className="recharts-legend-item legend-item-0"
                    style={{ display: 'inline-block', marginRight: 10 }}
                >
                    <span
                        className="recharts-legend-icon"
                        style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            backgroundColor: entry.color,
                            marginRight: 4,
                        }}
                    />
                    <span className="recharts-legend-item-text" style={{ color: entry.color }}>
                        {entry.value}
                    </span>
                </li>
            ))}
        </ul>
    );
}

export default function ReportsAndAnalytics() {
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const reportRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('access');
                const { data: payload } = await axios.get(API, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setData(payload);
            } catch (err) {
                console.error('Analytics fetch failed:', err);
                setError('Unable to load analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="reports-loading">Loading reports & analytics...</div>;
    }

    if (error || !data) {
        return <div className="reports-error">{error || 'No data available.'}</div>;
    }

    const { summary } = data;
    const maxPatientBarangay = data.patients_by_barangay[0]?.count || 1;
    const referralChartData = data.referrals_by_barangay.map((row) => ({
        barangay: row.barangay,
        count: row.count,
    }));

    const diseaseChartData = data.disease_distribution.map((row) => ({
        name: row.label,
        value: row.count,
    }));

    const sexChartData = data.patient_sex_distribution.map((row) => ({
        name: row.label,
        value: row.count,
    }));

    const roleChartData = data.staff_by_role.map((row) => ({
        name: row.label,
        value: row.count,
    }));

    return (
        <div className="reports-page" ref={reportRef}>
            <div className="reports-page-header">
                <h1 className="page-title">
                    <BarChart3 size={24} /> Reports & Analytics
                </h1>
                <div className="page-time">
                    <Clock size={16} /> {currentTime}
                </div>
            </div>

            <div className="reports-toolbar">
                <div className="reports-as-of">
                    <Calendar size={16} />
                    Report as of {formatReportDate(data.report_as_of)}
                </div>
                <button type="button" className="reports-download-btn" onClick={handlePrint}>
                    <Download size={16} /> Download/Print Report
                </button>
            </div>

            <SectionLabel icon={Activity}>Summary Overview</SectionLabel>
            <div className="reports-summary-grid">
                <SummaryCard
                    value={summary.total_patients}
                    label="Total Patients"
                    iconClass="patients"
                    Icon={User}
                />
                <SummaryCard
                    value={summary.total_staff}
                    label="Staff Accounts"
                    iconClass="staff"
                    Icon={Users}
                />
                <SummaryCard
                    value={summary.total_visits}
                    label="Total Visits"
                    iconClass="visits"
                    Icon={ClipboardList}
                />
                <SummaryCard
                    value={summary.total_referrals}
                    label="Referrals"
                    iconClass="referrals"
                    Icon={FileText}
                />
            </div>

            <SectionLabel icon={TrendingUp}>Health Trends — 12 Month Overview</SectionLabel>
            <div className="reports-charts-row">
                <div className="reports-card">
                    <h3>Monthly Patient Visits</h3>
                    <div className="reports-chart-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthly_visits}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke={LINE_COLOR}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: LINE_COLOR }}
                                    {...CHART_ANIM}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="reports-card">
                    <h3>Monthly Referrals</h3>
                    <div className="reports-chart-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthly_referrals}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke={LINE_COLOR}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: LINE_COLOR }}
                                    {...CHART_ANIM}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <SectionLabel icon={MapPin}>Barangay Analysis</SectionLabel>
            <div className="reports-charts-row">
                <div className="reports-card">
                    <h3>Patients by Barangay</h3>
                    <p className="reports-card-subtitle">Top 10 barangays with most registered patients</p>
                    {data.patients_by_barangay.length > 0 ? (
                        <div className="reports-barangay-list">
                            {data.patients_by_barangay.map((row) => (
                                <div key={row.barangay} className="reports-barangay-item">
                                    <div className="reports-barangay-item-header">
                                        <span>{row.barangay}</span>
                                        <span>{row.count}</span>
                                    </div>
                                    <div className="reports-barangay-bar-track">
                                        <div
                                            className="reports-barangay-bar-fill"
                                            style={{ width: `${(row.count / maxPatientBarangay) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyChart message="No patient barangay data yet." />
                    )}
                </div>
                <div className="reports-card">
                    <h3>Barangay Referral Hotspots</h3>
                    <p className="reports-card-subtitle">Barangays generating the most referrals</p>
                    {referralChartData.length > 0 ? (
                        <div className="reports-chart-wrap tall">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={referralChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="barangay" width={120} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill={LINE_COLOR} radius={[0, 4, 4, 0]} {...CHART_ANIM} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="No referral barangay data yet." />
                    )}
                </div>
            </div>

            <SectionLabel icon={PieChartIcon}>Distribution Breakdown</SectionLabel>
            <div className="reports-distribution-grid">
                <div className="reports-card">
                    <h3><Zap size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Disease Distribution</h3>
                    {diseaseChartData.length > 0 ? (
                        <div className="reports-chart-wrap">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={diseaseChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={2}
                                        {...CHART_ANIM}
                                    >
                                        {diseaseChartData.map((entry) => (
                                            <Cell key={entry.name} fill={getDiseaseColor(entry.name)} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        content={() => <DiseaseLegend diseases={diseaseChartData} />}
                                        wrapperStyle={{ fontSize: 11 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="No diagnosis data from visits yet." />
                    )}
                </div>
                <div className="reports-card">
                    <h3>Patient Sex Distribution</h3>
                    {sexChartData.length > 0 ? (
                        <div className="reports-chart-wrap">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sexChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={85}
                                        {...CHART_ANIM}
                                    >
                                        {sexChartData.map((entry) => (
                                            <Cell key={entry.name} fill={SEX_COLORS[entry.name] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="No patient sex data yet." />
                    )}
                </div>
                <div className="reports-card">
                    <h3>Staff by Role</h3>
                    {roleChartData.length > 0 ? (
                        <div className="reports-chart-wrap">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={85}
                                        {...CHART_ANIM}
                                    >
                                        {roleChartData.map((entry) => (
                                            <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="No staff role data yet." />
                    )}
                </div>
            </div>
        </div>
    );
}

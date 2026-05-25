import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Activity,
    BarChart3,
    ClipboardList,
    Clock,
    FileText,
    Grid2X2,
    Map,
    MapPin,
    QrCode,
    User,
    Users,
} from 'lucide-react';
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import ReferralQRScanner from '../components/Referrals/ReferralQRScanner.jsx';
import { parseReferralCodeFromQr } from '../utils/patientPrefill.js';
import '../assets/css/AdminDashboard.css';
import '../assets/css/Referrals.css';

const API = 'http://127.0.0.1:8000/api';

const CHART_ANIM = {
    isAnimationActive: true,
    animationDuration: 900,
    animationEasing: 'ease-out',
};

const LINE_COLOR = '#2d6a4f';
const SEX_COLORS = { Male: '#3b82f6', Female: '#ec4899' };
const ROLE_COLORS = { Admin: '#7c3aed', Doctor: '#3b82f6', Nurse: '#ec4899' };
const DISEASE_COLORS = ['#3b82f6', '#2d6a4f', '#7c3aed', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16', '#6366f1'];

function SectionLabel({ icon: Icon, children }) {
    return (
        <h2 className="admin-dash-section-label">
            {Icon && <Icon size={14} />}
            {children}
        </h2>
    );
}

function SummaryCard({ value, label, iconClass, Icon }) {
    return (
        <div className="admin-summary-card">
            <div>
                <strong>{value}</strong>
                <span>{label}</span>
            </div>
            <div className={`admin-summary-icon ${iconClass}`}>
                <Icon size={22} />
            </div>
        </div>
    );
}

function EmptyChart({ message }) {
    return <div className="admin-empty-chart">{message}</div>;
}

function Admin() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [scanProcessing, setScanProcessing] = useState(false);

    useEffect(() => {
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('access');
                const { data } = await axios.get(`${API}/analytics/dashboard/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDashboardData(data);
            } catch (err) {
                console.error('Admin dashboard fetch failed:', err);
                setError('Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleQrScan = useCallback(async (decodedText) => {
        const code = parseReferralCodeFromQr(decodedText);
        if (!code) {
            alert('Invalid QR code. No referral code was detected.');
            return;
        }

        setShowScanner(false);
        setScanProcessing(true);

        try {
            const token = localStorage.getItem('access');
            const { data } = await axios.get(`${API}/referrals/lookup-by-code/`, {
                params: { code },
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.has_registered_patient && data.patient) {
                navigate('/admin/patients', {
                    state: {
                        qrRedirect: {
                            type: 'view',
                            patient: data.patient,
                            referralCode: data.referral_code,
                        },
                    },
                });
                return;
            }

            navigate('/admin/patients', {
                state: {
                    qrRedirect: {
                        type: 'new',
                        prefill: {
                            ...data.walkin_prefill,
                            referral_code: data.referral_code,
                            referral_id: data.referral_id,
                        },
                    },
                },
            });
        } catch (err) {
            if (err.response?.status === 404) {
                alert(`Referral "${code}" was not found in the system.`);
            } else {
                console.error('QR lookup failed:', err);
                alert('Could not verify this referral QR code. Please try again.');
            }
        } finally {
            setScanProcessing(false);
        }
    }, [navigate]);

    const sixMonthVisits = useMemo(() => (
        dashboardData?.monthly_visits?.slice(-6) || []
    ), [dashboardData]);

    const topBarangays = useMemo(() => (
        dashboardData?.patients_by_barangay?.slice(0, 5) || []
    ), [dashboardData]);

    const diseaseChartData = useMemo(() => (
        dashboardData?.disease_distribution?.map((row) => ({
            name: row.label,
            value: row.count,
        })) || []
    ), [dashboardData]);

    const sexChartData = useMemo(() => (
        dashboardData?.patient_sex_distribution?.map((row) => ({
            name: row.label,
            value: row.count,
        })) || []
    ), [dashboardData]);

    const roleChartData = useMemo(() => (
        dashboardData?.staff_by_role?.map((row) => ({
            name: row.label,
            value: row.count,
        })) || []
    ), [dashboardData]);

    const maxBarangayCount = topBarangays[0]?.count || 1;

    if (loading) {
        return <div className="admin-dashboard-loading">Loading admin dashboard...</div>;
    }

    if (error || !dashboardData) {
        return <div className="admin-dashboard-error">{error || 'No dashboard data available.'}</div>;
    }

    const summary = dashboardData.summary || {};

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-header">
                <h1 className="page-title">
                    <Grid2X2 size={22} /> Admin Dashboard
                </h1>
                <div className="page-time">
                    <Clock size={16} /> {currentTime}
                </div>
            </div>

            <SectionLabel icon={Grid2X2}>Summary Overview</SectionLabel>
            <div className="admin-summary-grid">
                <SummaryCard value={summary.total_patients ?? 0} label="Total Patients" iconClass="patients" Icon={User} />
                <SummaryCard value={summary.total_staff ?? 0} label="Staff Accounts" iconClass="staff" Icon={Users} />
                <SummaryCard value={summary.total_visits ?? 0} label="Total Visits" iconClass="visits" Icon={ClipboardList} />
                <SummaryCard value={summary.total_referrals ?? 0} label="Referrals" iconClass="referrals" Icon={FileText} />
            </div>

            <SectionLabel icon={QrCode}>QR Scanner</SectionLabel>
            <button
                type="button"
                className="admin-qr-button"
                onClick={() => setShowScanner(true)}
                disabled={scanProcessing}
            >
                <QrCode size={16} /> {scanProcessing ? 'Processing...' : 'Scan QR Code'}
            </button>

            <SectionLabel icon={Activity}>Health Analytics Summary</SectionLabel>
            <div className="admin-analytics-layout">
                <div className="admin-card admin-trends-card">
                    <div className="admin-card-header">
                        <h3><BarChart3 size={16} /> Community Health Trends (6 Months)</h3>
                        <button type="button" className="admin-outline-btn" onClick={() => navigate('/admin/map')}>
                            <Map size={14} /> GIS Map
                        </button>
                    </div>
                    {sixMonthVisits.length > 0 ? (
                        <div className="admin-trends-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sixMonthVisits}>
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
                    ) : (
                        <EmptyChart message="No visit trend data yet." />
                    )}
                </div>

                <div className="admin-card admin-barangay-card">
                    <h3><MapPin size={16} /> Top Barangays</h3>
                    {topBarangays.length > 0 ? (
                        <div className="admin-barangay-list">
                            {topBarangays.map((row) => (
                                <div key={row.barangay} className="admin-barangay-item">
                                    <div className="admin-barangay-meta">
                                        <span>{row.barangay}</span>
                                        <span>{row.count}</span>
                                    </div>
                                    <div className="admin-barangay-track">
                                        <div
                                            className="admin-barangay-fill"
                                            style={{ width: `${(row.count / maxBarangayCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyChart message="No barangay data yet." />
                    )}
                    <button type="button" className="admin-map-link" onClick={() => navigate('/admin/map')}>
                        <Map size={14} /> View Full GIS Map
                    </button>
                </div>
            </div>

            <div className="admin-distribution-grid">
                <div className="admin-card admin-distribution-card">
                    <h3><BarChart3 size={16} /> Disease Distribution</h3>
                    {diseaseChartData.length > 0 ? (
                        <div className="admin-pie-wrap">
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
                                        {diseaseChartData.map((entry, index) => (
                                            <Cell key={entry.name} fill={DISEASE_COLORS[index % DISEASE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="No diagnosis data yet." />
                    )}
                </div>

                <div className="admin-card admin-distribution-card">
                    <h3><BarChart3 size={16} /> Patient Sex Distribution</h3>
                    {sexChartData.length > 0 ? (
                        <div className="admin-pie-wrap">
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

                <div className="admin-card admin-distribution-card">
                    <h3><BarChart3 size={16} /> Staff by Role</h3>
                    {roleChartData.length > 0 ? (
                        <div className="admin-pie-wrap">
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

            <ReferralQRScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleQrScan}
            />
        </div>
    );
}

export default Admin;
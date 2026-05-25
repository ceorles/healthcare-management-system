import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Clock,
    Edit,
    FileText,
    Eye,
    LayoutDashboard,
    Printer,
    QrCode,
    ScanLine,
    Users,
    UserRound,
} from 'lucide-react';
import EditPatient from './Patients/EditPatient.jsx';
import ViewPatient from './Patients/ViewPatient.jsx';
import EditReferral from './Referrals/EditReferral.jsx';
import PrintReferral from './Referrals/PrintReferral.jsx';
import ViewReferral from './Referrals/ViewReferral.jsx';
import ReferralQRScanner from './Referrals/ReferralQRScanner.jsx';
import { parseReferralCodeFromQr } from '../utils/patientPrefill.js';

const API = 'http://127.0.0.1:8000/api';
const RECENT_DAYS = 7;
const TABLE_LIMIT = 5;

function isRecent(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return false;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
    return date >= cutoff;
}

function sortByNewest(items) {
    return [...items].sort((a, b) => {
        const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
        const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
        return bTime - aTime;
    });
}

function getReferralBarangay(referral) {
    return referral.patient_barangay_display || referral.barangay || '-----';
}

export default function LimitedAccessDashboard({ title, basePath }) {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [patients, setPatients] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [editingPatient, setEditingPatient] = useState(null);
    const [editingReferral, setEditingReferral] = useState(null);
    const [printingReferral, setPrintingReferral] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scanProcessing, setScanProcessing] = useState(false);

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem('access')}`,
    }), []);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [patientsResponse, referralsResponse] = await Promise.all([
                axios.get(`${API}/patients/`, { headers: authHeaders() }),
                axios.get(`${API}/referrals/`, { headers: authHeaders() }),
            ]);

            setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
            setReferrals(Array.isArray(referralsResponse.data) ? referralsResponse.data : []);
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Unable to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        loadDashboardData();
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, [loadDashboardData]);

    const recentPatients = useMemo(() => sortByNewest(patients), [patients]);
    const recentReferrals = useMemo(() => sortByNewest(referrals), [referrals]);
    const recentPatientCount = useMemo(
        () => patients.filter((patient) => isRecent(patient.created_at)).length,
        [patients]
    );
    const recentReferralCount = useMemo(
        () => referrals.filter((referral) => isRecent(referral.created_at)).length,
        [referrals]
    );

    const handleQrScan = useCallback(async (decodedText) => {
        const code = parseReferralCodeFromQr(decodedText);
        if (!code) {
            alert('Invalid QR code. No referral code was detected.');
            return;
        }

        setShowScanner(false);
        setScanProcessing(true);

        try {
            const { data } = await axios.get(`${API}/referrals/lookup-by-code/`, {
                params: { code },
                headers: authHeaders(),
            });

            if (data.has_registered_patient && data.patient) {
                navigate(`${basePath}/patients`, {
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

            navigate(`${basePath}/patients`, {
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
    }, [authHeaders, basePath, navigate]);

    const handlePatientSaveSuccess = () => {
        setEditingPatient(null);
        loadDashboardData();
    };

    const handleReferralSaveSuccess = () => {
        setEditingReferral(null);
        loadDashboardData();
    };

    if (selectedPatient) {
        return (
            <ViewPatient
                patient={selectedPatient}
                onBack={() => setSelectedPatient(null)}
                onEdit={() => {
                    setEditingPatient(selectedPatient);
                    setSelectedPatient(null);
                }}
                canDelete={false}
                canCreateVisit={false}
            />
        );
    }

    if (editingPatient) {
        return (
            <EditPatient
                patient={editingPatient}
                onCancel={() => setEditingPatient(null)}
                onSaveSuccess={handlePatientSaveSuccess}
            />
        );
    }

    if (selectedReferral) {
        return (
            <ViewReferral
                referral={selectedReferral}
                onBack={() => setSelectedReferral(null)}
                onEdit={() => {
                    setEditingReferral(selectedReferral);
                    setSelectedReferral(null);
                }}
                onPrint={() => {
                    setPrintingReferral(selectedReferral);
                    setSelectedReferral(null);
                }}
            />
        );
    }

    if (editingReferral) {
        return (
            <EditReferral
                referral={editingReferral}
                onCancel={() => setEditingReferral(null)}
                onSaveSuccess={handleReferralSaveSuccess}
            />
        );
    }

    if (printingReferral) {
        return (
            <PrintReferral
                referral={printingReferral}
                onCancel={() => setPrintingReferral(null)}
            />
        );
    }

    return (
        <div className="nurse-dashboard">
            <div className="nurse-dashboard-header">
                <h1><LayoutDashboard size={20} /> {title}</h1>
                <div className="nurse-dashboard-time"><Clock size={14} /> {currentTime}</div>
            </div>

            {error && <div className="nurse-dashboard-alert">{error}</div>}

            <section className="nurse-dashboard-section">
                <div className="nurse-section-label"><LayoutDashboard size={12} /> Summary Overview</div>
                <div className="nurse-summary-grid">
                    <div className="nurse-summary-card">
                        <div>
                            <strong>{loading ? '...' : patients.length}</strong>
                            <span>Total Patients</span>
                        </div>
                        <div className="nurse-summary-icon blue"><UserRound size={20} /></div>
                    </div>

                    <div className="nurse-summary-card">
                        <div>
                            <strong>{loading ? '...' : recentPatientCount}</strong>
                            <span>Recent Patients</span>
                        </div>
                        <div className="nurse-summary-icon orange"><Users size={20} /></div>
                    </div>

                    <div className="nurse-summary-card">
                        <div>
                            <strong>{loading ? '...' : recentReferralCount}</strong>
                            <span>Recent Referrals</span>
                        </div>
                        <div className="nurse-summary-icon purple"><FileText size={20} /></div>
                    </div>
                </div>
            </section>

            <section className="nurse-dashboard-section">
                <div className="nurse-section-label"><ScanLine size={12} /> QR Scanner</div>
                <button
                    type="button"
                    className="nurse-scan-btn"
                    onClick={() => setShowScanner(true)}
                    disabled={scanProcessing}
                >
                    <QrCode size={16} /> {scanProcessing ? 'Processing...' : 'Scan QR Code'}
                </button>
            </section>

            <section className="nurse-dashboard-section">
                <div className="nurse-section-label"><FileText size={12} /> Recent Patient and Referral Summary</div>
                <div className="nurse-recent-grid">
                    <div className="nurse-recent-card">
                        <div className="nurse-recent-header">
                            <h2><Users size={16} /> Recent Patients</h2>
                            <button type="button" onClick={() => navigate(`${basePath}/patients`)}>View All</button>
                        </div>

                        <div className="nurse-table-wrap">
                            <table className="nurse-mini-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Age / Sex</th>
                                        <th>Barangay</th>
                                        <th aria-label="Actions"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="nurse-empty-row">Loading patients...</td></tr>
                                    ) : recentPatients.length > 0 ? (
                                        recentPatients.slice(0, TABLE_LIMIT).map((patient) => (
                                            <tr key={patient.id}>
                                                <td>{patient.full_name || '-----'}</td>
                                                <td>{patient.age || '--'} / {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : '-----'}</td>
                                                <td>{patient.barangay || '-----'}</td>
                                                <td>
                                                    <div className="nurse-row-actions">
                                                        <button
                                                            type="button"
                                                            className="nurse-action-btn view"
                                                            onClick={() => setSelectedPatient(patient)}
                                                            aria-label={`View ${patient.full_name || 'patient'}`}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="nurse-action-btn edit"
                                                            onClick={() => setEditingPatient(patient)}
                                                            aria-label={`Edit ${patient.full_name || 'patient'}`}
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="nurse-empty-row">No recent patients found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="nurse-recent-card">
                        <div className="nurse-recent-header">
                            <h2><FileText size={16} /> Recent Referrals</h2>
                            <button type="button" onClick={() => navigate(`${basePath}/referrals`)}>View All</button>
                        </div>

                        <div className="nurse-table-wrap">
                            <table className="nurse-mini-table referrals">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Patient</th>
                                        <th>Barangay</th>
                                        <th aria-label="Actions"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="nurse-empty-row">Loading referrals...</td></tr>
                                    ) : recentReferrals.length > 0 ? (
                                        recentReferrals.slice(0, TABLE_LIMIT).map((referral) => (
                                            <tr key={referral.id}>
                                                <td className="nurse-ref-code">{referral.referral_code || '-----'}</td>
                                                <td>{referral.patient_name_display || 'Walk-in'}</td>
                                                <td>{getReferralBarangay(referral)}</td>
                                                <td>
                                                    <div className="nurse-row-actions">
                                                        <button
                                                            type="button"
                                                            className="nurse-action-btn view"
                                                            onClick={() => setSelectedReferral(referral)}
                                                            aria-label={`View ${referral.referral_code || 'referral'}`}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="nurse-action-btn print"
                                                            onClick={() => setPrintingReferral(referral)}
                                                            aria-label={`Print ${referral.referral_code || 'referral'}`}
                                                        >
                                                            <Printer size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="nurse-action-btn edit"
                                                            onClick={() => setEditingReferral(referral)}
                                                            aria-label={`Edit ${referral.referral_code || 'referral'}`}
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="nurse-empty-row">No recent referrals found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            <ReferralQRScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleQrScan}
            />
        </div>
    );
}

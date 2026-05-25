import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Calendar,
    Clock,
    Eye,
    LayoutDashboard,
    List,
    QrCode,
    ScanLine,
    UserRound,
    Users,
} from 'lucide-react';
import ViewPatient from '../../components/Patients/ViewPatient.jsx';
import NewVisit from '../../components/Patients/Visit/NewVisit.jsx';
import ViewVisit from '../../components/Patients/Visit/ViewVisit.jsx';
import ViewReferral from '../../components/Referrals/ViewReferral.jsx';
import ReferralQRScanner from '../../components/Referrals/ReferralQRScanner.jsx';
import { parseReferralCodeFromQr } from '../../utils/patientPrefill.js';
import '../../assets/css/DoctorDashboard.css';

const API = 'http://127.0.0.1:8000/api';
const RECENT_DAYS = 7;
const TABLE_LIMIT = 5;

function formatDateValue(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

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

function formatQueueDate(date = new Date()) {
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    });
}

function formatAppointmentTime(time) {
    if (!time) return '--:--';
    const [hour = '0', minute = '0'] = String(time).split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getAppointmentStatusKey(status) {
    return status === 'completed' ? 'completed' : 'pending';
}

function Doctor() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [profile, setProfile] = useState(null);
    const [patients, setPatients] = useState([]);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [newVisitPatient, setNewVisitPatient] = useState(null);
    const [selectedVisitId, setSelectedVisitId] = useState(null);
    const [selectedReferralId, setSelectedReferralId] = useState(null);
    const [visitRefreshKey, setVisitRefreshKey] = useState(0);
    const [showScanner, setShowScanner] = useState(false);
    const [scanProcessing, setScanProcessing] = useState(false);

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem('access')}`,
    }), []);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [profileResponse, patientsResponse, visitsResponse] = await Promise.all([
                axios.get(`${API}/users/profile/`, { headers: authHeaders() }),
                axios.get(`${API}/patients/`, { headers: authHeaders() }),
                axios.get(`${API}/visits/`, { headers: authHeaders() }),
            ]);

            setProfile(profileResponse.data);
            setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
            setVisits(Array.isArray(visitsResponse.data) ? visitsResponse.data : []);
        } catch (err) {
            console.error('Error loading doctor dashboard:', err);
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

    const today = useMemo(() => new Date(), []);
    const todayValue = useMemo(() => formatDateValue(today), [today]);
    const recentPatients = useMemo(() => sortByNewest(patients), [patients]);
    const patientById = useMemo(() => {
        const map = new Map();
        patients.forEach((patient) => map.set(patient.id, patient));
        return map;
    }, [patients]);

    const todaysAppointments = useMemo(() => {
        if (!profile?.id) return [];
        return visits
            .filter((visit) => (
                visit.has_follow_up
                && visit.follow_up_summary?.appointment_date === todayValue
                && Number(visit.follow_up_summary?.doctor_id) === Number(profile.id)
            ))
            .sort((a, b) => (
                String(a.follow_up_summary?.appointment_time || '')
                    .localeCompare(String(b.follow_up_summary?.appointment_time || ''))
            ));
    }, [profile?.id, todayValue, visits]);

    const recentPatientCount = useMemo(
        () => patients.filter((patient) => isRecent(patient.created_at || patient.updated_at)).length,
        [patients]
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
                navigate('/doctor/patients', {
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

            navigate('/doctor/patients', {
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
    }, [authHeaders, navigate]);

    const openPatient = (patient) => {
        if (!patient) return;
        setSelectedPatient(patient);
        setVisitRefreshKey((k) => k + 1);
    };

    const handleVisitSaveSuccess = () => {
        setVisitRefreshKey((k) => k + 1);
        setSelectedPatient(newVisitPatient);
        setNewVisitPatient(null);
        loadDashboardData();
    };

    if (selectedVisitId && selectedPatient) {
        return (
            <ViewVisit
                visitId={selectedVisitId}
                patient={selectedPatient}
                onBack={() => setSelectedVisitId(null)}
            />
        );
    }

    if (selectedReferralId) {
        return (
            <ViewReferral
                referralId={selectedReferralId}
                onBack={() => setSelectedReferralId(null)}
                fromPatientProfile
            />
        );
    }

    if (newVisitPatient) {
        return (
            <NewVisit
                patient={newVisitPatient}
                onCancel={() => setNewVisitPatient(null)}
                onSaveSuccess={handleVisitSaveSuccess}
            />
        );
    }

    if (selectedPatient) {
        return (
            <ViewPatient
                key={visitRefreshKey}
                patient={selectedPatient}
                onBack={() => setSelectedPatient(null)}
                onNewVisit={() => setNewVisitPatient(selectedPatient)}
                onViewVisit={setSelectedVisitId}
                onViewReferral={setSelectedReferralId}
                canDelete={false}
            />
        );
    }

    return (
        <div className="doctor-dashboard">
            <div className="doctor-dashboard-header">
                <h1><LayoutDashboard size={20} /> Doctor Dashboard</h1>
                <div className="doctor-dashboard-time"><Clock size={14} /> {currentTime}</div>
            </div>

            {error && <div className="doctor-dashboard-alert">{error}</div>}

            <section className="doctor-dashboard-section">
                <div className="doctor-section-label"><LayoutDashboard size={12} /> Summary Overview</div>
                <div className="doctor-summary-grid">
                    <div className="doctor-summary-card">
                        <div>
                            <strong>{loading ? '...' : patients.length}</strong>
                            <span>Total Patients</span>
                        </div>
                        <div className="doctor-summary-icon blue"><UserRound size={20} /></div>
                    </div>

                    <div className="doctor-summary-card">
                        <div>
                            <strong>{loading ? '...' : todaysAppointments.length}</strong>
                            <span>Today's Appointment</span>
                        </div>
                        <div className="doctor-summary-icon purple"><Calendar size={20} /></div>
                    </div>

                    <div className="doctor-summary-card">
                        <div>
                            <strong>{loading ? '...' : recentPatientCount}</strong>
                            <span>Recent Patients</span>
                        </div>
                        <div className="doctor-summary-icon orange"><Users size={20} /></div>
                    </div>
                </div>
            </section>

            <section className="doctor-dashboard-section">
                <div className="doctor-section-label"><ScanLine size={12} /> QR Scanner</div>
                <button
                    type="button"
                    className="doctor-scan-btn"
                    onClick={() => setShowScanner(true)}
                    disabled={scanProcessing}
                >
                    <QrCode size={16} /> {scanProcessing ? 'Processing...' : 'Scan QR Code'}
                </button>
            </section>

            <section className="doctor-dashboard-section">
                <div className="doctor-section-label"><Calendar size={12} /> Appointment Queue and Patient Summary</div>
                <div className="doctor-main-grid">
                    <div className="doctor-queue-card">
                        <div className="doctor-card-header">
                            <h2><List size={16} /> Today's Queue - {formatQueueDate(today)}</h2>
                        </div>

                        {loading ? (
                            <div className="doctor-empty-queue">
                                <Calendar size={44} />
                                <strong>Loading appointments...</strong>
                            </div>
                        ) : todaysAppointments.length > 0 ? (
                            <div className="doctor-queue-list">
                                {todaysAppointments.map((visit) => {
                                    const patient = patientById.get(visit.patient);
                                    const followUp = visit.follow_up_summary || {};
                                    return (
                                        <div className="doctor-queue-item" key={visit.id}>
                                            <div>
                                                <strong>{visit.patient_name || patient?.full_name || 'Patient'}</strong>
                                                <span>{formatAppointmentTime(followUp.appointment_time)}</span>
                                                <span>{followUp.appointment_type_display || followUp.appointment_type || 'Appointment'}</span>
                                                <span className={`doctor-status-badge ${getAppointmentStatusKey(followUp.status)}`}>
                                                    {followUp.status_display || (followUp.status === 'completed' ? 'Completed' : 'Pending')}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openPatient(patient)}
                                                disabled={!patient}
                                            >
                                                View Patient
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="doctor-empty-queue">
                                <Calendar size={48} />
                                <strong>No Appointments Today</strong>
                            </div>
                        )}
                    </div>

                    <div className="doctor-recent-card">
                        <div className="doctor-recent-header">
                            <h2><Users size={16} /> Recent Patients</h2>
                            <button type="button" onClick={() => navigate('/doctor/patients')}>View All</button>
                        </div>

                        <div className="doctor-table-wrap">
                            <table className="doctor-mini-table">
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
                                        <tr><td colSpan="4" className="doctor-empty-row">Loading patients...</td></tr>
                                    ) : recentPatients.length > 0 ? (
                                        recentPatients.slice(0, TABLE_LIMIT).map((patient) => (
                                            <tr key={patient.id}>
                                                <td>{patient.full_name || '-----'}</td>
                                                <td>{patient.age || '--'} / {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : '-----'}</td>
                                                <td>{patient.barangay || '-----'}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="doctor-action-btn view"
                                                        onClick={() => openPatient(patient)}
                                                        aria-label={`View ${patient.full_name || 'patient'}`}
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="doctor-empty-row">No recent patients found.</td></tr>
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

export default Doctor;
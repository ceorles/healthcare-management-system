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
    UserX,
    UserRound,
    Users,
    XCircle,
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
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function formatQueueDateValue(dateValue) {
    if (!dateValue) return '';
    return formatQueueDate(new Date(`${dateValue}T12:00:00`));
}

function getMonthStart(dateValue) {
    const date = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return {
            date,
            value: formatDateValue(date),
            day: date.getDate(),
            inMonth: date.getMonth() === month,
        };
    });
}

function getMonthBounds(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    return {
        start_date: formatDateValue(new Date(year, month, 1)),
        end_date: formatDateValue(new Date(year, month + 1, 0)),
    };
}

function formatAppointmentTime(time) {
    if (!time) return '--:--';
    const [hour = '0', minute = '0'] = String(time).split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getAppointmentStatusKey(status) {
    return status || 'scheduled';
}

function Doctor() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [profile, setProfile] = useState(null);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appointmentLoading, setAppointmentLoading] = useState(true);
    const [error, setError] = useState('');
    const [todayAppointmentCount, setTodayAppointmentCount] = useState(0);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [newVisitPatient, setNewVisitPatient] = useState(null);
    const [selectedVisitId, setSelectedVisitId] = useState(null);
    const [selectedReferralId, setSelectedReferralId] = useState(null);
    const [visitRefreshKey, setVisitRefreshKey] = useState(0);
    const [showScanner, setShowScanner] = useState(false);
    const [scanProcessing, setScanProcessing] = useState(false);
    const [selectedQueueDate, setSelectedQueueDate] = useState(() => formatDateValue());
    const [queueViewMode, setQueueViewMode] = useState('list');
    const [calendarMonth, setCalendarMonth] = useState(() => getMonthStart());

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem('access')}`,
    }), []);

    const todayValue = useMemo(() => formatDateValue(), []);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [profileResponse, patientsResponse] = await Promise.all([
                axios.get(`${API}/users/profile/`, { headers: authHeaders() }),
                axios.get(`${API}/patients/`, { headers: authHeaders() }),
            ]);

            setProfile(profileResponse.data);
            setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
        } catch (err) {
            console.error('Error loading doctor dashboard:', err);
            setError('Unable to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    const loadAppointmentData = useCallback(async () => {
        setAppointmentLoading(true);
        const monthBounds = getMonthBounds(calendarMonth);

        try {
            const requestConfig = {
                headers: authHeaders(),
                params: {
                    mine: 'true',
                    follow_up_only: 'true',
                    status: 'scheduled',
                },
            };
            const [monthResponse, todayResponse] = await Promise.all([
                axios.get(`${API}/appointments/`, {
                    ...requestConfig,
                    params: {
                        ...requestConfig.params,
                        ...monthBounds,
                    },
                }),
                axios.get(`${API}/appointments/`, {
                    ...requestConfig,
                    params: {
                        ...requestConfig.params,
                        date: todayValue,
                    },
                }),
            ]);

            setAppointments(Array.isArray(monthResponse.data) ? monthResponse.data : []);
            setTodayAppointmentCount(Array.isArray(todayResponse.data) ? todayResponse.data.length : 0);
        } catch (err) {
            console.error('Error loading doctor appointments:', err);
            setError('Unable to load appointment queue. Please try again.');
        } finally {
            setAppointmentLoading(false);
        }
    }, [authHeaders, calendarMonth, todayValue]);

    useEffect(() => {
        loadDashboardData();
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, [loadDashboardData]);

    useEffect(() => {
        loadAppointmentData();
    }, [loadAppointmentData]);

    const recentPatients = useMemo(() => sortByNewest(patients), [patients]);
    const patientById = useMemo(() => {
        const map = new Map();
        patients.forEach((patient) => map.set(patient.id, patient));
        return map;
    }, [patients]);

    const doctorAppointments = useMemo(() => {
        if (!profile?.id) return appointments;
        return appointments
            .filter((visit) => (
                Number(visit.doctor) === Number(profile.id)
            ))
            .sort((a, b) => (
                String(a.appointment_date || '').localeCompare(String(b.appointment_date || ''))
                || String(a.appointment_time || '').localeCompare(String(b.appointment_time || ''))
            ));
    }, [appointments, profile?.id]);

    const selectedDateAppointments = useMemo(() => (
        doctorAppointments
            .filter((visit) => visit.appointment_date === selectedQueueDate)
            .sort((a, b) => (
                String(a.appointment_time || '').localeCompare(String(b.appointment_time || ''))
            ))
    ), [doctorAppointments, selectedQueueDate]);

    const appointmentCountByDate = useMemo(() => {
        const counts = {};
        doctorAppointments.forEach((visit) => {
            const date = visit.appointment_date;
            if (date) counts[date] = (counts[date] || 0) + 1;
        });
        return counts;
    }, [doctorAppointments]);

    const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
    const selectedDateLabel = useMemo(() => formatQueueDateValue(selectedQueueDate), [selectedQueueDate]);

    const handleQueueDateChange = (value) => {
        setSelectedQueueDate(value);
        setCalendarMonth(getMonthStart(value));
    };

    const shiftCalendarMonth = (amount) => {
        setCalendarMonth((current) => {
            const nextMonth = new Date(current.getFullYear(), current.getMonth() + amount, 1);
            setSelectedQueueDate(formatDateValue(nextMonth));
            return nextMonth;
        });
    };

    const handleAppointmentStatusChange = async (appointment, nextStatus) => {
        const actionLabel = nextStatus === 'cancelled' ? 'cancel this appointment' : 'mark this appointment as no show';
        const shouldUpdate = window.confirm(`Are you sure you want to ${actionLabel}?`);
        if (!shouldUpdate) return;

        try {
            await axios.patch(`${API}/appointments/${appointment.id}/`, { status: nextStatus }, {
                headers: authHeaders(),
            });
            loadAppointmentData();
        } catch (err) {
            console.error('Error updating appointment status:', err);
            alert('Unable to update appointment status. Please try again.');
        }
    };

    const renderQueueList = (appointments, emptyLabel) => (
        appointments.length > 0 ? (
            <div className="doctor-queue-list">
                {appointments.map((appointment) => {
                    const patient = patientById.get(appointment.patient);
                    return (
                        <div className="doctor-queue-item" key={appointment.id}>
                            <div>
                                <strong>{appointment.patient_name || patient?.full_name || 'Patient'}</strong>
                                <span>{formatAppointmentTime(appointment.appointment_time)}</span>
                                <span>{appointment.appointment_type_display || appointment.appointment_type || 'Appointment'}</span>
                                <span className={`doctor-status-badge ${getAppointmentStatusKey(appointment.status)}`}>
                                    {appointment.status_display || 'Scheduled'}
                                </span>
                            </div>
                            <div className="doctor-queue-actions">
                                <button
                                    type="button"
                                    onClick={() => openPatient(patient)}
                                    disabled={!patient}
                                >
                                    View Patient
                                </button>
                                {appointment.status === 'scheduled' && (
                                    <>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => handleAppointmentStatusChange(appointment, 'cancelled')}
                                        >
                                            <XCircle size={12} /> Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="warning"
                                            onClick={() => handleAppointmentStatusChange(appointment, 'no_show')}
                                        >
                                            <UserX size={12} /> No Show
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="doctor-empty-queue">
                <Calendar size={48} />
                <strong>{emptyLabel}</strong>
            </div>
        )
    );

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
            if (err.response?.status === 409) {
                alert(err.response.data?.detail || 'This referral slip has already been used. Please get a new referral slip.');
            } else if (err.response?.status === 404) {
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
        loadAppointmentData();
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
                            <strong>{loading ? '...' : todayAppointmentCount}</strong>
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
                        <div className="doctor-card-header doctor-card-header--queue">
                            <h2><List size={16} /> Appointment Queue - {selectedDateLabel}</h2>
                            <div className="doctor-queue-controls">
                                <input
                                    type="date"
                                    className="doctor-date-input"
                                    value={selectedQueueDate}
                                    onChange={(e) => handleQueueDateChange(e.target.value)}
                                />
                                <div className="doctor-view-toggle">
                                    <button
                                        type="button"
                                        className={queueViewMode === 'list' ? 'active' : ''}
                                        onClick={() => setQueueViewMode('list')}
                                    >
                                        List
                                    </button>
                                    <button
                                        type="button"
                                        className={queueViewMode === 'calendar' ? 'active' : ''}
                                        onClick={() => setQueueViewMode('calendar')}
                                    >
                                        Calendar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {(loading || appointmentLoading) ? (
                            <div className="doctor-empty-queue">
                                <Calendar size={44} />
                                <strong>Loading appointments...</strong>
                            </div>
                        ) : queueViewMode === 'calendar' ? (
                            <div className="doctor-calendar-panel">
                                <div className="doctor-calendar-header">
                                    <button type="button" onClick={() => shiftCalendarMonth(-1)}>Prev</button>
                                    <strong>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                                    <button type="button" onClick={() => shiftCalendarMonth(1)}>Next</button>
                                </div>
                                <div className="doctor-calendar-grid">
                                    {WEEK_DAYS.map((day) => (
                                        <div key={day} className="doctor-calendar-weekday">{day}</div>
                                    ))}
                                    {calendarDays.map((day) => {
                                        const count = appointmentCountByDate[day.value] || 0;
                                        const isToday = day.value === todayValue;
                                        const isSelected = day.value === selectedQueueDate;
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                className={[
                                                    'doctor-calendar-day',
                                                    day.inMonth ? '' : 'muted',
                                                    isToday ? 'today' : '',
                                                    isSelected ? 'selected' : '',
                                                ].filter(Boolean).join(' ')}
                                                onClick={() => handleQueueDateChange(day.value)}
                                            >
                                                <span>{day.day}</span>
                                                {count > 0 && <em>{count}</em>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {renderQueueList(selectedDateAppointments, 'No Appointments on Selected Date')}
                            </div>
                        ) : (
                            renderQueueList(
                                selectedDateAppointments,
                                selectedQueueDate === todayValue ? 'No Appointments Today' : 'No Appointments on Selected Date'
                            )
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
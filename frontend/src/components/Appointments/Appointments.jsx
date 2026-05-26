import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import '../../assets/css/Appointments.css';

const API = 'http://127.0.0.1:8000/api';
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const APPOINTMENT_TYPES = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'check_up', label: 'Check-up' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'prenatal', label: 'Prenatal' },
    { value: 'other', label: 'Other' },
];
const STATUS_OPTIONS = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' },
];

function formatDateValue(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateValue) {
    if (!dateValue) return '';
    return new Date(`${dateValue}T12:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(time) {
    if (!time) return '--:--';
    const [hour = '0', minute = '0'] = String(time).split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getMonthStart(dateValue) {
    const date = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthBounds(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    return {
        start_date: formatDateValue(new Date(year, month, 1)),
        end_date: formatDateValue(new Date(year, month + 1, 0)),
    };
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

function getStatusLabel(status) {
    return STATUS_OPTIONS.find((option) => option.value === status)?.label || status || 'Scheduled';
}

function getTypeLabel(type) {
    return APPOINTMENT_TYPES.find((option) => option.value === type)?.label || type || 'Appointment';
}

function AppointmentModal({ mode, appointment, doctors, onClose, onSave }) {
    const isEdit = mode === 'edit';
    const [formData, setFormData] = useState(() => ({
        appointment_date: appointment?.appointment_date || formatDateValue(),
        appointment_time: appointment?.appointment_time?.slice(0, 5) || '',
        appointment_type: appointment?.appointment_type || 'follow_up',
        doctor: appointment?.doctor || '',
        notes: appointment?.notes || '',
    }));
    const [saving, setSaving] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        const saved = await onSave(formData);
        if (!saved) setSaving(false);
    };

    return (
        <div className="appt-modal-backdrop" role="dialog" aria-modal="true">
            <div className="appt-modal">
                <div className="appt-modal-header">
                    <h3>{isEdit ? 'Edit Appointment' : 'Appointment Details'}</h3>
                    <button type="button" onClick={onClose} aria-label="Close appointment modal">
                        <X size={16} />
                    </button>
                </div>

                {isEdit ? (
                    <form onSubmit={handleSubmit} className="appt-modal-body">
                        <div className="appt-form-grid grid-cols-2">
                            <div className="appt-input-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    name="appointment_date"
                                    className="appt-input"
                                    value={formData.appointment_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="appt-input-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    name="appointment_time"
                                    className="appt-input"
                                    value={formData.appointment_time}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="appt-form-grid grid-cols-1">
                            <div className="appt-input-group">
                                <label>Appointment Type</label>
                                <select
                                    name="appointment_type"
                                    className="appt-select"
                                    value={formData.appointment_type}
                                    onChange={handleChange}
                                    required
                                >
                                    {APPOINTMENT_TYPES.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="appt-form-grid grid-cols-1">
                            <div className="appt-input-group">
                                <label>Assigned Doctor</label>
                                <select
                                    name="doctor"
                                    className="appt-select"
                                    value={formData.doctor}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select doctor</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.fullname || doctor.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="appt-form-grid grid-cols-1">
                            <div className="appt-input-group">
                                <label>Notes / Remarks</label>
                                <textarea
                                    name="notes"
                                    className="appt-textarea"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="appt-modal-actions">
                            <button type="button" className="appt-btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="appt-btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="appt-modal-body">
                        <div className="appt-detail-grid">
                            <div><span>Patient</span><strong>{appointment.patient_name || 'Unknown Patient'}</strong></div>
                            <div><span>Date</span><strong>{formatDisplayDate(appointment.appointment_date)}</strong></div>
                            <div><span>Time</span><strong>{formatTime(appointment.appointment_time)}</strong></div>
                            <div><span>Type</span><strong>{appointment.appointment_type_display || getTypeLabel(appointment.appointment_type)}</strong></div>
                            <div><span>Doctor</span><strong>{appointment.doctor_name || 'Unassigned'}</strong></div>
                            <div><span>Status</span><strong>{appointment.status_display || getStatusLabel(appointment.status)}</strong></div>
                        </div>
                        <div className="appt-detail-notes">
                            <span>Notes / Remarks</span>
                            <p>{appointment.notes || 'No notes added.'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Appointments() {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => formatDateValue());
    const [currentMonth, setCurrentMonth] = useState(() => getMonthStart());
    const [viewMode, setViewMode] = useState('calendar');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [activeModal, setActiveModal] = useState(null);

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem('access')}`,
    }), []);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = {
                ...getMonthBounds(currentMonth),
                follow_up_only: 'true',
            };
            if (doctorFilter) params.doctor = doctorFilter;
            if (typeFilter) params.appointment_type = typeFilter;
            if (statusFilter) params.status = statusFilter;

            const { data } = await axios.get(`${API}/appointments/`, {
                headers: authHeaders(),
                params,
            });
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Unable to load appointments. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [authHeaders, currentMonth, doctorFilter, statusFilter, typeFilter]);

    const fetchDoctors = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/staff/`, {
                headers: authHeaders(),
            });
            const activeDoctors = Array.isArray(data)
                ? data.filter((staff) => staff.role === 'DOCTOR' && staff.is_active)
                : [];
            setDoctors(activeDoctors);
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    }, [authHeaders]);

    useEffect(() => {
        fetchDoctors();
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, [fetchDoctors]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const todayValue = useMemo(() => formatDateValue(), []);
    const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
    const selectedDateAppointments = useMemo(() => (
        appointments
            .filter((appointment) => appointment.appointment_date === selectedDate)
            .sort((a, b) => String(a.appointment_time || '').localeCompare(String(b.appointment_time || '')))
    ), [appointments, selectedDate]);

    const appointmentsByDate = useMemo(() => {
        const map = {};
        appointments.forEach((appointment) => {
            const date = appointment.appointment_date;
            if (!date) return;
            if (!map[date]) map[date] = [];
            map[date].push(appointment);
        });
        return map;
    }, [appointments]);

    const handleDateChange = (dateValue) => {
        setSelectedDate(dateValue);
        setCurrentMonth(getMonthStart(dateValue));
    };

    const shiftMonth = (amount) => {
        setCurrentMonth((current) => {
            const next = new Date(current.getFullYear(), current.getMonth() + amount, 1);
            setSelectedDate(formatDateValue(next));
            return next;
        });
    };

    const handleSaveAppointment = async (payload) => {
        if (!activeModal?.appointment) return;

        try {
            await axios.patch(`${API}/appointments/${activeModal.appointment.id}/`, payload, {
                headers: authHeaders(),
            });
            setActiveModal(null);
            fetchAppointments();
            return true;
        } catch (err) {
            console.error('Error updating appointment:', err);
            const detail = err.response?.data?.non_field_errors?.[0]
                || err.response?.data?.detail
                || err.response?.data?.follow_up
                || 'Unable to update appointment. Please check the appointment details.';
            alert(detail);
            return false;
        }
    };

    const handleDeleteAppointment = async (appointment) => {
        const shouldDelete = window.confirm(`Delete appointment of ${appointment.patient_name || 'this patient'}?`);
        if (!shouldDelete) return;

        try {
            await axios.delete(`${API}/appointments/${appointment.id}/`, {
                headers: authHeaders(),
            });
            fetchAppointments();
        } catch (err) {
            console.error('Error deleting appointment:', err);
            alert('Unable to delete appointment. Please try again.');
        }
    };

    return (
        <div className="appointments-page">
            <div className="appt-page-header">
                <div className="appt-page-title"><CalendarIcon size={24} /> Appointment Management</div>
                <div className="appt-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            {error && <div className="appt-alert">{error}</div>}

            <div className="appt-filter-card">
                <div className="appt-filter-group">
                    <label>Date</label>
                    <input
                        type="date"
                        className="appt-input"
                        value={selectedDate}
                        onChange={(event) => handleDateChange(event.target.value)}
                    />
                </div>
                <div className="appt-filter-group">
                    <label>Doctor</label>
                    <select className="appt-select" value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)}>
                        <option value="">All Doctors</option>
                        {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>Dr. {doctor.fullname || doctor.username}</option>
                        ))}
                    </select>
                </div>
                <div className="appt-filter-group">
                    <label>Type</label>
                    <select className="appt-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                        <option value="">All Types</option>
                        {APPOINTMENT_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div className="appt-filter-group">
                    <label>Status</label>
                    <select className="appt-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div className="appt-view-toggle" aria-label="Appointment view toggle">
                    <button type="button" className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>
                        Calendar
                    </button>
                    <button type="button" className={viewMode === 'queue' ? 'active' : ''} onClick={() => setViewMode('queue')}>
                        Queue
                    </button>
                </div>
            </div>

            <div className={viewMode === 'calendar' ? 'appointments-layout' : 'appointments-layout queue-only'}>
                {viewMode === 'calendar' && (
                    <div className="calendar-widget">
                        <div className="calendar-header">
                            <button type="button" onClick={() => shiftMonth(-1)} className="calendar-nav-btn"><ChevronLeft size={20}/></button>
                            <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                            <button type="button" onClick={() => shiftMonth(1)} className="calendar-nav-btn"><ChevronRight size={20}/></button>
                        </div>

                        <div className="calendar-body">
                            <div className="calendar-days-header">
                                {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
                            </div>
                            <div className="calendar-grid">
                                {calendarDays.map((day) => {
                                    const dayAppointments = appointmentsByDate[day.value] || [];
                                    const firstType = dayAppointments[0]?.appointment_type_display || getTypeLabel(dayAppointments[0]?.appointment_type);
                                    return (
                                        <button
                                            key={day.value}
                                            type="button"
                                            className={[
                                                'calendar-day',
                                                day.inMonth ? '' : 'muted',
                                                day.value === selectedDate ? 'active' : '',
                                                day.value === todayValue ? 'today' : '',
                                                dayAppointments.length ? 'has-appointment' : '',
                                            ].filter(Boolean).join(' ')}
                                            onClick={() => handleDateChange(day.value)}
                                            title={dayAppointments.length ? `${dayAppointments.length} appointment(s)` : 'No appointments'}
                                        >
                                            <span>{day.day}</span>
                                            {dayAppointments.length > 0 && <em>{dayAppointments.length}</em>}
                                            {dayAppointments.length > 0 && <small>{firstType}</small>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="queue-card">
                    <div className="queue-header">
                        <div>
                            <h3>Queue for {formatDisplayDate(selectedDate)}</h3>
                            <span>{selectedDateAppointments.length} appointment{selectedDateAppointments.length === 1 ? '' : 's'}</span>
                        </div>
                    </div>

                    <div className="appt-table-wrap">
                        <table className="appt-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Patient</th>
                                    <th>Time</th>
                                    <th>Type</th>
                                    <th>Doctor</th>
                                    <th>Status</th>
                                    <th aria-label="Actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="appt-empty-row">Loading appointments...</td></tr>
                                ) : selectedDateAppointments.length > 0 ? selectedDateAppointments.map((appointment, index) => (
                                    <tr key={appointment.id}>
                                        <td><div className="queue-badge">{index + 1}</div></td>
                                        <td className="appt-patient-cell">{appointment.patient_name || 'Unknown Patient'}</td>
                                        <td>{formatTime(appointment.appointment_time)}</td>
                                        <td>{appointment.appointment_type_display || getTypeLabel(appointment.appointment_type)}</td>
                                        <td>{appointment.doctor_name || 'Unassigned'}</td>
                                        <td>
                                            <span className={`appt-status-badge ${appointment.status || 'scheduled'}`}>
                                                {appointment.status_display || getStatusLabel(appointment.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="appt-row-actions">
                                                <button
                                                    type="button"
                                                    className="appt-btn-action view"
                                                    onClick={() => setActiveModal({ mode: 'view', appointment })}
                                                    title="View appointment"
                                                    aria-label={`View appointment of ${appointment.patient_name || 'patient'}`}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="appt-btn-action edit"
                                                    onClick={() => setActiveModal({ mode: 'edit', appointment })}
                                                    title="Edit appointment"
                                                    aria-label={`Edit appointment of ${appointment.patient_name || 'patient'}`}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="appt-btn-action delete"
                                                    onClick={() => handleDeleteAppointment(appointment)}
                                                    title="Delete appointment"
                                                    aria-label={`Delete appointment of ${appointment.patient_name || 'patient'}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="appt-empty-row">
                                            No appointments scheduled for this date.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {activeModal && (
                <AppointmentModal
                    mode={activeModal.mode}
                    appointment={activeModal.appointment}
                    doctors={doctors}
                    onClose={() => setActiveModal(null)}
                    onSave={handleSaveAppointment}
                />
            )}
        </div>
    );
}
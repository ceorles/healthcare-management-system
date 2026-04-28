import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, ClipboardList } from 'lucide-react';
import '../../assets/css/Appointments.css';

export default function Appointments({ onAddNew }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [appointments, setAppointments] = useState([]);
    
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        fetchAppointments();
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('access');
            const res = await axios.get('http://127.0.0.1:8000/api/appointments/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(res.data);
        } catch (error) { console.error("Error fetching appointments:", error); }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('access');
            await axios.patch(`http://127.0.0.1:8000/api/appointments/${id}/`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAppointments(); 
        } catch (error) { alert("Failed to update status."); }
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; 
    };

    const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const formatDateStr = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const selectedDateStr = formatDateStr(selectedDate);
    const dailyAppointments = appointments.filter(app => app.appointment_date === selectedDateStr);

    return (
        <div>
            <div className="appt-page-header">
                <div className="appt-page-title"><CalendarIcon size={24}/> Appointment Calendar</div>
                <div className="appt-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="appointments-layout">
                
                {/* LEFT */}
                <div className="calendar-widget">
                    <div className="calendar-header">
                        <button onClick={prevMonth} className="calendar-nav-btn"><ChevronLeft size={20}/></button>
                        <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={nextMonth} className="calendar-nav-btn"><ChevronRight size={20}/></button>
                    </div>
                    
                    <div className="calendar-body">
                        <div className="calendar-days-header">
                            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                        </div>
                        <div className="calendar-grid">
                            {blanks.map((_, i) => <div key={`blank-${i}`} className="calendar-day empty"></div>)}
                            
                            {days.map(day => {
                                const thisDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                const isSelected = formatDateStr(thisDate) === selectedDateStr;
                                const hasApps = appointments.some(app => app.appointment_date === formatDateStr(thisDate));

                                return (
                                    <div 
                                        key={day} 
                                        className={`calendar-day ${isSelected ? 'active' : ''} ${hasApps && !isSelected ? 'has-appointment' : ''}`}
                                        onClick={() => setSelectedDate(thisDate)}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="queue-card">
                    <div className="queue-header">
                        <h3>Queue for {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric'})}</h3>
                        <button onClick={onAddNew} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={16}/> New Appointment
                        </button>
                    </div>

                    <table className="appt-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>PATIENT</th>
                                <th>TIME</th>
                                <th>TYPE</th>
                                <th>DOCTOR</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyAppointments.length > 0 ? dailyAppointments.map(app => (
                                <tr key={app.id}>
                                    <td><div className="queue-badge">{app.queue_number || '-'}</div></td>
                                    <td style={{ fontWeight: 600 }}>{app.patient_name || 'Unknown Patient'}</td>
                                    <td>{new Date(`2000-01-01T${app.appointment_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{app.appointment_type.replace('_', ' ')}</td>
                                    <td>{app.doctor_name || 'Unassigned'}</td>
                                    <td>
                                        <select 
                                            className="status-select" 
                                            value={app.status} 
                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        >
                                            <option value="scheduled">Scheduled</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="no_show">No Show</option>
                                        </select>
                                    </td>
                                    <td style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button className="appt-btn-action" title="View details"><ClipboardList size={16}/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                                        No appointments scheduled for this date.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
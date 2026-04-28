import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CalendarPlus, Clock, Search } from 'lucide-react';
import '../../assets/css/Appointments.css';

export default function NewAppointment({ onCancel, onSaveSuccess }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    // Data from Django
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);

    // SEARCH
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    
    const [doctorSearch, setDoctorSearch] = useState('');
    const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

    // FOR CLOSING THE DROPDOWN
    const patientRef = useRef(null);
    const doctorRef = useRef(null);

    const [formData, setFormData] = useState({
        patient: '', 
        doctor: '',  
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'consultation',
        reason: '',
        notes: ''
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        fetchDropdownData();

        // CLICK OUTSIDE TO CLOSE DROPDOWNS 
        const handleClickOutside = (event) => {
            if (patientRef.current && !patientRef.current.contains(event.target)) setShowPatientDropdown(false);
            if (doctorRef.current && !doctorRef.current.contains(event.target)) setShowDoctorDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            clearInterval(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem('access');
            const headers = { Authorization: `Bearer ${token}` };

            const patRes = await axios.get('http://127.0.0.1:8000/api/patients/', { headers });
            setPatients(patRes.data);

            const staffRes = await axios.get('http://127.0.0.1:8000/api/staff/', { headers });
            const onlyDoctors = staffRes.data.filter(staff => staff.role === 'DOCTOR' && staff.is_active);
            setDoctors(onlyDoctors);
        } catch (error) { console.error("Error fetching dropdown data:", error); }
    };

    const filteredPatients = patients.filter(p => 
        p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) || 
        p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
    );

    const filteredDoctors = doctors.filter(d => 
        (d.fullname || d.username).toLowerCase().includes(doctorSearch.toLowerCase())
    );

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.patient) { alert("Please select a valid Patient from the dropdown list."); return; }
        if (!formData.doctor) { alert("Please select a valid Doctor from the dropdown list."); return; }

        try {
            await axios.post('http://127.0.0.1:8000/api/appointments/', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            alert("Appointment Scheduled Successfully!");
            onSaveSuccess(); 
        } catch (error) {
            console.error(error);
            alert("Error scheduling appointment. Please check all fields.");
        }
    };

    return (
        <div>
            <div className="appt-page-header" style={{ padding: '24px 24px 0 24px' }}>
                <div className="appt-page-title"><CalendarPlus size={24}/> Schedule Appointment</div>
                <div className="appt-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <form onSubmit={handleSubmit} className="appt-form-container">
                <div className="appt-form-section" style={{ marginBottom: 0 }}>
                    <div className="appt-form-header">Appointment Details</div>
                    
                    <div className="appt-form-grid grid-cols-2">
                        
                        {/* PATIENT SEARCH */}
                        <div className="appt-input-group" ref={patientRef}>
                            <label>Patient</label>
                            <div className="appt-search-container">
                                <input 
                                    type="text" 
                                    className="appt-input" 
                                    placeholder="Patient Name or ID"
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setShowPatientDropdown(true);
                                        setFormData({...formData, patient: ''}); // CLEAR ID IF THEY TYPE A NEW NAME
                                    }}
                                    onFocus={() => setShowPatientDropdown(true)}
                                />
                                {showPatientDropdown && (
                                    <div className="appt-search-dropdown">
                                        {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                            <div 
                                                key={p.id} 
                                                className="appt-search-option"
                                                onClick={() => {
                                                    setFormData({...formData, patient: p.id});
                                                    setPatientSearch(`${p.full_name} (${p.patient_id})`);
                                                    setShowPatientDropdown(false);
                                                }}
                                            >
                                                <strong>{p.full_name}</strong> <span style={{color: 'gray', fontSize: '11px'}}>({p.patient_id})</span>
                                            </div>
                                        )) : (
                                            <div className="appt-search-option empty">No patients found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="appt-input-group" ref={doctorRef}>
                            <label>Doctor</label>
                            <div className="appt-search-container">
                                <input 
                                    type="text" 
                                    className="appt-input" 
                                    placeholder="Doctor"
                                    value={doctorSearch}
                                    onChange={(e) => {
                                        setDoctorSearch(e.target.value);
                                        setShowDoctorDropdown(true);
                                        setFormData({...formData, doctor: ''});
                                    }}
                                    onFocus={() => setShowDoctorDropdown(true)}
                                />
                                {showDoctorDropdown && (
                                    <div className="appt-search-dropdown">
                                        {filteredDoctors.length > 0 ? filteredDoctors.map(d => (
                                            <div 
                                                key={d.id} 
                                                className="appt-search-option"
                                                onClick={() => {
                                                    setFormData({...formData, doctor: d.id});
                                                    setDoctorSearch(`Dr. ${d.fullname || d.username}`);
                                                    setShowDoctorDropdown(false);
                                                }}
                                            >
                                                <strong>Dr. {d.fullname || d.username}</strong>
                                            </div>
                                        )) : (
                                            <div className="appt-search-option empty">No doctors found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Date & Time */}
                    <div className="appt-form-grid grid-cols-2">
                        <div className="appt-input-group">
                            <label>Date</label>
                            <input type="date" name="appointment_date" className="appt-input" required onChange={handleChange} value={formData.appointment_date} />
                        </div>
                        <div className="appt-input-group">
                            <label>Time</label>
                            <input type="time" name="appointment_time" className="appt-input" required onChange={handleChange} value={formData.appointment_time} />
                        </div>
                    </div>

                    {/* Row 3: Appointment Type */}
                    <div className="appt-form-grid grid-cols-1">
                        <div className="appt-input-group">
                            <label>Appointment Type</label>
                            <select name="appointment_type" className="appt-select" required onChange={handleChange} value={formData.appointment_type}>
                                <option value="consultation">Consultation</option>
                                <option value="follow_up">Follow-up</option>
                                <option value="check_up">Check-up</option>
                                <option value="vaccination">Vaccination</option>
                                <option value="prenatal">Prenatal</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="appt-form-grid grid-cols-1">
                        <div className="appt-input-group">
                            <label>Reason</label>
                            <textarea name="reason" className="appt-textarea" rows="2" onChange={handleChange} value={formData.reason}></textarea>
                        </div>
                    </div>

                    <div className="appt-form-grid grid-cols-1">
                        <div className="appt-input-group">
                            <label>Notes/Remarks</label>
                            <textarea name="notes" className="appt-textarea" rows="2" onChange={handleChange} value={formData.notes}></textarea>
                        </div>
                    </div>
                </div>

                <div className="appt-form-actions">
                    <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: '10px 20px', border: '1px solid var(--border)', color: 'var(--text)' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>Save Appointment</button>
                </div>
            </form>
        </div>
    );
}
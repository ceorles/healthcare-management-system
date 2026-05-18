import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, ChevronLeft } from 'lucide-react';
import { buildPatientFormFromWalkinPrefill } from '../../utils/patientPrefill.js';
import '../../assets/css/Patients.css';

const EMPTY_FORM = {
    first_name: '', last_name: '', middle_name: '',
    date_of_birth: '', sex: 'M', civil_status: 'single',
    contact_number: '', blood_type: '', address: '', barangay: 'Poblacion 1',
    guardian_name: '', guardian_contact_info: '',
    emergency_contact_name: '', emergency_contact_number: '',
    philhealth_number: '', allergies: '',
};

const BARANGAYS = [
    'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4', 'Poblacion 5', 'Poblacion 6',
    'Antipolo', 'Balubal', 'Bignay 1', 'Bignay 2', 'Bucal', 'Canda', 'Castañas', 
    'Concepcion 1', 'Concepcion Banahaw', 'Concepcion Palasan', 'Concepcion Pinagbukuran', 
    'Gibanga', 'Guisguis San Roque', 'Guisguis Talon', 'Janagdong 1', 'Janagdong 2', 
    'Limbon', 'Lutucan 1', 'Lutucan Bata', 'Lutucan Malabag', 'Mamala 1', 'Mamala 2', 
    'Manggalang 1', 'Manggalang Bantilan', 'Manggalang Kiling', 'Manggalang Tulo-Tulo', 
    'Montecillo', 'Morong', 'Pili', 'Sampaloc 1', 'Sampaloc 2', 'Sampaloc Bogon', 
    'Sto. Cristo', 'Talaan Aplaya', 'Talaan Pantoc', 'Tumbaga 1', 'Tumbaga 2'
];

export default function NewPatient({ onCancel, onSaveSuccess, prefill = null }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const [formData, setFormData] = useState(() => {
        const fromPrefill = buildPatientFormFromWalkinPrefill(prefill);
        return fromPrefill ? { ...EMPTY_FORM, ...fromPrefill } : { ...EMPTY_FORM };
    });

    useEffect(() => {
        const fromPrefill = buildPatientFormFromWalkinPrefill(prefill);
        if (fromPrefill) {
            setFormData((prev) => ({ ...prev, ...fromPrefill }));
        }
    }, [prefill]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
        return age;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:8000/api/patients/', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            alert("Patient Saved Successfully!");
            onSaveSuccess();
        } catch (error) {
            if (error.response && error.response.data) {
                const errorDetails = Object.entries(error.response.data)
                    .map(([field, messages]) => `${field.toUpperCase()}: ${messages}`)
                    .join('\n');
                alert(`DJANGO REJECTED IT:\n\n${errorDetails}`);
            } else {
                alert("Network Error: Is the Django server running?");
            }
            console.error("Full error:", error);
        }
    };

    return (
        <div className="patient-form-page">
            <div className="page-header page-header--form">
                <div className="page-title-row">
                    <button type="button" className="btn-back-form" onClick={onCancel} aria-label="Go back to patient list">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="page-title">New Patient</h1>
                </div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <form onSubmit={handleSubmit} className="patient-form">

                {prefill?.referral_code && (
                    <p className="patient-qr-prefill-banner">
                        Walk-in from referral <strong>{prefill.referral_code}</strong> — complete the record below. A new patient will be created (no duplicate).
                    </p>
                )}

                <div className="form-card">
                    <div className="form-section-header">Personal Information</div>
                    
                    <div className="form-grid grid-3">
                        <div className="input-group"><label>Last Name</label><input type="text" name="last_name" className="form-input" required value={formData.last_name} onChange={handleChange} /></div>
                        <div className="input-group"><label>First Name</label><input type="text" name="first_name" className="form-input" required value={formData.first_name} onChange={handleChange} /></div>
                        <div className="input-group"><label>Middle Name</label><input type="text" name="middle_name" className="form-input" value={formData.middle_name} onChange={handleChange} /></div>
                    </div>

                    <div className="form-grid grid-4">
                        <div className="input-group"><label>Date of Birth</label><input type="date" name="date_of_birth" className="form-input" required value={formData.date_of_birth} onChange={handleChange} /></div>
                        <div className="input-group"><label>Age</label><input type="text" className="form-input" disabled value={calculateAge(formData.date_of_birth)} /></div>
                        <div className="input-group"><label>Sex</label>
                            <select name="sex" className="form-input" onChange={handleChange} value={formData.sex}>
                                <option value="M">Male</option><option value="F">Female</option>
                            </select>
                        </div>
                        <div className="input-group"><label>Civil Status</label>
                            <select name="civil_status" className="form-input" onChange={handleChange} value={formData.civil_status}>
                                <option value="single">Single</option><option value="married">Married</option><option value="widowed">Widowed</option><option value="separated">Separated</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Contact Number</label><input type="text" name="contact_number" className="form-input" value={formData.contact_number} onChange={handleChange} /></div>
                        <div className="input-group"><label>Blood Type</label><input type="text" name="blood_type" className="form-input" value={formData.blood_type} onChange={handleChange} /></div>
                    </div>

                    <div className="form-grid grid-2-address form-grid--last">
                        <div className="input-group"><label>Address</label><input type="text" name="address" className="form-input" placeholder="City / Street / House & Lot no." value={formData.address} onChange={handleChange} /></div>
                        <div className="input-group"><label>Barangay</label>
                            <select name="barangay" className="form-input" onChange={handleChange} value={formData.barangay}>
                                {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-card">
                    <div className="form-section-header">Medical & Emergency Info</div>
                    
                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Guardian&apos;s Name</label><input type="text" name="guardian_name" className="form-input" value={formData.guardian_name} onChange={handleChange} /></div>
                        <div className="input-group"><label>Guardian&apos;s Contact Info</label><input type="text" name="guardian_contact_info" className="form-input" value={formData.guardian_contact_info} onChange={handleChange} /></div>
                    </div>

                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Emergency Contact Name</label><input type="text" name="emergency_contact_name" className="form-input" value={formData.emergency_contact_name} onChange={handleChange} /></div>
                        <div className="input-group"><label>Emergency Contact Number</label><input type="text" name="emergency_contact_number" className="form-input" value={formData.emergency_contact_number} onChange={handleChange} /></div>
                    </div>

                    <div className="form-grid grid-2 form-grid--last">
                        <div className="input-group"><label>PhilHealth Number</label><input type="text" name="philhealth_number" className="form-input" value={formData.philhealth_number} onChange={handleChange} /></div>
                        <div className="input-group"><label>Known Allergies</label><input type="text" name="allergies" className="form-input" value={formData.allergies} onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="form-actions form-actions--standalone">
                    <button type="button" onClick={onCancel} className="btn-secondary btn-form-cancel">Cancel</button>
                    <button type="submit" className="btn-primary btn-form-save">Save Patient Record</button>
                </div>
            </form>
        </div>
    );
}

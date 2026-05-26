import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Clock } from 'lucide-react';
import '../../assets/css/Patients.css';
import { BARANGAYS, roleRequiresBarangay } from '../../constants/barangays.js';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '../../utils/patientForm.js';

export default function NewStaffAccount({ onCancel, onSaveSuccess }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    const [formData, setFormData] = useState({
        username: '', fullname: '', email: '', phone_number: '',
        role: 'NURSE', barangay: 'Poblacion 1', password: ''
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'phone_number' ? formatPhoneNumber(value) : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalData = { ...formData };
        if (!roleRequiresBarangay(finalData.role)) {
            finalData.barangay = '';
        }

        if (!isValidPhoneNumber(finalData.phone_number)) {
            alert('Phone number must be 11 digits, start with 0, and follow this format: 09XX-XXX-XXXX');
            return;
        }

        finalData.phone_number = normalizePhoneNumber(finalData.phone_number);
        finalData.confirm_password = finalData.password;

        try {
            // Notice we use the /users/register/ endpoint for brand new accounts!
            const response = await axios.post('http://127.0.0.1:8000/api/users/register/', finalData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            alert(response.data?.message || 'Staff account created and verified successfully!');
            onSaveSuccess(); 
        } catch (error) {
            if (error.response && error.response.data) {
                const errorDetails = Object.entries(error.response.data).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n');
                alert(`Failed to create account:\n\n${errorDetails}`);
            } else {
                alert("Error saving staff account.");
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title"><UserPlus size={24}/> Create New User</div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-section" style={{ marginBottom: 0 }}>
                    <div className="form-section-header">User Account Details</div>
                    
                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Username</label><input type="text" name="username" className="form-input" required onChange={handleChange} /></div>
                        <div className="input-group"><label>Full Name</label><input type="text" name="fullname" className="form-input" required onChange={handleChange} /></div>
                    </div>

                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Email</label><input type="email" name="email" className="form-input" required onChange={handleChange} /></div>
                        <div className="input-group"><label>Phone Number</label><input type="text" name="phone_number" className="form-input" placeholder="09XX-XXX-XXXX" maxLength="13" value={formData.phone_number} onChange={handleChange} /></div>
                    </div>

                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Role</label>
                            <select name="role" className="form-input" onChange={handleChange} value={formData.role}>
                                <option value="ADMIN">Admin</option>
                                <option value="DOCTOR">Doctor</option>
                                <option value="NURSE">Nurse</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>
                        
                        {roleRequiresBarangay(formData.role) ? (
                            <div className="input-group"><label>Barangay</label>
                                <select name="barangay" className="form-input" onChange={handleChange} value={formData.barangay} required>
                                    {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        ) : <div />}
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="input-group"><label>Password</label><input type="password" name="password" className="form-input" required minLength="8" onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: '10px 20px', border: '1px solid var(--border)', color: 'var(--text)' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>Save User</button>
                </div>
            </form>
        </div>
    );
}
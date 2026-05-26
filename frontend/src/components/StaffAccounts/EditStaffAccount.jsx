import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCog, Clock } from 'lucide-react';
import '../../assets/css/Patients.css';
import { BARANGAYS, roleRequiresBarangay } from '../../constants/barangays.js';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '../../utils/patientForm.js';

export default function EditStaffAccount({ staff, onCancel, onSaveSuccess }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    // Initialize with selected staff data
    const [formData, setFormData] = useState({
        username: staff.username || '', fullname: staff.fullname || '', email: staff.email || '', 
        phone_number: formatPhoneNumber(staff.phone_number), role: staff.role || 'NURSE', barangay: staff.barangay || 'Poblacion 1',
        is_active: staff.is_active !== undefined ? staff.is_active : true
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: e.target.name === 'phone_number' ? formatPhoneNumber(value) : value,
        });
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

        try {
            await axios.put(`http://127.0.0.1:8000/api/staff/${staff.id}/`, finalData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            alert("Staff Account Updated Successfully!");
            onSaveSuccess();
        } catch (error) { alert("Error updating account."); console.error(error); }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title"><UserCog size={24}/> Edit User</div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-section" style={{ marginBottom: 0 }}>
                    <div className="form-section-header">Staff Account Details</div>
                    
                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Username</label><input type="text" name="username" className="form-input" required value={formData.username} onChange={handleChange} /></div>
                        <div className="input-group"><label>Full Name</label><input type="text" name="fullname" className="form-input" required value={formData.fullname} onChange={handleChange} /></div>
                    </div>

                    <div className="form-grid grid-2">
                        <div className="input-group"><label>Email</label><input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} /></div>
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

                    {/* Account Status Toggle */}
                    <div className="form-grid grid-2" style={{ marginTop: '20px' }}>
                        <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: '18px', height: '18px' }}/>
                            <label style={{ margin: 0, fontSize: '14px' }}>Account is Active (Can log in)</label>
                        </div>
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
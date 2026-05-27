import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../assets/css/Register.css";
import logo from "../assets/images/smhc_logo.png";
import { BARANGAYS, roleRequiresBarangay } from '../constants/barangays.js';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '../utils/patientForm.js';

function Register() {
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        phone_number: '',
        role: 'NURSE', // DEFAULT ROLE
        barangay: '',
        password: '',
        confirm_password: '',
    });
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false); 
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'phone_number' ? formatPhoneNumber(value) : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 

        if (formData.password !== formData.confirm_password) {
            setIsError(true);
            setMessage("Error: Passwords do not match!");
            return;
        }

        if (!isValidPhoneNumber(formData.phone_number, true)) {
            setIsError(true);
            setMessage('Error: Phone number must be 11 digits, start with 0, and follow this format: 09XX-XXX-XXXX');
            return;
        }

        try {
            const payload = {
                ...formData,
                phone_number: normalizePhoneNumber(formData.phone_number),
            };
            const response = await axios.post('http://127.0.0.1:8000/api/users/register/', payload);
            setIsError(false);
            setMessage(
                response.data?.message
                || 'Registration submitted! Your account is pending admin verification. You can log in after approval.'
            );
        } catch (error) {
            if (error.response && error.response.data) {
                const data = error.response.data;
                const backendErrors = data.message
                    || Object.values(data).flat().join(', ');
                setMessage(`Error: ${backendErrors}`);
            } else {
                setMessage("Network Error: Is the Django server running?");
            }
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
            <img src={logo} alt="Logo" className="register-logo" />
            <h2 className="register-title">Create Your Account</h2>
            <p className="register-subtitle">Sariaya Municipal Health Center - Staff Registration</p>

            {message && (
                <div className={`register-message ${isError ? "error" : "success"}`}>
                {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
                <div className="register-field">
                <label className="register-label">Full Name</label>
                <input type="text" name="fullname" placeholder="Full Name (e.g., Juan Dela Cruz)" className="register-input" onChange={handleChange} required/>
                </div>

                <div className="register-field">
                <label className="register-label">Username</label>
                <input type="text" name="username" placeholder="Username" className="register-input" onChange={handleChange} required/>
                </div>

                <div className="register-row">
                    <div className="register-field">
                        <label className="register-label">Email</label>
                        <input type="email" name="email" placeholder="Email" className="register-input" onChange={handleChange} required/>
                    </div>

                    <div className="register-field">
                        <label className="register-label">Phone Number</label>
                        <input type="text" name="phone_number" placeholder="09XX-XXX-XXXX" className="register-input" maxLength="13" value={formData.phone_number} onChange={handleChange} required/>
                    </div>
                </div>

                <div className="register-row">
                    <div className="register-field">
                        <label className="register-label">Role</label>
                        <select
                        name="role"
                        className="register-select"
                        value={formData.role}
                        onChange={handleChange}
                        >
                        <option value="DOCTOR">Doctor</option>
                        <option value="NURSE">Nurse</option>
                        <option value="STAFF">Staff</option>
                        </select>
                    </div>

                    {roleRequiresBarangay(formData.role) && (
                        <div className="register-field">
                        <label className="register-label">Barangay</label>
                        <select name="barangay" className="register-select" value={formData.barangay} onChange={handleChange} required>
                            <option value="">Select Barangay...</option>
                            {BARANGAYS.map((brgy) => (
                            <option key={brgy} value={brgy}>{brgy}</option>
                            ))}
                        </select>
                        </div>
                    )}
                </div>

                <div className="register-field">
                <label className="register-label">Password</label>
                <input type="password" name="password" placeholder="Password" className="register-input" onChange={handleChange} required/>
                </div>

                <div className="register-field">
                <label className="register-label">Confirm Password</label>
                <input type="password" name="confirm_password"  placeholder="Confirm Password" className="register-input" onChange={handleChange} required/>
                </div>

                <button type="submit" className="register-btn">Sign Up</button>
            </form>

            <p className="register-footer">Already have an account?? <a href="/login">Sign In</a></p>
            </div>
        </div>
    );
}

export default Register;
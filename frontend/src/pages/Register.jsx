import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../assets/css/Register.css";
import logo from "../assets/images/smhc_logo.png"

const BARANGAYS = [
    'Poblacion 1', 'Poblacion 2',
    'Poblacion 3', 'Poblacion 4',
    'Poblacion 5', 'Poblacion 6',
    'Antipolo', 'Balubal',
    'Bignay 1', 'Bignay 2',
    'Bucal', 'Canda',
    'Castañas', 'Concepcion 1',
    'Concepcion Banahaw', 'Concepcion Palasan',
    'Concepcion Pinagbukuran', 'Gibanga',
    'Guisguis San Roque', 'Guisguis Talon',
    'Janagdong 1', 'Janagdong 2', 
    'Limbon', 'Lutucan 1',
    'Lutucan Bata', 'Lutucan Malabag',
    'Mamala 1', 'Mamala 2', 
    'Manggalang 1', 'Manggalang Bantilan',
    'Manggalang Kiling', 'Manggalang Tulo-Tulo', 
    'Montecillo', 'Morong',
    'Pili', 'Sampaloc 1',
    'Sampaloc 2', 'Sampaloc Bogon', 
    'Sto. Cristo', 'Talaan Aplaya',
    'Talaan Pantoc', 'Tumbaga 1', 'Tumbaga 2'
];

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 

        if (formData.password !== formData.confirm_password) {
            setIsError(true);
            setMessage("Error: Passwords do not match!");
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/users/register/', formData);
            setIsError(false);
            setMessage("Registration successful! Redirecting to login...");
            setTimeout(() => navigate('/login'), 2000); 
        } catch (error) {
            if (error.response && error.response.data) {
                const backendErrors = Object.values(error.response.data).join(', ');
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
            <p className="register-subtitle">Register to continue</p>

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
                        <input type="text" name="phone_number" placeholder="09xx-xxx-xxxx" className="register-input" onChange={handleChange} required/>
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
                        <option value="ADMIN">Admin</option>
                        <option value="DOCTOR">Doctor</option>
                        <option value="NURSE">Nurse</option>
                        </select>
                    </div>

                    {formData.role === 'NURSE' && (
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

                <button type="submit" className="register-btn">Register</button>
            </form>

            <p className="register-footer">Already have an account? <a href="/login">Login here</a></p>
            </div>
        </div>
    );
}

export default Register;
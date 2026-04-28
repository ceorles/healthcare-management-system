import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
        <div>
            <h2>Register for Sariaya Health System</h2>
            {message && <p>{message}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" name="fullname" placeholder="Full Name (e.g., Juan Dela Cruz)" onChange={handleChange} required />
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="text" name="phone_number" placeholder="09xx-xxx-xxxx" onChange={handleChange} required />
                
                <select name="role" onChange={handleChange} value={formData.role}>
                    <option value="ADMIN">Admin</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                </select>

                {formData.role === 'NURSE' && (
                    <select name="barangay" onChange={handleChange} value={formData.barangay} required>
                        <option value="">Select Barangay...</option>
                        
                        {/* LOOP OF 43 BARANGAYS */}
                        {BARANGAYS.map((brgy) => (
                            <option key={brgy} value={brgy}>
                                {brgy}
                            </option>
                        ))}
                        
                    </select>
                )}

                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <input type="password" name="confirm_password" placeholder="Confirm Password" onChange={handleChange} required />

                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
    );
}

export default Register;
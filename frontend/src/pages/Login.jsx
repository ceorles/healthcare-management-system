import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../assets/css/Login.css";
import logo from '../assets/images/smhc_logo.png'

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // SEND REQUEST TO DJANGO
            const response = await axios.post('http://127.0.0.1:8000/api/login/', {
                username: username,
                password: password
            });

            // IKAPAG SUCCESSFUL, S-SAVE YUNG TOKEN
            const accessToken = response.data.access;
            localStorage.setItem('access', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);

            // FETCHING PROFILE TO GET ROLE
            const profileResponse = await axios.get('http://127.0.0.1:8000/api/users/profile/', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            // GET THE ROLE FROM RESPONSE
            const userRole = profileResponse.data.role;

            // REDIRECT BASED ON ROLE
            if (userRole === 'ADMIN') {
                navigate('/admin');
            } else if (userRole === 'DOCTOR') {
                navigate('/doctor');
            } else if (userRole === 'NURSE') {
                navigate('/nurse');
            } else if (userRole === 'STAFF') {
                navigate('/staff');
            } else {
                alert("Unknown role!");
            }
            
        } catch (err) {
            const data = err.response?.data;
            const detail = data?.detail || data?.non_field_errors?.[0];
            if (detail) {
                setError(typeof detail === 'string' ? detail : detail[0]);
            } else if (err.response && err.response.status === 401) {
                setError("Incorrect username or password. Please try again.");
            } else if (err.message === "Network Error") {
                setError("Cannot connect to server. Is Django running on port 8000?");
            } else {
                setError(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
            <img src={logo} alt="Logo" className="login-logo" />

            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Login to continue your account</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">

                <div className="login-field">
                <label className="login-label">Username</label>
                <input 
                    type="text"
                    className="login-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                </div>

                <div className="login-field">
                <label className="login-label">Password</label>
                <input 
                    type="password"
                    className="login-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                </div>
                <button type="submit" className="login-btn">Login</button>
            </form>
            <p className="login-footer">Don't have an account? <a href="/register">Register here</a></p>
            </div>
        </div>
    );
}

export default Login;
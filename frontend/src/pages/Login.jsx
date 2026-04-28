import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Send login request to Django
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
            } else {
                alert("Unknown role!");
            }
            
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("Incorrect username or password. Please try again.");
            } else if (err.message === "Network Error") {
                setError("Cannot connect to server. Is Django running on port 8000?");
            } else {
                setError(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div>
            <h2>Login to Sariaya Health System</h2>
            {error && <p>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
    );
}

export default Login;
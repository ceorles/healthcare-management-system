import { useNavigate } from 'react-router-dom';

function Doctor() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Doctor Dashboard</h1>
            <p>Welcome to the Sariaya Health System Admin Panel.</p>
            <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px', background: 'red', color: 'white' }}>
                Logout
            </button>
        </div>
    );
}

export default Doctor;
import { useNavigate } from 'react-router-dom';

function Admin() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>TANGGAL NA SI ELVIRA</h1>
            <p>TANGGAL NA SI ELVIRA</p>
            <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px', background: 'red', color: 'white' }}>
                Logout
            </button>
        </div>
    );
}

export default Admin;
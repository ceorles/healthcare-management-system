import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar.jsx';
import '../assets/css/Dashboard.css';

const API = 'http://127.0.0.1:8000/api/users';

export default function DashboardLayout({
    SidebarComponent = AdminSidebar,
    title = 'Admin',
    allowedRoles = [],
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [authState, setAuthState] = useState({
        loading: allowedRoles.length > 0,
        allowed: allowedRoles.length === 0,
        user: null,
    });

    useEffect(() => {
        if (allowedRoles.length === 0) return;

        const token = localStorage.getItem('access');
        if (!token) {
            queueMicrotask(() => setAuthState({ loading: false, allowed: false, user: null }));
            return;
        }

        axios.get(`${API}/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(({ data }) => {
                setAuthState({
                    loading: false,
                    allowed: allowedRoles.includes(data.role),
                    user: data,
                });
            })
            .catch(() => {
                setAuthState({ loading: false, allowed: false, user: null });
            });
    }, [allowedRoles]);

    if (authState.loading) return null;
    if (!authState.allowed) return <Navigate to="/login" replace />;

    return (
        <div className="dashboard-wrapper">
            
            {/* MOBILE TOP HEADER (Only shows on small screens) */}
            <div className="dashboard-mobile-header">
                <h3>{title}</h3>
                <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
            </div>

            {/* MOBILE OVERLAY (Clicking outside the sidebar closes it) */}
            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* THE SIDEBAR */}
            <SidebarComponent
                isOpen={isSidebarOpen}
                currentUser={authState.user}
                onNavigate={() => setIsSidebarOpen(false)}
            />

            {/* MAIN CONTENT AREA */}
            <main className="dashboard-content">
                <Outlet /> 
            </main>
            
        </div>
    );
}
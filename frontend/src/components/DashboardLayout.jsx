import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './AdminSidebar.jsx';
import '../assets/css/Dashboard.css';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Automatically close sidebar when the user clicks a link on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    return (
        <div className="dashboard-wrapper">
            
            {/* MOBILE TOP HEADER (Only shows on small screens) */}
            <div className="dashboard-mobile-header">
                <h3>Admin</h3>
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
            <Sidebar isOpen={isSidebarOpen} />

            {/* MAIN CONTENT AREA */}
            <main className="dashboard-content">
                <Outlet /> 
            </main>
            
        </div>
    );
}
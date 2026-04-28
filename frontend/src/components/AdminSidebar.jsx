import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, User, Users, Shield, Calendar, 
    FileText, Folder, MapPin, BarChart3, LogOut 
} from 'lucide-react';

export default function AdminSidebar({ isOpen }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    return (
        <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
            
            <div className="sidebar-header">
                <div className="sidebar-logo">MH</div>
                <h4 style={{ margin: 0, fontWeight: 600 }}>Admin Panel</h4>
            </div>

            <nav className="sidebar-nav">
                
                {/* --- ADMINISTRATION --- */}
                <div className="sidebar-divider">Administration</div>
                <NavLink to="/admin" end className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={18}/> Dashboard
                </NavLink>

                {/* --- MANAGEMENT --- */}
                <div className="sidebar-divider">Management</div>
                <NavLink to="/admin/patients" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <User size={18}/> Patients
                </NavLink>
                <NavLink to="/admin/staff" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Users size={18}/> Staff Accounts
                </NavLink>
                <NavLink to="/admin/audit-logs" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Shield size={18}/> Audit Logs
                </NavLink>
                <NavLink to="/admin/appointments" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Calendar size={18}/> Appointments
                </NavLink>
                <NavLink to="/admin/referrals" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <FileText size={18}/> Referrals
                </NavLink>
                <NavLink to="/admin/programs" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Folder size={18}/> Programs
                </NavLink>

                {/* --- ANALYTICS --- */}
                <div className="sidebar-divider">Analytics</div>
                <NavLink to="/admin/map" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <MapPin size={18}/> GIS Map
                </NavLink>
                <NavLink to="/admin/reports" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <BarChart3 size={18}/> Reports & Analytics
                </NavLink>

            </nav>

            <button onClick={handleLogout} className="sidebar-logout">
                <LogOut size={18} /> Logout
            </button>
            
        </aside>
    );
}
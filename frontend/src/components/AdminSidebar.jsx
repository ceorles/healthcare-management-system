import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LayoutDashboard, User, Users, Shield,
    FileText, Folder, MapPin, BarChart3, LogOut,
    Settings, Calendar
} from 'lucide-react';
import logo from '../assets/images/smhc_logo.png';

const API = 'http://127.0.0.1:8000/api/users';

const SIDEBAR_SECTIONS = {
    admin: [
        {
            label: 'Administration',
            items: [
                { to: '/admin', end: true, label: 'Dashboard', Icon: LayoutDashboard },
            ],
        },
        {
            label: 'Management',
            items: [
                { to: '/admin/patients', label: 'Patients', Icon: User },
                { to: '/admin/staff', label: 'Staff Accounts', Icon: Users },
                { to: '/admin/audit-logs', label: 'Audit Logs', Icon: Shield },
                { to: '/admin/appointments', label: 'Appointments', Icon: Calendar },
                { to: '/admin/referrals', label: 'Referrals', Icon: FileText },
                { to: '/admin/programs', label: 'Programs', Icon: Folder },
            ],
        },
        {
            label: 'Analytics',
            items: [
                { to: '/admin/map', label: 'GIS Map', Icon: MapPin },
                { to: '/admin/reports', label: 'Reports & Analytics', Icon: BarChart3 },
            ],
        },
        {
            label: 'Account',
            items: [
                { to: '/admin/settings', label: 'Settings', Icon: Settings },
            ],
        },
    ],
    doctor: [
        {
            label: 'Doctor',
            items: [
                { to: '/doctor', end: true, label: 'Dashboard', Icon: LayoutDashboard },
            ],
        },
        {
            label: 'Management',
            items: [
                { to: '/doctor/patients', label: 'Patients', Icon: User },
                { to: '/doctor/referrals', label: 'Referrals', Icon: FileText },
            ],
        },
        {
            label: 'Account',
            items: [
                { to: '/doctor/settings', label: 'Settings', Icon: Settings },
            ],
        },
    ],
    nurse: [
        {
            label: 'Nurse',
            items: [
                { to: '/nurse', end: true, label: 'Dashboard', Icon: LayoutDashboard },
            ],
        },
        {
            label: 'Management',
            items: [
                { to: '/nurse/patients', label: 'Patients', Icon: User },
                { to: '/nurse/referrals', label: 'Referrals', Icon: FileText },
            ],
        },
        {
            label: 'Account',
            items: [
                { to: '/nurse/settings', label: 'Settings', Icon: Settings },
            ],
        },
    ],
    staff: [
        {
            label: 'Staff',
            items: [
                { to: '/staff', end: true, label: 'Dashboard', Icon: LayoutDashboard },
            ],
        },
        {
            label: 'Management',
            items: [
                { to: '/staff/patients', label: 'Patients', Icon: User },
                { to: '/staff/referrals', label: 'Referrals', Icon: FileText },
            ],
        },
        {
            label: 'Account',
            items: [
                { to: '/staff/settings', label: 'Settings', Icon: Settings },
            ],
        },
    ],
};

function getDisplayName(user) {
    if (!user) return 'Admin';
    const first = (user.first_name || '').trim();
    const last = (user.last_name || '').trim();
    if (first || last) return `${first} ${last}`.trim();
    return user.fullname || user.username || 'Admin';
}

function getRoleLabel(role) {
    if (!role) return 'Admin';
    return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function AdminSidebar({ isOpen, variant = 'admin', currentUser = null, onNavigate }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(currentUser);
    const sections = SIDEBAR_SECTIONS[variant] || SIDEBAR_SECTIONS.admin;

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
            return;
        }

        const token = localStorage.getItem('access');
        if (!token) return;

        axios.get(`${API}/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(({ data }) => setUser(data))
            .catch(() => setUser(null));
    }, [currentUser]);

    const handleLogout = async () => {
        const token = localStorage.getItem('access');
        if (token) {
            try {
                await axios.post(`${API}/logout/`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (error) {
                console.error('Logout audit failed:', error);
            }
        }
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    return (
        <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>

            <div className="sidebar-header">
                <img src={logo} alt="Sariaya MHC Logo" className="sidebar-logo-img" />
                <div className="sidebar-brand-text">
                    <h4>Sariaya MHC</h4>
                    <span>Municipal Health Center</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {sections.map((section) => (
                    <div className="sidebar-section" key={section.label}>
                        <div className="sidebar-divider">{section.label}</div>
                        {section.items.map(({ to, end, label, Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                onClick={onNavigate}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} /> {label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-user-section">
                <div className="sidebar-user-info">
                    <span className="sidebar-user-name">{getDisplayName(user)}</span>
                    <span className="sidebar-user-meta">{getRoleLabel(user?.role) || user?.username}</span>
                </div>
                <button onClick={handleLogout} className="sidebar-logout">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>

        </aside>
    );
}
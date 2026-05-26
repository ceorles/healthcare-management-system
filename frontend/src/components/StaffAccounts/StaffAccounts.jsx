import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import '../../assets/css/Patients.css';
import '../../assets/css/StaffAccounts.css';

export default function StaffAccounts({ onAddNew, onView, onEdit, onDelete }) {
    const [staff, setStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All Roles');
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        fetchStaff();
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('access');
            const response = await axios.get('http://127.0.0.1:8000/api/staff/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching staff:", error);
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredStaff = staff.filter(s => {
        const searchString = `${s.fullname} ${s.username} ${s.email} ${s.phone_number} ${s.barangay}`.toLowerCase();
        const matchesSearch = searchString.includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'All Roles' || s.role === filterRole.toUpperCase();
        return matchesSearch && matchesRole;
    });

    // Helper function for colored Role Badges
    const getRoleBadge = (role) => {
        switch(role) {
            case 'ADMIN': return <span style={{ background: '#f3e8ff', color: '#a855f7', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Admin</span>;
            case 'DOCTOR': return <span style={{ background: '#dbeafe', color: '#3b82f6', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Doctor</span>;
            case 'NURSE': return <span style={{ background: '#fce7f3', color: '#ec4899', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Nurse</span>;
            case 'STAFF': return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Staff</span>;
            default: return <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>{role}</span>;
        }
    };

    const getVerificationBadge = (status) => {
        const key = (status || 'PENDING').toLowerCase();
        const label = status === 'VERIFIED' ? 'Verified' : status === 'REJECTED' ? 'Rejected' : 'Pending';
        return <span className={`verification-badge ${key}`}>{label}</span>;
    };

    const handleVerify = async (staffId) => {
        if (!window.confirm('Verify this account? The user will be able to log in.')) return;
        try {
            const token = localStorage.getItem('access');
            await axios.post(`http://127.0.0.1:8000/api/staff/${staffId}/verify/`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchStaff();
        } catch (error) {
            console.error('Verify failed:', error);
            alert(error.response?.data?.detail || 'Could not verify account.');
        }
    };

    const handleReject = async (staffId) => {
        const reason = window.prompt('Rejection reason (optional):', '');
        if (reason === null) return;
        try {
            const token = localStorage.getItem('access');
            await axios.post(`http://127.0.0.1:8000/api/staff/${staffId}/reject/`, { reason }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchStaff();
        } catch (error) {
            console.error('Reject failed:', error);
            alert(error.response?.data?.detail || 'Could not reject account.');
        }
    };

    return (
        <div className="staff-accounts-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '80vh' }}>
            
            {/* Header */}
            <div className="page-header" style={{ padding: '24px 24px 0 24px' }}>
                <div className="page-title"><Users size={24}/> Staff Accounts</div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar staff-accounts-filter-bar" style={{ padding: '20px 24px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
                <div className="filter-group" style={{ flex: 1.5 }}>
                    <label>Search Staff</label>
                    <div className="search-wrapper">
                        <Search size={16} className="search-icon" />
                        <input type="text" className="search-input" placeholder="Name, username, email, phone, barangay..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="filter-group">
                    <label>Filter by Role</label>
                    <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                        <option value="All Roles">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Doctor">Doctor</option>
                        <option value="Nurse">Nurse</option>
                        <option value="Staff">Staff</option>
                    </select>
                </div>
                <button className="btn-filter" style={{ background: '#3b82f6' }}><Filter size={16}/> Filter</button>
            </div>

            {/* Table Header */}
            <div className="table-header-row staff-accounts-table-header" style={{ borderLeft: 'none', borderRight: 'none' }}>
                <h3>All Staff ({filteredStaff.length})</h3>
                <button onClick={onAddNew} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--green)' }}>
                    <Plus size={16} /> New Staff
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '50px' }}>Loading staff accounts...</p>
            ) : (
                <div className="staff-records-scroll" style={{ overflowX: 'auto' }}>
                    <table className="patient-table" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
                        <thead>
                            <tr>
                                <th>NAME</th>
                                <th>USERNAME</th>
                                <th>ROLE</th>
                                <th>BARANGAY</th>
                                <th>PHONE</th>
                                <th>VERIFICATION</th>
                                <th>ACCOUNT</th>
                                <th style={{ textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.length > 0 ? filteredStaff.map(s => (
                                <tr key={s.id} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{s.fullname || 'N/A'}</td>
                                    <td style={{ color: 'var(--text)' }}>@{s.username}</td>
                                    <td>{getRoleBadge(s.role)}</td>
                                    <td>{s.barangay || '-----'}</td>
                                    <td>{s.phone_number || '-----'}</td>
                                    <td>{getVerificationBadge(s.verification_status)}</td>
                                    <td>
                                        <span style={{ 
                                            background: s.is_active ? '#dcfce7' : '#fee2e2', 
                                            color: s.is_active ? '#166534' : '#991b1b', 
                                            padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' 
                                        }}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="staff-action-btns">
                                            {s.verification_status === 'PENDING' && (
                                                <>
                                                    <button type="button" className="btn-action verify" title="Verify" onClick={() => handleVerify(s.id)}><CheckCircle size={16}/></button>
                                                    <button type="button" className="btn-action reject-account" title="Reject" onClick={() => handleReject(s.id)}><XCircle size={16}/></button>
                                                </>
                                            )}
                                            <button type="button" className="btn-action view" onClick={() => onView(s)} title="View"><Eye size={16}/></button>
                                            <button type="button" className="btn-action edit" onClick={() => onEdit(s)} title="Edit"><Edit size={16}/></button>
                                            <button type="button" className="btn-action delete" onClick={() => onDelete(s)} title="Delete"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No staff accounts found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
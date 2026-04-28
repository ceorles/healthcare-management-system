import { useState, useEffect } from 'react';
import { Users, Clock } from 'lucide-react';
import '../../assets/css/StaffAccounts.css';

export default function ViewStaffAccount({ staff, onBack, onEdit }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    // INITIALS FOR PFP
    const getInitials = (name, username) => {
        if (name) {
            const parts = name.split(' ');
            return `${parts[0][0]}${parts.length > 1 ? parts[parts.length-1][0] : ''}`.toUpperCase();
        }
        return username ? username[0].toUpperCase() : 'U';
    };

    // DATE FORMAT
    const formatDate = (dateString) => {
        if (!dateString) return '-----';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-----';
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div>
            <div className="staff-page-header" style={{ padding: '24px 24px 0 24px' }}>
                <div className="staff-page-title">
                    <Users size={24}/> Staff Profile
                </div>
                <div className="staff-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="staff-profile-wrapper">
                <div className="staff-profile-card">
                    
                    <div className="staff-profile-top">
                        <div className="staff-initials">{getInitials(staff.fullname, staff.username)}</div>
                        <h3>{staff.fullname || 'No Name Provided'}</h3>
                        
                        <div className="staff-badges">
                            <span className="staff-username-badge">@{staff.username}</span>
                            <span className="staff-role-badge" style={{ 
                                background: staff.role === 'ADMIN' ? '#f3e8ff' : staff.role === 'DOCTOR' ? '#dbeafe' : '#fce7f3', 
                                color: staff.role === 'ADMIN' ? '#a855f7' : staff.role === 'DOCTOR' ? '#3b82f6' : '#ec4899' 
                            }}>
                                {staff.role === 'ADMIN' ? 'Admin' : staff.role === 'DOCTOR' ? 'Doctor' : 'Nurse'}
                            </span>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <ul className="staff-details-list">
                        <li><label>Full Name</label><span>{staff.fullname || '-----'}</span></li>
                        <li><label>Username</label><span>@{staff.username}</span></li>
                        <li><label>Email</label><span>{staff.email || '-----'}</span></li>
                        <li><label>Phone</label><span>{staff.phone_number || '----------'}</span></li>
                        <li><label>Role</label><span style={{ textTransform: 'capitalize' }}>{staff.role ? staff.role.toLowerCase() : '-----'}</span></li>
                        
                        {/* Only show Barangay if Nurse */}
                        {staff.role === 'NURSE' && <li><label>Barangay</label><span>{staff.barangay || '-----'}</span></li>}

                        <li><label>Date Joined</label><span>{formatDate(staff.date_joined)}</span></li>
                        <li><label>Last Login</label><span>{formatDateTime(staff.last_login)}</span></li>
                    </ul>

                    {/* BUTTONS */}
                    <div className="staff-profile-actions">
                        <button className="btn-staff-back" onClick={onBack}>Back</button>
                        <button className="btn-staff-edit" onClick={onEdit}>Edit</button>
                    </div>

                </div>
            </div>
        </div>
    );
}
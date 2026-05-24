import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock } from 'lucide-react';
import '../../assets/css/StaffAccounts.css';
import { roleRequiresBarangay } from '../../constants/barangays.js';

const ROLE_STYLES = {
    ADMIN: { background: '#f3e8ff', color: '#a855f7', label: 'Admin' },
    DOCTOR: { background: '#dbeafe', color: '#3b82f6', label: 'Doctor' },
    NURSE: { background: '#fce7f3', color: '#ec4899', label: 'Nurse' },
    STAFF: { background: '#e0f2fe', color: '#0369a1', label: 'Staff' },
};

export default function ViewStaffAccount({ staff, onBack, onEdit, onStaffUpdated }) {
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

    const roleStyle = ROLE_STYLES[staff.role] || { background: '#f3f4f6', color: '#6b7280', label: staff.role };
    const verificationKey = (staff.verification_status || 'PENDING').toLowerCase();
    const verificationLabel = staff.verification_status === 'VERIFIED'
        ? 'Verified'
        : staff.verification_status === 'REJECTED'
            ? 'Rejected'
            : 'Pending';

    const handleVerify = async () => {
        if (!window.confirm('Verify this account? The user will be able to log in.')) return;
        try {
            const token = localStorage.getItem('access');
            const { data } = await axios.post(`http://127.0.0.1:8000/api/staff/${staff.id}/verify/`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onStaffUpdated?.(data);
            alert('Account verified successfully.');
        } catch (error) {
            alert(error.response?.data?.detail || 'Could not verify account.');
        }
    };

    const handleReject = async () => {
        const reason = window.prompt('Rejection reason (optional):', '');
        if (reason === null) return;
        try {
            const token = localStorage.getItem('access');
            const { data } = await axios.post(
                `http://127.0.0.1:8000/api/staff/${staff.id}/reject/`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onStaffUpdated?.(data);
            alert('Account rejected.');
        } catch (error) {
            alert(error.response?.data?.detail || 'Could not reject account.');
        }
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
                            <span className="staff-role-badge" style={{ background: roleStyle.background, color: roleStyle.color }}>
                                {roleStyle.label}
                            </span>
                            <span className={`verification-badge ${verificationKey}`}>{verificationLabel}</span>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <ul className="staff-details-list">
                        <li><label>Full Name</label><span>{staff.fullname || '-----'}</span></li>
                        <li><label>Username</label><span>@{staff.username}</span></li>
                        <li><label>Email</label><span>{staff.email || '-----'}</span></li>
                        <li><label>Phone</label><span>{staff.phone_number || '----------'}</span></li>
                        <li><label>Role</label><span style={{ textTransform: 'capitalize' }}>{staff.role ? staff.role.toLowerCase() : '-----'}</span></li>
                        
                        {roleRequiresBarangay(staff.role) && (
                            <li><label>Barangay</label><span>{staff.barangay || '-----'}</span></li>
                        )}

                        <li><label>Date Joined</label><span>{formatDate(staff.date_joined)}</span></li>
                        <li><label>Last Login</label><span>{formatDateTime(staff.last_login)}</span></li>
                        <li><label>Verification</label><span className={`verification-badge ${verificationKey}`}>{verificationLabel}</span></li>
                        <li><label>Account Status</label><span>{staff.is_active ? 'Active' : 'Inactive'}</span></li>
                        {staff.rejection_reason && (
                            <li><label>Rejection Note</label><span>{staff.rejection_reason}</span></li>
                        )}
                    </ul>

                    {/* BUTTONS */}
                    <div className="staff-profile-actions">
                        <button type="button" className="btn-staff-back" onClick={onBack}>Back</button>
                        {staff.verification_status === 'PENDING' && (
                            <>
                                <button type="button" className="btn-staff-reject" onClick={handleReject}>Reject</button>
                                <button type="button" className="btn-staff-verify" onClick={handleVerify}>Verify</button>
                            </>
                        )}
                        <button type="button" className="btn-staff-edit" onClick={onEdit}>Edit</button>
                    </div>

                </div>
            </div>
        </div>
    );
}
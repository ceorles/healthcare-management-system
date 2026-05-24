import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Settings as SettingsIcon,
    Clock,
    UserPlus,
    Lock,
    SquarePen,
    CheckCircle,
    Eye,
    EyeOff,
} from 'lucide-react';
import '../../assets/css/Settings.css';
import '../../assets/css/Patients.css';

const API = 'http://127.0.0.1:8000/api/users';

function getInitials(user) {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    const name = user?.fullname || user?.username || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'U').toUpperCase();
}

function getDisplayName(user) {
    if (!user) return '';
    const first = (user.first_name || '').trim();
    const last = (user.last_name || '').trim();
    if (first || last) return `${first} ${last}`.trim();
    return user.fullname || user.username || '';
}

function getRoleLabel(role) {
    if (!role) return 'Staff';
    return role.charAt(0) + role.slice(1).toLowerCase();
}

function getRoleClass(role) {
    if (role === 'ADMIN') return 'admin';
    if (role === 'DOCTOR') return 'doctor';
    return 'nurse';
}

function parseApiErrors(err) {
    const data = err?.response?.data;
    if (!data) return err?.message || 'Something went wrong. Please try again.';
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    const messages = [];
    Object.entries(data).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ');
        const text = Array.isArray(value) ? value.join(' ') : String(value);
        messages.push(`${label}: ${text}`);
    });
    return messages.join(' ') || 'Validation failed.';
}

export default function Settings() {
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [infoEditMode, setInfoEditMode] = useState(false);
    const [passwordEditMode, setPasswordEditMode] = useState(false);
    const [infoSaving, setInfoSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);

    const [infoMessage, setInfoMessage] = useState({ type: '', text: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    const [infoForm, setInfoForm] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone_number: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem('access')}`,
    }), []);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/profile/`, { headers: authHeaders() });
            setProfile(data);
            setInfoForm({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                username: data.username || '',
                email: data.email || '',
                phone_number: data.phone_number || '',
            });
        } catch (err) {
            console.error(err);
            setInfoMessage({ type: 'error', text: 'Failed to load profile.' });
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        loadProfile();
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, [loadProfile]);

    const resetInfoForm = () => {
        if (!profile) return;
        setInfoForm({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            username: profile.username || '',
            email: profile.email || '',
            phone_number: profile.phone_number || '',
        });
    };

    const toggleInfoEdit = () => {
        if (infoEditMode) resetInfoForm();
        setInfoEditMode((prev) => !prev);
        setInfoMessage({ type: '', text: '' });
    };

    const togglePasswordEdit = () => {
        if (passwordEditMode) {
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        }
        setPasswordEditMode((prev) => !prev);
        setPasswordMessage({ type: '', text: '' });
    };

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        let next = value;
        if (name === 'username') {
            next = value.replace(/\s/g, '');
        }
        setInfoForm((prev) => ({ ...prev, [name]: next }));
    };

    const handlePasswordChange = (e) => {
        setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validateInfoForm = () => {
        if (!infoForm.first_name.trim() && !infoForm.last_name.trim()) {
            return 'Please enter your first or last name.';
        }
        if (!infoForm.username.trim()) {
            return 'Username is required.';
        }
        if (!/^\w+$/.test(infoForm.username)) {
            return 'Username may only contain letters, numbers, and underscores.';
        }
        if (!infoForm.email.trim()) {
            return 'Email is required.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoForm.email)) {
            return 'Please enter a valid email address.';
        }
        return null;
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        if (!infoEditMode) return;

        const validationError = validateInfoForm();
        if (validationError) {
            setInfoMessage({ type: 'error', text: validationError });
            return;
        }

        setInfoSaving(true);
        setInfoMessage({ type: '', text: '' });
        try {
            const { data } = await axios.patch(`${API}/profile/`, {
                first_name: infoForm.first_name.trim(),
                last_name: infoForm.last_name.trim(),
                username: infoForm.username.trim(),
                email: infoForm.email.trim(),
                phone_number: infoForm.phone_number.trim(),
            }, { headers: authHeaders() });

            setProfile(data);
            setInfoForm({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                username: data.username || '',
                email: data.email || '',
                phone_number: data.phone_number || '',
            });
            setInfoEditMode(false);
            setInfoMessage({ type: 'success', text: 'Your information was updated successfully.' });
        } catch (err) {
            setInfoMessage({ type: 'error', text: parseApiErrors(err) });
        } finally {
            setInfoSaving(false);
        }
    };

    const validatePasswordForm = () => {
        if (!passwordForm.current_password) {
            return 'Current password is required.';
        }
        if (!passwordForm.new_password) {
            return 'New password is required.';
        }
        if (passwordForm.new_password.length < 8) {
            return 'New password must be at least 8 characters.';
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            return 'New password and confirmation do not match.';
        }
        return null;
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!passwordEditMode) return;

        const validationError = validatePasswordForm();
        if (validationError) {
            setPasswordMessage({ type: 'error', text: validationError });
            return;
        }

        setPasswordSaving(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            await axios.post(`${API}/change-password/`, passwordForm, { headers: authHeaders() });
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            setPasswordEditMode(false);
            setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
        } catch (err) {
            setPasswordMessage({ type: 'error', text: parseApiErrors(err) });
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-page">
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px' }}>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-page-header">
                <h1 className="page-title">
                    <SettingsIcon size={24} /> Settings
                </h1>
                <div className="page-time">
                    <Clock size={16} /> {currentTime}
                </div>
            </div>

            {profile && (
                <div className="settings-profile-card">
                    <div className="settings-avatar">{getInitials(profile)}</div>
                    <div className="settings-profile-info">
                        <h2>{getDisplayName(profile)}</h2>
                        <span className={`settings-role-badge ${getRoleClass(profile.role)}`}>
                            {getRoleLabel(profile.role)}
                        </span>
                        <div className="settings-profile-meta">
                            <div>
                                <label>Username</label>
                                <span>@{profile.username}</span>
                            </div>
                            <div>
                                <label>Email</label>
                                <span>{profile.email || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form className="settings-card" onSubmit={handleUpdateInfo}>
                <div className="settings-card-header">
                    <div className="settings-card-header-left">
                        <UserPlus size={18} /> Change User Info
                    </div>
                    <button
                        type="button"
                        className={`settings-edit-btn${infoEditMode ? ' active' : ''}`}
                        onClick={toggleInfoEdit}
                        aria-label={infoEditMode ? 'Cancel editing user info' : 'Edit user info'}
                    >
                        <SquarePen size={16} />
                    </button>
                </div>
                <div className="settings-card-body">
                    {infoMessage.text && (
                        <div className={`settings-alert ${infoMessage.type}`}>{infoMessage.text}</div>
                    )}
                    <div className="settings-form-grid">
                        <div className="settings-field">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                className="settings-input"
                                value={infoForm.first_name}
                                onChange={handleInfoChange}
                                disabled={!infoEditMode}
                                readOnly={!infoEditMode}
                            />
                        </div>
                        <div className="settings-field">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                className="settings-input"
                                value={infoForm.last_name}
                                onChange={handleInfoChange}
                                disabled={!infoEditMode}
                                readOnly={!infoEditMode}
                            />
                        </div>
                        <div className="settings-field full-width">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                className="settings-input"
                                value={infoForm.username}
                                onChange={handleInfoChange}
                                disabled={!infoEditMode}
                                readOnly={!infoEditMode}
                                placeholder="@username"
                            />
                            <span className="settings-hint">Only letters, numbers, and underscores. No spaces.</span>
                        </div>
                        <div className="settings-field">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                className="settings-input"
                                value={infoForm.email}
                                onChange={handleInfoChange}
                                disabled={!infoEditMode}
                                readOnly={!infoEditMode}
                            />
                        </div>
                        <div className="settings-field">
                            <label>Contact No. #</label>
                            <input
                                type="text"
                                name="phone_number"
                                className="settings-input"
                                value={infoForm.phone_number}
                                onChange={handleInfoChange}
                                disabled={!infoEditMode}
                                readOnly={!infoEditMode}
                                placeholder="09123456789"
                            />
                        </div>
                        <div className="settings-field full-width">
                            <label>Role</label>
                            <input
                                type="text"
                                className="settings-input"
                                value={getRoleLabel(profile?.role)}
                                disabled
                                readOnly
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={`settings-update-btn${infoEditMode ? ' active' : ''}`}
                        disabled={!infoEditMode || infoSaving}
                    >
                        <CheckCircle size={16} />
                        {infoSaving ? 'Updating...' : 'Update Info'}
                    </button>
                </div>
            </form>

            <form className="settings-card" onSubmit={handleUpdatePassword}>
                <div className="settings-card-header">
                    <div className="settings-card-header-left">
                        <Lock size={18} /> Change Password
                    </div>
                    <button
                        type="button"
                        className={`settings-edit-btn${passwordEditMode ? ' active' : ''}`}
                        onClick={togglePasswordEdit}
                        aria-label={passwordEditMode ? 'Cancel editing password' : 'Edit password'}
                    >
                        <SquarePen size={16} />
                    </button>
                </div>
                <div className="settings-card-body">
                    {passwordMessage.text && (
                        <div className={`settings-alert ${passwordMessage.type}`}>{passwordMessage.text}</div>
                    )}
                    <div className="settings-form-grid">
                        <div className="settings-field full-width">
                            <label>Current Password *</label>
                            <div className="settings-input-wrap">
                                <input
                                    type={showCurrentPw ? 'text' : 'password'}
                                    name="current_password"
                                    className="settings-input"
                                    value={passwordForm.current_password}
                                    onChange={handlePasswordChange}
                                    disabled={!passwordEditMode}
                                    readOnly={!passwordEditMode}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="settings-toggle-pw"
                                    onClick={() => setShowCurrentPw((v) => !v)}
                                    disabled={!passwordEditMode}
                                    tabIndex={-1}
                                >
                                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <hr className="settings-password-divider" />
                        <div className="settings-field full-width">
                            <label>New Password * (min. 8 characters)</label>
                            <div className="settings-input-wrap">
                                <input
                                    type={showNewPw ? 'text' : 'password'}
                                    name="new_password"
                                    className="settings-input"
                                    value={passwordForm.new_password}
                                    onChange={handlePasswordChange}
                                    disabled={!passwordEditMode}
                                    readOnly={!passwordEditMode}
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="settings-toggle-pw"
                                    onClick={() => setShowNewPw((v) => !v)}
                                    disabled={!passwordEditMode}
                                    tabIndex={-1}
                                >
                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="settings-field full-width">
                            <label>Confirm New Password *</label>
                            <div className="settings-input-wrap">
                                <input
                                    type={showConfirmPw ? 'text' : 'password'}
                                    name="confirm_password"
                                    className="settings-input"
                                    value={passwordForm.confirm_password}
                                    onChange={handlePasswordChange}
                                    disabled={!passwordEditMode}
                                    readOnly={!passwordEditMode}
                                    placeholder="Re-enter new password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="settings-toggle-pw"
                                    onClick={() => setShowConfirmPw((v) => !v)}
                                    disabled={!passwordEditMode}
                                    tabIndex={-1}
                                >
                                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={`settings-update-btn${passwordEditMode ? ' active' : ''}`}
                        disabled={!passwordEditMode || passwordSaving}
                    >
                        <CheckCircle size={16} />
                        {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}

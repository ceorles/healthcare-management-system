import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Clock, Filter, RotateCcw, Search, Shield, Trash2 } from 'lucide-react';
import '../../assets/css/AuditLogs.css';

const API = 'http://127.0.0.1:8000/api/audit-logs/';
const PATIENTS_API = 'http://127.0.0.1:8000/api/patients/';
const REFERRALS_API = 'http://127.0.0.1:8000/api/referrals/';

const ACTIONS = [
    { value: '', label: 'All Actions' },
    { value: 'view', label: 'View' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Edit' },
    { value: 'delete', label: 'Delete' },
    { value: 'print', label: 'Print' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'qr_scan', label: 'QR Scan' },
    { value: 'restore', label: 'Restore' },
];

function formatTimestamp(value) {
    if (!value) return '-----';
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getRoleLabel(role) {
    if (!role) return 'System';
    return role.charAt(0) + role.slice(1).toLowerCase();
}

function getActionClass(action) {
    if (action === 'delete') return 'delete';
    if (action === 'create') return 'create';
    if (action === 'update') return 'update';
    if (action === 'print') return 'print';
    if (action === 'login' || action === 'logout') return 'auth';
    if (action === 'qr_scan') return 'qr';
    if (action === 'restore') return 'restore';
    return 'view';
}

function formatDateParam(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getIntegrityMessage(integrity) {
    if (!integrity) return '';
    if (integrity.valid) return 'Integrity OK';
    return integrity.failure_message || (
        integrity.failed_log
            ? `Tamper Warning - Issue detected at Log #${integrity.failed_log}`
            : 'Tamper Warning'
    );
}

export default function AuditLogs() {
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [logs, setLogs] = useState([]);
    const [trashRecords, setTrashRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trashLoading, setTrashLoading] = useState(false);
    const [error, setError] = useState('');
    const [activePanel, setActivePanel] = useState('logs');
    const [integrity, setIntegrity] = useState(null);
    const [integrityLoading, setIntegrityLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        action: '',
        date: '',
    });

    const params = useMemo(() => {
        const clean = {};
        if (filters.search.trim()) clean.search = filters.search.trim();
        if (filters.action) clean.action = filters.action;
        if (filters.date) clean.date = filters.date;
        clean.tz_offset = new Date().getTimezoneOffset();
        return clean;
    }, [filters]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('access');
            const { data } = await axios.get(API, {
                params,
                headers: { Authorization: `Bearer ${token}` },
            });
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading audit logs:', err);
            setError(err.response?.status === 403
                ? 'Only administrators can access audit logs.'
                : 'Unable to load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [params]);

    const fetchTrash = useCallback(async () => {
        setTrashLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('access');
            const headers = { Authorization: `Bearer ${token}` };
            const [patientsRes, referralsRes] = await Promise.all([
                axios.get(`${PATIENTS_API}trash/`, { headers }),
                axios.get(`${REFERRALS_API}trash/`, { headers }),
            ]);

            const deletedPatients = (Array.isArray(patientsRes.data) ? patientsRes.data : []).map((patient) => ({
                id: patient.id,
                type: 'Patient',
                label: patient.full_name || patient.patient_id,
                deletedBy: patient.deleted_by_name || '-----',
                deletedAt: patient.deleted_at,
            }));

            const deletedReferrals = (Array.isArray(referralsRes.data) ? referralsRes.data : []).map((referral) => ({
                id: referral.id,
                type: 'Referral',
                label: referral.referral_code || referral.patient_name_display || 'Referral',
                deletedBy: referral.deleted_by_name || '-----',
                deletedAt: referral.deleted_at,
            }));

            setTrashRecords([...deletedPatients, ...deletedReferrals].sort((a, b) => (
                new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()
            )));
        } catch (err) {
            console.error('Error loading trash bin:', err);
            setError(err.response?.status === 403
                ? 'Only administrators can access the trash bin.'
                : 'Unable to load trash bin.');
        } finally {
            setTrashLoading(false);
        }
    }, []);

    const verifyIntegrity = useCallback(async () => {
        setIntegrityLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('access');
            const { data } = await axios.get(`${API}verify-integrity/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIntegrity(data);
        } catch (err) {
            console.error('Integrity verification failed:', err);
            setError('Unable to verify audit log integrity.');
        } finally {
            setIntegrityLoading(false);
        }
    }, []);

    const filteredLogs = useMemo(() => {
        const search = filters.search.trim().toLowerCase();
        return logs.filter((log) => {
            if (filters.action && log.action !== filters.action) return false;
            if (filters.date && formatDateParam(log.timestamp) !== filters.date) return false;
            if (!search) return true;

            const haystack = [
                log.user_name,
                log.username,
                log.role,
                log.action,
                log.action_type,
                log.description,
                log.target_type,
                log.model_name,
                log.target_id,
                log.object_id,
            ].filter(Boolean).join(' ').toLowerCase();

            return haystack.includes(search);
        });
    }, [filters, logs]);

    useEffect(() => {
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(fetchLogs, 250);
        return () => clearTimeout(timeout);
    }, [fetchLogs]);

    useEffect(() => {
        if (activePanel === 'trash') {
            fetchTrash();
        }
    }, [activePanel, fetchTrash]);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchLogs();
    };

    const handleRestore = async (record) => {
        if (!window.confirm(`Restore this ${record.type.toLowerCase()} record?`)) return;

        try {
            const token = localStorage.getItem('access');
            const baseUrl = record.type === 'Patient' ? PATIENTS_API : REFERRALS_API;
            await axios.post(`${baseUrl}${record.id}/restore/`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await Promise.all([fetchTrash(), fetchLogs()]);
            alert(`${record.type} restored successfully.`);
        } catch (err) {
            console.error('Restore failed:', err);
            alert(err.response?.data?.detail || 'Unable to restore record.');
        }
    };

    return (
        <div className="audit-logs-page">
            <div className="page-header">
                <div className="page-title"><Shield size={24} /> Audit Logs</div>
                <div className="page-time"><Clock size={16} /> {currentTime}</div>
            </div>

            <div className="audit-card">
                <form className="audit-filter-bar" onSubmit={handleSubmit}>
                    <div className="audit-filter-title">Filter Logs</div>
                    <div className="audit-filter-grid">
                        <div className="audit-search-wrapper">
                            <Search size={16} className="audit-search-icon" />
                            <input
                                type="text"
                                className="audit-input"
                                placeholder="Filter by user, role, action, patient/referral..."
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            />
                        </div>

                        <select
                            className="audit-input"
                            value={filters.action}
                            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
                        >
                            {ACTIONS.map((action) => (
                                <option key={action.value || 'all'} value={action.value}>{action.label}</option>
                            ))}
                        </select>

                        <input
                            type="date"
                            className="audit-input"
                            value={filters.date}
                            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                        />

                        <button type="submit" className="audit-filter-btn">
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </form>

                <div className="audit-integrity-row">
                    <strong>Tamper-Evident Log</strong>
                    {integrity && (
                        <span className={`audit-integrity-badge ${integrity.valid ? 'ok' : 'tampered'}`}>
                            {integrity.valid ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                            {getIntegrityMessage(integrity)}
                        </span>
                    )}
                    <button
                        type="button"
                        className="audit-verify-btn"
                        onClick={verifyIntegrity}
                        disabled={integrityLoading}
                    >
                        {integrityLoading ? 'Checking...' : 'Verify Chain'}
                    </button>
                    <div className="audit-panel-tabs">
                        <button
                            type="button"
                            className={activePanel === 'logs' ? 'active' : ''}
                            onClick={() => setActivePanel('logs')}
                        >
                            Audit Logs
                        </button>
                        <button
                            type="button"
                            className={activePanel === 'trash' ? 'active' : ''}
                            onClick={() => setActivePanel('trash')}
                        >
                            <Trash2 size={14} /> Trash Bin
                        </button>
                    </div>
                </div>

                {error && <div className="audit-error">{error}</div>}

                {activePanel === 'logs' ? (
                <div className="audit-table-wrap">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Action</th>
                                <th>Description</th>
                                <th>Target</th>
                                <th>Hash (SHA-256)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="audit-empty">Loading audit logs...</td></tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log, index) => (
                                    <tr key={log.id}>
                                        <td className="audit-row-num">{filteredLogs.length - index}</td>
                                        <td>{formatTimestamp(log.timestamp)}</td>
                                        <td>{log.user_name || log.username || 'System'}</td>
                                        <td>{getRoleLabel(log.role)}</td>
                                        <td>
                                            <span className={`audit-action-badge ${getActionClass(log.action)}`}>
                                                {log.action_type || log.action}
                                            </span>
                                        </td>
                                        <td className="audit-description">{log.description}</td>
                                        <td>{log.target_type || log.model_name}{log.target_id ? `: ${log.target_id}` : ''}</td>
                                        <td className="audit-hash">{log.hash_short || log.record_hash || '-----'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="audit-empty">No audit logs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                ) : (
                <div className="audit-table-wrap">
                    <table className="audit-table audit-trash-table">
                        <thead>
                            <tr>
                                <th>Record Type</th>
                                <th>Name / Code</th>
                                <th>Deleted By</th>
                                <th>Deleted Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trashLoading ? (
                                <tr><td colSpan="5" className="audit-empty">Loading trash bin...</td></tr>
                            ) : trashRecords.length > 0 ? (
                                trashRecords.map((record) => (
                                    <tr key={`${record.type}-${record.id}`}>
                                        <td>{record.type}</td>
                                        <td className="audit-description">{record.label}</td>
                                        <td>{record.deletedBy}</td>
                                        <td>{formatTimestamp(record.deletedAt)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="audit-restore-btn"
                                                onClick={() => handleRestore(record)}
                                            >
                                                <RotateCcw size={14} /> Restore
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="audit-empty">Trash bin is empty.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        </div>
    );
}
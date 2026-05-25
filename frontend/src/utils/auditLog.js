import axios from 'axios';

const AUDIT_TRACK_URL = 'http://127.0.0.1:8000/api/audit-logs/track/';

export function trackAuditLog({ action, targetType, targetId = '', description }) {
    const token = localStorage.getItem('access');
    if (!token || !action || !targetType || !description) return;

    axios.post(AUDIT_TRACK_URL, {
        action,
        target_type: targetType,
        target_id: targetId,
        description,
    }, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch((error) => console.error('Audit tracking failed:', error));
}

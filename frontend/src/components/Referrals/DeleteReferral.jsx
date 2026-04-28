import { Trash2, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import '../../assets/css/Referrals.css';

export default function DeleteReferral({ referral, onCancel, onDeleteSuccess }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleDelete = async () => {
        try {
            await axios.delete(`http://127.0.0.1:8000/api/referrals/${referral.id}/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            alert("Referral Deleted Successfully!");
            onDeleteSuccess();
        } catch (error) {
            console.error(error);
            alert("Error deleting referral.");
        }
    };

    return (
        <div>
            <div className="ref-page-header">
                <div className="ref-page-title" style={{ color: '#dc2626' }}><Trash2 size={24}/> Confirm Delete</div>
                <div className="ref-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ background: '#ef4444', color: 'white', padding: '15px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                        <AlertTriangle size={18}/> Confirm Action
                    </div>
                    <div style={{ padding: '40px 30px' }}>
                        <Trash2 size={40} color="#ef4444" />
                        <h3 style={{ margin: '15px 0 10px 0', color: 'var(--text)' }}>Are you sure?</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
                            You are about to delete/archive:<br/>
                            {/* FIXED: We are using referral variables here now! */}
                            <strong>{referral.patient_name_display} ({referral.referral_code})</strong>
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button onClick={onCancel} className="btn-secondary" style={{ padding: '10px 24px', border: '1px solid var(--border)', color: 'var(--text)' }}>Cancel</button>
                            <button onClick={handleDelete} className="btn-primary" style={{ padding: '10px 24px', background: '#ef4444' }}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
import { Trash2, AlertTriangle, Clock } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import '../../assets/css/Patients.css';

export default function DeleteStaffAccount({ staff, onCancel, onDeleteSuccess }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleDelete = async () => {
        try {
            await axios.delete(`http://127.0.0.1:8000/api/staff/${staff.id}/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            alert("Staff Account Deleted Successfully!");
            onDeleteSuccess();
        } catch (error) { alert("Error deleting staff account."); console.error(error); }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title" style={{ color: '#dc2626' }}><Trash2 size={24}/> Confirm Delete</div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="delete-card-wrapper">
                <div className="delete-card">
                    <div className="delete-header"><AlertTriangle size={18}/> Confirm Action</div>
                    <div className="delete-body">
                        <Trash2 size={40} color="#ef4444" />
                        <h3>Are you sure?</h3>
                        <p>You are about to delete the record of:<br/>
                        <strong>{staff.fullname || staff.username} (Role: {staff.role})</strong></p>
                        
                        <div className="delete-actions">
                            <button onClick={onCancel} className="btn-secondary" style={{ padding: '10px 24px', border: '1px solid var(--border)', color: 'var(--text)' }}>Cancel</button>
                            <button onClick={handleDelete} className="btn-primary" style={{ padding: '10px 24px', background: '#ef4444' }}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
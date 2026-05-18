import { useState, useEffect } from 'react';
import { User, Clock, ClipboardList, Plus, FileText, Edit, Trash2 } from 'lucide-react';
import '../../assets/css/Patients.css';

export default function ViewPatient({ patient, onBack, onEdit, onDelete }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    // Generate Initials (e.g. "Aaron Faderagao" -> "AF")
    const getInitials = (first, last) => {
        return `${first ? first[0] : ''}${last ? last[0] : ''}`.toUpperCase();
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title" style={{ cursor: 'pointer' }} onClick={onBack}>
                    <User size={24}/> {patient.full_name}
                </div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="view-grid">
                {/* LEFT COLUMN: Profile & Actions */}
                <div>
                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-initials">{getInitials(patient.first_name, patient.last_name)}</div>
                            <div className="profile-name">
                                <h3>{patient.last_name}, {patient.first_name} {patient.middle_name}</h3>
                                <div className="profile-badges">
                                    <span className="badge-id">{patient.patient_id}</span>
                                    <span className="badge-tag">{patient.age}yrs</span>
                                    <span className="badge-tag">{patient.sex === 'M' ? 'Male' : 'Female'}</span>
                                    {patient.blood_type && <span className="badge-blood">{patient.blood_type}</span>}
                                </div>
                            </div>
                        </div>

                        <ul className="profile-details">
                            <li><label>Barangay</label><span>{patient.barangay}</span></li>
                            <li><label>Address</label><span>{patient.address || '-----'}</span></li>
                            <li><label>Contact</label><span>{patient.contact_number || '----------'}</span></li>
                            <li><label>Civil Status</label><span style={{ textTransform: 'capitalize' }}>{patient.civil_status || '-----'}</span></li>
                            <li><label>Philhealth</label><span>{patient.philhealth_number || '-----------------'}</span></li>
                            {(patient.guardian_name || patient.guardian_contact_info) && (
                                <li><label>Guardian</label>
                                    <span>
                                        {patient.guardian_name || '-----'}<br/>
                                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{patient.guardian_contact_info}</span>
                                    </span>
                                </li>
                            )}
                            <li><label>Emergency</label>
                                <span>
                                    {patient.emergency_contact_name || '-----'}<br/>
                                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{patient.emergency_contact_number}</span>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="actions-card">
                        <h4>Actions</h4>
                        <button className="btn-full green"><Plus size={16}/> New Visit</button>
                        <button className="btn-full yellow" onClick={onEdit}><Edit size={16}/> Edit Record</button>
                        <button className="btn-full red" onClick={onDelete}><Trash2 size={16}/> Delete</button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Histories */}
                <div>
                    <div className="history-card">
                        <div className="history-header">
                            <h4>Visit History</h4>
                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14}/> New Visit</button>
                        </div>
                        <div className="empty-state">
                            <ClipboardList size={32} strokeWidth={1.5} />
                            No Visit History yet.
                        </div>
                    </div>

                    <div className="history-card">
                        <div className="history-header"><h4>Referral History</h4></div>
                        <div className="empty-state">
                            <FileText size={32} strokeWidth={1.5} />
                            No Referral History yet.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
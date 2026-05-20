import { useState, useEffect, useCallback } from 'react';

import axios from 'axios';

import { User, Clock, ClipboardList, Plus, FileText, Edit, Trash2 } from 'lucide-react';

import '../../assets/css/Patients.css';

import '../../assets/css/Visit.css';



export default function ViewPatient({ patient, onBack, onEdit, onDelete, onNewVisit, onViewVisit }) {

    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const [visits, setVisits] = useState([]);

    const [visitsLoading, setVisitsLoading] = useState(true);



    const fetchVisits = useCallback(async () => {

        try {

            const token = localStorage.getItem('access');

            const { data } = await axios.get(`http://127.0.0.1:8000/api/visits/?patient=${patient.id}`, {

                headers: { Authorization: `Bearer ${token}` },

            });

            setVisits(data);

        } catch (error) {

            console.error('Error fetching visits:', error);

        } finally {

            setVisitsLoading(false);

        }

    }, [patient.id]);



    useEffect(() => {

        fetchVisits();

        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);

        return () => clearInterval(timer);

    }, [fetchVisits]);



    const getInitials = (first, last) => {

        return `${first ? first[0] : ''}${last ? last[0] : ''}`.toUpperCase();

    };



    const formatVisitDate = (dateString) => {

        if (!dateString) return '---';

        return new Date(dateString).toLocaleString('en-US', {

            year: 'numeric',

            month: 'long',

            day: 'numeric',

            hour: '2-digit',

            minute: '2-digit',

        });

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

                        <button type="button" className="btn-full green" onClick={onNewVisit}><Plus size={16}/> New Visit</button>

                        <button type="button" className="btn-full yellow" onClick={onEdit}><Edit size={16}/> Edit Record</button>

                        <button type="button" className="btn-full red" onClick={onDelete}><Trash2 size={16}/> Delete</button>

                    </div>

                </div>



                <div>

                    <div className="history-card">

                        <div className="history-header">

                            <h4>Visit History</h4>

                            <button

                                type="button"

                                className="btn-primary"

                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}

                                onClick={onNewVisit}

                            >

                                <Plus size={14}/> New Visit

                            </button>

                        </div>



                        {visitsLoading ? (

                            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>Loading visits...</p>

                        ) : visits.length > 0 ? (

                            <div className="visit-history-list">

                                {visits.map((visit) => (

                                    <div
                                        key={visit.id}
                                        className="visit-history-item clickable"
                                        onClick={() => onViewVisit?.(visit.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onViewVisit?.(visit.id);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                    >

                                        <div className="visit-history-icon">

                                            <ClipboardList size={20} />

                                        </div>

                                        <div className="visit-history-body">

                                            <h5>{formatVisitDate(visit.visit_date)}</h5>

                                            <p className="visit-history-meta">

                                                {visit.created_by_name || 'Staff'}

                                                {visit.diagnosis ? ` · ${visit.diagnosis}` : ''}

                                            </p>

                                            {visit.symptoms && (

                                                <p className="visit-history-summary">

                                                    <strong>Symptoms:</strong> {visit.symptoms}

                                                </p>

                                            )}

                                            {visit.has_follow_up && visit.follow_up_summary && (

                                                <p className="visit-history-followup">

                                                    Follow-up: {visit.follow_up_summary.appointment_date} at {visit.follow_up_summary.appointment_time}

                                                    {visit.follow_up_summary.doctor_name ? ` · ${visit.follow_up_summary.doctor_name}` : ''}

                                                </p>

                                            )}

                                        </div>

                                        <button
                                            type="button"
                                            className="visit-history-view-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewVisit?.(visit.id);
                                            }}
                                        >
                                            View Details
                                        </button>

                                    </div>

                                ))}

                            </div>

                        ) : (

                            <div className="empty-state">

                                <ClipboardList size={32} strokeWidth={1.5} />

                                No Visit History yet.

                            </div>

                        )}

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


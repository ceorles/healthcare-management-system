import { useState, useEffect, useCallback, useRef } from 'react';

import axios from 'axios';

import { Clock, ClipboardList, Plus, FileText, Edit, Trash2, ChevronLeft } from 'lucide-react';

import '../../assets/css/Patients.css';

import '../../assets/css/Visit.css';
import { trackAuditLog } from '../../utils/auditLog.js';



export default function ViewPatient({
    patient,
    onBack,
    onEdit,
    onDelete,
    onNewVisit,
    onViewVisit,
    onViewReferral,
    canDelete = true,
    canCreateVisit = true,
}) {

    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const [visits, setVisits] = useState([]);

    const [visitsLoading, setVisitsLoading] = useState(true);

    const [referrals, setReferrals] = useState([]);

    const [referralsLoading, setReferralsLoading] = useState(true);

    const viewTrackedRef = useRef(null);



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

    const fetchReferrals = useCallback(async () => {

        try {

            const token = localStorage.getItem('access');

            const { data } = await axios.get(`http://127.0.0.1:8000/api/referrals/?patient=${patient.id}`, {

                headers: { Authorization: `Bearer ${token}` },

            });

            setReferrals(data);

        } catch (error) {

            console.error('Error fetching referrals:', error);

        } finally {

            setReferralsLoading(false);

        }

    }, [patient.id]);



    useEffect(() => {

        fetchVisits();

        fetchReferrals();

        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);

        return () => clearInterval(timer);

    }, [fetchVisits, fetchReferrals]);

    useEffect(() => {

        if (!patient?.id || viewTrackedRef.current === patient.id) return;

        viewTrackedRef.current = patient.id;
        trackAuditLog({
            action: 'view',
            targetType: 'Patient',
            targetId: patient.id,
            description: `Viewed patient record: ${patient.full_name || `${patient.last_name || ''}, ${patient.first_name || ''}`.trim()}`,
        });

    }, [patient]);



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

    const formatReferralDate = (dateString) => {

        if (!dateString) return '---';

        return new Date(dateString).toLocaleString('en-US', {

            year: 'numeric',

            month: 'long',

            day: 'numeric',

            hour: '2-digit',

            minute: '2-digit',

        });

    };

    const formatReferralCode = (code) => {

        if (!code) return '-----';

        return code.replace(/^REF-/, 'REF - ');

    };

    const formatAppointmentType = (type) => {

        if (!type) return 'Appointment';

        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

    };

    const getAppointmentStatusKey = (status) => (
        status === 'completed' ? 'completed' : 'pending'
    );

    const patientDisplayName = `${patient.last_name}, ${patient.first_name}${patient.middle_name ? ` ${patient.middle_name.charAt(0)}.` : ''}`;



    return (

        <div>

            <div className="page-header">

                <div className="page-title-row">

                    <button type="button" className="btn-back-patient" onClick={onBack} aria-label="Go back">

                        <ChevronLeft size={20} />

                    </button>

                    <h1 className="page-title">{patientDisplayName}</h1>

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

                                    <span className="badge-tag">{patient.age || '--'}</span>

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

                        {canCreateVisit && onNewVisit && (
                            <button type="button" className="btn-full green" onClick={onNewVisit}><Plus size={16}/> New Visit</button>
                        )}

                        {onEdit && (
                            <button type="button" className="btn-full yellow" onClick={onEdit}><Edit size={16}/> Edit Record</button>
                        )}

                        {canDelete && onDelete && (
                            <button type="button" className="btn-full red" onClick={onDelete}><Trash2 size={16}/> Delete</button>
                        )}

                    </div>

                </div>



                <div>

                    <div className="history-card">

                        <div className="history-header">

                            <h4>Visit History</h4>

                            {canCreateVisit && onNewVisit && (
                                <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    onClick={onNewVisit}
                                >
                                    <Plus size={14}/> New Visit
                                </button>
                            )}

                        </div>



                        {visitsLoading ? (

                            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>Loading visits...</p>

                        ) : visits.length > 0 ? (

                            <div className="history-scroll-body">

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

                                                    <span>{visit.follow_up_summary.appointment_type_display || formatAppointmentType(visit.follow_up_summary.appointment_type)}</span>

                                                    <span>
                                                        Follow-up: {visit.follow_up_summary.appointment_date} at {visit.follow_up_summary.appointment_time}

                                                        {visit.follow_up_summary.doctor_name ? ` · ${visit.follow_up_summary.doctor_name}` : ''}
                                                    </span>

                                                    <span className={`visit-appointment-status ${getAppointmentStatusKey(visit.follow_up_summary.status)}`}>
                                                        Status: {visit.follow_up_summary.status_display || (visit.follow_up_summary.status === 'completed' ? 'Completed' : 'Pending')}
                                                    </span>

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

                        {referralsLoading ? (

                            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>Loading referrals...</p>

                        ) : referrals.length > 0 ? (

                            <div className="history-scroll-body">

                            <div className="referral-history-list">

                                {referrals.map((referral) => (

                                    <div key={referral.id} className="referral-history-item">

                                        <div className="referral-history-icon">

                                            <FileText size={20} />

                                        </div>

                                        <div className="referral-history-body">

                                            <h5 className="referral-history-code">{formatReferralCode(referral.referral_code)}</h5>

                                            <p className="referral-history-facility">To: {referral.referred_to || '-----'}</p>

                                            <p className="referral-history-meta">

                                                <span>{formatReferralDate(referral.created_at)}</span>

                                                <span className={`referral-history-status ${referral.status || 'pending'}`}>

                                                    {referral.status || 'pending'}

                                                </span>

                                            </p>

                                        </div>

                                        <button

                                            type="button"

                                            className="visit-history-view-btn"

                                            onClick={() => onViewReferral?.(referral.id)}

                                        >

                                            View Details

                                        </button>

                                    </div>

                                ))}

                            </div>

                            </div>

                        ) : (

                            <div className="empty-state">

                                <FileText size={32} strokeWidth={1.5} />

                                No Referral History yet.

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}


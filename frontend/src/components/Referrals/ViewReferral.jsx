import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from "qrcode.react";
import { FileText, Clock, QrCode, Printer, Edit, Trash2, ChevronLeft } from 'lucide-react';
import '../../assets/css/Referrals.css';
import '../../assets/css/Patients.css';

export default function ViewReferral({
    referral,
    referralId,
    onBack,
    onPrint,
    onEdit,
    onDelete,
    fromPatientProfile = false,
}) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [referralData, setReferralData] = useState(referral || null);
    const [loading, setLoading] = useState(Boolean(referralId && !referral));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (referral) {
            setReferralData(referral);
            setLoading(false);
            return;
        }
        if (!referralId) return;

        const fetchReferral = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('access');
                const { data } = await axios.get(`http://127.0.0.1:8000/api/referrals/${referralId}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setReferralData(data);
            } catch (err) {
                console.error('Error loading referral:', err);
                setError('Unable to load referral details.');
            } finally {
                setLoading(false);
            }
        };

        fetchReferral();
    }, [referral, referralId]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const renderPatientHeader = () => (
        <div className="page-header ref-patient-detail-header">
            <div className="page-title-row">
                <button type="button" className="btn-back-patient" onClick={onBack} aria-label="Go back">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="page-title">
                    <FileText size={24} /> Referral Detail
                </h1>
            </div>
            <div className="page-time"><Clock size={16} /> {currentTime}</div>
        </div>
    );

    if (loading) {
        return (
            <div className={fromPatientProfile ? 'ref-from-patient' : ''}>
                {fromPatientProfile && renderPatientHeader()}
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px' }}>Loading referral...</p>
            </div>
        );
    }

    if (error || !referralData) {
        return (
            <div className={fromPatientProfile ? 'ref-from-patient' : ''}>
                {fromPatientProfile && renderPatientHeader()}
                <p style={{ textAlign: 'center', color: '#dc2626', padding: '48px' }}>{error || 'Referral not found.'}</p>
                {!fromPatientProfile && (
                    <div style={{ textAlign: 'center' }}>
                        <button type="button" className="btn-staff-back" onClick={onBack}>Back</button>
                    </div>
                )}
            </div>
        );
    }

    const showActionsSidebar = !fromPatientProfile && (onPrint || onEdit || onDelete);

    return (
        <div className={fromPatientProfile ? 'ref-from-patient' : ''}>
            {fromPatientProfile ? (
                renderPatientHeader()
            ) : (
                <div className="ref-page-header">
                    <div className="ref-page-title" style={{ cursor: 'pointer' }} onClick={onBack}>
                        <FileText size={24} /> Referral Detail
                    </div>
                    <div className="ref-page-time"><Clock size={16} /> {currentTime}</div>
                </div>
            )}

            <div className="ref-view-layout">
                <div>
                    <div className="ref-qr-card">
                        <div className="ref-qr-header"><QrCode size={16}/> QR Code</div>
                        <div className="ref-qr-box">
                            <QRCodeSVG value={referralData.referral_code || "PENDING"} size={130} />
                            <strong style={{ marginTop: '15px' }}>{referralData.referral_code}</strong>
                        </div>
                    </div>
                    
                    {showActionsSidebar && (
                        <div className="ref-qr-card" style={{ padding: '20px' }}>
                            <div style={{ fontWeight: '700', marginBottom: '15px', textAlign: 'left', fontSize: '14px' }}>Actions</div>
                            {onPrint && <button type="button" className="btn-full green" onClick={onPrint}><Printer size={16} /> Print Referral</button>}
                            {onEdit && <button type="button" className="btn-full yellow" onClick={onEdit}><Edit size={16} /> Edit Referral</button>}
                            {onDelete && <button type="button" className="btn-full red" onClick={onDelete}><Trash2 size={16} /> Delete Referral</button>}
                        </div>
                    )}
                </div>

                <div className="ref-info-card">
                    <div className="ref-form-header" style={{ margin: 0, borderRadius: '8px 8px 0 0' }}>Referral Information</div>
                    
                    <div className="ref-info-section ref-view-data-grid">
                        <div><label>Date:</label> <strong>{new Date(referralData.created_at).toLocaleDateString()}</strong></div>
                        <div><label>From:</label> <strong>{referralData.barangay}</strong></div>
                        <div><label>To:</label> <strong>{referralData.referred_to}</strong></div>
                        <div><label>Hospital File:</label> <strong>{referralData.hospital_file_no || '-----'}</strong></div>
                        <div><label>Patient Name:</label> <strong>{referralData.patient_name_display}</strong></div>
                        <div><label>MHC Case No:</label> <strong>-----</strong></div>
                        <div><label>Age:</label> <strong>{referralData.patient_age_display}</strong></div>
                        <div style={{ gridColumn: '1 / -1' }}><label>Address:</label> <strong>{referralData.patient_address_display}</strong></div>
                    </div>

                    <div className="ref-form-header" style={{ margin: 0, borderRadius: 0 }}>Medical Details</div>
                    <div className="ref-info-section ref-view-details">
                        <div><label>Chief Complaint:</label> <strong>{referralData.chief_complaint || '-----'}</strong></div>
                        <div><label>Brief History:</label> <strong>{referralData.brief_history || '-----'}</strong></div>
                        
                        <div className="ref-view-pe-row">
                            <div><label>BP:</label> <strong>{referralData.bp || '--'}</strong></div>
                            <div><label>PR:</label> <strong>{referralData.pr || '--'}</strong></div>
                            <div><label>RR:</label> <strong>{referralData.rr || '--'}</strong></div>
                            <div><label>Temp:</label> <strong>{referralData.temp || '--'}</strong></div>
                            <div><label>Wt:</label> <strong>{referralData.weight || '--'}</strong></div>
                        </div>

                        <div><label>Impression:</label> <strong>{referralData.impression || '-----'}</strong></div>
                        <div><label>Reason for Referral:</label> <strong>{referralData.reason || '-----'}</strong></div>
                        <div><label>Services Needed:</label> <strong>{referralData.services_needed || '-----'}</strong></div>
                        <div><label>Remarks:</label> <strong>{referralData.remarks || '-----'}</strong></div>
                        
                        <div className="ref-view-signature-box">
                            <div><label>Referring RHU Staff:</label> <strong>{referralData.referred_by_name || 'Staff Name'}</strong></div>
                            <div><label>Designation:</label> <strong>{referralData.designation}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
            {!fromPatientProfile && (
                <div className="staff-profile-actions">
                    <button type="button" className="btn-staff-back" onClick={onBack}>Back</button>
                    {onEdit && <button type="button" className="btn-staff-edit" onClick={onEdit}>Edit</button>}
                </div>
            )}
        </div>
    );
}
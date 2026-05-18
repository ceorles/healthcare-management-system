import { useState, useEffect } from 'react';
import { QRCodeSVG } from "qrcode.react";
import { FileText, Clock, QrCode, Printer, Edit, Trash2 } from 'lucide-react';
import '../../assets/css/Referrals.css';

export default function ViewReferral({ referral, onBack, onPrint, onEdit, onDelete }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            <div className="ref-page-header">
                <div className="ref-page-title" style={{ cursor: 'pointer' }} onClick={onBack}><FileText size={24}/> Referral Detail</div>
                <div className="ref-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="ref-view-layout">
                <div>
                    <div className="ref-qr-card">
                        <div className="ref-qr-header"><QrCode size={16}/> QR Code</div>
                        <div className="ref-qr-box">
                            <QRCodeSVG value={referral.referral_code || "PENDING"} size={130} />
                            <strong style={{ marginTop: '15px' }}>{referral.referral_code}</strong>
                        </div>
                    </div>
                    
                    <div className="ref-qr-card" style={{ padding: '20px' }}>
                        <div style={{ fontWeight: '700', marginBottom: '15px', textAlign: 'left', fontSize: '14px' }}>Actions</div>
                        <button className="btn-full green" onClick={onPrint}><Printer size={16}/> Print Referral</button>
                        <button className="btn-full yellow" onClick={onEdit}><Edit size={16}/> Edit Referral</button>
                        <button className="btn-full red" onClick={onDelete}><Trash2 size={16}/> Delete</button>
                    </div>
                </div>

                <div className="ref-info-card">
                    <div className="ref-form-header" style={{ margin: 0, borderRadius: '8px 8px 0 0' }}>Referral Information</div>
                    
                    <div className="ref-info-section ref-view-data-grid">
                        <div><label>Date:</label> <strong>{new Date(referral.created_at).toLocaleDateString()}</strong></div>
                        <div><label>From:</label> <strong>{referral.barangay}</strong></div>
                        <div><label>To:</label> <strong>{referral.referred_to}</strong></div>
                        <div><label>Hospital File:</label> <strong>{referral.hospital_file_no || '-----'}</strong></div>
                        <div><label>Patient Name:</label> <strong>{referral.patient_name_display}</strong></div>
                        <div><label>MHC Case No:</label> <strong>-----</strong></div>
                        <div><label>Age:</label> <strong>{referral.patient_age_display}</strong></div>
                        <div style={{ gridColumn: '1 / -1' }}><label>Address:</label> <strong>{referral.patient_address_display}</strong></div>
                    </div>

                    <div className="ref-form-header" style={{ margin: 0, borderRadius: 0 }}>Medical Details</div>
                    <div className="ref-info-section ref-view-details">
                        <div><label>Chief Complaint:</label> <strong>{referral.chief_complaint || '-----'}</strong></div>
                        <div><label>Brief History:</label> <strong>{referral.brief_history || '-----'}</strong></div>
                        
                        <div className="ref-view-pe-row">
                            <div><label>BP:</label> <strong>{referral.bp || '--'}</strong></div>
                            <div><label>PR:</label> <strong>{referral.pr || '--'}</strong></div>
                            <div><label>RR:</label> <strong>{referral.rr || '--'}</strong></div>
                            <div><label>Temp:</label> <strong>{referral.temp || '--'}</strong></div>
                            <div><label>Wt:</label> <strong>{referral.weight || '--'}</strong></div>
                        </div>

                        <div><label>Impression:</label> <strong>{referral.impression || '-----'}</strong></div>
                        <div><label>Reason for Referral:</label> <strong>{referral.reason || '-----'}</strong></div>
                        <div><label>Services Needed:</label> <strong>{referral.services_needed || '-----'}</strong></div>
                        <div><label>Remarks:</label> <strong>{referral.remarks || '-----'}</strong></div>
                        
                        <div className="ref-view-signature-box">
                            <div><label>Referring RHU Staff:</label> <strong>{referral.referred_by_name || 'Staff Name'}</strong></div>
                            <div><label>Designation:</label> <strong>{referral.designation}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="staff-profile-actions">
                    <button className="btn-staff-back" onClick={onBack}>Back</button>
                    <button className="btn-staff-edit" onClick={onEdit}>Edit</button>
            </div>
        </div>
    );
}
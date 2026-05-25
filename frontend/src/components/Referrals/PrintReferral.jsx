import { QRCodeSVG } from "qrcode.react";
import { Printer } from 'lucide-react';
import SariayaLogo from '../../assets/images/SariayaLogo.png';
import GilasLogo from '../../assets/images/GilasLogo.png';
import '../../assets/css/Referrals.css';
import { trackAuditLog } from '../../utils/auditLog.js';

export default function PrintReferral({ referral, onCancel }) {
    
    const handlePrint = () => {
        trackAuditLog({
            action: 'print',
            targetType: 'Referral',
            targetId: referral.id,
            description: `Printed referral: ${referral.referral_code || 'Pending referral'}`,
        });
        window.print();
    };

    return (
        <div className="print-page-wrapper">

            <div className="print-document">
                
                <div className="print-header-section">
                    <img src={SariayaLogo} alt="Sariaya Logo" className="print-logo" />
                    <div className="print-header-text">
                        <p>Republic of the Philippines</p>
                        <h2>Municipal Health Office</h2>
                        <p>Sariaya, Quezon</p>
                        <h4>Referral Slip</h4>
                    </div>
                    <img src={GilasLogo} alt="Gilas Logo" className="print-logo" />
                </div>

                {/* The Green Border Wrapper */}
                <div className="print-content-border">
                    <div className="print-green-banner">Referral Details/Information</div>
                    
                    <div className="print-top-grid">
                        <div className="print-info-grid">
                            <div className="print-info-item"><label>Date:</label> <strong>{new Date(referral.created_at).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</strong></div>
                            <div className="print-info-item"><label>From:</label> <strong>{referral.barangay}</strong></div>
                            
                            <div className="print-info-item"><label>To:</label> <strong>{referral.referred_to}</strong></div>
                            <div className="print-info-item"><label>Hospital File:</label> <strong>{referral.hospital_file_no || '-----'}</strong></div>
                            
                            <div className="print-info-item"><label>Name of Patient:</label> <strong>{referral.patient_name_display}</strong></div>
                            <div className="print-info-item"><label>MHC Case No:</label> <strong>CN-00001</strong></div>
                            
                            <div className="print-info-item"><label>Age:</label> <strong>{referral.patient_age_display}</strong></div>
                            <div className="print-info-item"></div> {/* Empty spacer */}
                            
                            <div className="print-info-item full-width"><label>Address:</label> <strong>{referral.patient_address_display}</strong></div>
                        </div>

                        <div className="print-qr-section">
                            <div className="print-qr-label">QR Code</div>
                            <QRCodeSVG value={referral.referral_code || "PENDING"} size={85} />
                            <div className="print-qr-verify">Scan to verify Referral</div>
                            <div className="print-qr-code-text">{referral.referral_code}</div>
                        </div>
                    </div>

                    <div className="print-medical-section">
                        <div className="print-medical-item"><label>Chief Complaint:</label> <span>{referral.chief_complaint || '---------------------------------------------------'}</span></div>
                        <div className="print-medical-item"><label>Brief History:</label> <span>{referral.brief_history || '---------------------------------------------------'}</span></div>
                        
                        <div className="print-pe-row">
                            <label>Patient PE Findings:</label> 
                            <div className="print-pe-item"><label>BP</label> <strong>{referral.bp || '00'}</strong></div>
                            <div className="print-pe-item"><label>PR</label> <strong>{referral.pr || '00'}</strong></div>
                            <div className="print-pe-item"><label>RR</label> <strong>{referral.rr || '00'}</strong></div>
                            <div className="print-pe-item"><label>Temp.</label> <strong>{referral.temp || '00'}</strong></div>
                            <div className="print-pe-item"><label>Body Wt:</label> <strong>{referral.weight || '00'}</strong></div>
                        </div>

                        <div className="print-medical-item"><label>Impression:</label> <span>{referral.impression || '---------------------------------------------------'}</span></div>
                        <div className="print-medical-item"><label>Reason for Referral:</label> <span>{referral.reason || '---------------------------------------------------'}</span></div>
                        <div className="print-medical-item"><label>Services Needed:</label> <span>{referral.services_needed || '---------------------------------------------------'}</span></div>
                        <div className="print-medical-item"><label>Remarks:</label> <span>{referral.remarks || '---------------------------------------------------'}</span></div>

                        <div className="print-signature-wrapper">
                            <div className="print-signature-block">
                                <div className="print-sign-line">{referral.referred_by_name || 'Staff Name'}</div>
                                <div className="print-sign-label">Referring RHU Staff</div>
                                
                                <div className="print-sign-line">{referral.designation || 'Designation'}</div>
                                <div className="print-sign-label" style={{ marginBottom: 0 }}>Designation</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* The Print Controls (Moved to the bottom!) */}
            <div className="print-action-buttons">
                <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Printer size={16}/> Print Referral
                </button>
                <button onClick={onCancel} className="btn-secondary">Cancel</button>
            </div>

        </div>
    );
}
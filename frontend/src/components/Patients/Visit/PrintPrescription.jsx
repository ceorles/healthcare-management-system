import { useMemo } from 'react';
import { Printer } from 'lucide-react';
import SariayaLogo from '../../../assets/images/SariayaLogo.png';
import GilasLogo from '../../../assets/images/GilasLogo.png';
import '../../../assets/css/Visit.css';

function getPatientDisplayName(patient) {
    if (!patient) return '-----';
    const parts = [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return patient.full_name || '-----';
}

function getGenderLabel(sex) {
    if (sex === 'M') return 'Male';
    if (sex === 'F') return 'Female';
    return sex || '-----';
}

function formatPrintDate(date = new Date()) {
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function PrintPrescription({ patient, visit, prescriptions, onCancel }) {
    const printDate = useMemo(() => formatPrintDate(new Date()), []);
    const prescribingPhysician = visit?.created_by_name || 'Staff';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="rx-print-overlay">
            <div className="rx-print-page-wrapper">
                <div className="rx-print-document">
                    <div className="rx-print-header-section">
                        <img src={SariayaLogo} alt="Sariaya Logo" className="rx-print-logo" />
                        <div className="rx-print-header-text">
                            <h2>Sariaya Municipal Health Center</h2>
                            <p>Poblacion, Sariaya Quezon</p>
                            <p>Office: (042) 137-5XXX</p>
                        </div>
                        <img src={GilasLogo} alt="Gilas Logo" className="rx-print-logo" />
                    </div>

                    <hr className="rx-print-divider" />

                    <div className="rx-print-date-row">
                        <strong>Date:</strong> {printDate}
                    </div>

                    <div className="rx-print-patient-block">
                        <div className="rx-print-patient-row">
                            <label>Name:</label>
                            <strong>{getPatientDisplayName(patient)}</strong>
                        </div>
                        <div className="rx-print-patient-row">
                            <label>Age:</label>
                            <strong>{patient?.age ?? '-----'}</strong>
                        </div>
                        <div className="rx-print-patient-row">
                            <label>Gender:</label>
                            <strong>{getGenderLabel(patient?.sex)}</strong>
                        </div>
                    </div>

                    <div className="rx-print-body">
                        <div className="rx-print-symbol" aria-hidden="true">℞</div>
                        <div className="rx-print-medications">
                            {prescriptions?.length > 0 ? (
                                <ol className="rx-print-med-list">
                                    {prescriptions.map((rx) => (
                                        <li key={rx.id} className="rx-print-med-item">
                                            <span className="rx-print-med-name">{rx.medication_name}</span>
                                            {(rx.dosage || rx.frequency || rx.duration) && (
                                                <span className="rx-print-med-meta">
                                                    {[rx.dosage, rx.frequency, rx.duration]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </span>
                                            )}
                                            {rx.instructions && (
                                                <span className="rx-print-med-sig">
                                                    Sig: {rx.instructions}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="rx-print-empty">No medications recorded for this visit.</p>
                            )}
                        </div>
                    </div>

                    <div className="rx-print-footer">
                        <div className="rx-print-physician-row">
                            <label>Name of Prescribing Physician:</label>
                            <span className="rx-print-physician-line">{prescribingPhysician}</span>
                        </div>
                        <div className="rx-print-physician-row">
                            <label>License No.</label>
                            {/* License number — reserved for future implementation */}
                            <span className="rx-print-license-line" />
                        </div>
                    </div>
                </div>

                <div className="rx-print-action-buttons">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="visit-btn-save"
                        style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                    >
                        <Printer size={16} /> Print Prescription
                    </button>
                    <button type="button" onClick={onCancel} className="visit-btn-cancel">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

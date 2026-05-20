import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Clock, ChevronLeft, Activity, Info, FileText, Calendar, Pill, Printer,
} from 'lucide-react';
import PrintPrescription from './PrintPrescription';
import '../../../assets/css/Visit.css';
import {
    displayValue,
    formatVisitDateTime,
    formatDateOnly,
    formatAppointmentType,
} from '../../../utils/formatNames';

function ClinicalNoteBlock({ label, value }) {
    return (
        <div className="view-visit-note-block">
            <label>{label}</label>
            <div className="view-visit-note-content">{displayValue(value)}</div>
        </div>
    );
}

export default function ViewVisit({ visitId, patient, onBack }) {
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [visit, setVisit] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPrintPrescription, setShowPrintPrescription] = useState(false);

    useEffect(() => {
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('access');
        const headers = { Authorization: `Bearer ${token}` };

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [visitRes, apptRes] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000/api/visits/${visitId}/`, { headers }),
                    axios.get(`http://127.0.0.1:8000/api/appointments/?patient=${patient.id}`, { headers }),
                ]);
                setVisit(visitRes.data);
                setAppointments(apptRes.data);
            } catch (err) {
                console.error('Error loading visit:', err);
                setError('Unable to load visit details.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [visitId, patient.id]);

    const vitals = visit?.vitals_detail;
    const patientLabel = patient
        ? `${patient.last_name}, ${patient.first_name}${patient.middle_name ? ` ${patient.middle_name.charAt(0)}.` : ''}`
        : visit?.patient_name || 'Patient';

    if (loading) {
        return (
            <div className="visit-page">
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px' }}>Loading visit details...</p>
            </div>
        );
    }

    if (error || !visit) {
        return (
            <div className="visit-page">
                <p style={{ textAlign: 'center', color: '#dc2626', padding: '48px' }}>{error || 'Visit not found.'}</p>
                <div style={{ textAlign: 'center' }}>
                    <button type="button" className="visit-btn-cancel" onClick={onBack}>Go Back</button>
                </div>
            </div>
        );
    }

    const scds = visit.scds_output;
    const prescriptions = visit.prescriptions || [];

    return (
        <div className={`visit-page view-visit-page${showPrintPrescription ? ' view-visit-printing' : ''}`}>
            {showPrintPrescription && (
                <PrintPrescription
                    patient={patient}
                    visit={visit}
                    prescriptions={prescriptions}
                    onCancel={() => setShowPrintPrescription(false)}
                />
            )}
            <div className="visit-page-header">
                <div className="visit-title-row">
                    <button type="button" className="btn-back-form" onClick={onBack} aria-label="Go back">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="page-title">{patientLabel}</h1>
                </div>
                <div className="page-time">
                    <Clock size={16} /> {currentTime}
                </div>
            </div>

            <div className="view-visit-layout">
                <div className="view-visit-column view-visit-sidebar">
                    <div className="visit-card">
                        <div className="visit-section-header view-visit-section-header">
                            <Activity size={16} /> Vital Signs
                        </div>
                        <ul className="view-visit-info-list">
                            <li><span>Blood Pressure</span><strong>{displayValue(vitals?.bp_display !== 'N/A' ? vitals?.bp_display : null)}</strong></li>
                            <li><span>Pulse Rate</span><strong>{displayValue(vitals?.heart_rate ? `${vitals.heart_rate} bpm` : null)}</strong></li>
                            <li><span>Respiratory Rate</span><strong>{displayValue(vitals?.respiratory_rate ? `${vitals.respiratory_rate} /min` : null)}</strong></li>
                            <li><span>Temperature</span><strong>{displayValue(vitals?.temperature ? `${vitals.temperature} °C` : null)}</strong></li>
                            <li><span>Weight / Height</span><strong>{displayValue(vitals?.weight || vitals?.height ? `${vitals?.weight || '—'} kg / ${vitals?.height || '—'} cm` : null)}</strong></li>
                            <li><span>BMI</span><strong>{displayValue(vitals?.bmi)}</strong></li>
                        </ul>
                    </div>

                    <div className="visit-card">
                        <div className="visit-section-header view-visit-section-header">
                            <Info size={16} /> Visit Info
                        </div>
                        <ul className="view-visit-info-list view-visit-info-stack">
                            <li>
                                <span>Date</span>
                                <strong>{formatVisitDateTime(visit.visit_date)}</strong>
                            </li>
                            <li>
                                <span>Recorded By</span>
                                <strong>{visit.created_by_name || 'Staff'}</strong>
                            </li>
                            <li>
                                <span>Assigned Doctor</span>
                                <strong>{visit.doctor_name || 'Unassigned'}</strong>
                            </li>
                            {visit.has_follow_up && visit.follow_up_summary && (
                                <li>
                                    <span>Follow-up</span>
                                    <strong className="view-visit-followup-date">
                                        {formatDateOnly(visit.follow_up_summary.appointment_date)}
                                        {' · '}
                                        {visit.follow_up_summary.doctor_name || 'Unassigned'}
                                    </strong>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="view-visit-column view-visit-main">
                    <div className="visit-card">
                        <div className="visit-section-header view-visit-section-header">
                            <FileText size={16} /> Clinical Notes
                        </div>
                        <ClinicalNoteBlock label="Chief Complaint" value={visit.chief_complaint} />
                        <ClinicalNoteBlock label="Symptoms" value={visit.symptoms} />
                        <ClinicalNoteBlock label="Diagnosis" value={visit.diagnosis} />
                        <ClinicalNoteBlock label="Treatment Given" value={visit.treatment_given} />
                        <ClinicalNoteBlock label="Notes / Remarks" value={visit.notes} />
                    </div>

                    <div className="visit-card">
                        <div className="view-visit-prescriptions-head">
                            <div className="visit-section-header view-visit-section-header">
                                <Pill size={16} /> Prescriptions
                            </div>
                            <button
                                type="button"
                                className="view-visit-print-btn"
                                onClick={() => setShowPrintPrescription(true)}
                                title="Print prescription"
                            >
                                <Printer size={14} /> Print
                            </button>
                        </div>
                        <div className="view-visit-table-wrap">
                            <table className="view-visit-table">
                                <thead>
                                    <tr>
                                        <th>Medication</th>
                                        <th>Dosage</th>
                                        <th>Frequency</th>
                                        <th>Duration</th>
                                        <th>Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescriptions.length > 0 ? (
                                        prescriptions.map((rx) => (
                                            <tr key={rx.id}>
                                                <td>{displayValue(rx.medication_name)}</td>
                                                <td>{displayValue(rx.dosage)}</td>
                                                <td>{displayValue(rx.frequency)}</td>
                                                <td>{displayValue(rx.duration)}</td>
                                                <td>{displayValue(rx.instructions)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>-----</td>
                                            <td>-----</td>
                                            <td>-----</td>
                                            <td>-----</td>
                                            <td>-----</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {scds && (
                        <div className="visit-card scds-card view-visit-scds">
                            <h4>Smart Clinical Decision Support</h4>
                            <p className="scds-subtitle">Insights recorded at time of visit</p>
                            {scds.possible_conditions?.length > 0 && (
                                <div className="scds-block">
                                    <h5>Possible Conditions</h5>
                                    <ul>{scds.possible_conditions.map((item, i) => <li key={`cond-${i}`}>{item}</li>)}</ul>
                                </div>
                            )}
                            {scds.recommended_tests?.length > 0 && (
                                <div className="scds-block">
                                    <h5>Recommended Tests</h5>
                                    <ul>{scds.recommended_tests.map((item, i) => <li key={`test-${i}`}>{item}</li>)}</ul>
                                </div>
                            )}
                            {scds.risk_indicators?.length > 0 && (
                                <div className="scds-block scds-risk">
                                    <h5>Risk Indicators</h5>
                                    <ul>{scds.risk_indicators.map((item, i) => <li key={`risk-${i}`}>{item}</li>)}</ul>
                                </div>
                            )}
                            {scds.recommendations?.length > 0 && (
                                <div className="scds-block">
                                    <h5>Recommendations</h5>
                                    <ul>{scds.recommendations.map((item, i) => <li key={`rec-${i}`}>{item}</li>)}</ul>
                                </div>
                            )}
                            {scds.disclaimer && <p className="scds-disclaimer">{scds.disclaimer}</p>}
                        </div>
                    )}

                    <div className="visit-card">
                        <div className="visit-section-header view-visit-section-header">
                            <Calendar size={16} /> Patient Appointment History
                        </div>
                        <div className="view-visit-table-wrap">
                            <table className="view-visit-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Doctor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length > 0 ? (
                                        appointments.map((appt, index) => (
                                            <tr key={appt.id}>
                                                <td className="view-visit-index">{index + 1}</td>
                                                <td>{appt.patient_name || patientLabel}</td>
                                                <td>{formatDateOnly(appt.appointment_date)}</td>
                                                <td>{formatAppointmentType(appt.appointment_type)}</td>
                                                <td>{appt.doctor_name || 'Unassigned'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="view-visit-index">1</td>
                                            <td>{patientLabel}</td>
                                            <td>-----</td>
                                            <td>-----</td>
                                            <td>-----</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

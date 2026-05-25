import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Clock, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import '../../../assets/css/Visit.css';

const APPOINTMENT_TYPES = [
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'check_up', label: 'Check-up' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'prenatal', label: 'Prenatal' },
    { value: 'other', label: 'Other' },
];

const EMPTY_PRESCRIPTION = {
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
};

function parseBloodPressure(bpString) {
    if (!bpString?.trim()) return { blood_pressure_systolic: null, blood_pressure_diastolic: null };
    const parts = bpString.trim().split('/');
    if (parts.length !== 2) return { blood_pressure_systolic: null, blood_pressure_diastolic: null };
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    return {
        blood_pressure_systolic: Number.isNaN(sys) ? null : sys,
        blood_pressure_diastolic: Number.isNaN(dia) ? null : dia,
    };
}

function calcBmi(weight, height) {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h <= 0) return '';
    const hm = h / 100;
    return (w / (hm * hm)).toFixed(1);
}

function parseApiError(error) {
    const data = error.response?.data;
    if (!data) return 'Error saving visit. Please check required fields.';
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;

    const messages = Object.values(data)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => (typeof value === 'object' ? Object.values(value).flat().join(' ') : String(value)))
        .filter(Boolean);

    return messages.join('\n') || 'Error saving visit. Please check required fields.';
}

export default function NewVisit({ patient, onCancel, onSaveSuccess }) {
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const [doctors, setDoctors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [scdsLoading, setScdsLoading] = useState(false);
    const [scdsOutput, setScdsOutput] = useState(null);
    const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);

    const [formData, setFormData] = useState({
        chief_complaint: '',
        symptoms: '',
        diagnosis: '',
        treatment_given: '',
        notes: '',
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        respiratory_rate: '',
        weight: '',
        height: '',
        follow_up_date: '',
        follow_up_time: '',
        appointment_type: 'follow_up',
        follow_up_doctor: '',
        follow_up_notes: '',
    });

    const bmi = useMemo(
        () => calcBmi(formData.weight, formData.height),
        [formData.weight, formData.height]
    );

    useEffect(() => {
        const timer = setInterval(
            () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            60000
        );
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('access');
        axios
            .get('http://127.0.0.1:8000/api/staff/', { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                const onlyDoctors = res.data.filter((s) => s.role === 'DOCTOR' && s.is_active);
                setDoctors(onlyDoctors);
            })
            .catch(console.error);
    }, []);

    const buildVitalsPayload = useCallback(() => {
        const bp = parseBloodPressure(formData.blood_pressure);
        return {
            ...bp,
            heart_rate: formData.heart_rate || null,
            temperature: formData.temperature || null,
            respiratory_rate: formData.respiratory_rate || null,
            weight: formData.weight || null,
            height: formData.height || null,
        };
    }, [formData]);

    const fetchScds = useCallback(async () => {
        const symptoms = formData.symptoms.trim();
        if (!symptoms) {
            setScdsOutput(null);
            return;
        }

        setScdsLoading(true);
        try {
            const token = localStorage.getItem('access');
            const { data } = await axios.post(
                'http://127.0.0.1:8000/api/visits/analyze-scds/',
                { symptoms, vitals: buildVitalsPayload() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setScdsOutput(data);
        } catch (error) {
            console.error('SCDS analysis failed:', error);
        } finally {
            setScdsLoading(false);
        }
    }, [formData.symptoms, buildVitalsPayload]);

    useEffect(() => {
        if (!formData.symptoms.trim()) {
            setScdsOutput(null);
            return;
        }
        const timer = setTimeout(fetchScds, 600);
        return () => clearTimeout(timer);
    }, [formData.symptoms, formData.blood_pressure, formData.heart_rate, formData.temperature, formData.respiratory_rate, fetchScds]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePrescriptionChange = (index, field, value) => {
        setPrescriptions((prev) => prev.map((row, i) => (
            i === index ? { ...row, [field]: value } : row
        )));
    };

    const addPrescriptionRow = () => {
        setPrescriptions((prev) => [...prev, { ...EMPTY_PRESCRIPTION }]);
    };

    const removePrescriptionRow = (index) => {
        setPrescriptions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.symptoms.trim()) {
            alert('Symptoms are required.');
            return;
        }
        if (!formData.chief_complaint.trim()) {
            alert('Chief complaint is required.');
            return;
        }
        if (scheduleFollowUp) {
            if (!formData.follow_up_date || !formData.follow_up_time) {
                alert('Please set follow-up date and time.');
                return;
            }
            if (!formData.follow_up_doctor) {
                alert('Please assign a doctor for the follow-up appointment.');
                return;
            }
        }

        setSaving(true);
        const token = localStorage.getItem('access');
        const vitals = buildVitalsPayload();

        const payload = {
            patient: patient.id,
            chief_complaint: formData.chief_complaint,
            symptoms: formData.symptoms,
            diagnosis: formData.diagnosis,
            treatment_given: formData.treatment_given,
            notes: formData.notes,
            status: 'completed',
            vitals,
            scds_output: scdsOutput,
            schedule_follow_up: scheduleFollowUp,
        };

        if (scheduleFollowUp) {
            payload.follow_up = {
                appointment_date: formData.follow_up_date,
                appointment_time: formData.follow_up_time,
                appointment_type: formData.appointment_type,
                doctor: formData.follow_up_doctor || null,
                notes: formData.follow_up_notes,
            };
        }

        const filledPrescriptions = prescriptions
            .filter((rx) => rx.medication_name.trim())
            .map((rx) => ({
                medication_name: rx.medication_name.trim(),
                dosage: rx.dosage.trim(),
                frequency: rx.frequency.trim(),
                duration: rx.duration.trim(),
                instructions: rx.instructions.trim(),
            }));

        if (filledPrescriptions.length > 0) {
            payload.prescriptions = filledPrescriptions;
        }

        try {
            await axios.post('http://127.0.0.1:8000/api/visits/', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Visit saved successfully!');
            onSaveSuccess();
        } catch (error) {
            console.error(error);
            alert(parseApiError(error));
        } finally {
            setSaving(false);
        }
    };

    const renderScdsList = (title, items, className = '') => (
        <div className={`scds-block ${className}`}>
            <h5>{title}</h5>
            {items?.length > 0 ? (
                <ul>{items.map((item, i) => <li key={`${title}-${i}`}>{item}</li>)}</ul>
            ) : (
                <p className="scds-empty">---------</p>
            )}
        </div>
    );

    return (
        <div className="visit-page">
            <div className="visit-page-header">
                <div className="visit-title-row">
                    <button type="button" className="btn-back-form" onClick={onCancel} aria-label="Go back">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="page-title">New Visit</h1>
                </div>
                <div className="page-time">
                    <Clock size={16} /> {currentTime}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="visit-layout">
                    <div className="visit-column">
                        <div className="visit-card">
                            <div className="visit-section-header">Vital Signs</div>
                            <div className="visit-vitals-grid">
                                <div className="visit-vital-row">
                                    <label>Blood Pressure</label>
                                    <input
                                        type="text"
                                        name="blood_pressure"
                                        className="visit-input"
                                        placeholder="120/80"
                                        value={formData.blood_pressure}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="visit-vital-row">
                                    <label>Pulse Rate</label>
                                    <input
                                        type="text"
                                        name="heart_rate"
                                        className="visit-input"
                                        placeholder="bpm"
                                        value={formData.heart_rate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="visit-vital-row">
                                    <label>Respiratory Rate</label>
                                    <input
                                        type="text"
                                        name="respiratory_rate"
                                        className="visit-input"
                                        placeholder="/min"
                                        value={formData.respiratory_rate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="visit-vital-row">
                                    <label>Temperature</label>
                                    <input
                                        type="text"
                                        name="temperature"
                                        className="visit-input"
                                        placeholder="°C"
                                        value={formData.temperature}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="visit-vital-row">
                                    <label>Weight / Height</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            name="weight"
                                            className="visit-input"
                                            placeholder="kg"
                                            value={formData.weight}
                                            onChange={handleChange}
                                        />
                                        <input
                                            type="text"
                                            name="height"
                                            className="visit-input"
                                            placeholder="cm"
                                            value={formData.height}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="visit-vital-row">
                                    <label>BMI</label>
                                    <div className="visit-bmi-display">{bmi || '—'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="visit-card">
                            <div className="visit-section-header">Visit Details</div>
                            <div className="visit-field">
                                <label>Chief Complaint</label>
                                <textarea
                                    name="chief_complaint"
                                    className="visit-textarea"
                                    value={formData.chief_complaint}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="visit-field">
                                <label>Symptoms</label>
                                <span className="visit-field-hint">(entering symptoms activates CDS*)</span>
                                <textarea
                                    name="symptoms"
                                    className="visit-textarea"
                                    value={formData.symptoms}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="visit-field">
                                <label>Diagnosis</label>
                                <textarea
                                    name="diagnosis"
                                    className="visit-textarea"
                                    value={formData.diagnosis}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="visit-field">
                                <label>Treatment Given</label>
                                <textarea
                                    name="treatment_given"
                                    className="visit-textarea"
                                    value={formData.treatment_given}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="visit-field">
                                <label>Notes / Remarks</label>
                                <textarea
                                    name="notes"
                                    className="visit-textarea"
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="prescription-card">
                            <div className="visit-section-header">Prescriptions (optional)</div>
                            <p className="visit-field-hint" style={{ marginTop: '-8px', marginBottom: '12px' }}>
                                Add medications prescribed during this visit.
                            </p>

                            {prescriptions.length > 0 && (
                                <div className="prescription-row-header">
                                    <span>Medication</span>
                                    <span>Dosage</span>
                                    <span>Frequency</span>
                                    <span>Duration</span>
                                    <span>Instructions</span>
                                    <span />
                                </div>
                            )}

                            {prescriptions.map((rx, index) => (
                                <div key={`rx-${index}`} className="prescription-row">
                                    <input
                                        type="text"
                                        className="visit-input"
                                        placeholder="Medicine name"
                                        value={rx.medication_name}
                                        onChange={(e) => handlePrescriptionChange(index, 'medication_name', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="visit-input"
                                        placeholder="e.g. 500mg"
                                        value={rx.dosage}
                                        onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="visit-input"
                                        placeholder="e.g. 2x daily"
                                        value={rx.frequency}
                                        onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="visit-input"
                                        placeholder="e.g. 7 days"
                                        value={rx.duration}
                                        onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="visit-input"
                                        placeholder="Take after meals"
                                        value={rx.instructions}
                                        onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="prescription-remove-btn"
                                        onClick={() => removePrescriptionRow(index)}
                                        aria-label="Remove prescription"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            <button type="button" className="prescription-add-btn" onClick={addPrescriptionRow}>
                                <Plus size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Add Prescription
                            </button>
                        </div>
                    </div>

                    <div className="visit-column">
                        <div className="scds-card">
                            <h4>Smart Clinical Decision Support</h4>
                            <p className="scds-subtitle">(Rule-Based for guidance only)</p>

                            {scdsLoading ? (
                                <p className="scds-loading">Analyzing symptoms and vitals...</p>
                            ) : !formData.symptoms.trim() ? (
                                <p className="scds-empty">Enter symptoms to activate clinical decision support.</p>
                            ) : scdsOutput ? (
                                <>
                                    {renderScdsList('Possible Conditions', scdsOutput.possible_conditions)}
                                    {renderScdsList('Recommended Tests', scdsOutput.recommended_tests)}
                                    {renderScdsList('Risk Indicators', scdsOutput.risk_indicators, 'scds-risk')}
                                    {renderScdsList('Recommendations', scdsOutput.recommendations)}
                                    <p className="scds-disclaimer">{scdsOutput.disclaimer}</p>
                                </>
                            ) : null}
                        </div>

                        <div className="followup-card">
                            <div className="followup-header">
                                <h4>Schedule Follow-up Appointment (optional)</h4>
                                <div className="followup-toggle-wrap">
                                    <span>Schedule now</span>
                                    <label className="visit-toggle">
                                        <input
                                            type="checkbox"
                                            checked={scheduleFollowUp}
                                            onChange={(e) => setScheduleFollowUp(e.target.checked)}
                                        />
                                        <span className="visit-toggle-slider" />
                                    </label>
                                </div>
                            </div>

                            {scheduleFollowUp && (
                                <div className="followup-fields">
                                    <div className="visit-field">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            name="follow_up_date"
                                            className="visit-input"
                                            value={formData.follow_up_date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="visit-field">
                                        <label>Time</label>
                                        <input
                                            type="time"
                                            name="follow_up_time"
                                            className="visit-input"
                                            value={formData.follow_up_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="visit-field">
                                        <label>Appointment Type</label>
                                        <select
                                            name="appointment_type"
                                            className="visit-select"
                                            value={formData.appointment_type}
                                            onChange={handleChange}
                                        >
                                            {APPOINTMENT_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="visit-field">
                                        <label>Assigned Doctor</label>
                                        <select
                                            name="follow_up_doctor"
                                            className="visit-select"
                                            value={formData.follow_up_doctor}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select doctor</option>
                                            {doctors.map((d) => {
                                                const name = d.fullname || d.username;
                                                const label = /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
                                                return (
                                                    <option key={d.id} value={d.id}>{label}</option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="visit-field full-width">
                                        <label>Notes / Remarks</label>
                                        <textarea
                                            name="follow_up_notes"
                                            className="visit-textarea"
                                            placeholder="Reason for follow-up appointment..."
                                            value={formData.follow_up_notes}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="visit-form-actions">
                    <button type="button" className="visit-btn-cancel" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="visit-btn-save" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Visit'}
                    </button>
                </div>
            </form>
        </div>
    );
}

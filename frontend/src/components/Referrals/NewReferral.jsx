import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { FilePlus, Clock } from 'lucide-react';
import { BARANGAYS } from '../../constants/barangays.js';
import { getTodayDateInputValue } from '../../utils/age.js';
import '../../assets/css/Referrals.css';

export default function NewReferral({ onCancel, onSaveSuccess }) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [patients, setPatients] = useState([]);
    const [isWalkin, setIsWalkin] = useState(true);
    const [patientSearch, setPatientSearch] = useState('-- Walk-in Patient --');
    const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        patient: '', referral_date: getTodayDateInputValue(), walkin_name: '', walkin_age: '', walkin_address: '', hospital_file_no: '',
        barangay: '', referred_to: 'Sariaya Health Center', designation: 'Sariaya Municipal Health Center',
        chief_complaint: '', brief_history: '', bp: '', pr: '', rr: '', temp: '', weight: '',
        impression: '', reason: '', services_needed: '', remarks: ''
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        axios.get('http://127.0.0.1:8000/api/patients/', { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } })
            .then(res => setPatients(res.data)).catch(console.error);
        return () => clearInterval(timer);
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const filteredPatients = useMemo(() => {
        const search = patientSearch.trim().toLowerCase();
        if (!search || search === '-- walk-in patient --') return patients;
        return patients.filter((patient) => (
            `${patient.full_name || ''} ${patient.patient_id || ''}`.toLowerCase().includes(search)
        ));
    }, [patientSearch, patients]);

    const handlePatientSelect = (val) => {
        if (val === "walkin") {
            setIsWalkin(true);
            setPatientSearch('-- Walk-in Patient --');
            setIsPatientDropdownOpen(false);
            setFormData({ ...formData, patient: '', walkin_name: '', walkin_age: '', walkin_address: '', barangay: '' });
        } else {
            setIsWalkin(false);
            const p = patients.find(pat => pat.id.toString() === val);
            if (!p) return;
            
            // FIXED: We now grab both the address AND the barangay from the patient!
            setPatientSearch(`${p.full_name} (${p.patient_id})`);
            setIsPatientDropdownOpen(false);
            setFormData({ 
                ...formData, 
                patient: val, 
                walkin_name: p.full_name, 
                walkin_age: p.age, 
                walkin_address: p.address,
                barangay: p.barangay
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const finalData = { ...formData };
        
        if (!isWalkin) {
            const linkedPatient = patients.find(p => p.id.toString() === finalData.patient?.toString());
            if (linkedPatient) {
                finalData.barangay = linkedPatient.barangay;
            }
            finalData.walkin_name = '';
            finalData.walkin_age = '';
            finalData.walkin_address = '';
        }

        try {
            await axios.post('http://127.0.0.1:8000/api/referrals/', finalData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            alert("Referral Created Successfully!");
            onSaveSuccess();
        } catch (error) { 
            alert("Error saving referral."); 
            console.error(error); 
        }
    };

    return (
        <div>
            <div className="ref-page-header">
                <div className="ref-page-title"><FilePlus size={24}/> Create Referral</div>
                <div className="ref-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <form onSubmit={handleSubmit} className="ref-form-wrapper">
                <div className="ref-form-header">Referral Slip</div>
                
                <div className="ref-grid ref-grid-2">
                    <div className="ref-input-group"><label>Select Patient:</label>
                        <div className="ref-patient-combobox" onBlur={() => setIsPatientDropdownOpen(false)}>
                            <input
                                type="text"
                                className="ref-input"
                                value={patientSearch}
                                onChange={(e) => {
                                    setPatientSearch(e.target.value);
                                    setIsPatientDropdownOpen(true);
                                }}
                                onFocus={() => setIsPatientDropdownOpen(true)}
                            />
                            {isPatientDropdownOpen && (
                                <div className="ref-patient-dropdown">
                                    <button type="button" onMouseDown={() => handlePatientSelect('walkin')}>
                                        -- Walk-in Patient --
                                    </button>
                                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                        <button type="button" key={p.id} onMouseDown={() => handlePatientSelect(p.id.toString())}>
                                            {p.full_name} ({p.patient_id})
                                        </button>
                                    )) : (
                                        <span>No patients found</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="ref-input-group"><label>Date:</label><input type="date" name="referral_date" className="ref-input" value={formData.referral_date} onChange={handleChange} /></div>
                    </div>

                <div className="ref-grid ref-grid-2">
                    <div className="ref-input-group"><label>Name of Patient:</label><input type="text" name="walkin_name" className="ref-input" value={formData.walkin_name} onChange={handleChange} disabled={!isWalkin} required /></div>
                    <div className="ref-input-group"><label>Age:</label><input type="text" name="walkin_age" className="ref-input" value={formData.walkin_age} onChange={handleChange} disabled={!isWalkin} style={{width: '60px'}}/>
                    <label style={{marginLeft:'10px'}}>Hospital File:</label><input type="text" name="hospital_file_no" className="ref-input" value={formData.hospital_file_no} onChange={handleChange} /></div>
                </div>

                <div className="ref-grid ref-grid-2">
                    <div className="ref-input-group"><label>Barangay:</label>
                        {isWalkin ? (
                            <select name="barangay" className="ref-input" value={formData.barangay} onChange={handleChange} required>
                                <option value="" disabled>Select barangay</option>
                                {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                        ) : (
                            <input type="text" className="ref-input ref-input-readonly" value={formData.barangay} readOnly disabled />
                        )}</div>
                    <div className="ref-input-group"><label>Referred To:</label><input type="text" name="referred_to" className="ref-input" value={formData.referred_to} onChange={handleChange} /></div>
                </div>

                <div className="ref-form-header" style={{ marginTop: '20px' }}>Medical Information</div>
                
                {/* FIXED: Added value={formData...} to all these inputs */}
                <div className="ref-input-group column"><label>Chief Complaint</label><input type="text" name="chief_complaint" value={formData.chief_complaint} className="ref-input" onChange={handleChange}/></div>
                <div className="ref-input-group column"><label>Brief History</label><input type="text" name="brief_history" value={formData.brief_history} className="ref-input" onChange={handleChange}/></div>
                
                <div className="pe-findings-row" style={{ marginTop: '15px' }}>
                    <label style={{fontSize: '12px', fontWeight: 700}}>Patient PE Findings:</label>
                    <div className="pe-box"><label>BP</label><input type="text" name="bp" value={formData.bp} onChange={handleChange}/></div>
                    <div className="pe-box"><label>PR</label><input type="text" name="pr" value={formData.pr} onChange={handleChange}/></div>
                    <div className="pe-box"><label>RR</label><input type="text" name="rr" value={formData.rr} onChange={handleChange}/></div>
                    <div className="pe-box"><label>Temp.</label><input type="text" name="temp" value={formData.temp} onChange={handleChange}/></div>
                    <div className="pe-box"><label>Body Wt:</label><input type="text" name="weight" value={formData.weight} onChange={handleChange}/></div>
                </div>

                <div className="ref-input-group column"><label>Impression</label><input type="text" name="impression" value={formData.impression} className="ref-input" onChange={handleChange}/></div>
                <div className="ref-input-group column"><label>Reason for Referral</label><input type="text" name="reason" value={formData.reason} className="ref-input" onChange={handleChange}/></div>
                <div className="ref-input-group column"><label>Services Needed</label><input type="text" name="services_needed" value={formData.services_needed} className="ref-input" onChange={handleChange}/></div>
                <div className="ref-input-group column"><label>Remarks</label><input type="text" name="remarks" value={formData.remarks} className="ref-input" onChange={handleChange}/></div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Create Referral</button>
                </div>
            </form>
        </div>
    );
}
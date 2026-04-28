import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, Edit2, Shield, Clock } from 'lucide-react';
import '../assets/css/AdminPrograms.css'; // BRAND NEW CSS FILE!

const PREDEFINED_SERVICES = {
    "Medical": { icon: "Stethoscope", subtitle: "General consultation and clinical services" },
    "Dental": { icon: "Smile", subtitle: "Oral health care and education" },
    "Laboratory": { icon: "FlaskConical", subtitle: "Diagnostic testing and screenings" },
    "Health Education": { icon: "BookOpen", subtitle: "Community education and awareness programs" },
    "National Immunization Program": { icon: "Syringe", subtitle: "Vaccination services for all ages" },
    "Nutrition": { icon: "Salad", subtitle: "Nutritional support and supplementation programs" },
    "Disease Surveillance": { icon: "Activity", subtitle: "Monitoring and reporting of communicable diseases" },
    "Integrated Management on Childhood Illnesses": { icon: "Baby", subtitle: "Diagnosis and treatment for children" },
    "Family Planning & Reproductive Health": { icon: "Users", subtitle: "Counseling, education and modern family planning methods" },
    "Adolescent Health Program": { icon: "User", subtitle: "Health services and counseling for the youth" }
};

const PREDEFINED_CORE_VALUES = {
    "Compassion": "Heart", "Equity": "Scale", "Excellence": "Award", "Integrity": "Handshake",
    "Community": "Leaf", "Innovation": "Lightbulb", "Empathy": "HeartHandshake", "Respect": "Smile",
    "Teamwork": "Users", "Accountability": "FileCheck", "Professionalism": "Briefcase", "Resilience": "ShieldCheck"
};

const CATEGORY_ORDER = [ "Medical", "Dental", "Laboratory", "Health Education", "National Immunization Program", "Nutrition", "Disease Surveillance", "Integrated Management on Childhood Illnesses", "Family Planning & Reproductive Health", "Adolescent Health Program" ];

export default function AdminPrograms() {
    const [activeTab, setActiveTab] = useState('contact'); 
    const [message, setMessage] = useState('');

    const [clinicInfo, setClinicInfo] = useState({ id: '', office_phone: '', emergency_hotline: '', email: '', address: '', facebook_link: '', vision: '', mission: '', before_visit: '' });
    const [coreValues, setCoreValues] = useState([]);
    const [services, setServices] = useState([]);
    const [schedules, setSchedules] = useState([]);

    const [newCoreValue, setNewCoreValue] = useState({ title: 'Compassion', description: '', icon_name: 'Heart' });
    const [editingCoreValueId, setEditingCoreValueId] = useState(null);
    const [editingCoreValueDesc, setEditingCoreValueDesc] = useState('');

    const [selectedCategory, setSelectedCategory] = useState('Medical');
    const [newItemText, setNewItemText] = useState('');

    const [isEditingVision, setIsEditingVision] = useState(false);
    const [isEditingMission, setIsEditingMission] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [newReq, setNewReq] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const infoRes = await axios.get('http://127.0.0.1:8000/api/clinic-info/');
            if (infoRes.data.length > 0) setClinicInfo(infoRes.data[0]);
            
            const valRes = await axios.get('http://127.0.0.1:8000/api/core-values/');
            setCoreValues(valRes.data.sort((a, b) => a.id - b.id));

            const servRes = await axios.get('http://127.0.0.1:8000/api/services-cms/');
            setServices(servRes.data.sort((a, b) => CATEGORY_ORDER.indexOf(a.title) - CATEGORY_ORDER.indexOf(b.title)));

            const schedRes = await axios.get('http://127.0.0.1:8000/api/schedules/');
            setSchedules(schedRes.data.sort((a, b) => a.order - b.order));
        } catch (error) { console.error("Error fetching data:", error); }
    };

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } });
    const showMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

    const handleSaveInfo = async (e) => {
        if(e) e.preventDefault();
        try {
            if (clinicInfo.id) await axios.put(`http://127.0.0.1:8000/api/clinic-info/${clinicInfo.id}/`, clinicInfo, getAuthHeader());
            else await axios.post('http://127.0.0.1:8000/api/clinic-info/', clinicInfo, getAuthHeader());
            showMessage('Changes saved successfully!');
            setIsEditingContact(false);
            setIsEditingVision(false); 
            setIsEditingMission(false);
        } catch (error) { showMessage('Error saving changes.'); }
    };

    const handleScheduleChange = async (schedId, field, value) => {
        const updatedSchedules = schedules.map(s => s.id === schedId ? { ...s, [field]: value } : s);
        setSchedules(updatedSchedules);
        const updatedItem = updatedSchedules.find(s => s.id === schedId);
        try { await axios.put(`http://127.0.0.1:8000/api/schedules/${schedId}/`, updatedItem, getAuthHeader()); } 
        catch (error) { showMessage('Error updating schedule.'); }
    };

    const reqArray = clinicInfo.before_visit ? clinicInfo.before_visit.split('\n').filter(i => i.trim() !== '') : [];
    const handleAddReq = (e) => {
        e.preventDefault();
        if(!newReq.trim()) return;
        setClinicInfo({...clinicInfo, before_visit: [...reqArray, newReq.trim()].join('\n')});
        setNewReq('');
    };
    const handleEditReq = (index) => {
        const val = window.prompt("Edit requirement:", reqArray[index]);
        if(val && val.trim() !== "") {
            const arr = [...reqArray];
            arr[index] = val.trim();
            setClinicInfo({...clinicInfo, before_visit: arr.join('\n')});
        }
    };
    const handleDeleteReq = (index) => {
        if(!window.confirm("Remove requirement?")) return;
        const arr = [...reqArray];
        arr.splice(index, 1);
        setClinicInfo({...clinicInfo, before_visit: arr.join('\n')});
    };

    const handleCoreValueCategoryChange = (e) => {
        const title = e.target.value;
        setNewCoreValue({ ...newCoreValue, title, icon_name: PREDEFINED_CORE_VALUES[title] });
    };
    const handleAddCoreValue = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:8000/api/core-values/', newCoreValue, getAuthHeader());
            setNewCoreValue({ title: 'Compassion', description: '', icon_name: 'Heart' }); 
            fetchData();
            showMessage('Core Value added!');
        } catch (error) { showMessage('Error adding core value.'); }
    };
    const handleDeleteCoreValue = async (id) => {
        if (!window.confirm("Delete this core value?")) return;
        await axios.delete(`http://127.0.0.1:8000/api/core-values/${id}/`, getAuthHeader());
        fetchData();
    };
    const handleSaveCoreValueEdit = async (v) => {
        try {
            await axios.put(`http://127.0.0.1:8000/api/core-values/${v.id}/`, { ...v, description: editingCoreValueDesc }, getAuthHeader());
            setEditingCoreValueId(null); 
            fetchData(); 
            showMessage('Core Value updated!');
        } catch (error) { showMessage('Error updating core value.'); }
    };

    const handleAddServiceItem = async (e) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        const existingService = services.find(s => s.title === selectedCategory);
        const { icon, subtitle } = PREDEFINED_SERVICES[selectedCategory];
        try {
            if (existingService) {
                const newDesc = existingService.description ? `${existingService.description}, ${newItemText}` : newItemText;
                await axios.put(`http://127.0.0.1:8000/api/services-cms/${existingService.id}/`, { ...existingService, description: newDesc }, getAuthHeader());
            } else {
                await axios.post('http://127.0.0.1:8000/api/services-cms/', { title: selectedCategory, subtitle, icon_name: icon, description: newItemText }, getAuthHeader());
            }
            setNewItemText(''); fetchData(); showMessage('Item added!');
        } catch (error) { showMessage('Error adding item.'); }
    };
    const handleEditServiceItem = async (service, itemIndex) => {
        const items = service.description.split(',').map(i => i.trim());
        const val = window.prompt("Edit service item:", items[itemIndex]);
        if (val && val.trim() !== "" && val !== items[itemIndex]) {
            items[itemIndex] = val.trim(); 
            try {
                await axios.put(`http://127.0.0.1:8000/api/services-cms/${service.id}/`, { ...service, description: items.join(', ') }, getAuthHeader());
                fetchData();
            } catch (error) { showMessage("Error editing item."); }
        }
    };
    const handleDeleteServiceItem = async (service, itemIndex) => {
        if (!window.confirm("Remove this item?")) return;
        const items = service.description.split(',').map(i => i.trim());
        items.splice(itemIndex, 1); 
        try {
            if (items.length === 0) await axios.delete(`http://127.0.0.1:8000/api/services-cms/${service.id}/`, getAuthHeader());
            else await axios.put(`http://127.0.0.1:8000/api/services-cms/${service.id}/`, { ...service, description: items.join(', ') }, getAuthHeader());
            fetchData();
        } catch (error) { showMessage("Error deleting item."); }
    };

    return (
        <div>
            <h2 className="admin-title">Manage Website Programs</h2>

            <div className="admin-tabs">
                <button className={`admin-tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Services</button>
                <button className={`admin-tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>Vision & Mission</button>
                <button className={`admin-tab-btn ${activeTab === 'corevalues' ? 'active' : ''}`} onClick={() => setActiveTab('corevalues')}>Core Values</button>
                <button className={`admin-tab-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>Contact</button>
            </div>

            {message && <div className="admin-message">{message}</div>}

            {/* SERVICES TAB */}
            {activeTab === 'services' && (
                <div className="admin-grid-sidebar">
                    <form className="admin-card fit-height" onSubmit={handleAddServiceItem}>
                        <div className="admin-card-header"><h4><Plus size={16} /> Add Program Item</h4></div>
                        <div className="admin-form-group">
                            <label className="admin-label">Select Category:</label>
                            <select className="admin-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                {Object.keys(PREDEFINED_SERVICES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-label">Specific Item Name:</label>
                            <input className="admin-input" type="text" placeholder="e.g. Suturing..." value={newItemText} onChange={e => setNewItemText(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn-primary" style={{width: '100%'}}>Add to Category</button>
                    </form>

                    <div className="admin-card">
                        <div className="admin-card-header"><h4>Current Programs</h4></div>
                        {services.length === 0 ? <p style={{color: 'var(--muted)'}}>No services added yet.</p> : (
                            <div>
                                {services.map(service => (
                                    <div key={service.id} style={{marginBottom: '30px'}}>
                                        <h5 style={{color: 'var(--green)', borderBottom: '2px solid var(--green-light)', paddingBottom: '5px', marginBottom: '10px', fontSize: '16px'}}>{service.title}</h5>
                                        <ul className="admin-list-container">
                                            {service.description.split(',').map((item, index) => (
                                                <li className="admin-list-item" key={index}>
                                                    <span>{item.trim()}</span>
                                                    <div className="admin-action-btns">
                                                        <button type="button" className="icon-btn edit" onClick={() => handleEditServiceItem(service, index)}><Edit2 size={16}/></button>
                                                        <button type="button" className="icon-btn delete" onClick={() => handleDeleteServiceItem(service, index)}><Trash2 size={16}/></button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ABOUT TAB (VISION & MISSION) */}
            {activeTab === 'about' && (
                <div className="admin-grid-half">
                    <div className="admin-card vision-card">
                        <div className="shield-icon"><Shield size={24} color="white" /></div>
                        <div className="admin-card-header">
                            <h3 className="vm-title">Our Vision</h3>
                            {!isEditingVision && <button className="edit-toggle-btn" onClick={() => setIsEditingVision(true)}><Edit2 size={14}/> Edit</button>}
                        </div>
                        {isEditingVision ? (
                            <div>
                                <textarea className="admin-textarea" value={clinicInfo.vision} onChange={e => setClinicInfo({...clinicInfo, vision: e.target.value})} rows="5" style={{marginBottom: '15px'}} />
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <button onClick={handleSaveInfo} className="btn-white">Save Changes</button>
                                    <button onClick={() => { setIsEditingVision(false); fetchData(); }} className="btn-outline-white">Cancel</button>
                                </div>
                            </div>
                        ) : <p style={{lineHeight: '1.7', opacity: 0.9, whiteSpace: 'pre-wrap'}}>{clinicInfo.vision}</p>}
                    </div>

                    <div className="admin-card mission-card">
                        <div className="shield-icon"><Shield size={24} color="var(--green)" /></div>
                        <div className="admin-card-header">
                            <h3 className="vm-title" style={{color: 'var(--text)'}}>Our Mission</h3>
                            {!isEditingMission && <button className="edit-toggle-btn" onClick={() => setIsEditingMission(true)}><Edit2 size={14}/> Edit</button>}
                        </div>
                        {isEditingMission ? (
                            <div>
                                <textarea className="admin-textarea" value={clinicInfo.mission} onChange={e => setClinicInfo({...clinicInfo, mission: e.target.value})} rows="8" style={{marginBottom: '15px'}} />
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <button onClick={handleSaveInfo} className="btn-primary">Save Changes</button>
                                    <button onClick={() => { setIsEditingMission(false); fetchData(); }} className="btn-secondary">Cancel</button>
                                </div>
                            </div>
                        ) : <div style={{lineHeight: '1.7', color: 'var(--muted)', whiteSpace: 'pre-wrap'}}>{clinicInfo.mission}</div>}
                    </div>
                </div>
            )}

            {/* CORE VALUES TAB */}
            {activeTab === 'corevalues' && (
                <div className="admin-grid-sidebar">
                    <form className="admin-card fit-height" onSubmit={handleAddCoreValue}>
                        <div className="admin-card-header"><h4><Plus size={16} /> Add Core Value</h4></div>
                        <div className="admin-form-group">
                            <label className="admin-label">Select Core Value:</label>
                            <select className="admin-select" value={newCoreValue.title} onChange={handleCoreValueCategoryChange}>
                                {Object.keys(PREDEFINED_CORE_VALUES).map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-label">Description:</label>
                            <textarea className="admin-textarea" value={newCoreValue.description} onChange={e => setNewCoreValue({...newCoreValue, description: e.target.value})} required rows="4" />
                        </div>
                        <button type="submit" className="btn-primary" style={{width: '100%'}}>Save Value</button>
                    </form>
                    
                    <div className="admin-card">
                        <div className="admin-card-header"><h4>Current Core Values</h4></div>
                        <ul className="admin-list-container">
                            {coreValues.map(v => (
                                <li key={v.id} style={{padding: '15px 0', borderBottom: '1px solid var(--border)'}}>
                                    {editingCoreValueId === v.id ? (
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                            <strong>{v.title}</strong>
                                            <textarea className="admin-textarea" value={editingCoreValueDesc} onChange={e => setEditingCoreValueDesc(e.target.value)} rows="3" />
                                            <div style={{display: 'flex', gap: '10px'}}>
                                                <button onClick={() => handleSaveCoreValueEdit(v)} className="btn-primary" style={{padding: '6px 12px'}}>Save</button>
                                                <button onClick={() => setEditingCoreValueId(null)} className="btn-secondary" style={{padding: '6px 12px'}}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                            <div>
                                                <strong>{v.title}</strong><br/>
                                                <span style={{fontSize: '13px', color: 'var(--muted)'}}>{v.description}</span>
                                            </div>
                                            <div className="admin-action-btns">
                                                <button type="button" className="icon-btn edit" onClick={() => {setEditingCoreValueId(v.id); setEditingCoreValueDesc(v.description);}}><Edit2 size={18}/></button>
                                                <button type="button" className="icon-btn delete" onClick={() => handleDeleteCoreValue(v.id)}><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* CONTACT INFO TAB */}
            {activeTab === 'contact' && (
                <div className="admin-grid-half">
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h4>General Information</h4>
                            {!isEditingContact && <button className="edit-toggle-btn" style={{background: 'var(--green-light)', color: 'var(--green)'}} onClick={() => setIsEditingContact(true)}><Edit2 size={14}/> Edit</button>}
                        </div>

                        {isEditingContact ? (
                            <form onSubmit={handleSaveInfo}>
                                <div className="admin-form-group"><label className="admin-label">Office Phone</label><input className="admin-input" type="text" value={clinicInfo.office_phone} onChange={(e) => setClinicInfo({...clinicInfo, office_phone: e.target.value})} /></div>
                                <div className="admin-form-group"><label className="admin-label">Emergency Hotline</label><input className="admin-input" type="text" value={clinicInfo.emergency_hotline} onChange={(e) => setClinicInfo({...clinicInfo, emergency_hotline: e.target.value})} /></div>
                                <div className="admin-form-group"><label className="admin-label">Email Address</label><input className="admin-input" type="email" value={clinicInfo.email} onChange={(e) => setClinicInfo({...clinicInfo, email: e.target.value})} /></div>
                                <div className="admin-form-group"><label className="admin-label">Facebook Link</label><input className="admin-input" type="url" value={clinicInfo.facebook_link || ''} onChange={(e) => setClinicInfo({...clinicInfo, facebook_link: e.target.value})} /></div>
                                <div className="admin-form-group"><label className="admin-label">Clinic Address</label><textarea className="admin-textarea" value={clinicInfo.address} onChange={(e) => setClinicInfo({...clinicInfo, address: e.target.value})} rows="3" /></div>
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <button type="submit" className="btn-primary">Save Changes</button>
                                    <button type="button" className="btn-secondary" onClick={() => { setIsEditingContact(false); fetchData(); }}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', color: 'var(--muted)', fontSize: '14px'}}>
                                <div><strong style={{color: 'var(--text)'}}>Office Phone</strong><br/>{clinicInfo.office_phone}</div>
                                <div><strong style={{color: 'var(--text)'}}>Emergency Hotline</strong><br/>{clinicInfo.emergency_hotline}</div>
                                <div><strong style={{color: 'var(--text)'}}>Email Address</strong><br/>{clinicInfo.email}</div>
                                <div><strong style={{color: 'var(--text)'}}>Facebook Link</strong><br/>{clinicInfo.facebook_link || 'N/A'}</div>
                                <div><strong style={{color: 'var(--text)'}}>Clinic Address</strong><br/>{clinicInfo.address}</div>
                            </div>
                        )}
                    </div>

                    <div className="admin-card">
                        <div className="admin-card-header"><h4><Clock size={20} color="var(--green)"/> Operating Hours</h4></div>
                        <div className="schedule-container">
                            {schedules.map(sched => (
                                <div className="schedule-row" key={sched.id}>
                                    <div className="schedule-day">{sched.day}</div>
                                    <input className="schedule-input" type="text" value={sched.hours} onChange={(e) => handleScheduleChange(sched.id, 'hours', e.target.value)} />
                                    <select className={`schedule-select ${sched.is_open ? 'open' : 'closed'}`} value={sched.is_open ? "true" : "false"} onChange={(e) => handleScheduleChange(sched.id, 'is_open', e.target.value === "true")}>
                                        <option value="true">Open</option>
                                        <option value="false">Closed</option>
                                    </select>
                                </div>
                            ))}
                            <div className="schedule-note">* Changes to schedule are saved automatically.</div>
                        </div>
                    </div>

                    <div className="admin-grid-full">
                        <form className="admin-card fit-height" onSubmit={handleAddReq} style={{marginBottom: '20px', padding: '20px'}}>
                            <div className="admin-card-header" style={{marginBottom: '15px'}}><h4><Plus size={16} /> Add Visit Requirement</h4></div>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <input className="admin-input" type="text" placeholder="e.g. Bring PhilHealth ID..." value={newReq} onChange={e => setNewReq(e.target.value)} required />
                                <button type="submit" className="btn-primary">Add</button>
                            </div>
                        </form>

                        <div className="admin-card fit-height" style={{padding: '20px'}}>
                            <div className="admin-card-header">
                                <h4>Current Requirements</h4>
                                <button onClick={handleSaveInfo} className="btn-secondary" style={{padding: '4px 10px', fontSize: '12px'}}>Save List Order</button>
                            </div>
                            {reqArray.length === 0 ? <p style={{color: 'var(--muted)'}}>No requirements added yet.</p> : (
                                <ul className="admin-list-container">
                                    {reqArray.map((req, index) => (
                                        <li className="admin-list-item" key={index}>
                                            <span>{req}</span>
                                            <div className="admin-action-btns">
                                                <button type="button" className="icon-btn edit" onClick={() => handleEditReq(index)}><Edit2 size={16}/></button>
                                                <button type="button" className="icon-btn delete" onClick={() => handleDeleteReq(index)}><Trash2 size={16}/></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
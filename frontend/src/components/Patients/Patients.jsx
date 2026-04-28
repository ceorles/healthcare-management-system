import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Clock, Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import '../../assets/css/Patients.css';

const BARANGAYS = [
    'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4', 'Poblacion 5', 'Poblacion 6',
    'Antipolo', 'Balubal', 'Bignay 1', 'Bignay 2', 'Bucal', 'Canda', 'Castañas', 
    'Concepcion 1', 'Concepcion Banahaw', 'Concepcion Palasan', 'Concepcion Pinagbukuran', 
    'Gibanga', 'Guisguis San Roque', 'Guisguis Talon', 'Janagdong 1', 'Janagdong 2', 
    'Limbon', 'Lutucan 1', 'Lutucan Bata', 'Lutucan Malabag', 'Mamala 1', 'Mamala 2', 
    'Manggalang 1', 'Manggalang Bantilan', 'Manggalang Kiling', 'Manggalang Tulo-Tulo', 
    'Montecillo', 'Morong', 'Pili', 'Sampaloc 1', 'Sampaloc 2', 'Sampaloc Bogon', 
    'Sto. Cristo', 'Talaan Aplaya', 'Talaan Pantoc', 'Tumbaga 1', 'Tumbaga 2'
];

export default function Patients({ onAddNew, onView, onEdit, onDelete }) {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBarangay, setFilterBarangay] = useState('All Barangays');
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        fetchPatients();
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/patients/', {
                headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
            });
            setPatients(response.data);
        } catch (error) { console.error("Error fetching patients:", error); }
    };

    // Filter Logic
    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBarangay = filterBarangay === 'All Barangays' || p.barangay === filterBarangay;
        return matchesSearch && matchesBarangay;
    });

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-title"><Users size={24}/> Patient Records</div>
                <div className="page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group" style={{ flex: 1.5 }}>
                    <label>Search Patient</label>
                    <div className="search-wrapper">
                        <Search size={16} className="search-icon" />
                        <input type="text" className="search-input" placeholder="Name, patient ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="filter-group">
                    <label>Filter by Barangay</label>
                    <select className="filter-select" value={filterBarangay} onChange={e => setFilterBarangay(e.target.value)}>
                        <option value="All Barangays">All Barangays</option>
                        {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <button className="btn-filter"><Filter size={16}/> Filter</button>
            </div>

            {/* Table Header */}
            <div className="table-header-row">
                <h3>All Patients ({filteredPatients.length})</h3>
                <button onClick={onAddNew} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> New Patient
                </button>
            </div>

            {/* Table */}
            <table className="patient-table">
                <thead>
                    <tr>
                        <th>PATIENT ID</th>
                        <th>NAME</th>
                        <th>AGE / SEX</th>
                        <th>BARANGAY</th>
                        <th>CONTACT</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                        <tr key={p.id}>
                            <td className="patient-id-text">{p.patient_id}</td>
                            <td style={{ fontWeight: 600 }}>{p.full_name}</td>
                            <td>{p.age}y / {p.sex === 'M' ? 'Male' : 'Female'}</td>
                            <td>{p.barangay}</td>
                            <td>{p.contact_number || 'N/A'}</td>
                            <td>
                                <div className="action-btns" style={{ justifyContent: 'center' }}>
                                    <button className="btn-action view" onClick={() => onView(p)}><Eye size={16}/></button>
                                    <button className="btn-action edit" onClick={() => onEdit(p)}><Edit size={16}/></button>
                                    <button className="btn-action delete" onClick={() => onDelete(p)}><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No patients found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
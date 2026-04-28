import { useState, useEffect } from 'react';
import axios from 'axios';
import { List, Clock, Search, Filter, Plus, Eye, Printer, Edit, Trash2 } from 'lucide-react';
import '../../assets/css/Referrals.css';

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

export default function Referrals({ onAddNew, onView, onEdit, onDelete, onPrint }) {
    const [referrals, setReferrals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBarangay, setFilterBarangay] = useState('All Barangays');
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    useEffect(() => {
        fetchReferrals();
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchReferrals = async () => {
        try {
            const token = localStorage.getItem('access');
            const response = await axios.get('http://127.0.0.1:8000/api/referrals/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReferrals(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching referrals:", error);
            setLoading(false);
        }
    };

    const filteredReferrals = referrals.filter(r => {
        const searchString = `${r.patient_name_display} ${r.referral_code} ${r.urgency}`.toLowerCase();
        const matchesSearch = searchString.includes(searchTerm.toLowerCase());
        const matchesBarangay = filterBarangay === 'All Barangays' || r.barangay === filterBarangay;
        return matchesSearch && matchesBarangay;
    });

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '80vh' }}>
            
            {/* Header */}
            <div className="ref-page-header">
                <div className="ref-page-title"><List size={24}/> Referral Records</div>
                <div className="ref-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="ref-filter-bar">
                <div className="ref-filter-group expand">
                    <label>Search Referral</label>
                    <div className="ref-search-wrapper">
                        <Search size={16} className="ref-search-icon" />
                        <input type="text" className="ref-search-input" placeholder="Name, patient id, urgency..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="ref-filter-group">
                    <label>Filter by Barangays</label>
                    <select className="ref-filter-select" value={filterBarangay} onChange={e => setFilterBarangay(e.target.value)}>
                        <option value="All Barangays">All Barangays</option>
                        {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <button className="ref-btn-filter"><Filter size={16}/> Filter</button>
            </div>

            <div className="ref-table-header-row">
                <h3>All Referrals ({filteredReferrals.length})</h3>
                <button onClick={onAddNew} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981' }}>
                    <Plus size={16} /> New Referral
                </button>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '50px' }}>Loading referral records...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="ref-table">
                        <thead>
                            <tr>
                                <th>CODE</th>
                                <th>PATIENT</th>
                                <th>BARANGAY</th>
                                <th>TO</th>
                                <th>URGENCY</th>
                                <th>BY</th>
                                <th>DATE</th>
                                <th style={{ textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReferrals.length > 0 ? filteredReferrals.map(r => (
                                <tr key={r.id} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td className="ref-code-text">{r.referral_code}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.patient_name_display || 'Walk-in'}</td>
                                    <td>{r.barangay}</td>
                                    
                                    {/* Truncated "TO" column */}
                                    <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.referred_to}>
                                        {r.referred_to}
                                    </td>
                                    
                                    <td style={{ textTransform: 'capitalize' }}>{r.urgency}</td>
                                    <td>{r.referred_by_name || 'Admin'}</td>
                                    <td>{formatDate(r.created_at)}</td>
                                    
                                    <td>
                                        <div className="ref-action-btns">
                                            <button className="ref-btn-action view" onClick={() => onView(r)} title="View"><Eye size={16}/></button>
                                            
                                            <button className="ref-btn-action print" onClick={() => onPrint(r)} title="Print"><Printer size={16}/></button>
                                            
                                            <button className="ref-btn-action edit" onClick={() => onEdit(r)} title="Edit"><Edit size={16}/></button>
                                            <button className="ref-btn-action delete" onClick={() => onDelete(r)} title="Delete"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No referrals found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { List, Clock, Search, Filter, Plus, Eye, Printer, Edit, Trash2, QrCode } from 'lucide-react';
import ReferralQRScanner from './ReferralQRScanner.jsx';
import { parseReferralCodeFromQr } from '../../utils/patientPrefill.js';
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
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBarangay, setFilterBarangay] = useState('All Barangays');
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [scanProcessing, setScanProcessing] = useState(false);
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
        const searchString = `${r.patient_name_display} ${r.referral_code} ${r.barangay} ${r.referred_to}`.toLowerCase();
        const matchesSearch = searchString.includes(searchTerm.toLowerCase());
        const matchesBarangay = filterBarangay === 'All Barangays' || r.barangay === filterBarangay;
        return matchesSearch && matchesBarangay;
    });

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const handleQrScan = useCallback(async (decodedText) => {
        const code = parseReferralCodeFromQr(decodedText);
        if (!code) {
            alert('Invalid QR code. No referral code was detected.');
            return;
        }

        setShowScanner(false);
        setScanProcessing(true);

        try {
            const token = localStorage.getItem('access');
            const { data } = await axios.get('http://127.0.0.1:8000/api/referrals/lookup-by-code/', {
                params: { code },
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.has_registered_patient && data.patient) {
                navigate('/admin/patients', {
                    state: {
                        qrRedirect: {
                            type: 'view',
                            patient: data.patient,
                            referralCode: data.referral_code,
                        },
                    },
                });
                return;
            }

            navigate('/admin/patients', {
                state: {
                    qrRedirect: {
                        type: 'new',
                        prefill: {
                            ...data.walkin_prefill,
                            referral_code: data.referral_code,
                            referral_id: data.referral_id,
                        },
                    },
                },
            });
        } catch (error) {
            if (error.response?.status === 404) {
                setSearchTerm(code);
                alert(`Referral "${code}" was not found in the system.`);
            } else {
                console.error('QR lookup failed:', error);
                alert('Could not verify this referral QR code. Please try again.');
            }
        } finally {
            setScanProcessing(false);
        }
    }, [navigate]);

    return (
        <div className="referrals-page">
            <div className="ref-page-header">
                <div className="ref-page-title"><List size={24}/> Referral Records</div>
                <div className="ref-page-time"><Clock size={16}/> {currentTime}</div>
            </div>

            <div className="ref-filter-bar">
                <div className="ref-filter-group expand">
                    <label>Search Referral</label>
                    <div className="ref-search-wrapper">
                        <Search size={16} className="ref-search-icon" />
                        <input
                            type="text"
                            className="ref-search-input"
                            placeholder="Name, patient id, urgency"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="ref-filter-group">
                    <label>Filter by Barangays</label>
                    <select className="ref-filter-select" value={filterBarangay} onChange={e => setFilterBarangay(e.target.value)}>
                        <option value="All Barangays">All Barangays</option>
                        {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <button type="button" className="ref-btn-filter"><Filter size={16}/> Filter</button>
            </div>

            <div className="ref-table-header-row">
                <h3>All Referrals ({filteredReferrals.length})</h3>
                <div className="ref-header-actions">
                    <button type="button" className="ref-btn-scan" onClick={() => setShowScanner(true)} disabled={scanProcessing}>
                        <QrCode size={16} /> {scanProcessing ? 'Processing...' : 'Scan QR Code'}
                    </button>
                    <button type="button" onClick={onAddNew} className="ref-btn-new">
                        <Plus size={16} /> New Referral
                    </button>
                </div>
            </div>

            <div className="ref-table-container">
                {loading ? (
                    <p className="ref-loading">Loading referral records...</p>
                ) : (
                    <table className="ref-table">
                        <thead>
                            <tr>
                                <th>CODE</th>
                                <th>PATIENT</th>
                                <th>BARANGAY</th>
                                <th>TO</th>
                                <th>BY</th>
                                <th>DATE</th>
                                <th style={{ textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReferrals.length > 0 ? filteredReferrals.map(r => (
                                <tr key={r.id} className="ref-table-row">
                                    <td className="ref-code-text">{r.referral_code}</td>
                                    <td className="ref-patient-name">{r.patient_name_display || 'Walk-in'}</td>
                                    <td>{r.barangay}</td>
                                    <td className="ref-to-cell" title={r.referred_to}>{r.referred_to}</td>
                                    <td>{r.referred_by_name || 'Admin'}</td>
                                    <td>{formatDate(r.created_at)}</td>
                                    <td>
                                        <div className="ref-action-btns">
                                            <button type="button" className="ref-btn-action view" onClick={() => onView(r)} title="View"><Eye size={16}/></button>
                                            <button type="button" className="ref-btn-action print" onClick={() => onPrint(r)} title="Print"><Printer size={16}/></button>
                                            <button type="button" className="ref-btn-action edit" onClick={() => onEdit(r)} title="Edit"><Edit size={16}/></button>
                                            <button type="button" className="ref-btn-action delete" onClick={() => onDelete(r)} title="Delete"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="ref-empty">No referrals found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <ReferralQRScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleQrScan}
            />
        </div>
    );
}

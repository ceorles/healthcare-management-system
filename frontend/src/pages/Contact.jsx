import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Phone, Mail, MessageCircle, AlertTriangle } from 'lucide-react';
import PageBanner from '../components/PageBanner.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import "../assets/css/Contact.css";

export default function Contact() {
    const [clinicInfo, setClinicInfo] = useState({
        address: 'Municipal Health Center',
        office_phone: '',
        emergency_hotline: '',
        email: '',
        facebook_link: '',
        before_visit: ''
    });

    // NEW: Dynamic Schedule State
    const [hours, setHours] = useState([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/clinic-info/')
            .then(res => {
                if(res.data.length > 0) setClinicInfo(res.data[0]);
            })
            .catch(err => console.error(err));

        // Fetch dynamic schedules!
        axios.get('http://127.0.0.1:8000/api/schedules/')
            .then(res => {
                setHours(res.data.sort((a, b) => a.order - b.order));
            })
            .catch(err => console.error(err));
    }, []);

    const reqArray = clinicInfo.before_visit ? clinicInfo.before_visit.split('\n').filter(i => i.trim() !== '') : [];
    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(clinicInfo.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    return (
        <>
        <PageBanner title="Contact Us" subtitle="For appointments, inquiries, or any healthcare concerns. We're here to help you." />

        <section className="contact-section alt">
            <div className="contact-grid">

            <div>
                <div className="section-label">Get in Touch</div>
                <h2 className="section-title" style={{ marginBottom: 28 }}>How to Reach Us</h2>

                <div className="info-cards">
                    <div className="info-card">
                        <div className="info-icon"><MapPin /></div>
                        <div>
                            <h4>Address</h4>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{clinicInfo.address}</p>
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"><Phone /></div>
                        <div>
                            <h4>Phone</h4>
                            <a href={`tel:${clinicInfo.office_phone}`}>{clinicInfo.office_phone}</a>
                            <a href={`tel:${clinicInfo.emergency_hotline}`}>{clinicInfo.emergency_hotline}</a>
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"><Mail /></div>
                        <div>
                            <h4>Email</h4>
                            <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a>
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-icon"><MessageCircle /></div>
                        <div>
                            <h4>Facebook</h4>
                            <a href={clinicInfo.facebook_link || '#'} target="_blank" rel="noopener noreferrer">MHC Sariaya Official</a>
                        </div>
                    </div>
                </div>

                <div className="emergency-box">
                    <div>
                        <h4 className="emergency-title"><AlertTriangle size={20} className="emergency-icon" /><span>Emergency Hotline</span></h4>
                        <span className="emergency-hotline">{clinicInfo.emergency_hotline}</span>
                        <p>Available 24 hours, 7 days a week</p>
                    </div>
                    <span className="badge">24 / 7</span>
                </div>

                <div className="before-visit">
                    <h4>Before Your Visit</h4>
                    <ul>
                        {reqArray.map((item, index) => (
                        <li key={index}><span className="before-visit-check">✓</span>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div>
                <div className="map-container">
                    <iframe src={mapUrl} width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>

                <div className="hours-table">
                    <table>
                        <thead>
                            <tr><th>Day</th><th>Hours</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                        {hours.map(({ id, day, hours, is_open }) => (
                            <tr key={id}>
                            <td>{day}</td>
                            <td>{hours}</td>
                            <td>
                                <span className={is_open ? 'badge-open' : 'badge-closed'}>
                                {is_open ? 'Open' : 'Closed'}
                                </span>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            </div>
        </section>

        <CtaBanner title="Need Medical Assistance?" subtitle="Visit us during office hours or call our emergency hotline anytime." primaryTo="/services" primaryText="View Our Services" secondaryTo="/about" secondaryText="About Us" />
        </>
    )
}
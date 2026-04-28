import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'
import {
  Stethoscope, Smile, FlaskConical, Syringe, Salad, Users,
  Hospital, UserRoundCheck, ClipboardList, PhoneCall, Building2, Image,
} from 'lucide-react'
import * as Icons from 'lucide-react';
import CtaBanner from '../components/CtaBanner.jsx'
import "../assets/css/Home.css";
import BG from "../assets/images/landing-bg.png";
import MH from "../assets/images/smhc_image.png";


/* ── Data ── */
const stats = [
  // { num: '9+',   label: 'Health Programs'     },
  // { num: '30+',  label: 'Lab Tests Available'  },
  // { num: 'Free', label: 'Basic Consultations'  },
  // { num: '24/7', label: 'Emergency Hotline'    },
]

const CATEGORY_ORDER = [
    "Medical", "Dental", "Laboratory", "Health Education", 
    "National Immunization Program", "Nutrition"
];

const serviceCards = [
    { icon: <Stethoscope />, 
        title: 'Medical',         
        desc: 'Consultation, minor surgery, wound care & more',
        hash: 'medical'},
    { icon: <Smile />,
        title: 'Dental',          
        desc: 'Dental health education & tooth extraction',      
        hash: 'dental'},
    { icon: <FlaskConical />,
        title: 'Laboratory',     
        desc: '30+ diagnostic tests and screenings',
        hash: 'laboratory'
    },
    { icon: <Syringe />, 
        title: 'Immunization',    
        desc: 'Vaccines for children, schools & seniors',        
        hash: 'immunization'},
    { icon: <Salad />,   
        title: 'Nutrition',       
        desc: 'Supplemental feeding & micronutrient programs',   
        hash: 'nutrition'},
    { icon: <Users />,   
        title: 'Family Planning', 
        desc: 'Counseling, modern methods & cancer screening',   
        hash: 'family-planning'},
]

const whyItems = [
    { icon: <Hospital />,         
        title: 'Accessible to All',       
        desc: 'Free basic consultations and services available to every resident of Sariaya regardless of financial capacity.'},
    { icon: <UserRoundCheck />,   
        title: 'Trained Professionals',   
        desc: 'Our team of licensed doctors, nurses, midwives and health workers are dedicated to your wellbeing.'},
    { icon: <ClipboardList />,    
        title: 'Comprehensive Programs',  
        desc: 'From immunization to disease surveillance — we cover every stage of your health journey.'},
    { icon: <PhoneCall />,        
        title: 'Emergency Hotline',       
        desc: '24/7 emergency response line for immediate medical concerns in our community.'},
]

export default function Home() {
    const [services, setServices] = useState([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/services-cms/')
            .then(res => {
                const sortedServices = res.data.sort((a, b) => {
                    return CATEGORY_ORDER.indexOf(a.title) - CATEGORY_ORDER.indexOf(b.title);
                });
                setServices(sortedServices);
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <>
        {/* ── Hero ── */}
        <section className="hero">
            <div className="hero-content">
            {/* <div className="hero-badge">
                <span className="hero-badge-dot" />
                Serving Sariaya since the 1980s
            </div> */}
            <h1>Municipal Health Center<br />of Sariaya</h1>
            <p>Compassionate care, healthier community, stronger future. Quality healthcare services accessible to every Sariayanin.</p>
            <div className="hero-btns">
                <Link to="/services" className="btn-white">View Our Services</Link>
                <Link to="/contact"  className="btn-outline-white">Contact Us</Link>
            </div>
            </div>
            <div className="hero-image">
            <div className="hero-image-placeholder">
                <img src={BG} alt="BACKGROUND IMAGE"></img>
            </div>
            </div>
        </section>

        {/* ── Stats Strip ── */}
        <div className="stats-strip">
            {stats.map(({ num, label }) => (
            <div className="stat-item" key={label}>
                <span className="stat-num">{num}</span>
                <span className="stat-label">{label}</span>
            </div>
            ))}
        </div>

        {/* ── Welcome ── */}
        <section className="welcome-section">
            <div className="section-label">Welcome</div>
            <h2 className="section-title">Your Community Health Partner</h2>
            <p>The Municipal Health Center of Sariaya, Quezon is committed to delivering affordable, accessible, and quality healthcare services to every member of our community.</p>

            <div className="service-cards">
                {/* DYNAMIC HOME PAGE CARDS! (Only shows the first 6 to keep it tidy) */}
                {services.slice(0, 6).map((svc) => {
                    const IconCmp = Icons[svc.icon_name] || Icons.Circle;
                    return (
                        <Link to={`/services#service-${svc.id}`} className="service-card" key={svc.id}>
                            <span className="service-card-icon"><IconCmp /></span>
                            <h3>{svc.title}</h3>
                            <p>{svc.subtitle}</p>
                        </Link>
                    );
                })}
            </div>
            <Link to="/services" className="btn-primary">View All Services →</Link>
        </section>

        {/* ── Why Us ── */}
        <section className="why-section">
            <div className="section-label">Why Choose Us</div>
            <h2 className="section-title">Healthcare You Can Trust</h2>
            <div className="why-grid">
            <div className="why-list">
                {whyItems.map(({ icon, title, desc }) => (
                <div className="why-item" key={title}>
                    <div className="why-icon">{icon}</div>
                    <div>
                    <h4>{title}</h4>
                    <p>{desc}</p>
                    </div>
                </div>
                ))}
            </div>
            <div className="why-image">
                <div className="why-img-placeholder">
                <img src={MH} alt="Health Center"></img>
                </div>
            </div>
            </div>
        </section>

        {/* ── CTA ── */}
        <CtaBanner
            title="Join Us in Building a Healthier Community"
            subtitle="Whether you need medical care or want to learn more about our services, we're here to help."
            primaryTo="/services"   primaryText="View Our Services"
            secondaryTo="/contact"  secondaryText="Contact Us"
        />
        </>
    )
}
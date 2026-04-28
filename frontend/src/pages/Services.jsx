import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as Icons from 'lucide-react'; // Dynamic Icons
import { LayoutList } from 'lucide-react';
import CtaBanner from '../components/CtaBanner.jsx';
import "../assets/css/Services.css";

const CATEGORY_ORDER = [
    "Medical", "Dental", "Laboratory", "Health Education", 
    "National Immunization Program", "Nutrition", "Disease Surveillance", 
    "Integrated Management on Childhood Illnesses", 
    "Family Planning & Reproductive Health", "Adolescent Health Program"
];

export default function Services() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeId, setActiveId] = useState('');
    const [services, setServices] = useState([]); // Dynamic Services State
    const sectionRefs = useRef({});

    useEffect(() => {
        // Fetch services from Django
        axios.get('http://127.0.0.1:8000/api/services-cms/')
            .then(res => {
                const sortedServices = res.data.sort((a, b) => {
                    return CATEGORY_ORDER.indexOf(a.title) - CATEGORY_ORDER.indexOf(b.title);
                });
                
                setServices(sortedServices);
                if(sortedServices.length > 0) setActiveId(`service-${sortedServices[0].id}`);
            })
            .catch(err => console.error(err));
    }, []);

    // Scroll-spy: highlight sidebar on scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                });
            },
            { rootMargin: '-30% 0px -60% 0px' }
        );
        Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
        return () => observer.disconnect();
    }, [services]); // Re-run when services load

    const scrollTo = (id) => {
        setSidebarOpen(false);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
            <LayoutList size={16} strokeWidth={2} /> Browse by Category
        </button>
        <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

        <div className="services-layout">
            <aside className={`services-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-label">Categories</div>
                <ul className="sidebar-nav">
                    {/* DYNAMIC SIDEBAR LINKS */}
                    {services.map((svc) => {
                        const IconCmp = Icons[svc.icon_name] || Icons.Circle;
                        const blockId = `service-${svc.id}`;
                        return (
                            <li key={svc.id}>
                                <button className={activeId === blockId ? 'active' : ''} onClick={() => scrollTo(blockId)}>
                                    <span className="nav-icon"><IconCmp /></span> {svc.title}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            <main className="services-content">
                <div className="section-label">What We Offer</div>
                <h2 className="section-title">Our Services</h2>
                <p className="content-intro">Comprehensive healthcare services designed to meet the needs of every member of our community in Sariaya, Quezon.</p>

                {/* DYNAMIC SERVICE BLOCKS */}
                {services.map((svc) => {
                    const IconCmp = Icons[svc.icon_name] || Icons.Circle;
                    const blockId = `service-${svc.id}`;
                    
                    // Split the comma-separated string from Admin into an array of items
                    const itemsArray = svc.description.split(',').map(item => item.trim()).filter(item => item !== '');

                    return (
                        <div className="service-category" id={blockId} key={svc.id} ref={el => sectionRefs.current[blockId] = el}>
                            <div className="category-header">
                                <div className="category-icon"><IconCmp /></div>
                                <div>
                                    <h2>{svc.title}</h2>
                                    <p>{svc.subtitle}</p>
                                </div>
                            </div>
                            <div className="service-list">
                                {itemsArray.map((item, index) => (
                                    <div className="service-item" key={index}>
                                        <div className="service-dot" />
                                        <span className="service-text">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>

        <CtaBanner title="Need to Visit Us?" subtitle="Our staff is ready to assist you. Check our contact details or visit during office hours." primaryTo="/contact" primaryText="Contact Us" secondaryTo="/about" secondaryText="About Us" />
        </>
    );
}
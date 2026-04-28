import { useState, useEffect } from 'react';
import axios from 'axios';
import * as Icons from 'lucide-react'; // Imports all icons so we can use them dynamically
import { Target, HeartPulse } from 'lucide-react';
import PageBanner from '../components/PageBanner.jsx';
import CtaBanner from '../components/CtaBanner.jsx';
import "../assets/css/About.css";
import image from "../assets/images/smhc_image.png";

export default function About() {
    const [clinicInfo, setClinicInfo] = useState({ vision: '', mission: '' });
    const [coreValues, setCoreValues] = useState([]);

    useEffect(() => {
        // Fetch the data from Django!
        axios.get('http://127.0.0.1:8000/api/clinic-info/').then(res => {
            if(res.data.length > 0) setClinicInfo(res.data[0]);
        });
        axios.get('http://127.0.0.1:8000/api/core-values/').then(res => {
            // setCoreValues(res.data);
            const sortedCoreValues = res.data.sort((a, b) => a.id - b.id);
            setCoreValues(sortedCoreValues);
        });
    }, []);

    // Split the mission statement into bullet points based on the asterisks (*) or newlines
    const missionTextRaw = clinicInfo.mission || "";
    // We split by newline or *, then filter out empty lines
    const missionPointsArray = missionTextRaw.split(/[\n*]/).map(p => p.trim()).filter(p => p !== '');

    return (
        <>
        <PageBanner title="About Us" subtitle="Serving the community of Sariaya with quality healthcare for over three decades." />

        <section className="about-section alt">
            <div className="section-label">Our Story</div>
            <h2 className="section-title">Caring for Every Sariayahin</h2>
            <div className="story-grid">
                <div className="story-image"><img src={image} alt="Health Center" /></div>
                <div className="story-text">
                    <p>The Municipal Health Center of Sariaya, Quezon has been a cornerstone of community health in the municipality for over three decades.</p>
                    <p>Our dedicated team of licensed doctors, nurses, midwives, and health workers work tirelessly every day to provide preventive, curative, and promotive health services to all — regardless of economic status.</p>
                </div>
            </div>
        </section>

        <section className="about-section">
            <div className="section-label">Direction</div>
            <h2 className="section-title">Our Vision & Mission</h2>
            <div className="vm-grid">
                <div className="vm-card vision">
                    <div className="vm-card-icon"><Target /></div>
                    <h3>Our Vision</h3>
                    {/* DYNAMIC VISION */}
                    <p>{clinicInfo.vision}</p> 
                </div>
                <div className="vm-card mission">
                    <div className="vm-card-icon"><HeartPulse /></div>
                    <h3>Our Mission</h3>
                    <div className="mission-points">
                        {/* DYNAMIC MISSION BULLETS */}
                        {missionPointsArray.map((pt, index) => (
                            <div className="mission-point" key={index}>
                                <div className="mission-dot" />
                                <span>{pt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        <section className="about-section alt">
            <div className="section-label">What We Stand For</div>
            <h2 className="section-title">Our Core Values</h2>
            <div className="values-grid">
                {/* DYNAMIC CORE VALUES */}
                {coreValues.map(({ id, icon_name, title, description }) => {
                    // Dynamically grab the correct icon from lucide-react!
                    const IconComponent = Icons[icon_name] || Icons.Circle; 
                    return (
                        <div className="value-card" key={id}>
                            <div className="value-icon"><IconComponent /></div>
                            <h4>{title}</h4>
                            <p>{description}</p>
                        </div>
                    );
                })}
            </div>
        </section>

        <CtaBanner title="Learn More About What We Offer" subtitle="Explore our full range of health services." primaryTo="/services" primaryText="View Our Services" secondaryTo="/contact" secondaryText="Contact Us" />
        </>
    )
}
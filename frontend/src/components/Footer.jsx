import { Link } from 'react-router-dom'
import { Plus, Mail } from 'lucide-react'
import "../assets/css/Footer.css";
import logo from "../assets/images/smhc_logo.png";

export default function Footer() {
    return (
    <footer className="footer">
        <div className="footer-grid">

        {/* Brand */}
        <div className="footer-brand">
            <div className="footer-brand-logo">
                <div className="footer-brand-icon">
                    <img src={logo} alt="Municipal Health Center Logo" />
            </div>
            <h3>
                Municipal Health Center
                <span>Sariaya, Quezon</span>
            </h3>
            </div>
            <div className="footer-tagline">
                Compassionate Care. Healthier Community.<br />Stronger Future.
            </div>
            <div className="footer-social">
                <a href="https://www.facebook.com/people/Sariaya-Rural-Health-Unit-Office-on-Health-Services/61582330865361/" aria-label="Facebook">FB</a>
                <a href="#" aria-label="Instagram">IG</a>
                <a href="mailto:mhcsariaya@quezon.gov.ph" aria-label="Email"><Mail /></a>
            </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/services">Our Services</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
        </div>

        {/* Services */}
        <div className="footer-col">
            <h4>Services</h4>
            <Link to="/services#medical">Medical</Link>
            <Link to="/services#dental">Dental</Link>
            <Link to="/services#laboratory">Laboratory</Link>
            <Link to="/services#immunization">Immunization</Link>
        </div>

        {/* Contact */}
        <div className="footer-col">
            <h4>Contact</h4>
            <a href="mailto:mhcsariaya@quezon.gov.ph">mhcsariaya@quezon.gov.ph</a>
            <a href="tel:+6342137500">Office: (042) 137-5XXX</a>
            <a href="tel:+63423750000">Emergency: (042) 375-XXXX</a>
        </div>

        </div>

        <div className="footer-bottom">
            <span>© 2026 Municipal Health Center of Sariaya. All Rights Reserved.</span>
            <span>Sariaya, Quezon, Philippines</span>
        </div>
    </footer>
    )
}
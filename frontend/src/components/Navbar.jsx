import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, LogIn, Menu, X } from 'lucide-react'
import "../assets/css/Navbar.css";
import logo from "../assets/images/smhc_logo.png";


export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false)

    const closeDrawer = () => setDrawerOpen(false)

    return (
    <>
        <nav className="navbar">
            {/* Brand */}
            <NavLink to="/" className="nav-brand" onClick={closeDrawer}>
                <div className="nav-logo">
                    <img src={logo} alt="Municipal Health Center Logo" />
                </div>
                <div className="nav-name">
                    Municipal Health Center
                    <span>Sariaya, Quezon</span>
                </div>
            </NavLink>

            {/* Desktop links */}
            <ul className="nav-links">
                <li><NavLink to="/" end>Home</NavLink></li>
                <li><NavLink to="/services">Our Services</NavLink></li>
                <li><NavLink to="/about">About Us</NavLink></li>
                <li><NavLink to="/contact">Contact</NavLink></li>
            </ul>

            {/* Login button */}
            <NavLink to="/login" className="nav-login">
                <LogIn size={14} strokeWidth={2.2} />
                Login
            </NavLink>

            {/* Hamburger */}
            <button
                className="nav-mobile-btn"
                onClick={() => setDrawerOpen(prev => !prev)}
                aria-label="Toggle menu"
            >
                {drawerOpen
                ? <X size={22} strokeWidth={2} />
                : <Menu size={22} strokeWidth={2} />
                }
            </button>
        </nav>

        {/* Mobile drawer */}
        <div className={`nav-drawer${drawerOpen ? ' open' : ''}`}>
            <NavLink to="/" end onClick={closeDrawer}>Home</NavLink>
            <NavLink to="/services" onClick={closeDrawer}>Our Services</NavLink>
            <NavLink to="/about" onClick={closeDrawer}>About Us</NavLink>
            <NavLink to="/contact" onClick={closeDrawer}>Contact</NavLink>
            <NavLink to="/login" className="drawer-login" onClick={closeDrawer}>
                <LogIn size={14} strokeWidth={2.2} />
                Login
            </NavLink>
        </div>
    </>
    )
}
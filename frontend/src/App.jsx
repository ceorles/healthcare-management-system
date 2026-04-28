import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Authentication
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer';
import ScrollToTop from "./components/ScrollToTop";
import DashboardLayout from './components/DashboardLayout';

// Landing Page
import Home from './pages/Home'
import Services from './pages/Services.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'

// Admin Dashboards
import Admin from './pages/Admin';
import AdminPatients from './pages/AdminPatients';
import AdminStaffAccounts from './pages/AdminStaffAccounts';
import AdminAppointments from './pages/AdminAppointments';
import AdminReferrals from './pages/AdminReferrals';
import AdminPrograms from './pages/AdminPrograms';

import Doctor from './pages/Doctor';
import Nurse from './pages/Nurse';

// CSS
import './App.css';

function PublicLayout() {
    return (
        <>
            <Navbar />
            <main>
                <Outlet /> 
            </main>
            <Footer />
        </>
    );
}

function App() {
    return (
        <Router>
            <ScrollToTop />
            <Routes>
                
                {/* --- PUBLIC PAGES (With Navbar & Footer) --- */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/about"    element={<About />} />
                    <Route path="/contact"  element={<Contact />} />
                </Route>
                
                {/* --- AUTH & DASHBOARD PAGES (No Navbar/Footer) --- */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route element={<DashboardLayout />}>
                    {/* When you go to /admin, it shows Admin.jsx INSIDE the layout */}
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/patients" element={<AdminPatients />} />
                    <Route path="/admin/staff" element={<AdminStaffAccounts />} />
                    <Route path="/admin/appointments" element={<AdminAppointments />} />
                    <Route path="/admin/referrals" element={<AdminReferrals />} />
                    <Route path="/admin/programs" element={<AdminPrograms />} />

                    {/* <Route path="/admin/patients" element={<AdminPatients />} /> */}
                    {/* <Route path="/admin/cms-services" element={<AdminCmsServices />} /> */}
                </Route>

                <Route path="/doctor" element={<Doctor />} />
                <Route path="/nurse" element={<Nurse />} />

            </Routes>
        </Router>
    );
}

export default App;
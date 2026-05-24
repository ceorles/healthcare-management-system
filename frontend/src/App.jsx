import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// AUTHENTICATION
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// COMPONENTS
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx';
import ScrollToTop from "./components/ScrollToTop.jsx";
import DashboardLayout from './components/DashboardLayout.jsx';

// LANDING
import Home from './pages/Home.jsx'
import Services from './pages/Services.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'

// ADMIN
import Admin from './pages/Admin.jsx';
import AdminPatients from './pages/AdminPatients.jsx';
import AdminStaffAccounts from './pages/AdminStaffAccounts.jsx';
import AdminAuditLogs from './pages/AdminAuditLogs.jsx';
import AdminAppointments from './pages/AdminAppointments.jsx';
import AdminReferrals from './pages/AdminReferrals.jsx';
import AdminPrograms from './pages/AdminPrograms.jsx';
import AdminGISMap from './pages/AdminGISMap.jsx';
import AdminReportsAndAnalytics from './pages/AdminReportsAndAnalytics.jsx';
import AdminSettings from './pages/AdminSettings.jsx';

// DOCTOR
import Doctor from './pages/Doctor/Doctor.jsx';


// NURSE
import Nurse from './pages/Nurse/Nurse.jsx';

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
                
                {/* --- LADNING PAGES --- */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/about"    element={<About />} />
                    <Route path="/contact"  element={<Contact />} />
                </Route>
                
                {/* --- AUTH & DASHBOARD PAGES --- */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route element={<DashboardLayout />}>
                    <Route path="/admin" element={<Admin />} />

                    <Route path="/admin/patients" element={<AdminPatients />} />
                    <Route path="/admin/staff" element={<AdminStaffAccounts />} />
                    <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                    <Route path="/admin/appointments" element={<AdminAppointments />} />
                    <Route path="/admin/referrals" element={<AdminReferrals />} />
                    <Route path="/admin/programs" element={<AdminPrograms />} />

                    <Route path="/admin/map" element={<AdminGISMap />} /> 
                    <Route path="/admin/reports" element={<AdminReportsAndAnalytics />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />

                    {/* <Route path="/admin/cms-services" element={<AdminCmsServices />} /> */}
                </Route>

                <Route path="/doctor" element={<Doctor />} />
                <Route path="/nurse" element={<Nurse />} />

            </Routes>
        </Router>
    );
}

export default App;
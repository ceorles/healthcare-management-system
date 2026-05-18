import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// AUTHENTICATION
import Login from './pages/Login';
import Register from './pages/Register';

// COMPONENTS
import Navbar from './components/Navbar'
import Footer from './components/Footer';
import ScrollToTop from "./components/ScrollToTop";
import DashboardLayout from './components/DashboardLayout.jsx';

// LANDING
import Home from './pages/Home'
import Services from './pages/Services.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'

// ADMIN
import Admin from './pages/Admin';
import AdminPatients from './pages/AdminPatients';
import AdminStaffAccounts from './pages/AdminStaffAccounts';
import AdminAuditLogs from './pages/AdminAuditLogs.jsx';
import AdminAppointments from './pages/AdminAppointments';
import AdminReferrals from './pages/AdminReferrals';
import AdminPrograms from './pages/AdminPrograms';
import AdminGISMap from './pages/AdminGISMap.jsx';
import AdminReportsAndAnalytics from './pages/AdminReportsAndAnalytics.jsx';

// DOCTOR
import Doctor from './pages/Doctor';


// NURSE
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

                    {/* <Route path="/admin/cms-services" element={<AdminCmsServices />} /> */}
                </Route>

                <Route path="/doctor" element={<Doctor />} />
                <Route path="/nurse" element={<Nurse />} />

            </Routes>
        </Router>
    );
}

export default App;
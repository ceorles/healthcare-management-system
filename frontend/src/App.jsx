import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// AUTHENTICATION
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// COMPONENTS
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx';
import ScrollToTop from "./components/ScrollToTop.jsx";
import DashboardLayout from './components/DashboardLayout.jsx';
import DoctorSidebar from './components/DoctorSidebar.jsx';
import NurseSidebar from './components/NurseSidebar.jsx';
import StaffSidebar from './components/StaffSidebar.jsx';

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
import DoctorPatients from './pages/Doctor/DoctorPatients.jsx';
import DoctorReferrals from './pages/Doctor/DoctorReferrals.jsx';
import DoctorSettings from './pages/Doctor/DoctorSettings.jsx';


// NURSE
import Nurse from './pages/Nurse/Nurse.jsx';
import NursePatients from './pages/Nurse/NursePatients.jsx';
import NurseReferrals from './pages/Nurse/NurseReferrals.jsx';
import NurseSettings from './pages/Nurse/NurseSettings.jsx';

// STAFF
import Staff from './pages/Staff/Staff.jsx';
import StaffPatients from './pages/Staff/StaffPatients.jsx';
import StaffReferrals from './pages/Staff/StaffReferrals.jsx';
import StaffSettings from './pages/Staff/StaffSettings.jsx';

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
                
                <Route element={<DashboardLayout title="Admin" allowedRoles={['ADMIN']} />}>
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

                <Route
                    element={
                        <DashboardLayout
                            SidebarComponent={DoctorSidebar}
                            title="Doctor"
                            allowedRoles={['DOCTOR']}
                        />
                    }
                >
                    <Route path="/doctor" element={<Doctor />} />
                    <Route path="/doctor/patients" element={<DoctorPatients />} />
                    <Route path="/doctor/referrals" element={<DoctorReferrals />} />
                    <Route path="/doctor/settings" element={<DoctorSettings />} />
                </Route>

                <Route
                    element={
                        <DashboardLayout
                            SidebarComponent={NurseSidebar}
                            title="Nurse"
                            allowedRoles={['NURSE']}
                        />
                    }
                >
                    <Route path="/nurse" element={<Nurse />} />
                    <Route path="/nurse/patients" element={<NursePatients />} />
                    <Route path="/nurse/referrals" element={<NurseReferrals />} />
                    <Route path="/nurse/settings" element={<NurseSettings />} />
                </Route>

                <Route
                    element={
                        <DashboardLayout
                            SidebarComponent={StaffSidebar}
                            title="Staff"
                            allowedRoles={['STAFF']}
                        />
                    }
                >
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/staff/patients" element={<StaffPatients />} />
                    <Route path="/staff/referrals" element={<StaffReferrals />} />
                    <Route path="/staff/settings" element={<StaffSettings />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
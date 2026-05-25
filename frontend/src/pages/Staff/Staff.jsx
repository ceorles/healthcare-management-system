import LimitedAccessDashboard from '../../components/LimitedAccessDashboard.jsx';
import '../../assets/css/StaffDashboard.css';

function Staff() {
    return <LimitedAccessDashboard title="Staff Dashboard" basePath="/staff" />;
}

export default Staff;
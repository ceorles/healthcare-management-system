import LimitedAccessDashboard from '../../components/LimitedAccessDashboard.jsx';
import '../../assets/css/NurseDashboard.css';

function Nurse() {
    return <LimitedAccessDashboard title="Nurse Dashboard" basePath="/nurse" />;
}

export default Nurse;
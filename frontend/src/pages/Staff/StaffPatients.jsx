import AdminPatients from '../AdminPatients.jsx';

export default function StaffPatients() {
    return (
        <AdminPatients
            canDeletePatients={false}
            canCreateVisit={false}
            patientsPath="/staff/patients"
        />
    );
}

import AdminPatients from '../AdminPatients.jsx';

export default function NursePatients() {
    return (
        <AdminPatients
            canDeletePatients={false}
            canCreateVisit={false}
            patientsPath="/nurse/patients"
        />
    );
}

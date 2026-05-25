import AdminReferrals from '../AdminReferrals.jsx';

export default function StaffReferrals() {
    return (
        <AdminReferrals
            canDeleteReferrals={false}
            patientsPath="/staff/patients"
        />
    );
}

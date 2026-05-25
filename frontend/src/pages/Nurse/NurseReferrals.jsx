import AdminReferrals from '../AdminReferrals.jsx';

export default function NurseReferrals() {
    return (
        <AdminReferrals
            canDeleteReferrals={false}
            patientsPath="/nurse/patients"
        />
    );
}

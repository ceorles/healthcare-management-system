import { useState } from 'react';
import Referrals from '../components/Referrals/Referrals.jsx'
import NewReferral from '../components/Referrals/NewReferral.jsx';
import ViewReferral from '../components/Referrals/ViewReferral.jsx';
import EditReferral from '../components/Referrals/EditReferral.jsx';
import DeleteReferral from '../components/Referrals/DeleteReferral.jsx';
import PrintReferral from '../components/Referrals/PrintReferral.jsx';

export default function AdminReferrals() {
    const [currentView, setCurrentView] = useState('list');
    
    const [selectedReferral, setSelectedReferral] = useState(null);

    const handleView = (referral) => { setSelectedReferral(referral); setCurrentView('view'); };
    const handleEdit = (referral) => { setSelectedReferral(referral); setCurrentView('edit'); };
    const handleDelete = (referral) => { setSelectedReferral(referral); setCurrentView('delete'); };
    const handlePrint = (referral) => { setSelectedReferral(referral); setCurrentView('print'); };

    return (
        <div>
            {currentView === 'list' && (
                <Referrals 
                    onAddNew={() => setCurrentView('new')} 
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPrint={handlePrint} // Added Print Handler!
                />
            )}
            
            {currentView === 'new' && (
                <NewReferral 
                    onCancel={() => setCurrentView('list')} 
                    onSaveSuccess={() => setCurrentView('list')} 
                />
            )}
            
            {currentView === 'view' && selectedReferral && (
                <ViewReferral 
                    referral={selectedReferral}
                    onBack={() => setCurrentView('list')}
                    onEdit={() => setCurrentView('edit')}
                    onDelete={() => setCurrentView('delete')}
                    onPrint={() => setCurrentView('print')}
                />
            )}

            {currentView === 'edit' && selectedReferral && (
                <EditReferral 
                    referral={selectedReferral}
                    onCancel={() => setCurrentView('list')} 
                    onSaveSuccess={() => setCurrentView('list')} 
                />
            )}

            {currentView === 'delete' && selectedReferral && (
                <DeleteReferral 
                    referral={selectedReferral}
                    onCancel={() => setCurrentView('list')} 
                    onDeleteSuccess={() => setCurrentView('list')} 
                />
            )}

            {currentView === 'print' && selectedReferral && (
                <PrintReferral 
                    referral={selectedReferral}
                    onCancel={() => setCurrentView('list')} 
                />
            )}
        </div>
    );
}
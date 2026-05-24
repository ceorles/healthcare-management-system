import { useState } from 'react';
import StaffAccounts from '../components/StaffAccounts/StaffAccounts.jsx';
import NewStaffAccount from '../components/StaffAccounts/NewStaffAccount.jsx';
import EditStaffAccount from '../components/StaffAccounts/EditStaffAccount.jsx';
import DeleteStaffAccount from '../components/StaffAccounts/DeleteStaffAccount.jsx';
import ViewStaffAccount from '../components/StaffAccounts/ViewStaffAccount.jsx';

export default function AdminStaffAccounts() {
    const [currentView, setCurrentView] = useState('list');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [listRefreshKey, setListRefreshKey] = useState(0);

    const handleView = (staff) => { setSelectedStaff(staff); setCurrentView('view'); };
    const handleEdit = (staff) => { setSelectedStaff(staff); setCurrentView('edit'); };
    const handleDelete = (staff) => { setSelectedStaff(staff); setCurrentView('delete'); };

    return (
        <div>
            {currentView === 'list' && (
                <StaffAccounts
                    key={listRefreshKey}
                    onAddNew={() => setCurrentView('new')} 
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            
            {currentView === 'new' && (
                <NewStaffAccount 
                    onCancel={() => setCurrentView('list')} 
                    onSaveSuccess={() => setCurrentView('list')} 
                />
            )}

            {currentView === 'view' && selectedStaff && (
                <ViewStaffAccount
                    staff={selectedStaff}
                    onBack={() => setCurrentView('list')}
                    onEdit={() => setCurrentView('edit')}
                    onStaffUpdated={(updated) => {
                        setSelectedStaff(updated);
                        setListRefreshKey((k) => k + 1);
                    }}
                />
            )}

            {currentView === 'edit' && selectedStaff && (
                <EditStaffAccount 
                    staff={selectedStaff}
                    onCancel={() => setCurrentView('list')} 
                    onSaveSuccess={() => setCurrentView('list')} 
                />
            )}

            {currentView === 'delete' && selectedStaff && (
                <DeleteStaffAccount 
                    staff={selectedStaff}
                    onCancel={() => setCurrentView('list')} 
                    onDeleteSuccess={() => setCurrentView('list')} 
                />
            )}
        </div>
    );
}
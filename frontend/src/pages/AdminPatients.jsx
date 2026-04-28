import { useState } from 'react';
import Patients from '../components/Patients/Patients.jsx';
import NewPatient from '../components/Patients/NewPatient.jsx';
import ViewPatient from '../components/Patients/ViewPatient.jsx';
import EditPatient from '../components/Patients/EditPatient.jsx';
import DeletePatient from '../components/Patients/DeletePatient.jsx';

export default function AdminPatients() {
    const [currentView, setCurrentView] = useState('list');

    const [selectedPatient, setSelectedPatient] = useState(null);

    // Handlers passed down to the components
    const handleView = (patient) => { setSelectedPatient(patient); setCurrentView('view'); };
    const handleEdit = (patient) => { setSelectedPatient(patient); setCurrentView('edit'); };
    const handleDelete = (patient) => { setSelectedPatient(patient); setCurrentView('delete'); };

    return (
        <div>
            {currentView === 'list' && (
                <Patients 
                    onAddNew={() => setCurrentView('new')} 
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            
            {currentView === 'new' && (
                <NewPatient 
                    onCancel={() => setCurrentView('list')} 
                    onSaveSuccess={() => setCurrentView('list')} 
                />
            )}

            {currentView === 'view' && selectedPatient && (
                <ViewPatient 
                    patient={selectedPatient}
                    onBack={() => setCurrentView('list')}
                    onEdit={() => setCurrentView('edit')}
                    onDelete={() => setCurrentView('delete')}
                />
            )}

            {currentView === 'edit' && selectedPatient && (
                <EditPatient 
                    patient={selectedPatient}
                    onCancel={() => setCurrentView('list')}
                    onSaveSuccess={() => setCurrentView('list')} 
                />
            )}

            {currentView === 'delete' && selectedPatient && (
                <DeletePatient 
                    patient={selectedPatient}
                    onCancel={() => setCurrentView('list')} 
                    onDeleteSuccess={() => setCurrentView('list')} 
                />
            )}
        </div>
    );
}
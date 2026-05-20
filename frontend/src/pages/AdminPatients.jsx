import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Patients from '../components/Patients/Patients.jsx';
import NewPatient from '../components/Patients/NewPatient.jsx';
import ViewPatient from '../components/Patients/ViewPatient.jsx';
import EditPatient from '../components/Patients/EditPatient.jsx';
import DeletePatient from '../components/Patients/DeletePatient.jsx';
import NewVisit from '../components/Patients/Visit/NewVisit.jsx';
import ViewVisit from '../components/Patients/Visit/ViewVisit.jsx';

export default function AdminPatients() {
    const location = useLocation();
    const navigate = useNavigate();

    const [currentView, setCurrentView] = useState('list');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [newPatientPrefill, setNewPatientPrefill] = useState(null);
    const [visitRefreshKey, setVisitRefreshKey] = useState(0);
    const [selectedVisitId, setSelectedVisitId] = useState(null);

    useEffect(() => {
        const redirect = location.state?.qrRedirect;
        if (!redirect) return;

        if (redirect.type === 'view' && redirect.patient) {
            setSelectedPatient(redirect.patient);
            setCurrentView('view');
        } else if (redirect.type === 'new') {
            setNewPatientPrefill(redirect.prefill || null);
            setCurrentView('new');
        }

        navigate(location.pathname, { replace: true, state: {} });
    }, [location.state, location.pathname, navigate]);

    // Handlers passed down to the components
    const handleView = (patient) => { setSelectedPatient(patient); setCurrentView('view'); };
    const handleEdit = (patient) => { setSelectedPatient(patient); setCurrentView('edit'); };
    const handleDelete = (patient) => { setSelectedPatient(patient); setCurrentView('delete'); };
    const handleNewVisit = (patient) => { setSelectedPatient(patient); setCurrentView('newVisit'); };
    const handleViewVisit = (visitId) => { setSelectedVisitId(visitId); setCurrentView('viewVisit'); };

    const handleVisitSaveSuccess = () => {
        setVisitRefreshKey((k) => k + 1);
        setCurrentView('view');
    };

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
                    prefill={newPatientPrefill}
                    onCancel={() => { setNewPatientPrefill(null); setCurrentView('list'); }}
                    onSaveSuccess={() => { setNewPatientPrefill(null); setCurrentView('list'); }}
                />
            )}

            {currentView === 'view' && selectedPatient && (
                <ViewPatient
                    key={visitRefreshKey}
                    patient={selectedPatient}
                    onBack={() => setCurrentView('list')}
                    onEdit={() => setCurrentView('edit')}
                    onDelete={() => setCurrentView('delete')}
                    onNewVisit={() => handleNewVisit(selectedPatient)}
                    onViewVisit={handleViewVisit}
                />
            )}

            {currentView === 'viewVisit' && selectedPatient && selectedVisitId && (
                <ViewVisit
                    visitId={selectedVisitId}
                    patient={selectedPatient}
                    onBack={() => setCurrentView('view')}
                />
            )}

            {currentView === 'newVisit' && selectedPatient && (
                <NewVisit
                    patient={selectedPatient}
                    onCancel={() => setCurrentView('view')}
                    onSaveSuccess={handleVisitSaveSuccess}
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
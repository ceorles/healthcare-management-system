import { useState } from 'react';
import Appointments from '../components/Appointments/Appointments.jsx';
import NewAppointment from '../components/Appointments/NewAppointment.jsx';

export default function AdminAppointments() {
    const [currentView, setCurrentView] = useState('list');

    return (
        <div>
            {currentView === 'list' && (
                <Appointments 
                    onAddNew={() => setCurrentView('new')} 
                />
            )}
            
            {currentView === 'new' && (
                <NewAppointment 
                    onCancel={() => setCurrentView('list')} 
                    onSaveSuccess={() => setCurrentView('list')} 
                />
            )}
        </div>
    );
}
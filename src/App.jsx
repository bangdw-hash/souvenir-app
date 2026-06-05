import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GroupDashboard from './pages/GroupDashboard';
import CalendarPage from './pages/CalendarPage';
import PatientPage from './pages/PatientPage';
import AddPage from './pages/AddPage';
import SettingsPage from './pages/SettingsPage';
import MedicationsPage from './pages/MedicationsPage';
import RecordsPage from './pages/RecordsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/group/:slug" element={<GroupDashboard />} />
        <Route path="/group/:slug/calendar" element={<CalendarPage />} />
        <Route path="/group/:slug/patient/:patientId" element={<PatientPage />} />
        <Route path="/group/:slug/add" element={<AddPage />} />
        <Route path="/group/:slug/medications" element={<MedicationsPage />} />
        <Route path="/group/:slug/settings" element={<SettingsPage />} />
        <Route path="/group/:slug/records" element={<RecordsPage />} />
      </Routes>
    </Router>
  );
}

export default App;

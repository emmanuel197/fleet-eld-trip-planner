/**
 * Root Application Component
 * 
 * Sets up routing between the main trip planner page
 * and the trip detail/results page.
 */

import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import TripPlannerPage from './pages/TripPlannerPage';
import TripResultPage from './pages/TripResultPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Main page: trip input form */}
        <Route path="/" element={<TripPlannerPage />} />

        {/* Trip results: map, stops, and ELD logs */}
        <Route path="/trip/:tripId" element={<TripResultPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;

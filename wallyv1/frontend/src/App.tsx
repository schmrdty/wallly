import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SplashPage from './hooks/SplashPage';
import Auth from './components/Auth';
import TransferForm from './components/TransferForm';
import EventFeed from './hooks/EventFeed';
import TokenValidator from './components/TokenValidator';
import SessionManager from './hooks/SessionManager';
import ExportData from './hooks/ExportData';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Instructions from './pages/Instructions';
import RequireAuth from './components/RequireAuth';

const App: React.FC = () => (
    <Router>
        <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/transfer" element={<TransferForm />} />
            <Route path="/events" element={<EventFeed />} />
            <Route path="/validate" element={<TokenValidator />} />
            <Route path="/session" element={<SessionManager />} />
            <Route path="/export" element={<ExportData />} />
            <Route path="/dashboard" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="/instructions" element={<Instructions />} />
            {/* 404 */}
            <Route path="*" element={<SplashPage />} />
        </Routes>
    </Router>
);

export default App;
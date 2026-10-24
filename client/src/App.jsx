import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { OfflineProvider } from './context/OfflineContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';

import { AppLayout } from './layouts/AppLayout.jsx';

// Pages
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { SOSPage } from './pages/SOSPage.jsx';
import { SafetyMapPage } from './pages/SafetyMapPage.jsx';
import { ReportHazardPage } from './pages/ReportHazardPage.jsx';
import { FamilyPage } from './pages/FamilyPage.jsx';
import { MessagesPage } from './pages/MessagesPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { SubscriptionPage } from './pages/SubscriptionPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          <Routes>
            {/* Public Routes — zero location overhead, instant load */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Authenticated App Routes */}
            <Route
              path="/app"
              element={
                <LocationProvider>
                  <AppLayout />
                </LocationProvider>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="sos" element={<SOSPage />} />
              <Route path="map" element={<SafetyMapPage />} />
              <Route path="report" element={<ReportHazardPage />} />
              <Route path="family" element={<FamilyPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
            </Route>

            {/* Catch all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

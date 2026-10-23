import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { OfflineBanner } from '../components/OfflineBanner.jsx';
import { DemoBanner } from '../components/DemoBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getSocket } from '../services/socket.js';

export const AppLayout = () => {
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (user?._id) {
      const socket = getSocket();
      socket.emit('join_user', user._id);
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: '4px solid rgba(58, 134, 255, 0.2)',
            borderTopColor: 'var(--brand-blue)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Securing Connection to Signal Bridge...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <OfflineBanner />
        <DemoBanner />
        <Navbar />

        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main className="main-content">
            <Outlet />
          </main>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

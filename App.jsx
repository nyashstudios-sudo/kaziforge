import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import Login from './Login';
import SignUp from './SignUp';
import FreelancerDashboard from './FreelancerDashboard';
import ClientDashboard from './ClientDashboard';
import RoleSelection from './RoleSelection';
import ProtectedRoute from './ProtectedRoute';

/**
 * Main Application component handling client-side routing.
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/role-selection" 
          element={
            <ProtectedRoute>
              <RoleSelection />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/client-dashboard" 
          element={
            <ProtectedRoute allowedType="client">
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/freelancer-dashboard" 
          element={
            <ProtectedRoute allowedType="freelancer">
              <FreelancerDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
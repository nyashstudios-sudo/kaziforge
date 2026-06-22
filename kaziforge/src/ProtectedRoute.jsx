import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabase';

/**
 * ProtectedRoute ensures that only authenticated users with the 
 * correct user_type can access specific dashboard routes.
 */
export default function ProtectedRoute({ children, allowedType }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-indigo-600">Loading Session...</div>;

  if (!session) return <Navigate to="/login" replace />;

  const userType = session.user.user_metadata.user_type || 'pending';

  if (userType === 'pending' && window.location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  if (allowedType && userType !== allowedType) {
    return <Navigate to={`/${userType}-dashboard`} replace />;
  }

  return children;
}
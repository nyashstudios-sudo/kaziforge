import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for an existing session (e.g., after social login redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userType = session.user.user_metadata.user_type || 'pending';
        if (userType === 'pending') {
          navigate('/role-selection');
        } else {
          navigate(`/${userType}-dashboard`);
        }
      }
    });
  }, [navigate]);

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      const userType = data.user.user_metadata.user_type || 'pending';
      if (userType === 'pending') navigate('/role-selection');
      else navigate(`/${userType}-dashboard`);
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">KF</div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Log in to your KaziForge account</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600 transition" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600 transition" 
            />
          </div>
          
          <div className="space-y-3 pt-4">
            <button onClick={handleLogin} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition">Log In</button>
            
            <div className="text-center pt-2">
              <Link to="/signup" className="text-gray-500 text-sm hover:underline">Need an account? Sign Up</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
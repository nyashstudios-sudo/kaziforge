import React, { useState } from 'react';
import { supabase } from './supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (type) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { 
        data: { 
          user_type: type 
        } 
      }
    });
    
    if (error) {
      alert(error.message);
    } else {
      alert('Registration successful! Please check your email for confirmation.');
      navigate('/login');
    }
  };

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/login',
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">KF</div>
          <h2 className="text-3xl font-bold text-gray-900">Join KaziForge</h2>
          <p className="text-gray-500 mt-2">Create an account to get started</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-5 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600 transition" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600 transition" 
            />
          </div>
          
          <div className="space-y-3 pt-4">
            <button onClick={() => handleSignUp('client')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition">Sign Up as Client</button>
            <button onClick={() => handleSignUp('freelancer')} className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition">Sign Up as Skiller</button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-2 border-2 border-gray-100 py-3 rounded-2xl font-semibold hover:bg-gray-50 transition">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Google
              </button>
              <button onClick={() => handleSocialLogin('github')} className="flex items-center justify-center gap-2 border-2 border-gray-100 py-3 rounded-2xl font-semibold hover:bg-gray-50 transition">
                <Github size={20} />
                GitHub
              </button>
            </div>
            
            <div className="text-center pt-2">
              <Link to="/login" className="text-gray-500 text-sm hover:underline">Already have an account? Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
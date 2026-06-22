import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Camera, Loader2 } from 'lucide-react';

export default function RoleSelection() {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Pre-fill from social metadata if available
        setDisplayName(user.user_metadata.display_name || user.user_metadata.full_name || '');
        setAvatarUrl(user.user_metadata.avatar_url || '');
      }
    };
    fetchUserData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleRoleSelect = async (role) => {
    if (!displayName.trim()) {
      alert('Please enter a display name');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      let finalAvatarUrl = avatarUrl;

      // Upload file to Supabase Storage if a new one was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          alert('Error uploading avatar: ' + uploadError.message);
          setLoading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        finalAvatarUrl = publicUrl;
      }

      // 1. Update Profile table in public schema
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          user_type: role,
          display_name: displayName,
          avatar_url: finalAvatarUrl
        })
        .eq('id', user.id);

      if (profileError) {
        alert(profileError.message);
        setLoading(false);
        return;
      }

      // 2. Update Auth metadata so dashboards can resolve the route
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          user_type: role,
          display_name: displayName,
          avatar_url: finalAvatarUrl
        }
      });

      if (authError) {
        alert(authError.message);
      } else {
        navigate(`/${role}-dashboard`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-500 mb-10">Welcome to KaziForge! Please choose how you want to use the platform.</p>

        <div className="space-y-6 mb-10 text-left max-w-md mx-auto">
          <div className="flex flex-col items-center mb-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-gray-100 rounded-full mb-4 cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center relative group"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-gray-400" size={32} />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                Change Photo
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <p className="text-xs text-gray-500">Upload a profile picture</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jamal K."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600 transition" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL (Optional)</label>
            <input 
              type="text" 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600 transition" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            disabled={loading}
            onClick={() => handleRoleSelect('client')}
            className="group p-8 border-2 border-gray-100 rounded-3xl hover:border-indigo-600 transition text-left flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
              <User size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">I'm a Client</h3>
            <p className="text-sm text-gray-500 text-center">I want to hire talent, manage projects, and grow my business.</p>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleRoleSelect('freelancer')}
            className="group p-8 border-2 border-gray-100 rounded-3xl hover:border-indigo-600 transition text-left flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Briefcase size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">I'm a Skiller</h3>
            <p className="text-sm text-gray-500 text-center">I want to find exciting gigs, offer my skills, and earn income.</p>
          </button>
        </div>
        
        {loading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-indigo-600 font-medium">
            <Loader2 className="animate-spin" size={20} />
            Finalizing your profile...
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Search, Briefcase, Users, MessageSquare, Check } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function ClientDashboard() {
  const [jobs, setJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', budget: '', description: '' });
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [hiredFreelancers, setHiredFreelancers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchHiredFreelancers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setJobs(data);
    if (error) console.error('Error fetching jobs:', error.message);
  };

  const fetchHiredFreelancers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        id,
        status,
        freelancer_id,
        profiles:freelancer_id (id, email),
        jobs!inner (client_id)
      `)
      .eq('status', 'accepted')
      .eq('jobs.client_id', user.id);

    if (data) {
      // Filter unique freelancers
      const uniqueFreelancers = Array.from(new Set(data.map(p => p.profiles.id)))
        .map(id => data.find(p => p.profiles.id === id).profiles);
      setHiredFreelancers(uniqueFreelancers);
    }
  };

  const fetchProposals = async (jobId) => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    
    if (data) setProposals(data);
    if (error) console.error('Error fetching proposals:', error.message);
  };

  const handleChatInitiate = (freelancer) => {
    setChatTarget(freelancer);
    setChatOpen(true);
  };

  const handleAcceptProposal = async (proposalId) => {
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'accepted' })
      .eq('id', proposalId);

    if (!error) {
      alert('Proposal accepted!');
      if (selectedJobId) fetchProposals(selectedJobId);
      fetchHiredFreelancers();
    } else {
      alert(error.message);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('jobs').insert([
      { 
        ...formData, 
        client_id: userData.user.id,
        proposals: 0,
        status: 'active'
      }
    ]);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ title: '', budget: '', description: '' });
      fetchJobs();
    } else {
      alert(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl">KF</div>
          <span className="font-bold text-2xl">KaziForge</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-indigo-600 bg-indigo-50 rounded-2xl font-medium"><Briefcase size={20} /> Dashboard</button>
          <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-2xl transition"><Plus size={20} /> Post Jobs</button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-2xl transition"><Users size={20} /> Freelancers</button>
        </nav>

        <div className="pt-8 border-t">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-3 rounded-2xl transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Client Dashboard</h1>
          <div className="relative w-64">
            <input type="text" placeholder="Search..." className="w-full bg-white border-0 rounded-3xl py-2 px-5 pl-12 shadow-sm" />
            <Search className="absolute left-4 top-2.5 text-gray-400" size={18} />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="font-semibold text-xl mb-6">Recent Job Posts</h2>
            <div className="space-y-4">
              {jobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => {
                    setSelectedJobId(job.id);
                    fetchProposals(job.id);
                  }}
                  className={`p-5 border rounded-2xl cursor-pointer transition ${selectedJobId === job.id ? 'border-indigo-600 bg-indigo-50' : 'hover:border-indigo-200'}`}
                >
                  <div className="font-bold text-lg">{job.title}</div>
                  <div className="text-sm text-green-600 font-medium">{job.proposals} proposals • ${job.budget} budget</div>
                </div>
              ))}
            </div>
          </div>
          
          {selectedJobId ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="font-semibold text-xl mb-6">Proposals</h2>
              <div className="space-y-4">
                {proposals.length === 0 ? (
                  <p className="text-gray-500">No proposals yet for this job.</p>
                ) : (
                  proposals.map(p => (
                    <div key={p.id} className="p-4 border rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-indigo-600">${p.bid_amount}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">{p.cover_letter}</p>
                      {p.status === 'pending' && (
                        <button 
                          onClick={() => handleAcceptProposal(p.id)}
                          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
                        >
                          <Check size={18} /> Accept Proposal
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Briefcase size={32} />
              </div>
              <p className="text-gray-500">Select a job post to view proposals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
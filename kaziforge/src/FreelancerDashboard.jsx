import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Briefcase, Bell, X, MessageSquare } from 'lucide-react';
import ChatWidget from './ChatWidget';

export default function FreelancerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [newJobAlert, setNewJobAlert] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposal, setProposal] = useState({ bid_amount: '', cover_letter: '' });
  const [hiredJobs, setHiredJobs] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchJobs();
    fetchHiredJobs();
    getCurrentUser();

    // Real-time listener replaces Socket.io
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, payload => {
        setJobs(prev => [payload.new, ...prev]);
        setNewJobAlert(payload.new.title);
        setTimeout(() => setNewJobAlert(null), 5000);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
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
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (data) setJobs(data);
  };

  const fetchHiredJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        id,
        status,
        job_id,
        jobs!inner (
          id,
          title,
          client_id,
          profiles:client_id (id, email)
        )
      `)
      .eq('freelancer_id', user?.id)
      .eq('status', 'accepted');

    if (data) setHiredJobs(data);
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const submitProposal = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('proposals').insert([
      {
        job_id: selectedJob.id,
        freelancer_id: user.id,
        bid_amount: parseInt(proposal.bid_amount),
        cover_letter: proposal.cover_letter
      }
    ]);

    if (error) alert(error.message);
    else {
      alert('Application submitted successfully!');
      setIsModalOpen(false);
      setProposal({ bid_amount: '', cover_letter: '' });
    }
  };

  const handleChatInitiate = (client) => {
    setChatTarget(client);
    setChatOpen(true);
  };

  return (
    <div className="flex-1 p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Freelancer Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Available Jobs */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Briefcase className="text-indigo-600" /> Available Jobs
              </h2>
              <div className="space-y-6">
                {jobs.map(job => (
                  <div key={job.id} className="flex justify-between items-center border-b pb-6 hover:bg-gray-50 p-2 rounded-xl transition">
                    <div>
                      <div className="font-medium text-lg">{job.title}</div>
                      <div className="text-sm text-gray-500">${job.budget} budget</div>
                    </div>
                    <button 
                      onClick={() => handleApplyClick(job)}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Hired Gigs */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-6">My Hired Gigs</h2>
              <div className="space-y-4">
                {hiredJobs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hired gigs yet. Keep applying!</p>
                ) : (
                  hiredJobs.map(hired => (
                    <div key={hired.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm line-clamp-1">{hired.jobs.title}</div>
                        <div className="text-xs text-gray-500">Client: {hired.jobs.profiles.email}</div>
                      </div>
                      <button 
                        onClick={() => handleChatInitiate(hired.jobs.profiles)}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition"
                      >
                        <MessageSquare size={20} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Earnings Widget */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="font-semibold mb-6">Earnings This Month</h2>
              <div className="h-40 flex items-end gap-2">
                <div className="flex-1 bg-indigo-200 rounded-t h-[40%]"></div>
                <div className="flex-1 bg-indigo-400 rounded-t h-[70%]"></div>
                <div className="flex-1 bg-indigo-600 rounded-t h-[90%]"></div>
              </div>
              <div className="mt-4 text-center font-bold text-2xl text-gray-900">$2,450</div>
            </div>
          </div>
        </div>
      </div>

      <ChatWidget 
        currentUserId={currentUserId}
        targetUser={chatTarget}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Apply for {selectedJob?.title}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={submitProposal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount ($)</label>
                <input 
                  type="number" required 
                  value={proposal.bid_amount}
                  onChange={(e) => setProposal({...proposal, bid_amount: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                <textarea 
                  rows="4" required 
                  value={proposal.cover_letter}
                  onChange={(e) => setProposal({...proposal, cover_letter: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-600"
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition">
                Submit Proposal
              </button>
            </form>
          </div>
        </div>
      )}

      {newJobAlert && (
        <div className="fixed bottom-10 right-10 bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce">
          <Bell className="inline mr-2" size={18} /> New Job: {newJobAlert}
        </div>
      )}
    </div>
  );
}
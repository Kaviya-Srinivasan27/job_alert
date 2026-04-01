import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { LayoutDashboard, Bookmark, CheckCircle, Bell, MapPin, Calendar, X, User, Save, Briefcase, Link as LinkIcon, UploadCloud, FileText, Clock, XCircle } from 'lucide-react'; 
import { supabase } from '../supabase'; 

export default function Home() {
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [activeBox, setActiveBox] = useState(null);

  const [liveEvents, setLiveEvents] = useState([]);
  const [appliedEvents, setAppliedEvents] = useState([]); 
  const [savedEvents, setSavedEvents] = useState([]); 
  
  const [user, setUser] = useState(null);
  
  const [profileData, setProfileData] = useState({
    name: '', email: '', phone: '', age: '', gender: '', degree: '', 
    skills: '', portfolio_url: '', bio: '', resume_url: '' // ✨ Resume URL added
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (userData) {
          setProfileData({
            name: userData.name || '', email: userData.email || user.email, phone: userData.phone || '',
            age: userData.age || '', gender: userData.gender || '', degree: userData.degree || '',
            skills: userData.skills || '', portfolio_url: userData.portfolio_url || '', bio: userData.bio || '',
            resume_url: userData.resume_url || ''
          });
        }
        fetchLiveEvents(); fetchAppliedEvents(user.id); fetchSavedEvents(user.id);
      } else window.location.href = '/';
    };
    checkUser();
  }, []);

  const fetchLiveEvents = async () => {
    const { data } = await supabase.from('events').select('*').eq('status', 'Active').order('created_at', { ascending: false });
    if (data) setLiveEvents(data);
  };

  const fetchAppliedEvents = async (userId) => {
    // We now fetch all applied statuses (Applied, Shortlisted, Rejected, Hired)
    const { data } = await supabase.from('applications').select('id, status, events(*)').eq('student_id', userId).neq('status', 'Saved');
    if (data) setAppliedEvents(data.map(app => ({ ...app.events, application_id: app.id, app_status: app.status })));
  };

  const fetchSavedEvents = async (userId) => {
    const { data } = await supabase.from('applications').select('id, status, events(*)').eq('student_id', userId).eq('status', 'Saved');
    if (data) setSavedEvents(data.map(app => ({ ...app.events, application_id: app.id })));
  };

  const handleApply = async (eventId) => {
    const { error } = await supabase.from('applications').insert([{ student_id: user.id, event_id: eventId, status: 'Applied' }]);
    if (!error) { alert("Successfully Applied! 🎉"); fetchAppliedEvents(user.id); setActiveBox('applied'); }
  };

  const handleSave = async (eventId) => {
    const { error } = await supabase.from('applications').insert([{ student_id: user.id, event_id: eventId, status: 'Saved' }]);
    if (!error) { alert("Job Saved Successfully! 🔖"); fetchSavedEvents(user.id); setActiveBox('saved'); }
  };

  const handleApplyFromSaved = async (applicationId) => {
    const { error } = await supabase.from('applications').update({ status: 'Applied' }).eq('id', applicationId);
    if (!error) { alert("Applied from Saved Jobs! 🚀"); fetchAppliedEvents(user.id); fetchSavedEvents(user.id); setActiveBox('applied'); }
  };

  // ✨ RESUME UPLOAD LOGIC ✨
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingResume(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file);
    
    if (uploadError) {
      alert("Error uploading resume: " + uploadError.message);
    } else {
      const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);
      setProfileData({ ...profileData, resume_url: data.publicUrl });
      alert("Resume Uploaded! Make sure to click 'Save Profile Changes' below.");
    }
    setUploadingResume(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.from('users').update(profileData).eq('id', user.id);
    if (!error) alert("Profile Updated Successfully! ✅");
    else alert("Error updating profile: " + error.message);
    setIsSaving(false);
  };

  const displayData = activeBox === 'active' ? liveEvents : activeBox === 'applied' ? appliedEvents : activeBox === 'saved' ? savedEvents : [];

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-xl font-bold text-slate-500">Loading your dashboard...</p></div>;

  return (
    <div className="flex h-screen font-sans bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-full shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <h2 className="text-xl font-extrabold text-blue-600 flex items-center gap-2"><LayoutDashboard size={24} /> Student Panel</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('active'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'dashboard' && activeBox === 'active' ? 'font-bold bg-blue-50 text-blue-700' : 'font-semibold text-slate-600 hover:bg-slate-50'} border-l-4 ${currentView === 'dashboard' && activeBox === 'active' ? 'border-blue-600' : 'border-transparent'}`}><Bell size={20} /> Live Alerts</button>
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('applied'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'dashboard' && activeBox === 'applied' ? 'font-bold bg-amber-50 text-amber-700' : 'font-semibold text-slate-600 hover:bg-slate-50'} border-l-4 ${currentView === 'dashboard' && activeBox === 'applied' ? 'border-amber-600' : 'border-transparent'}`}><CheckCircle size={20} /> My Applications</button>
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('saved'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'dashboard' && activeBox === 'saved' ? 'font-bold bg-rose-50 text-rose-700' : 'font-semibold text-slate-600 hover:bg-slate-50'} border-l-4 ${currentView === 'dashboard' && activeBox === 'saved' ? 'border-rose-600' : 'border-transparent'}`}><Bookmark size={20} /> Saved Events</button>
          <div className="my-4 border-t border-slate-100"></div>
          <button onClick={() => setCurrentView('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'profile' ? 'font-bold bg-indigo-50 text-indigo-700' : 'font-semibold text-slate-600 hover:bg-slate-50'} border-l-4 ${currentView === 'profile' ? 'border-indigo-600' : 'border-transparent'}`}><User size={20} /> My Profile</button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <Navbar /> 
        <main className="p-6 md:p-10 max-w-6xl mx-auto w-full">
          {currentView === 'profile' ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-300 mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl font-black uppercase shadow-inner">{profileData.name.charAt(0) || 'U'}</div>
                  <div><h2 className="text-3xl font-extrabold text-slate-800">My Profile</h2><p className="text-slate-500 font-medium">Update your professional details to stand out.</p></div>
                </div>
                
                {/* ✨ RESUME UPLOAD UI ✨ */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 border-dashed flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><FileText size={24}/></div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Your Resume (PDF)</p>
                    {profileData.resume_url ? (
                      <a href={profileData.resume_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-semibold hover:underline">View Uploaded Resume</a>
                    ) : (
                      <p className="text-xs text-slate-500">No resume uploaded</p>
                    )}
                  </div>
                  <label className="ml-auto bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition">
                    {uploadingResume ? 'Uploading...' : 'Upload'}
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} disabled={uploadingResume} />
                  </label>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                {/* Section 1 & 2 (Unchanged from previous code for brevity but fully functional) */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18} className="text-indigo-500"/> Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label><input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label><input type="email" value={profileData.email} disabled className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Contact Number</label><input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-slate-700 mb-2">Age</label><input type="number" value={profileData.age} onChange={e => setProfileData({...profileData, age: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-2">Gender</label><select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-indigo-500"/> Professional Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Degree / Qualification</label><input type="text" value={profileData.degree} onChange={e => setProfileData({...profileData, degree: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Key Skills</label><input type="text" value={profileData.skills} onChange={e => setProfileData({...profileData, skills: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><LinkIcon size={16} className="text-slate-400"/> Portfolio / LinkedIn URL</label><input type="url" value={profileData.portfolio_url} onChange={e => setProfileData({...profileData, portfolio_url: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2">About Me (Bio)</label><textarea rows="3" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"></textarea></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm disabled:opacity-70"><Save size={20} /> {isSaving ? 'Saving...' : 'Save Profile Changes'}</button>
                </div>
              </form>
            </div>
          ) : (
          <>
            <div className="mb-8"><h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {profileData.name || user.email.split('@')[0]}!</h1><p className="text-slate-500 mt-2">Click on the cards below to view your job processes.</p></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div onClick={() => setActiveBox('active')} className={`p-6 rounded-2xl shadow-sm cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'active' ? 'bg-emerald-600 shadow-emerald-200 shadow-lg ring-4 ring-emerald-100' : 'bg-emerald-500 hover:bg-emerald-600'}`}><p className="font-semibold text-emerald-50">Active Events</p><h2 className="text-4xl font-extrabold mt-3 text-white">{liveEvents.length}</h2></div>
              <div onClick={() => setActiveBox('applied')} className={`p-6 rounded-2xl shadow-sm cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'applied' ? 'bg-amber-600 shadow-amber-200 shadow-lg ring-4 ring-amber-100' : 'bg-amber-500 hover:bg-amber-600'}`}><p className="font-semibold text-amber-50">Applied</p><h2 className="text-4xl font-extrabold mt-3 text-white">{appliedEvents.length}</h2></div>
              <div onClick={() => setActiveBox('saved')} className={`p-6 rounded-2xl shadow-sm cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'saved' ? 'bg-rose-600 shadow-rose-200 shadow-lg ring-4 ring-rose-100' : 'bg-rose-500 hover:bg-rose-600'}`}><p className="font-semibold text-rose-50">Saved</p><h2 className="text-4xl font-extrabold mt-3 text-white">{savedEvents.length}</h2></div>
            </div>

            {activeBox && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 capitalize">{activeBox === 'active' && '🟢 Live Job Events'}{activeBox === 'applied' && '🟡 Your Application Status'}{activeBox === 'saved' && '🔴 Your Saved Jobs'}</h3>
                  <button onClick={() => setActiveBox(null)} className="p-2 bg-slate-100 rounded-full hover:bg-red-100 hover:text-red-600 transition"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                  {displayData.length === 0 ? <p className="text-slate-500 text-center py-4">No events to show right now.</p> : (
                    displayData.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><MapPin size={16} className="text-blue-500"/> {item.district}</span>
                            <span className="flex items-center gap-1"><Calendar size={16} className="text-blue-500"/> {item.date}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {activeBox === 'active' && (<><button onClick={() => handleSave(item.id)} className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200"><Bookmark size={20} /></button><button onClick={() => handleApply(item.id)} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-600">Apply Now</button></>)}
                          
                          {/* ✨ STATUS TRACKER BADGES ✨ */}
                          {activeBox === 'applied' && (
                            <span className={`px-4 py-2 text-sm font-bold rounded-lg border flex items-center gap-2 
                              ${item.app_status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                item.app_status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                                item.app_status === 'Hired' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                'bg-amber-100 text-amber-700 border-amber-200'}`}
                            >
                              {item.app_status === 'Shortlisted' ? <CheckCircle size={16}/> : 
                               item.app_status === 'Rejected' ? <XCircle size={16}/> : 
                               <Clock size={16}/>} 
                              {item.app_status || 'Applied'}
                            </span>
                          )}
                          
                          {activeBox === 'saved' && <button onClick={() => handleApplyFromSaved(item.application_id)} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700">Apply Now</button>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
          )}
        </main>
      </div>
    </div>
  );
}
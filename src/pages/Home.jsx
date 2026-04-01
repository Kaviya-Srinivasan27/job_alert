import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { LayoutDashboard, Bookmark, CheckCircle, Bell, MapPin, Calendar, X, User, Save, Briefcase, Link as LinkIcon, FileText, Clock, XCircle, ChevronRight, Sparkles, Trophy, Search, Filter } from 'lucide-react'; 
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
    skills: '', portfolio_url: '', bio: '', resume_url: '' 
  });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const filterOptions = ['All', 'Software', 'UI/UX', 'Fullstack', 'Walk-in', 'Core', 'Workshop', 'PPT'];

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
        fetchLiveEvents(); 
        fetchUserApplications(user.id);
      } else window.location.href = '/';
    };
    checkUser();
  }, []);

  const fetchLiveEvents = async () => {
    const { data } = await supabase.from('events').select('*').eq('status', 'Active').order('created_at', { ascending: false });
    if (data) setLiveEvents(data);
  };

  // ✨ FIXED: Database-la pazhaya duplicates irundhalum code clean pannidum
  const fetchUserApplications = async (userId) => {
    const { data, error } = await supabase.from('applications').select('id, status, event_id, events(*)').eq('student_id', userId);
    
    if (!error && data) {
      // 🧹 Remove Duplicate Entries (Testing la varra duplicates)
      const uniqueAppsMap = new Map();
      data.forEach(app => {
        const existing = uniqueAppsMap.get(app.event_id);
        if (!existing || (existing.status === 'Saved' && app.status !== 'Saved')) {
          uniqueAppsMap.set(app.event_id, app);
        }
      });
      const uniqueData = Array.from(uniqueAppsMap.values());

      const applied = uniqueData
        .filter(app => app.status !== 'Saved')
        .map(app => ({ ...app.events, application_id: app.id, app_status: app.status }));
      setAppliedEvents(applied);

      const saved = uniqueData
        .filter(app => app.status === 'Saved')
        .map(app => ({ ...app.events, application_id: app.id }));
      setSavedEvents(saved);
    }
  };

  const handleApply = async (eventId) => {
    const alreadyApplied = appliedEvents.find(e => e.id === eventId);
    if (alreadyApplied) return alert("You have already applied for this event!");

    const { error } = await supabase.from('applications').insert([{ student_id: user.id, event_id: eventId, status: 'Applied' }]);
    if (!error) { alert("Successfully Applied! 🎉"); fetchUserApplications(user.id); setActiveBox('applied'); }
  };

  const handleSave = async (eventId) => {
    const alreadySaved = savedEvents.find(e => e.id === eventId);
    if (alreadySaved) return alert("Event already saved!");

    const { error } = await supabase.from('applications').insert([{ student_id: user.id, event_id: eventId, status: 'Saved' }]);
    if (!error) { alert("Job Saved Successfully! 🔖"); fetchUserApplications(user.id); setActiveBox('saved'); }
  };

  const handleApplyFromSaved = async (applicationId) => {
    const { error } = await supabase.from('applications').update({ status: 'Applied' }).eq('id', applicationId);
    if (!error) { alert("Applied from Saved Jobs! 🚀"); fetchUserApplications(user.id); setActiveBox('applied'); }
  };

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

  const calculateCompletion = () => {
    const fields = ['name', 'phone', 'age', 'gender', 'degree', 'skills', 'portfolio_url', 'bio', 'resume_url'];
    const filled = fields.filter(f => profileData[f] && profileData[f].toString().trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };
  const completionPercentage = calculateCompletion();

  let displayData = [];
  if (activeBox === 'active') {
    displayData = liveEvents.filter(item => {
      const matchesSearch = (item?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item?.district || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || 
                            (item?.title || '').toLowerCase().includes(activeFilter.toLowerCase()) ||
                            (item?.event_type || '').toLowerCase().includes(activeFilter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  } else if (activeBox === 'applied') {
    displayData = appliedEvents.filter(item => (item?.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
  } else if (activeBox === 'saved') {
    displayData = savedEvents.filter(item => (item?.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-xl font-bold text-slate-500 animate-pulse">Loading your workspace...</p></div>;

  return (
    <div className="flex h-screen font-sans bg-slate-50 overflow-hidden relative">
      
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-full shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 cursor-pointer" onClick={() => {setCurrentView('dashboard'); setActiveBox(null);}}>
          <h2 className="text-xl font-extrabold text-blue-600 flex items-center gap-2"><LayoutDashboard size={24} /> Student Panel</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('active'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'dashboard' && activeBox === 'active' ? 'font-bold bg-blue-50 text-blue-700' : 'font-semibold text-slate-600 hover:bg-slate-50'}`}><Bell size={20} /> Live Alerts</button>
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('applied'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'dashboard' && activeBox === 'applied' ? 'font-bold bg-amber-50 text-amber-700' : 'font-semibold text-slate-600 hover:bg-slate-50'}`}><CheckCircle size={20} /> My Applications</button>
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('saved'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'dashboard' && activeBox === 'saved' ? 'font-bold bg-rose-50 text-rose-700' : 'font-semibold text-slate-600 hover:bg-slate-50'}`}><Bookmark size={20} /> Saved Events</button>
          <div className="my-4 border-t border-slate-100"></div>
          <button onClick={() => setCurrentView('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentView === 'profile' ? 'font-bold bg-indigo-50 text-indigo-700' : 'font-semibold text-slate-600 hover:bg-slate-50'}`}><User size={20} /> My Profile</button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <Navbar /> 
        
        <main className="p-4 md:p-10 max-w-6xl mx-auto w-full pb-28 md:pb-20">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 capitalize break-all">{profileData?.name || user?.email?.split('@')[0] || 'Student'}</span> 👋
              </h1>
              <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Here is what's happening with your job applications today.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm w-full lg:w-72 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 flex items-center gap-1"><Trophy size={16} className="text-amber-500"/> Profile Setup</span>
                <span className="text-indigo-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
              </div>
              {completionPercentage < 100 && (
                <p className="text-xs text-slate-400 font-medium cursor-pointer hover:text-indigo-600 transition" onClick={() => setCurrentView('profile')}>Complete your profile to stand out →</p>
              )}
            </div>
          </div>

          {currentView === 'profile' ? (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black uppercase shadow-lg shadow-indigo-200 transform rotate-3">{(profileData?.name || user?.email || 'U').charAt(0)}</div>
                  <div><h2 className="text-xl md:text-3xl font-extrabold text-slate-800">My Profile</h2><p className="text-xs md:text-sm text-slate-500 font-medium">Update your professional info.</p></div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 border-dashed flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 md:p-3 rounded-xl text-blue-600"><FileText size={20}/></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Your Resume (PDF)</p>
                      {profileData.resume_url ? (<a href={profileData.resume_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-semibold hover:underline">View Uploaded Resume</a>) : (<p className="text-xs text-slate-500">No resume uploaded</p>)}
                    </div>
                  </div>
                  <label className="sm:ml-auto w-full sm:w-auto text-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition shadow-sm">
                    {uploadingResume ? 'Uploading...' : 'Upload'}
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} disabled={uploadingResume} />
                  </label>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18} className="text-indigo-500"/> Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label><input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label><input type="email" value={profileData.email} disabled className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed text-sm" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Contact Number</label><input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-slate-700 mb-2">Age</label><input type="number" value={profileData.age} onChange={e => setProfileData({...profileData, age: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm" /></div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-2">Gender</label><select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-indigo-500"/> Professional Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Degree / Qualification</label><input type="text" value={profileData.degree} onChange={e => setProfileData({...profileData, degree: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Key Skills</label><input type="text" value={profileData.skills} onChange={e => setProfileData({...profileData, skills: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm" placeholder="e.g. React, UX Design" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><LinkIcon size={16} className="text-slate-400"/> Portfolio / LinkedIn URL</label><input type="url" value={profileData.portfolio_url} onChange={e => setProfileData({...profileData, portfolio_url: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2">About Me (Bio)</label><textarea rows="3" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition resize-none text-sm"></textarea></div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isSaving} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-70"><Save size={20} /> {isSaving ? 'Saving...' : 'Save Profile Changes'}</button>
                </div>
              </form>
            </div>
          ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              <div onClick={() => setActiveBox('active')} className={`relative overflow-hidden p-6 rounded-3xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'active' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200 shadow-xl ring-4 ring-emerald-100 text-white' : 'bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md group'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${activeBox === 'active' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}><Briefcase size={24} /></div>
                <p className={`font-semibold text-sm ${activeBox === 'active' ? 'text-emerald-50' : 'text-slate-500'}`}>Active Job Events</p>
                <h2 className={`text-3xl md:text-4xl font-extrabold mt-1 ${activeBox === 'active' ? 'text-white' : 'text-slate-800'}`}>{liveEvents.length}</h2>
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-black pointer-events-none"><Briefcase size={120}/></div>
              </div>

              <div onClick={() => setActiveBox('applied')} className={`relative overflow-hidden p-6 rounded-3xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'applied' ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-200 shadow-xl ring-4 ring-amber-100 text-white' : 'bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md group'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${activeBox === 'applied' ? 'bg-white/20' : 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'}`}><CheckCircle size={24} /></div>
                <p className={`font-semibold text-sm ${activeBox === 'applied' ? 'text-amber-50' : 'text-slate-500'}`}>Jobs Applied</p>
                <h2 className={`text-3xl md:text-4xl font-extrabold mt-1 ${activeBox === 'applied' ? 'text-white' : 'text-slate-800'}`}>{appliedEvents.length}</h2>
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-black pointer-events-none"><CheckCircle size={120}/></div>
              </div>

              <div onClick={() => setActiveBox('saved')} className={`relative overflow-hidden p-6 rounded-3xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'saved' ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200 shadow-xl ring-4 ring-rose-100 text-white' : 'bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md group'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${activeBox === 'saved' ? 'bg-white/20' : 'bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white'}`}><Bookmark size={24} /></div>
                <p className={`font-semibold text-sm ${activeBox === 'saved' ? 'text-rose-50' : 'text-slate-500'}`}>Saved for Later</p>
                <h2 className={`text-3xl md:text-4xl font-extrabold mt-1 ${activeBox === 'saved' ? 'text-white' : 'text-slate-800'}`}>{savedEvents.length}</h2>
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-black pointer-events-none"><Bookmark size={120}/></div>
              </div>
            </div>

            {activeBox ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 capitalize flex items-center gap-2 md:gap-3">
                    {activeBox === 'active' && <><span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> Events</>}
                    {activeBox === 'applied' && <><span className="w-3 h-3 rounded-full bg-amber-500"></span> Applied</>}
                    {activeBox === 'saved' && <><span className="w-3 h-3 rounded-full bg-rose-500"></span> Saved</>}
                  </h3>
                  <button onClick={() => {setActiveBox(null); setSearchQuery(''); setActiveFilter('All');}} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 hover:text-slate-800 transition"><X size={18} /></button>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input type="text" placeholder="Search jobs, skills, or locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm font-medium" />
                  </div>

                  {activeBox === 'active' && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      <Filter size={16} className="text-slate-400 mr-1 flex-shrink-0" />
                      {filterOptions.map(filter => (
                        <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === filter ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          {filter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {displayData.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-medium text-sm md:text-base">{searchQuery || activeFilter !== 'All' ? 'No matching jobs found. Try clearing your search! 🔍' : 'No events to show right now. Keep exploring! 🚀'}</p>
                    </div>
                  ) : (
                    displayData.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 hover:shadow-sm transition gap-4 group">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base md:text-lg group-hover:text-blue-600 transition-colors">{item?.title || 'Untitled Event'}</h4>
                          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-xs md:text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> {item?.district || 'TBD'}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} className="text-slate-400"/> {item?.date ? new Date(item.date).toLocaleDateString() : 'No Date'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-0">
                          {activeBox === 'active' && (() => {
                            // ✨ FIXED: Check if the user already applied/saved this specific event
                            const appliedDetails = appliedEvents.find(e => e.id === item.id);
                            const isSaved = savedEvents.find(e => e.id === item.id);

                            if (appliedDetails) {
                              return (
                                <span className={`w-full md:w-auto justify-center px-4 py-2 text-xs md:text-sm font-bold rounded-xl border flex items-center gap-2 shadow-sm
                                  ${appliedDetails.app_status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    appliedDetails.app_status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    'bg-amber-50 text-amber-700 border-amber-200'}`}
                                >
                                  {appliedDetails.app_status === 'Shortlisted' ? <CheckCircle size={14}/> : 
                                   appliedDetails.app_status === 'Rejected' ? <XCircle size={14}/> : 
                                   <Clock size={14}/>} 
                                  {appliedDetails.app_status || 'Applied'}
                                </span>
                              );
                            }

                            return (
                              <>
                                {!isSaved ? (
                                  <button onClick={() => handleSave(item.id)} className="p-2 md:p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition">
                                    <Bookmark size={18} />
                                  </button>
                                ) : (
                                  <span className="p-2 md:p-3 text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
                                    <Bookmark size={18} className="fill-rose-500" />
                                  </span>
                                )}
                                <button onClick={() => handleApply(item.id)} className="flex-1 md:flex-none justify-center px-4 md:px-6 py-2.5 md:py-3 bg-slate-900 text-white text-xs md:text-sm font-bold rounded-xl hover:bg-blue-600 transition shadow-sm flex items-center gap-2">
                                  Apply <ChevronRight size={14}/>
                                </button>
                              </>
                            );
                          })()}
                          
                          {activeBox === 'applied' && (
                            <span className={`w-full md:w-auto justify-center px-3 py-2 text-xs md:text-sm font-bold rounded-xl border flex items-center gap-2 shadow-sm
                              ${item.app_status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                item.app_status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                'bg-amber-50 text-amber-700 border-amber-200'}`}
                            >
                              {item.app_status === 'Shortlisted' ? <CheckCircle size={14}/> : 
                               item.app_status === 'Rejected' ? <XCircle size={14}/> : 
                               <Clock size={14}/>} 
                              {item.app_status || 'Applied'}
                            </span>
                          )}
                          
                          {activeBox === 'saved' && <button onClick={() => handleApplyFromSaved(item.application_id)} className="w-full md:w-auto justify-center px-4 py-2.5 bg-emerald-600 text-white text-xs md:text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm flex items-center gap-2">Apply <ChevronRight size={14}/></button>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-4 md:mb-6 mt-2 md:mt-4">
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-800 flex items-center gap-2"><Sparkles size={18} className="text-amber-500"/> Recommended for You</h3>
                  <button onClick={() => setActiveBox('active')} className="text-xs md:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">View All <ChevronRight size={14}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {liveEvents.slice(0, 4).map(item => (
                    <div key={item.id} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl">{(item?.title || 'J').charAt(0).toUpperCase()}</div>
                        <span className="bg-green-100 text-green-700 text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full">New</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base md:text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{item?.title || 'Untitled Event'}</h4>
                      <p className="text-slate-500 text-xs md:text-sm font-medium flex items-center gap-1.5 md:gap-2 mb-4 md:mb-6"><MapPin size={12} md:size={14}/> {item?.district || 'TBD'}</p>
                      
                      <button onClick={() => { setActiveBox('active'); setTimeout(() => handleApply(item.id), 300); }} className="w-full py-2.5 md:py-3 bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white text-xs md:text-sm font-bold rounded-xl border border-slate-200 hover:border-blue-600 transition-all">
                        Apply Now
                      </button>
                    </div>
                  ))}
                  {liveEvents.length === 0 && <p className="text-slate-500 col-span-1 md:col-span-2 text-sm">No recommended jobs available right now.</p>}
                </div>
              </div>
            )}
          </>
          )}
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 py-3 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
        <button onClick={() => { setCurrentView('dashboard'); setActiveBox('active'); }} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'dashboard' && activeBox === 'active' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Briefcase size={22} className={currentView === 'dashboard' && activeBox === 'active' ? 'fill-blue-50/50' : ''}/>
          <span className="text-[10px] font-extrabold">Jobs</span>
        </button>
        <button onClick={() => { setCurrentView('dashboard'); setActiveBox('applied'); }} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'dashboard' && activeBox === 'applied' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <CheckCircle size={22} className={currentView === 'dashboard' && activeBox === 'applied' ? 'fill-amber-50/50' : ''}/>
          <span className="text-[10px] font-extrabold">Applied</span>
        </button>
        <button onClick={() => { setCurrentView('dashboard'); setActiveBox('saved'); }} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'dashboard' && activeBox === 'saved' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Bookmark size={22} className={currentView === 'dashboard' && activeBox === 'saved' ? 'fill-rose-50/50' : ''}/>
          <span className="text-[10px] font-extrabold">Saved</span>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'profile' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <User size={22} className={currentView === 'profile' ? 'fill-indigo-50/50' : ''}/>
          <span className="text-[10px] font-extrabold">Profile</span>
        </button>
      </div>

    </div>
  );
}
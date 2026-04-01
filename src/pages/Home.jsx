import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { LayoutDashboard, Bookmark, CheckCircle, Bell, MapPin, Calendar, X, User, Save, Briefcase, Link as LinkIcon, FileText, Clock, XCircle, ChevronRight, Sparkles, Trophy, Search, Filter } from 'lucide-react'; 
import { supabase } from '../supabase'; 

export default function Home() {
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [activeBox, setActiveBox] = useState('active'); 

  const [liveEvents, setLiveEvents] = useState([]);
  const [appliedEvents, setAppliedEvents] = useState([]); 
  const [savedEvents, setSavedEvents] = useState([]); 
  
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', age: '', gender: '', degree: '', skills: '', portfolio_url: '', bio: '', resume_url: '' });
  
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
          setProfileData({ ...userData, email: userData.email || user.email });
        }
        fetchLiveEvents(); 
        fetchUserApplications(user.id);
      } else {
        window.location.href = '/';
      }
    };
    checkUser();
  }, []);

  const fetchLiveEvents = async () => {
    const { data } = await supabase.from('events').select('*').eq('status', 'Active').order('created_at', { ascending: false });
    if (data) {
      const uniqueEvents = [];
      const seenTitles = new Set();
      data.forEach(event => {
        const titleKey = event.title.trim().toLowerCase();
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          uniqueEvents.push(event);
        }
      });
      setLiveEvents(uniqueEvents);
    }
  };

  const fetchUserApplications = async (userId) => {
    const { data, error } = await supabase.from('applications').select('id, status, event_id, events(*)').eq('student_id', userId);
    
    if (!error && data) {
      const uniqueAppsMap = new Map();
      data.forEach(app => {
        if (app.events) {
          const existing = uniqueAppsMap.get(app.event_id);
          if (!existing || (existing.status === 'Saved' && app.status !== 'Saved')) {
            uniqueAppsMap.set(app.event_id, app);
          }
        }
      });
      const validApps = Array.from(uniqueAppsMap.values());

      setAppliedEvents(validApps.filter(app => app.status !== 'Saved').map(app => ({ ...app.events, application_id: app.id, app_status: app.status })));
      setSavedEvents(validApps.filter(app => app.status === 'Saved').map(app => ({ ...app.events, application_id: app.id })));
    }
  };

  const handleApply = async (eventId) => {
    const alreadyApplied = appliedEvents.find(e => e.id === eventId);
    if (alreadyApplied) return alert("You have already applied for this event!");

    const { error } = await supabase.from('applications').insert([{ student_id: user.id, event_id: eventId, status: 'Applied' }]);
    if (!error) { 
      const eventToMove = liveEvents.find(e => e.id === eventId);
      if (eventToMove) setAppliedEvents(prev => [...prev, { ...eventToMove, app_status: 'Applied' }]);
      alert("Successfully Applied! 🎉"); 
      setActiveBox('applied'); 
      fetchUserApplications(user.id); 
    }
  };

  const handleSave = async (eventId) => {
    const alreadySaved = savedEvents.find(e => e.id === eventId);
    if (alreadySaved) return alert("Event already saved!");
    const { error } = await supabase.from('applications').insert([{ student_id: user.id, event_id: eventId, status: 'Saved' }]);
    if (!error) { alert("Job Saved Successfully! 🔖"); fetchUserApplications(user.id); }
  };

  const handleApplyFromSaved = async (applicationId, eventId) => {
    const { error } = await supabase.from('applications').update({ status: 'Applied' }).eq('id', applicationId);
    if (!error) { 
      setSavedEvents(prev => prev.filter(e => e.application_id !== applicationId));
      const eventToMove = liveEvents.find(e => e.id === eventId);
      if (eventToMove) setAppliedEvents(prev => [...prev, { ...eventToMove, app_status: 'Applied' }]);
      alert("Applied from Saved Jobs! 🚀"); 
      setActiveBox('applied');
      fetchUserApplications(user.id); 
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingResume(true);
    const fileName = `${user.id}-${Math.random()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file);
    if (!uploadError) {
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
    setIsSaving(false);
  };

  const calculateCompletion = () => {
    const fields = ['name', 'phone', 'age', 'gender', 'degree', 'skills', 'portfolio_url', 'bio', 'resume_url'];
    const filled = fields.filter(f => profileData[f] && profileData[f].toString().trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };
  const completionPercentage = calculateCompletion();

  let displayData = [];
  const availableLiveEvents = liveEvents.filter(item => !appliedEvents.some(app => app.id === item.id));

  if (activeBox === 'active') {
    displayData = availableLiveEvents.filter(item => {
      const matchesSearch = (item?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || (item?.title || '').toLowerCase().includes(activeFilter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  } else if (activeBox === 'applied') {
    displayData = appliedEvents.filter(item => (item?.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
  } else if (activeBox === 'saved') {
    displayData = savedEvents.filter(item => (item?.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50">Loading...</div>;

  return (
    <div className="flex h-screen font-sans bg-slate-50/50 overflow-hidden relative">
      
      {/* ✨ PREMIUM SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 border-b border-slate-50 cursor-pointer" onClick={() => {setCurrentView('dashboard'); setActiveBox('active');}}>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 flex items-center gap-2"><LayoutDashboard size={24} className="text-blue-600" /> JobAlert.tn</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Menu</p>
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('active'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'dashboard' && activeBox === 'active' ? 'bg-blue-50/80 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100/50' : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}><Bell size={18} className={currentView === 'dashboard' && activeBox === 'active' ? 'fill-blue-100' : ''}/> Live Alerts</button>
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('applied'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'dashboard' && activeBox === 'applied' ? 'bg-amber-50/80 text-amber-700 font-bold shadow-sm ring-1 ring-amber-100/50' : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}><CheckCircle size={18} className={currentView === 'dashboard' && activeBox === 'applied' ? 'fill-amber-100' : ''}/> My Applications</button>
          <button onClick={() => { setCurrentView('dashboard'); setActiveBox('saved'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'dashboard' && activeBox === 'saved' ? 'bg-rose-50/80 text-rose-700 font-bold shadow-sm ring-1 ring-rose-100/50' : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}><Bookmark size={18} className={currentView === 'dashboard' && activeBox === 'saved' ? 'fill-rose-100' : ''}/> Saved Events</button>
          <div className="my-6 border-t border-slate-100"></div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Account</p>
          <button onClick={() => setCurrentView('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'profile' ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100/50' : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}><User size={18} className={currentView === 'profile' ? 'fill-indigo-100' : ''}/> My Profile</button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto scroll-smooth">
        <Navbar /> 
        
        <main className="p-4 md:p-10 max-w-6xl mx-auto w-full pb-28 md:pb-20">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
            <div className="animate-in slide-in-from-left duration-500">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 capitalize break-all">{profileData?.name || user?.email?.split('@')[0]}</span> 👋
              </h1>
              <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Track your job applications and discover new opportunities.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full lg:w-80 flex flex-col gap-3 animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center text-sm font-extrabold"><span className="text-slate-700 flex items-center gap-1.5"><Trophy size={16} className="text-amber-500 fill-amber-100"/> Profile Setup</span><span className="text-indigo-600">{completionPercentage}%</span></div>
              <div className="w-full bg-slate-100/80 rounded-full h-2.5 overflow-hidden shadow-inner"><div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 relative overflow-hidden" style={{ width: `${completionPercentage}%` }}>
                <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-pulse"></div>
              </div></div>
              {completionPercentage < 100 && (<p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition" onClick={() => setCurrentView('profile')}>Complete profile to stand out →</p>)}
            </div>
          </div>

          {currentView === 'profile' ? (
             <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500">
             
             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-slate-100">
               <div className="flex items-center gap-5">
                 <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black uppercase shadow-lg shadow-indigo-200/50 transform -rotate-3 hover:rotate-0 transition-all duration-300">{(profileData?.name || user?.email || 'U').charAt(0)}</div>
                 <div><h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">My Profile</h2><p className="text-sm text-slate-500 font-medium mt-1">Manage your professional identity.</p></div>
               </div>
               
               <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 border-dashed flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 group">
                 <div className="flex items-center gap-3">
                   <div className="bg-white p-3 rounded-xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                   <div>
                     <p className="text-sm font-extrabold text-slate-800">Your Resume (PDF)</p>
                     {profileData.resume_url ? (<a href={profileData.resume_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">View Uploaded Document</a>) : (<p className="text-xs text-slate-500 font-medium">No document uploaded</p>)}
                   </div>
                 </div>
                 <label className="sm:ml-auto w-full sm:w-auto text-center bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all">
                   {uploadingResume ? 'Uploading...' : 'Upload'}
                   <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} disabled={uploadingResume} />
                 </label>
               </div>
             </div>

             <form onSubmit={handleUpdateProfile} className="space-y-10">
                {/* ✨ Section 1: Personal Information */}
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><User size={18}/></span> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name</label><input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label><input value={profileData.email} disabled className="w-full p-4 bg-slate-100 border border-slate-100 rounded-2xl text-slate-400 cursor-not-allowed text-sm font-medium" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Contact Number</label><input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Age</label><input type="number" value={profileData.age} onChange={e => setProfileData({...profileData, age: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" /></div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Gender</label>
                        <select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium text-slate-700">
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full border-t border-slate-100"></div>

                {/* ✨ Section 2: Professional Profile */}
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2.5">
                    <span className="p-2 bg-blue-50 rounded-lg text-blue-600"><Briefcase size={18}/></span> Professional Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Degree & Branch</label><input value={profileData.degree} onChange={e => setProfileData({...profileData, degree: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" placeholder="e.g. B.Sc Computer Science" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Key Skills</label><input value={profileData.skills} onChange={e => setProfileData({...profileData, skills: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" placeholder="e.g. React, UI/UX Design" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-1.5"><LinkIcon size={14} className="text-slate-400"/> Portfolio / LinkedIn URL</label><input type="url" value={profileData.portfolio_url} onChange={e => setProfileData({...profileData, portfolio_url: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" placeholder="https://..." /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">About Me (Bio)</label><textarea rows="3" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none text-sm font-medium" placeholder="Write a short summary about yourself..."></textarea></div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={isSaving} className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 flex items-center justify-center gap-2">
                    <Save size={18} /> {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
             </form>
           </div>
          ) : (
          <>
            {/* Cards and Event Lists remain exactly as they were in the ultra-premium version */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              <div onClick={() => setActiveBox('active')} className={`relative overflow-hidden p-6 rounded-[2rem] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'active' ? 'bg-white border-2 border-emerald-500 shadow-[0_8px_30px_rgb(16,185,129,0.15)]' : 'bg-white border-2 border-transparent shadow-sm hover:shadow-md'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-slate-500 mb-1">Available Jobs</p>
                    <h2 className="text-4xl font-black text-slate-800">{availableLiveEvents.length}</h2>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeBox === 'active' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-50 text-emerald-500'}`}><Briefcase size={24} /></div>
                </div>
              </div>

              <div onClick={() => setActiveBox('applied')} className={`relative overflow-hidden p-6 rounded-[2rem] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'applied' ? 'bg-white border-2 border-amber-500 shadow-[0_8px_30px_rgb(245,158,11,0.15)]' : 'bg-white border-2 border-transparent shadow-sm hover:shadow-md'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-slate-500 mb-1">Applications</p>
                    <h2 className="text-4xl font-black text-slate-800">{appliedEvents.length}</h2>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeBox === 'applied' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-50 text-amber-500'}`}><CheckCircle size={24} /></div>
                </div>
              </div>

              <div onClick={() => setActiveBox('saved')} className={`relative overflow-hidden p-6 rounded-[2rem] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${activeBox === 'saved' ? 'bg-white border-2 border-rose-500 shadow-[0_8px_30px_rgb(244,63,94,0.15)]' : 'bg-white border-2 border-transparent shadow-sm hover:shadow-md'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-slate-500 mb-1">Saved Jobs</p>
                    <h2 className="text-4xl font-black text-slate-800">{savedEvents.length}</h2>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeBox === 'saved' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-50 text-rose-500'}`}><Bookmark size={24} /></div>
                </div>
              </div>
            </div>

            {activeBox && (
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 capitalize tracking-tight flex items-center gap-3">
                    {activeBox === 'active' && <><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgb(16,185,129)] animate-pulse"></span> Events Available</>}
                    {activeBox === 'applied' && <><span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgb(245,158,11)]"></span> Your Applications</>}
                    {activeBox === 'saved' && <><span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgb(244,63,94)]"></span> Saved Opportunities</>}
                  </h3>
                  <button onClick={() => {setActiveBox(null); setSearchQuery(''); setActiveFilter('All');}} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 hover:text-slate-800 transition"><X size={18} /></button>
                </div>

                <div className="flex flex-col gap-5 mb-8">
                  <div className="relative w-full group">
                    <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input type="text" placeholder="Search jobs, skills, or locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium" />
                  </div>

                  {activeBox === 'active' && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
                      <Filter size={16} className="text-slate-300 mr-2 flex-shrink-0" />
                      {filterOptions.map(filter => (
                        <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeFilter === filter ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>
                          {filter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {displayData.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-bold">{activeBox === 'active' ? "You've applied to all available jobs! 🎉 Great job." : "No events here right now."}</p>
                    </div>
                  ) : (
                    displayData.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 gap-5 group">
                        <div className="flex items-start gap-4">
                          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-slate-50 items-center justify-center text-xl font-black text-indigo-600 group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                            {item?.title?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors tracking-tight">{item?.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> {item?.district}</span>
                              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> {item?.date ? new Date(item.date).toLocaleDateString() : 'TBD'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {activeBox === 'active' && (
                            <>
                              <button onClick={() => handleSave(item.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-100 transition-all"><Bookmark size={18} /></button>
                              <button onClick={() => handleApply(item.id)} className="flex-1 md:flex-none justify-center px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm flex items-center gap-2">Apply <ChevronRight size={14}/></button>
                            </>
                          )}
                          
                          {activeBox === 'applied' && (
                            <span className="px-5 py-2.5 text-xs font-bold rounded-xl border bg-amber-50/50 text-amber-700 border-amber-200 flex items-center gap-2"><Clock size={14}/> {item.app_status || 'Applied'}</span>
                          )}
                          
                          {activeBox === 'saved' && <button onClick={() => handleApplyFromSaved(item.application_id, item.id)} className="w-full md:w-auto justify-center px-6 py-3 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">Apply Now</button>}
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

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-50 px-6 py-3 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
        <button onClick={() => { setCurrentView('dashboard'); setActiveBox('active'); }} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'dashboard' && activeBox === 'active' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <Briefcase size={22} className={currentView === 'dashboard' && activeBox === 'active' ? 'fill-indigo-50' : ''}/>
          <span className="text-[10px] font-black uppercase tracking-wider">Jobs</span>
        </button>
        <button onClick={() => { setCurrentView('dashboard'); setActiveBox('applied'); }} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'dashboard' && activeBox === 'applied' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <CheckCircle size={22} className={currentView === 'dashboard' && activeBox === 'applied' ? 'fill-amber-50' : ''}/>
          <span className="text-[10px] font-black uppercase tracking-wider">Applied</span>
        </button>
        <button onClick={() => { setCurrentView('dashboard'); setActiveBox('saved'); }} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'dashboard' && activeBox === 'saved' ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <Bookmark size={22} className={currentView === 'dashboard' && activeBox === 'saved' ? 'fill-rose-50' : ''}/>
          <span className="text-[10px] font-black uppercase tracking-wider">Saved</span>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <User size={22} className={currentView === 'profile' ? 'fill-blue-50' : ''}/>
          <span className="text-[10px] font-black uppercase tracking-wider">Profile</span>
        </button>
      </div>

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, LogOut, Plus, MapPin, Calendar, Trash2, Menu, ChevronLeft, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '../supabase';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Toggle State
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newEvent, setNewEvent] = useState({ title: '', district: '', date: '' });
  
  // Get Today's Date for Validation (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  
  // Tamil Nadu Districts for Dropdown
  const districts = ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Dindigul", "Thanjavur", "Tiruppur", "Kanyakumari", "Kanchipuram"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: eventsData } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    const { data: appsData } = await supabase.from('applications').select('*');
    if (eventsData) setEvents(eventsData);
    if (appsData) setApplications(appsData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault(); // Prevents empty submission
    const { error } = await supabase.from('events').insert([{ ...newEvent, status: 'Active' }]);
    if (!error) {
      alert('Event Published Successfully! 🎉');
      setShowModal(false);
      setNewEvent({ title: '', district: '', date: '' });
      fetchData();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  };

  // Stats Calculations
  const activeEvents = events.filter(e => e.status === 'Active').length;
  const appliedCount = applications.filter(a => a.status === 'Applied').length;
  const shortlistedCount = applications.filter(a => a.status === 'Shortlisted').length;
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

  // Chart Data Preparation (Top 4 Districts)
  const districtCounts = events.reduce((acc, curr) => {
    acc[curr.district] = (acc[curr.district] || 0) + 1;
    return acc;
  }, {});
  const topDistricts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxDistrictCount = topDistricts.length > 0 ? Math.max(...topDistricts.map(d => d[1])) : 1;

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-['Inter']">Loading Dashboard...</div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-['Inter'] overflow-hidden">
      
      {/* ✨ SIDEBAR (Collapsible) */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0F172A] text-white transition-all duration-300 flex flex-col h-full shadow-2xl relative z-20`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <h2 className={`font-bold text-xl flex items-center gap-2 text-indigo-400 whitespace-nowrap overflow-hidden transition-all ${!isSidebarOpen && 'opacity-0 w-0'}`}>
            <LayoutDashboard size={24} className="text-white"/> JobAlert.tn
          </h2>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-hidden">
          <p className={`px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 transition-all ${!isSidebarOpen && 'opacity-0'}`}>Menu</p>
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm shadow-lg shadow-indigo-600/20 group">
            <LayoutDashboard size={20} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all ${!isSidebarOpen && 'opacity-0 hidden'}`}>Dashboard Overview</span>
          </button>
        </nav>

        {/* ✨ LOGOUT MOVED TO BOTTOM */}
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors group">
            <LogOut size={20} className="flex-shrink-0 group-hover:text-rose-500" />
            <span className={`font-medium text-sm whitespace-nowrap transition-all ${!isSidebarOpen && 'opacity-0 hidden'}`}>Logout System</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* ✨ TOP BAR RESPONSIVE FIX */}
        <header className="bg-white px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
          <div>
            {/* Title Font updated to Inter, 28px (text-3xl), Semi-bold */}
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Events Management</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap w-full sm:w-auto">
            <Plus size={18} /> Host New Event
          </button>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          
          {/* METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Briefcase size={24}/></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Events</p><h3 className="text-2xl font-black text-slate-800">{events.length}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BarChart3 size={24}/></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Events</p><h3 className="text-2xl font-black text-slate-800">{activeEvents}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Users size={24}/></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</p><h3 className="text-2xl font-black text-slate-800">{applications.length}</h3></div>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ✨ DYNAMIC BAR CHART WITH EMPTY STATE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><MapPin size={16} className="text-indigo-500"/> Job Events by District</h3>
              {topDistricts.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium border border-dashed rounded-xl bg-slate-50">No events hosted yet.</div>
              ) : (
                <div className="h-48 flex items-end gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {topDistricts.map(([district, count]) => (
                    <div key={district} className="flex-1 flex flex-col items-center justify-end gap-2 group min-w-[60px]">
                      <div className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 group-hover:bg-indigo-400 relative" style={{ height: `${(count / maxDistrictCount) * 100}%`, minHeight: '20px' }}>
                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">{district}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✨ DYNAMIC DONUT CHART WITH EMPTY STATE */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><PieChart size={16} className="text-indigo-500"/> Application Status Overview</h3>
              {applications.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium border border-dashed rounded-xl bg-slate-50">No applications received yet.</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                   <div className="flex gap-4 items-end h-32 w-full justify-center">
                     {/* Using Simple Flex bars as a reliable alternative to complex SVG donuts to ensure it renders perfectly everywhere */}
                     <div className="flex flex-col items-center gap-2"><div className="w-12 bg-amber-400 rounded-t-xl" style={{height: `${Math.max((appliedCount/applications.length)*100, 10)}%`}}></div><span className="text-xs font-bold text-amber-600">Applied ({appliedCount})</span></div>
                     <div className="flex flex-col items-center gap-2"><div className="w-12 bg-emerald-500 rounded-t-xl" style={{height: `${Math.max((shortlistedCount/applications.length)*100, 10)}%`}}></div><span className="text-xs font-bold text-emerald-600">Shortlisted ({shortlistedCount})</span></div>
                     <div className="flex flex-col items-center gap-2"><div className="w-12 bg-rose-500 rounded-t-xl" style={{height: `${Math.max((rejectedCount/applications.length)*100, 10)}%`}}></div><span className="text-xs font-bold text-rose-600">Rejected ({rejectedCount})</span></div>
                   </div>
                </div>
              )}
            </div>

          </div>

          {/* EVENTS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Recent Events</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Event Name</th>
                    <th className="p-4">District</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-medium">No events posted yet.</td></tr>
                  ) : (
                    events.map(event => (
                      <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{event.title}</td>
                        <td className="p-4 text-sm text-slate-500">{event.district}</td>
                        <td className="p-4 text-sm text-slate-500">{event.date}</td>
                        <td className="p-4 flex items-center justify-center gap-2">
                          <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* ✨ HOST EVENT MODAL WITH VALIDATIONS */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Host New Event</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Event Title</label>
                <input 
                  type="text" 
                  required 
                  maxLength={50} // Restricts crazy long names
                  placeholder="e.g. Full Stack Developer Drive" 
                  value={newEvent.title} 
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-sm font-medium" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">District</label>
                {/* Changed to Select Dropdown */}
                <select 
                  required 
                  value={newEvent.district} 
                  onChange={e => setNewEvent({...newEvent, district: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-sm font-medium text-slate-700"
                >
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Event Date</label>
                <input 
                  type="date" 
                  required 
                  min={today} // Blocks Past Dates
                  value={newEvent.date} 
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition text-sm font-medium text-slate-700" 
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 mt-4 flex items-center justify-center gap-2">
                Publish Event 🚀
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
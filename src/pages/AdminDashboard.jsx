import React, { useState, useEffect, useMemo } from 'react';
// ✨ MapPin icon ippo correct-a import aagirukku!
import { LayoutDashboard, Briefcase, Plus, Trash2, X, Users, Activity, CheckCircle, Search, Filter, Download, FileText, Check, XCircle, LogOut, MapPin } from 'lucide-react'; 
import { supabase } from '../supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', district: '', event_type: 'Walk-in', date: '', status: 'Active' });

  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [allApplications, setAllApplications] = useState([]); 
  const [metrics, setMetrics] = useState({ totalEvents: 0, activeEvents: 0, totalApplications: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  const fetchData = async () => {
    const { data: eventsData, error: eventsError } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    const { data: appsData } = await supabase.from('applications').select('id, status, event_id');

    if (!eventsError && eventsData) {
      setEvents(eventsData);
      setAllApplications(appsData || []);
      const active = eventsData.filter(e => e.status === 'Active').length;
      setMetrics({ totalEvents: eventsData.length, activeEvents: active, totalApplications: appsData?.length || 0 });
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleHostEvent = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('events').insert([newEvent]);
    if (!error) { setShowModal(false); setNewEvent({ title: '', district: '', event_type: 'Walk-in', date: '', status: 'Active' }); fetchData(); }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    await supabase.from('applications').delete().eq('event_id', id);
    const { error: eventError } = await supabase.from('events').delete().eq('id', id);
    if (!eventError) fetchData(); 
  };

  const handleViewApplicants = async (event) => {
    setSelectedEvent(event);
    setShowApplicantsModal(true);
    setApplicants([]); 
    const { data, error } = await supabase.from('applications').select('id, status, created_at, users(name, email, resume_url)').eq('event_id', event.id);
    if (!error && data) {
      setApplicants(data.filter(app => app.status !== 'Saved'));
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', appId);
    if (!error) {
      setApplicants(applicants.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      fetchData(); 
    }
  };

  const downloadCSV = () => {
    if (applicants.length === 0) return;
    let csvContent = "Student Name,Email ID,Status,Applied Date\n";
    applicants.forEach(app => {
      csvContent += `${app.users?.name || 'Unknown'},${app.users?.email || 'N/A'},${app.status},${new Date(app.created_at).toLocaleDateString()}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEvent?.title}_Applicants.csv`;
    link.click();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  const uniqueDistricts = ['All', ...new Set(events.map(e => e.district))];
  const filteredEvents = events.filter(event => {
    return (event.title.toLowerCase().includes(searchQuery.toLowerCase())) && (selectedDistrict === 'All' || event.district.toLowerCase() === selectedDistrict.toLowerCase());
  });

  const jobsByDistrictData = useMemo(() => {
    const districtCounts = {};
    events.forEach(e => {
      districtCounts[e.district] = (districtCounts[e.district] || 0) + 1;
    });
    return Object.keys(districtCounts).map(key => ({ name: key, Events: districtCounts[key] }));
  }, [events]);

  const applicationStatusData = useMemo(() => {
    const statusCounts = { Applied: 0, Shortlisted: 0, Rejected: 0 };
    allApplications.forEach(app => {
      if (app.status !== 'Saved') {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      }
    });
    return [
      { name: 'Applied', value: statusCounts.Applied, color: '#F59E0B' }, 
      { name: 'Shortlisted', value: statusCounts.Shortlisted, color: '#10B981' }, 
      { name: 'Rejected', value: statusCounts.Rejected, color: '#EF4444' } 
    ];
  }, [allApplications]);


  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col h-full shadow-xl z-10">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-800"><div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm tracking-wider">JA</div><span className="text-xl font-extrabold tracking-tight">Admin Panel</span></div>
        <nav className="space-y-4"><button className="w-full text-left p-4 bg-indigo-600 rounded-xl font-bold flex items-center gap-3 shadow-md"><LayoutDashboard size={20}/> Dashboard Overview</button></nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-30">
           <h1 className="text-2xl font-extrabold text-slate-800">Events Management</h1>
           <div className="flex items-center gap-4">
             <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"><Plus size={20}/> Host New Event</button>
             <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-bold px-4 py-2.5 rounded-xl hover:bg-red-50 transition border border-slate-200 hover:border-red-200"><LogOut size={18} /> Logout</button>
           </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5"><div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Briefcase size={28} /></div><div><p className="text-slate-500 font-semibold text-sm">Total Events</p><h3 className="text-3xl font-black text-slate-800 mt-1">{metrics.totalEvents}</h3></div></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5"><div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><Activity size={28} /></div><div><p className="text-slate-500 font-semibold text-sm">Active Events</p><h3 className="text-3xl font-black text-slate-800 mt-1">{metrics.activeEvents}</h3></div></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5"><div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Users size={28} /></div><div><p className="text-slate-500 font-semibold text-sm">Total Applications</p><h3 className="text-3xl font-black text-slate-800 mt-1">{metrics.totalApplications}</h3></div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><MapPin size={18} className="text-indigo-500"/> Job Events by District</h3>
              <div className="h-64">
                {jobsByDistrictData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobsByDistrictData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                      <Bar dataKey="Events" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-slate-400">No data available</div>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> Application Status Overview</h3>
              <div className="h-64 flex items-center justify-center">
                {allApplications.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={applicationStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {applicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="text-slate-400">No applications yet</div>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-96"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm font-medium" /></div>
              <div className="flex items-center gap-2 w-full sm:w-auto"><Filter className="text-slate-400" size={18} /><select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm font-medium capitalize">{uniqueDistricts.map((d, i) => <option key={i} value={d}>{d}</option>)}</select></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr><th className="p-4 font-bold text-slate-600">Event Name</th><th className="p-4 font-bold text-slate-600">District</th><th className="p-4 font-bold text-slate-600">Status</th><th className="p-4 text-center font-bold text-slate-600">Actions</th></tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => (
                    <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-800">{event.title}</td><td className="p-4 text-slate-600 capitalize">{event.district}</td><td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={12}/> {event.status}</span></td>
                      <td className="p-4 flex justify-center gap-3"><button onClick={() => handleViewApplicants(event)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"><Users size={16}/> View Applicants</button><button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-extrabold text-slate-800">Host New Event</h2><button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-red-100 transition"><X size={20}/></button></div>
              <form onSubmit={handleHostEvent} className="space-y-4">
                <input required placeholder="Event Title" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium" onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                <input required placeholder="District" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium" onChange={e => setNewEvent({...newEvent, district: e.target.value})} />
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-600" onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">Publish Event 🚀</button>
              </form>
            </div>
          </div>
        )}

        {showApplicantsModal && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-5">
                <div><h2 className="text-2xl font-extrabold text-slate-800">Applicants List</h2><p className="text-indigo-600 font-bold mt-1 bg-indigo-50 inline-block px-3 py-1 rounded-lg text-sm">{selectedEvent?.title}</p></div>
                <div className="flex items-center gap-3">
                  {applicants.length > 0 && (<button onClick={downloadCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm text-sm"><Download size={18}/> Export CSV</button>)}
                  <button onClick={() => setShowApplicantsModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-red-100 transition"><X size={20}/></button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {applicants.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><Users size={48} className="mx-auto mb-4 text-slate-300" /><p className="font-semibold">No applicants yet.</p></div>
                ) : (
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-slate-500 text-sm font-bold px-4">
                        <th className="pb-2">Student Name</th>
                        <th className="pb-2">Resume</th>
                        <th className="pb-2 text-center">Status</th>
                        <th className="pb-2 text-right">Update Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map(app => (
                        <tr key={app.id} className="bg-slate-50 hover:bg-slate-100 transition rounded-xl">
                          <td className="p-4 font-bold text-slate-800 capitalize flex items-center gap-3 rounded-l-xl">
                             <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs">{(app.users?.name || 'U').charAt(0)}</div>
                             <div>{app.users?.name || 'Unknown'}<p className="text-xs text-slate-500 font-normal lowercase">{app.users?.email}</p></div>
                          </td>
                          <td className="p-4">{app.users?.resume_url ? (<a href={app.users.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"><FileText size={16}/> View CV</a>) : <span className="text-xs text-slate-400">Not provided</span>}</td>
                          <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${app.status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-700' : app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{app.status}</span></td>
                          <td className="p-4 rounded-r-xl text-right">
                            <div className="flex justify-end gap-2">
                              {app.status !== 'Shortlisted' && (<button onClick={() => handleUpdateStatus(app.id, 'Shortlisted')} className="p-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition" title="Shortlist"><Check size={18}/></button>)}
                              {app.status !== 'Rejected' && (<button onClick={() => handleUpdateStatus(app.id, 'Rejected')} className="p-1.5 bg-white border border-slate-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 transition" title="Reject"><XCircle size={18}/></button>)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
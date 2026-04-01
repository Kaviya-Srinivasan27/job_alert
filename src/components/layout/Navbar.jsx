import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { supabase } from '../../supabase'; 

export default function Navbar() {
  // REAL USER NAME STATE ✨
  const [userName, setUserName] = useState('Student');
  
  // NOTIFICATION STATES ✨
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    // 1. Fetch the logged-in user's name
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email.split('@')[0]);
      }
    };
    fetchUser();

    // 2. Fetch Latest 3 Jobs for Notifications ✨
    const fetchRecentJobs = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, district')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(3); 

      if (data) setRecentJobs(data);
    };
    fetchRecentJobs();
  }, []);

  // LOGOUT FUNCTION ✨
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Redirects back to login page
  };

  return (
    <nav className="bg-white border-b border-crm-card-border sticky top-0 z-50">
      <div className="max-w-[1700px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            {/* ✨ FIXED LOGO ✨ Using standard Tailwind class (bg-blue-600) */}
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm tracking-wider">
              JA
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">JobAlert.tn</span>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-6 text-slate-600">
            
            {/* NOTIFICATION BELL AREA ✨ */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-slate-100 text-blue-600' : 'hover:text-blue-600 hover:bg-slate-50'}`}
              >
                <Bell size={20} />
                {/* Unread dot logic */}
                {recentJobs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN MENU ✨ */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                      {recentJobs.length} New
                    </span>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {recentJobs.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">No new job alerts yet.</div>
                    ) : (
                      recentJobs.map(job => (
                        <div key={job.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-default">
                          <p className="text-sm font-semibold text-slate-800">🚀 New Job Alert: {job.title}</p>
                          <p className="text-xs text-slate-500 mt-1">📍 {job.district}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div 
                    onClick={() => setShowNotifications(false)}
                    className="p-3 text-center border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <span className="text-sm font-bold text-blue-600">Close</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              {/* Dynamic First Letter (Also fixed color to standard text-blue-600) */}
              <div className="w-9 h-9 bg-slate-100 border border-slate-200 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                {userName.charAt(0)}
              </div>
              <div className="flex flex-col text-sm text-slate-700 font-medium">
                {/* Dynamic Full Name */}
                <span className="leading-tight capitalize">{userName}</span>
                <span className="text-xs text-slate-500 font-normal">Student</span>
              </div>
              <ChevronDown size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>

            {/* LOGOUT BUTTON ✨ */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 hover:text-red-600 transition text-sm font-semibold ml-4 border-l border-slate-200 pl-4"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
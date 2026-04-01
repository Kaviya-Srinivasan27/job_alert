import React from 'react';
import { LayoutDashboard, Briefcase, Bookmark, Settings } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, active: true },
    { name: 'Job Events', icon: Briefcase, active: false },
    { name: 'Saved Jobs', icon: Bookmark, active: false },
    { name: 'Settings', icon: Settings, active: false },
  ];

  return (
    <aside className="w-64 bg-[#f8faff] border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-extrabold text-[#3b82f6] flex items-center gap-2">
          <Briefcase size={24} /> JobAlert.tn
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item, index) => (
          <button 
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              item.active 
              ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-200' 
              : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <item.icon size={20} />
            {item.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
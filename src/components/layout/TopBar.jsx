import React from 'react';
import { Bell, LogOut } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="bg-[#3b82f6] text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold md:hidden">JobAlert.tn</h2>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative hover:text-blue-200 transition">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#3b82f6]"></span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">
            S
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-bold leading-tight">Srinivasan</p>
            <p className="text-blue-200 text-xs">Student</p>
          </div>
        </div>

        <button className="flex items-center gap-2 hover:text-blue-200 transition text-sm font-medium ml-4 border-l border-blue-400 pl-4">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </header>
  );
}
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import { Bookmark, Clock } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">My Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl"><Bookmark size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Saved Events</p>
              <h3 className="text-2xl font-bold text-slate-800">12</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-xl"><Clock size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Alerts</p>
              <h3 className="text-2xl font-bold text-slate-800">3</h3>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
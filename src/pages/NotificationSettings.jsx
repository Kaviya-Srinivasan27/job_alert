import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import { BellRing, Mail, Smartphone } from 'lucide-react';

export default function NotificationSettings() {
  const [emailAlert, setEmailAlert] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Alert Settings 🔔</h1>
        <p className="text-slate-500 mb-8">Choose how you want to be notified about jobs.</p>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-4">
              <Mail className="text-indigo-500" />
              <div>
                <h4 className="font-bold text-slate-800">Email Notifications</h4>
                <p className="text-sm text-slate-500">Get daily summaries.</p>
              </div>
            </div>
            <input type="checkbox" checked={emailAlert} onChange={() => setEmailAlert(!emailAlert)} className="w-5 h-5 accent-indigo-600" />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-4">
              <Smartphone className="text-indigo-500" />
              <div>
                <h4 className="font-bold text-slate-800">Push Notifications</h4>
                <p className="text-sm text-slate-500">Instant alerts on your browser.</p>
              </div>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-indigo-600" />
          </div>

          <Button className="w-full">Save Preferences</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
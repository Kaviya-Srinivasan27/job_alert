import React from 'react';

export default function Input({ label, type = 'text', placeholder, value, onChange, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <div className="relative flex items-center">
        {Icon && <Icon size={18} className="absolute left-3 text-slate-400" />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}
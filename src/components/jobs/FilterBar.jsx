import React from 'react';

export default function FilterBar({ currentFilter, setFilter }) {
  const districts = ['All', 'Trichy', 'Chennai', 'Coimbatore', 'Madurai', 'Salem'];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {districts.map(d => (
        <button 
          key={d} 
          onClick={() => setFilter(d)}
          className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
            currentFilter === d 
            ? 'bg-slate-900 text-white' 
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
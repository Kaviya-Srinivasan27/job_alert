import { MapPin, Calendar, Briefcase, ArrowRight } from 'lucide-react';

export default function EventCard({ event }) {
  return (
    <div className="bg-white border border-crm-card-border p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
      
      {/* Dynamic Placeholder Avatar */}
      <div className={`w-14 h-14 ${event.district === 'Trichy' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} border border-slate-200 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0`}>
        {event.title.substring(0, 2).toUpperCase()}
      </div>

      {/* Details Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="text-lg font-bold text-slate-900 leading-tight truncate">{event.title}</h3>
          <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
            {event.type}
          </span>
        </div>
        
        <div className="space-y-3 mt-4 text-slate-600 text-sm mb-6">
          <div className="flex items-center text-slate-500 text-sm">
            <MapPin size={16} className="mr-2 text-crm-blue shrink-0" />
            <span className="truncate">{event.district} - TN</span>
          </div>
          <div className="flex items-center text-slate-500 text-sm">
            <Calendar size={16} className="mr-2 text-crm-blue shrink-0" />
            {event.date}
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-crm-blue transition-colors">
          Apply Now <ArrowRight size={18} />
        </button>
      </div>
      
    </div>
  );
}
import { User, Calendar } from 'lucide-react';

export default function PatientCard({ patient, appointmentCount = 0, onClick }) {
  const { name, birth, bloodType, conditions, color } = patient;
  const age = birth ? new Date().getFullYear() - new Date(birth).getFullYear() : null;

  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left overflow-hidden">
      <div className={`h-1.5 ${color?.dot || 'bg-blue-400'}`} />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color?.bg || 'bg-blue-100'}`}>
            <User size={22} className={color?.text || 'text-blue-700'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{age !== null ? `만 ${age}세` : ''}{bloodType ? ` · ${bloodType}형` : ''}</p>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Calendar size={12} /><span>{appointmentCount}건</span>
          </div>
        </div>
        {conditions && (
          <div className="mt-3 flex flex-wrap gap-1">
            {conditions.split(',').map((c, i) => <span key={i} className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">{c.trim()}</span>)}
          </div>
        )}
      </div>
    </button>
  );
}

import { Pill, Clock, Bell, BellOff, Trash2, Edit2 } from 'lucide-react';

const DAYS = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];

export default function MedicationCard({ medication, patient, onEdit, onDelete, onToggle }) {
  const { name, dosage, times = [], daysOfWeek = [], instructions, active } = medication;
  const isAllDays = daysOfWeek.length === 7;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${active ? 'border-purple-100' : 'border-gray-100 opacity-60'}`}>
      <div className={`h-1 ${patient?.color?.dot || 'bg-purple-400'}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Pill size={18} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{name}</h3>
              {dosage && <p className="text-xs text-gray-500 mt-0.5">{dosage}</p>}
              {patient && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${patient.color?.bg} ${patient.color?.text}`}>
                  {patient.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onToggle?.(!active)} className={`p-1.5 rounded-lg transition-colors ${active ? 'text-purple-500 bg-purple-50 hover:bg-purple-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`} title={active ? '알림 끄기' : '알림 켜기'}>
              {active ? <Bell size={14} /> : <BellOff size={14} />}
            </button>
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
          </div>
        </div>
        <div className="space-y-2">
          {times.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Clock size={12} className="text-gray-400" />
              {times.map((t) => <span key={t} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{t}</span>)}
            </div>
          )}
          {!isAllDays && daysOfWeek.length > 0 && (
            <div className="flex gap-1">
              {DAYS.map(({ key, label }) => (
                <span key={key} className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-medium ${daysOfWeek.includes(key) ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{label}</span>
              ))}
            </div>
          )}
          {isAllDays && <p className="text-xs text-gray-400">매일 복용</p>}
          {instructions && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1">{instructions}</p>}
        </div>
      </div>
    </div>
  );
}

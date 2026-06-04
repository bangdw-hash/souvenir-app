import { Calendar, Clock, MapPin, User } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDateShort, getDDay } from '../../utils/dateUtils';

export default function AppointmentCard({ appointment, patient, onClick, compact = false }) {
  const dday = getDDay(appointment.date);
  const isPast = appointment.status === '진료완료' || appointment.status === '취소';

  if (compact) {
    return (
      <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 transition-colors text-left">
        <div className={`w-1 self-stretch rounded-full ${patient?.color?.dot || 'bg-blue-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 truncate">{appointment.hospital}</span>
            <StatusBadge status={appointment.status} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <span>{patient?.name}</span><span>·</span>
            <span>{formatDateShort(appointment.date)} {appointment.time}</span>
          </div>
        </div>
        {!isPast && dday && (
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">{dday}</span>
        )}
      </button>
    );
  }

  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left overflow-hidden">
      <div className={`h-1 ${patient?.color?.dot || 'bg-blue-400'}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{appointment.hospital}</h3>
              {appointment.dept && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{appointment.dept}</span>}
            </div>
            <StatusBadge status={appointment.status} />
          </div>
          {!isPast && dday && <span className="text-lg font-bold text-blue-600">{dday}</span>}
        </div>
        <div className="space-y-1.5">
          {patient && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={14} className="text-gray-400 flex-shrink-0" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${patient.color?.bg} ${patient.color?.text}`}>{patient.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
            <span>{formatDateShort(appointment.date)}</span>
            {appointment.time && (<><Clock size={14} className="text-gray-400 flex-shrink-0" /><span>{appointment.time}</span></>)}
          </div>
          {appointment.doctor && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <span>{appointment.doctor} 선생님</span>
            </div>
          )}
        </div>
        {appointment.note && <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 line-clamp-2">{appointment.note}</p>}
      </div>
    </button>
  );
}

import { FileText, Pill, Calendar } from 'lucide-react';
import { formatDateShort } from '../../utils/dateUtils';

export default function RecordCard({ record, patient, appointment, onClick }) {
  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left overflow-hidden">
      <div className={`h-1 ${patient?.color?.dot || 'bg-green-400'}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">{record.diagnosis || '진단명 없음'}</h3>
              {patient && <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${patient.color?.bg} ${patient.color?.text}`}>{patient.name}</span>}
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateShort(record.visitDate || record.createdAt)}</span>
        </div>
        {record.memo && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{record.memo}</p>}
        {record.prescriptions?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Pill size={12} className="text-purple-400" />
            <span className="line-clamp-1">처방약: {record.prescriptions.join(', ')}</span>
          </div>
        )}
        {appointment && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
            <Calendar size={12} /><span>{appointment.hospital}</span>
          </div>
        )}
      </div>
    </button>
  );
}

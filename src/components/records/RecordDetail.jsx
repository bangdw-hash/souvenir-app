import { Calendar, Paperclip, X } from 'lucide-react';
import { formatDateShort } from '../../utils/dateUtils';
import { formatFileSize } from '../../services/storage';

export default function RecordDetail({ record, patient, appointment, onDelete, onDeleteAttachment }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-base leading-tight">
            {record.diagnosis || '진단명 없음'}
          </h3>
          {patient && (
            <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded-full mt-1 ${patient.color?.bg} ${patient.color?.text}`}>
              {patient.name}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-1">
          {formatDateShort(record.visitDate || record.createdAt)}
        </span>
      </div>

      {appointment && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <Calendar size={12} className="flex-shrink-0" />
          <span className="font-medium">{appointment.hospital}</span>
          {appointment.date && <span className="text-gray-400">· {appointment.date}</span>}
        </div>
      )}

      {record.memo && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">소견 / 메모</p>
          <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {record.memo}
          </p>
        </div>
      )}

      {record.prescriptions?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">처방약</p>
          <div className="flex flex-wrap gap-1.5">
            {record.prescriptions.map((p, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {record.nextVisitDate && (
        <div className="flex items-center justify-between text-xs bg-blue-50 rounded-xl px-3 py-2.5">
          <span className="text-gray-500">다음 예약일</span>
          <span className="font-semibold text-blue-700">
            {record.nextVisitDate}{record.nextVisitTime ? ` ${record.nextVisitTime}` : ''}
          </span>
        </div>
      )}

      {record.attachments?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            첨부파일 ({record.attachments.length}개)
          </p>
          <div className="space-y-1.5">
            {record.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 hover:bg-blue-50 hover:border-blue-100 transition-colors"
              >
                <Paperclip size={13} className="text-blue-400 flex-shrink-0" />
                <a href={att.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 truncate text-blue-600 text-xs font-medium hover:underline">{att.name}</a>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {att.size ? formatFileSize(att.size) : ''}
                </span>
                {onDeleteAttachment && (
                  <button
                    onClick={() => onDeleteAttachment(i)}
                    className="text-gray-300 hover:text-red-400 flex-shrink-0 p-0.5"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {onDelete && (
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={onDelete}
            className="w-full py-3 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            진료 기록 삭제
          </button>
        </div>
      )}
    </div>
  );
}

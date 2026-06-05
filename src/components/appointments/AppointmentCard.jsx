import { useState } from 'react';
import { Calendar, Clock, MapPin, User, ExternalLink, Share2, Paperclip } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ShareSheet from '../common/ShareSheet';
import { formatDateShort, getDDay } from '../../utils/dateUtils';
import { buildGoogleCalendarUrl } from '../../utils/googleCalendar';
import { getDisplayStatus } from '../../utils/appointmentUtils';
import { formatFileSize } from '../../services/storage';

export default function AppointmentCard({ appointment, patient, onClick, compact = false, showGcal = false }) {
  const displayStatus = getDisplayStatus(appointment);
  const dday = getDDay(appointment.date);
  const isPast = appointment.status === '진료완료' || appointment.status === '취소';
  const isToday = displayStatus === '진료 당일';
  const gcalUrl = showGcal ? buildGoogleCalendarUrl(appointment, patient) : null;
  const [showShareSheet, setShowShareSheet] = useState(false);

  const shareText = [
    `📅 진료 예약 안내`,
    `병원: ${appointment.hospital}${appointment.dept ? ` (${appointment.dept})` : ''}`,
    `날짜: ${appointment.date}${appointment.time ? ` ${appointment.time}` : ''}`,
    appointment.doctor ? `담당의: ${appointment.doctor} 선생님` : '',
    patient ? `환자: ${patient.name}` : '',
    appointment.note ? `메모: ${appointment.note}` : '',
  ].filter(Boolean).join('\n');

  function handleGcal(e) {
    e.stopPropagation();
    if (gcalUrl) window.open(gcalUrl, '_blank', 'noopener,noreferrer');
  }

  function handleShare(e) {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: `${appointment.hospital} 진료 예약`, text: shareText })
        .catch((err) => { if (err.name !== 'AbortError') setShowShareSheet(true); });
    } else {
      setShowShareSheet(true);
    }
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left
          ${isToday
            ? 'bg-pink-50 border-pink-200 hover:border-pink-300'
            : 'bg-white border-gray-100 hover:border-blue-200'}`}
      >
        <div className={`w-1 self-stretch rounded-full ${isToday ? 'bg-pink-500' : (patient?.color?.dot || 'bg-blue-400')}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 truncate">{appointment.hospital}</span>
            <StatusBadge status={displayStatus} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <span>{patient?.name}</span>
            <span>·</span>
            <span>{formatDateShort(appointment.date)} {appointment.time}</span>
          </div>
        </div>
        {!isPast && dday && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
            ${isToday ? 'bg-pink-100 text-pink-700' : 'bg-blue-50 text-blue-600'}`}>
            {isToday ? '오늘' : dday}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden
        ${isToday ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-100'}`}>
        <div className={`h-1.5 ${isToday ? 'bg-pink-400' : (patient?.color?.dot || 'bg-blue-400')}`} />
        <button onClick={onClick} className="w-full text-left p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{appointment.hospital}</h3>
                {appointment.dept && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {appointment.dept}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <StatusBadge status={displayStatus} />
              </div>
            </div>
            {!isPast && (
              <div className="text-right flex-shrink-0">
                {isToday ? (
                  <span className="text-lg font-bold text-pink-600">오늘!</span>
                ) : dday ? (
                  <span className="text-lg font-bold text-blue-600">{dday}</span>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            {patient && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} className="text-gray-400 flex-shrink-0" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${patient.color?.bg} ${patient.color?.text}`}>
                  {patient.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <span>{formatDateShort(appointment.date)}</span>
              {appointment.time && (
                <>
                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{appointment.time}</span>
                </>
              )}
            </div>
            {appointment.doctor && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                <span>{appointment.doctor} 선생님</span>
              </div>
            )}
          </div>

          {appointment.note && (
            <p className={`mt-3 text-xs rounded-lg p-2 ${isToday ? 'bg-pink-100/60 text-pink-800' : 'text-gray-500 bg-gray-50'}`}>
              {appointment.note}
            </p>
          )}

          {appointment.attachments?.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
              <Paperclip size={11} />
              <span>첨부파일 {appointment.attachments.length}개</span>
            </div>
          )}
        </button>

        <div className="px-4 pb-3 flex gap-2">
          {gcalUrl && !isPast && (
            <button
              onClick={handleGcal}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
            >
              <ExternalLink size={12} />
              구글 캘린더
            </button>
          )}
          <button
            onClick={handleShare}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-colors border
              ${isToday
                ? 'text-pink-600 bg-pink-50 hover:bg-pink-100 border-pink-100'
                : 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-100'}`}
          >
            <Share2 size={12} />
            공유
          </button>
        </div>
      </div>

      <ShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        title={`${appointment.hospital} 진료 예약`}
        text={shareText}
      />
    </>
  );
}

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarDays, formatMonth, isSameDay } from '../../utils/dateUtils';
import { format, isToday } from 'date-fns';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function MonthlyCalendar({ appointments, patients, onDayClick, selectedDate }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = getCalendarDays(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function getApptDots(day) {
    return appointments.filter((a) => a.date && isSameDay(a.date, format(day, 'yyyy-MM-dd')));
  }

  function getPatientColor(patientId) {
    const p = patients.find((p) => p.id === patientId);
    return p?.color?.dot || 'bg-blue-400';
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-semibold text-gray-900">{formatMonth(year, month)}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month;
          const today = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const dots = getApptDots(day);
          const dow = day.getDay();
          return (
            <button
              key={idx}
              onClick={() => onDayClick?.(day)}
              className={`relative flex flex-col items-center py-1.5 min-h-[52px] border-b border-r border-gray-50 transition-colors hover:bg-blue-50/50 ${!isCurrentMonth ? 'opacity-30' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
            >
              <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${today ? 'bg-blue-500 text-white' : ''} ${!today && dow === 0 ? 'text-red-400' : ''} ${!today && dow === 6 ? 'text-blue-400' : ''} ${!today && dow !== 0 && dow !== 6 ? 'text-gray-700' : ''}`}>
                {format(day, 'd')}
              </span>
              {dots.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center mt-0.5 max-w-[36px]">
                  {dots.slice(0, 3).map((a, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${getPatientColor(a.patientId)}`} />
                  ))}
                  {dots.length > 3 && <span className="text-[9px] text-gray-400">+{dots.length - 3}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

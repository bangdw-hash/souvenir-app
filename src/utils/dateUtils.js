import { format, differenceInDays, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, 'yyyy년 M월 d일 (EEE)', { locale: ko });
}

export function formatDateShort(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, 'M/d (EEE)', { locale: ko });
}

export function getDDay(date) {
  if (!date) return null;
  const d = date?.toDate ? date.toDate() : new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = differenceInDays(d, today);
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getCalendarDays(year, month) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const calStart = startOfWeek(start, { weekStartsOn: 0 });
  const calEnd = endOfWeek(end, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: calStart, end: calEnd });
}

export function isSameDay(a, b) {
  const da = a?.toDate ? a.toDate() : new Date(a);
  const db = b?.toDate ? b.toDate() : new Date(b);
  return format(da, 'yyyy-MM-dd') === format(db, 'yyyy-MM-dd');
}

export function formatMonth(year, month) {
  return format(new Date(year, month), 'yyyy년 M월', { locale: ko });
}

export function toISODate(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, 'yyyy-MM-dd');
}

export { addMonths, subMonths, isToday, isTomorrow };

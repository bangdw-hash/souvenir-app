const todayStr = () => new Date().toISOString().slice(0, 10);

export function getDisplayStatus(appointment) {
  if (!appointment) return '';
  const t = todayStr();
  if (appointment.status === '예약완료') {
    return appointment.date === t ? '진료 당일' : '예약 중';
  }
  if (appointment.status === '취소') return '일정삭제';
  return appointment.status;
}

export function isAppointmentToday(appointment) {
  return appointment?.date === todayStr();
}

export function isTodayStr(dateStr) {
  return dateStr === todayStr();
}

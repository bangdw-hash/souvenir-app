export function buildGoogleCalendarUrl(appointment, patient) {
  const { hospital, date, time, dept, doctor, note } = appointment;
  if (!date) return null;

  const patientName = patient?.name || '';
  const title = `[${hospital || '병원'}] ${patientName} 진료${dept ? ` - ${dept}` : ''}`;

  const dateStr = date.replace(/-/g, '');
  let startDt, endDt;

  if (time) {
    const [h, m] = time.split(':');
    const startH = h.padStart(2, '0');
    const endH = String(Math.min(parseInt(h) + 1, 23)).padStart(2, '0');
    startDt = `${dateStr}T${startH}${m}00`;
    endDt = `${dateStr}T${endH}${m}00`;
  } else {
    startDt = dateStr;
    endDt = dateStr;
  }

  const details = [patientName ? `환자: ${patientName}` : '', dept ? `진료과: ${dept}` : '', doctor ? `담당의: ${doctor} 선생님` : '', note ? `메모: ${note}` : ''].filter(Boolean).join('\n');

  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${startDt}/${endDt}`, details, location: hospital || '' });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

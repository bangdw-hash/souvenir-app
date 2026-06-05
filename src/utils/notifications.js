export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationGranted() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function showNotification(title, body) {
  if (!isNotificationGranted()) return;
  new Notification(title, { body, icon: '/favicon.svg' });
}

export function scheduleTodayMedications(medications, patients) {
  if (!isNotificationGranted()) return;

  const now = new Date();
  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];

  for (const med of medications) {
    if (!med.active || !med.notifyBrowser) continue;
    if (med.daysOfWeek && !med.daysOfWeek.includes(todayKey)) continue;

    const patient = patients.find((p) => p.id === med.patientId);
    const patientName = patient?.name || '';

    for (const timeStr of med.times || []) {
      const [h, m] = timeStr.split(':').map(Number);
      const fireAt = new Date();
      fireAt.setHours(h, m, 0, 0);
      const delay = fireAt.getTime() - now.getTime();
      if (delay > 0) {
        setTimeout(() => {
          showNotification('💊 복약 시간', `${patientName} - ${med.name}${med.dosage ? ` (${med.dosage})` : ''} 복용 시간입니다.`);
        }, delay);
      }
    }
  }
}

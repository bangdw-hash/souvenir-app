import { useState, useEffect } from 'react';
import { subscribeAppointments } from '../services/appointments';

export function useAppointments(groupId) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const unsub = subscribeAppointments(groupId, (data) => {
      setAppointments(data);
      setLoading(false);
    });
    return unsub;
  }, [groupId]);

  return { appointments, loading };
}

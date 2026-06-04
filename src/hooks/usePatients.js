import { useState, useEffect } from 'react';
import { subscribePatients } from '../services/patients';
import { getPatientColor } from '../utils/colors';

export function usePatients(groupId) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const unsub = subscribePatients(groupId, (data) => {
      setPatients(data.map((p, i) => ({ ...p, color: getPatientColor(i) })));
      setLoading(false);
    });
    return unsub;
  }, [groupId]);

  return { patients, loading };
}

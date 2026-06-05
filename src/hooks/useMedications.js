import { useState, useEffect } from 'react';
import { subscribeMedications } from '../services/medications';

export function useMedications(groupId) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const unsub = subscribeMedications(groupId, (data) => {
      setMedications(data);
      setLoading(false);
    });
    return unsub;
  }, [groupId]);

  return { medications, loading };
}

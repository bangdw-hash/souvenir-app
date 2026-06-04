import { useState, useEffect } from 'react';
import { subscribeRecords } from '../services/records';

export function useRecords(groupId) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const unsub = subscribeRecords(groupId, (data) => {
      setRecords(data);
      setLoading(false);
    });
    return unsub;
  }, [groupId]);

  return { records, loading };
}

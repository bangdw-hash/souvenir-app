import { useState, useEffect } from 'react';
import { getGroupBySlug, subscribeMembers, subscribeActivity } from '../services/groups';

export function useGroup(slug) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    getGroupBySlug(slug)
      .then((g) => {
        if (!g) {
          setError('그룹을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        setGroup(g);
        setLoading(false);

        try {
          const stored = JSON.parse(localStorage.getItem('recentGroups') || '[]');
          const updated = [
            { slug, name: g.name, visitedAt: Date.now() },
            ...stored.filter((x) => x.slug !== slug),
          ].slice(0, 5);
          localStorage.setItem('recentGroups', JSON.stringify(updated));
        } catch {}

        const unsubMembers = subscribeMembers(g.id, setMembers);
        const unsubActivity = subscribeActivity(g.id, setActivity);
        return () => {
          unsubMembers();
          unsubActivity();
        };
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  return { group, members, activity, loading, error };
}

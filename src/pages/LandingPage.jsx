import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Plus, Link2, Share2, ChevronRight, X } from 'lucide-react';
import { createGroup } from '../services/groups';
import { generateSlug } from '../utils/slugify';
import ShareSheet from '../components/common/ShareSheet';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

const PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-green-100', text: 'text-green-600' },
  { bg: 'bg-purple-100', text: 'text-purple-600' },
  { bg: 'bg-orange-100', text: 'text-orange-600' },
  { bg: 'bg-pink-100', text: 'text-pink-600' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [familyName, setFamilyName] = useState('');
  const [joinSlug, setJoinSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentGroups, setRecentGroups] = useState([]);
  const [shareTarget, setShareTarget] = useState(null);

  useEffect(() => {
    try {
      setRecentGroups(JSON.parse(localStorage.getItem('recentGroups') || '[]'));
    } catch {}
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!familyName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const slug = generateSlug(familyName.trim());
      await createGroup(familyName.trim(), slug);
      try {
        const stored = JSON.parse(localStorage.getItem('recentGroups') || '[]');
        const updated = [
          { slug, name: familyName.trim(), visitedAt: Date.now() },
          ...stored.filter((x) => x.slug !== slug),
        ].slice(0, 5);
        localStorage.setItem('recentGroups', JSON.stringify(updated));
      } catch {}
      navigate(`/group/${slug}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    const slug = joinSlug.trim().replace(/.*\/group\//, '').trim();
    if (!slug) return;
    navigate(`/group/${slug}`);
  }

  function openShare(e, g) {
    e.stopPropagation();
    const url = `${window.location.origin}/group/${g.slug}`;
    const shareData = {
      title: `${g.name} 가족 건강 허브`,
      text: `${g.name} 그룹에 참여해서 건강 정보를 함께 관리해요!\n${url}`,
      url,
    };
    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        if (err.name !== 'AbortError') setShareTarget(shareData);
      });
    } else {
      setShareTarget(shareData);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-500 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Heart size={22} className="text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">가족 건강 허브</h1>
            <p className="text-xs text-gray-400 mt-0.5">내 그룹 목록</p>
          </div>
        </div>
      </div>

      {/* Groups list */}
      <div className="flex-1 p-4">
        {recentGroups.length > 0 ? (
          <div className="space-y-2.5">
            <p className="text-xs text-gray-400 mb-3 px-1">최근 접속한 그룹</p>
            {recentGroups.map((g, i) => {
              const color = PALETTE[i % PALETTE.length];
              return (
                <button
                  key={g.slug}
                  onClick={() => navigate(`/group/${g.slug}`)}
                  className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left active:scale-[0.99]"
                >
                  <div className={`w-12 h-12 ${color.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xl font-bold ${color.text}`}>
                      {g.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(g.visitedAt)} 접속
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openShare(e, g)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Share2 size={15} />
                    </button>
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
              <Users size={36} className="text-blue-300" />
            </div>
            <p className="text-gray-800 font-semibold text-lg mb-1">아직 그룹이 없어요</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              새 그룹을 만들거나<br />초대 링크로 참여해 보세요.
            </p>
          </div>
        )}
      </div>

      {/* Bottom action buttons */}
      <div className="p-4 space-y-2.5 pb-10 bg-white border-t border-gray-100">
        <button
          onClick={() => { setError(''); setFamilyName(''); setMode('create'); }}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-semibold text-base shadow-md hover:bg-blue-600 active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          새 가족 그룹 만들기
        </button>
        <button
          onClick={() => { setJoinSlug(''); setMode('join'); }}
          className="w-full py-3.5 bg-gray-50 text-gray-700 rounded-2xl font-semibold text-sm border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Link2 size={15} />
          링크로 그룹 참여하기
        </button>
      </div>

      {/* Create bottom sheet */}
      {mode === 'create' && (
        <div className="fixed inset-0 z-50" onClick={() => setMode(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-base">새 가족 그룹 만들기</h2>
              <button onClick={() => setMode(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가족 이름</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="예: 김씨 가족, 우리 가족"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-gray-400 mt-1">그룹 링크 코드로 사용됩니다.</p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading || !familyName.trim()}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  {loading ? '생성 중...' : '그룹 만들기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join bottom sheet */}
      {mode === 'join' && (
        <div className="fixed inset-0 z-50" onClick={() => setMode(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-base">그룹 참여하기</h2>
              <button onClick={() => setMode(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">그룹 링크 또는 코드</label>
                <input
                  type="text"
                  value={joinSlug}
                  onChange={(e) => setJoinSlug(e.target.value)}
                  placeholder="링크를 붙여넣거나 코드 입력"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!joinSlug.trim()}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  참여하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ShareSheet
        isOpen={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        title={shareTarget?.title}
        text={shareTarget?.text}
        url={shareTarget?.url}
      />
    </div>
  );
}

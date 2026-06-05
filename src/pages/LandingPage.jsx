import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Calendar, Shield, ArrowRight, Link } from 'lucide-react';
import { createGroup } from '../services/groups';
import { generateSlug } from '../utils/slugify';
import ShareSheet from '../components/common/ShareSheet';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [familyName, setFamilyName] = useState('');
  const [joinSlug, setJoinSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState('');
  const [recentGroups, setRecentGroups] = useState([]);
  const [shareTarget, setShareTarget] = useState(null); // { title, text, url }

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentGroups') || '[]');
      setRecentGroups(stored);
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
      setCreatedSlug(slug);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    const slug = joinSlug.trim().replace(/.*\/group\//, '').trim();
    if (!slug) return;
    navigate(`/group/${slug}`);
  }

  function openShare(g) {
    const url = `${window.location.origin}/group/${g.slug}`;
    const shareData = {
      title: `${g.name} 가족 건강 허브`,
      text: `${g.name} 그룹에 참여해서 건강 정보를 함께 관리해요!`,
      url,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => setShareTarget(shareData));
    } else {
      setShareTarget(shareData);
    }
  }

  if (createdSlug) {
    const url = `${window.location.origin}/group/${createdSlug}`;
    const shareData = {
      title: `${familyName} 가족 건강 허브`,
      text: '가족 건강 허브 그룹에 참여하세요!',
      url,
    };

    function handleShareCreated() {
      if (navigator.share) {
        navigator.share(shareData).catch(() => setShareTarget(shareData));
      } else {
        setShareTarget(shareData);
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">그룹이 생성되었습니다!</h2>
          <p className="text-gray-500 text-sm mb-6">아래 링크를 가족에게 공유하세요.</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-1">그룹 링크</p>
            <p className="text-sm font-medium text-blue-600 break-all">{url}</p>
          </div>
          <button
            onClick={handleShareCreated}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-2xl font-semibold text-sm hover:bg-blue-600 transition-colors mb-3"
          >
            <Heart size={16} />
            가족에게 공유하기
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(url)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium text-sm hover:bg-gray-200 transition-colors mb-3"
          >
            <Link size={16} />
            링크 복사
          </button>
          <button
            onClick={() => navigate(`/group/${createdSlug}`)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            시작하기 <ArrowRight size={16} />
          </button>
        </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <Heart size={40} className="text-blue-500" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">가족 건강 허브</h1>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            가족 모두의 건강 정보를 한 곳에서.<br />
            링크 하나로 언제든 접근하세요.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-xs">
          {[
            { icon: Calendar, label: '진료 일정 관리' },
            { icon: Users, label: '가족 건강 공유' },
            { icon: Shield, label: '안전한 기록 보관' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white/80 rounded-2xl p-3 text-center">
              <Icon size={20} className="text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {!mode && (
          <div className="w-full max-w-sm space-y-3">
            {recentGroups.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-400 mb-2 text-center">최근 방문한 그룹</p>
                <div className="space-y-2">
                  {recentGroups.map((g) => (
                    <div key={g.slug} className="flex gap-2">
                      <button
                        onClick={() => navigate(`/group/${g.slug}`)}
                        className="flex-1 flex items-center gap-2.5 py-3 px-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-left hover:border-blue-200 transition-colors"
                      >
                        <Heart size={15} className="text-blue-400 flex-shrink-0" />
                        <span className="font-semibold text-sm text-gray-800 truncate">{g.name}</span>
                      </button>
                      <button
                        onClick={() => openShare(g)}
                        className="w-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
                        title="그룹 공유"
                      >
                        <Heart size={14} className="text-blue-300" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200/60 my-4" />
              </div>
            )}

            <button
              onClick={() => setMode('create')}
              className="w-full py-4 bg-blue-500 text-white rounded-2xl font-semibold text-base shadow-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Heart size={18} />
              새 가족 그룹 만들기
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-white text-gray-700 rounded-2xl font-semibold text-base shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              링크로 그룹 참여하기
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">새 가족 그룹 만들기</h2>
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
                <p className="text-xs text-gray-400 mt-1">그룹 링크에 사용됩니다.</p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !familyName.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
              >
                {loading ? '생성 중...' : '그룹 만들기'}
              </button>
              <button type="button" onClick={() => setMode(null)} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600">
                돌아가기
              </button>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">그룹 참여하기</h2>
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
              <button
                type="submit"
                disabled={!joinSlug.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
              >
                참여하기
              </button>
              <button type="button" onClick={() => setMode(null)} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600">
                돌아가기
              </button>
            </form>
          </div>
        )}
      </div>

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

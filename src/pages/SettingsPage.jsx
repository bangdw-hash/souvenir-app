import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Users, Bell, Share2, Info, BellOff, BellRing, ChevronRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ShareSheet from '../components/common/ShareSheet';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { addMember, deleteMember } from '../services/groups';

const ROLES = ['부모', '자녀', '조부모', '기타'];

export default function SettingsPage() {
  const { slug } = useParams();
  const { group, members, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', role: '기타' });
  const [saving, setSaving] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [shareTarget, setShareTarget] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function requestNotifications() {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      new Notification('가족 건강 허브', { body: '알림이 활성화되었습니다.' });
    }
  }

  if (groupLoading) return <LoadingSpinner />;

  async function handleAddMember(e) {
    e.preventDefault();
    if (!memberForm.name.trim()) { setMemberError('이름을 입력해 주세요.'); return; }
    setSaving(true);
    try {
      await addMember(group.id, memberForm);
      setMemberForm({ name: '', phone: '', role: '기타' });
      setShowAddMember(false);
    } catch (err) {
      setMemberError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMember(memberId, name) {
    if (!confirm(`${name}님을 멤버에서 제거하시겠습니까?`)) return;
    await deleteMember(group.id, memberId);
  }

  function shareLink() {
    const url = `${window.location.origin}/group/${slug}`;
    const shareData = {
      title: `${group?.name} 가족 건강 허브`,
      text: `${group?.name} 그룹에 참여해서 건강 정보를 함께 관리해요!`,
      url,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => setShareTarget(shareData));
    } else {
      setShareTarget(shareData);
    }
  }

  return (
    <Layout group={group} title="설정">
      <div className="p-4 space-y-5">
        {/* 그룹 정보 */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> 그룹 정보
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">그룹명</span>
              <span className="text-sm font-medium text-gray-900">{group?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">가족 구성원</span>
              <span className="text-sm font-medium text-gray-900">{patients.length}명</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">그룹 슬러그</span>
              <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{slug}</span>
            </div>
          </div>
        </section>

        {/* 링크 공유 */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Share2 size={14} className="text-blue-500" /> 링크 공유
            </h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-400 mb-3">
              아래 링크를 가족과 공유하면 로그인 없이 바로 접속할 수 있습니다.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 mb-3">
              <p className="flex-1 text-xs text-gray-600 break-all font-mono">
                {window.location.origin}/group/{slug}
              </p>
            </div>
            <button
              onClick={shareLink}
              className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              공유하기
            </button>
          </div>
        </section>

        {/* 알림 설정 */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Bell size={14} className="text-blue-500" /> 알림 설정
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {notifPermission === 'unsupported' ? (
              <p className="text-sm text-gray-400">이 브라우저는 알림을 지원하지 않습니다.</p>
            ) : notifPermission === 'granted' ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BellRing size={18} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">알림 활성화됨</p>
                  <p className="text-xs text-gray-400 mt-0.5">브라우저 알림이 허용되어 있습니다.</p>
                </div>
              </div>
            ) : notifPermission === 'denied' ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BellOff size={18} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">알림이 차단됨</p>
                  <p className="text-xs text-gray-400 mt-0.5">브라우저 설정에서 알림을 허용해 주세요.</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-3">
                  진료 일정 알림을 받으려면 브라우저 알림을 허용해 주세요.
                </p>
                <button
                  onClick={requestNotifications}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Bell size={15} /> 알림 허용하기
                  </span>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 알림 수신자 관리 */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users size={14} className="text-blue-500" /> 알림 수신자
            </h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="text-xs text-blue-500 flex items-center gap-1"
            >
              <Plus size={12} /> 추가
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {members.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                등록된 알림 수신자가 없습니다.
              </div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.role} {m.phone ? `· ${m.phone}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMember(m.id, m.name)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      <ShareSheet
        isOpen={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        title={shareTarget?.title}
        text={shareTarget?.text}
        url={shareTarget?.url}
      />

      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="알림 수신자 추가">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input
              type="text"
              value={memberForm.name}
              onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="홍길동"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 (문자 알림용)</label>
            <input
              type="tel"
              value={memberForm.phone}
              onChange={(e) => setMemberForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="010-0000-0000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMemberForm((f) => ({ ...f, role: r }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${memberForm.role === r
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {memberError && <p className="text-sm text-red-500">{memberError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddMember(false)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {saving ? '저장 중...' : '추가하기'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

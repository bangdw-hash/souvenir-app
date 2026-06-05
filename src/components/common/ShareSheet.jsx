import { useState, useEffect } from 'react';
import { X, Check, Share2, Mail, Phone } from 'lucide-react';

export default function ShareSheet({ isOpen, onClose, title, text, url }) {
  const [autoCopied, setAutoCopied] = useState(false);
  const [shareUnsupported, setShareUnsupported] = useState(false);

  const fullText = [text, url].filter(Boolean).join('\n');

  useEffect(() => {
    if (!isOpen) { setAutoCopied(false); setShareUnsupported(false); return; }
    navigator.clipboard?.writeText(fullText || '').then(() => setAutoCopied(true)).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleNativeShare() {
    if (!navigator.share) { setShareUnsupported(true); return; }
    try {
      await navigator.share({ title: title || '', text: fullText });
      onClose();
    } catch (e) {
      if (e.name !== 'AbortError') setShareUnsupported(true);
    }
  }

  function openSMS() { window.location.href = 'sms:'; }

  function openEmail() {
    const body = [text, url].filter(Boolean).join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(title || '')}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">공유하기</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm transition-colors
          ${autoCopied ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
          <Check size={15} className={autoCopied ? 'text-green-500' : 'text-gray-300'} />
          <span className="font-medium">
            {autoCopied ? '텍스트가 클립보드에 복사됐어요' : '클립보드 복사 중...'}
          </span>
        </div>

        <button
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center gap-2 py-3.5 mb-3 bg-blue-500 text-white rounded-2xl text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          <Share2 size={16} />
          외부로 공유하기
        </button>

        {shareUnsupported && (
          <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mb-3 leading-relaxed">
            이 환경에서는 공유 시트가 지원되지 않아요.<br />
            클립보드에 복사된 텍스트를 직접 붙여넣어 사용하세요.
          </p>
        )}

        <p className="text-xs text-gray-400 text-center mb-3">
          또는 아래 앱을 직접 선택하세요
        </p>

        <div className="grid grid-cols-3 gap-3 mb-2">
          <button
            onClick={() => { window.location.href = 'kakaotalk://'; }}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 transition-colors"
          >
            <span className="text-2xl leading-none">💬</span>
            <span className="text-xs font-medium text-gray-700">카카오톡</span>
          </button>
          <button
            onClick={openSMS}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-green-50 hover:bg-green-100 active:bg-green-200 transition-colors"
          >
            <Phone size={22} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700">문자 메시지</span>
          </button>
          <button
            onClick={openEmail}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
          >
            <Mail size={22} className="text-blue-500" />
            <span className="text-xs font-medium text-gray-700">이메일</span>
          </button>
        </div>

        <button onClick={onClose} className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 mt-1">
          취소
        </button>
      </div>
    </div>
  );
}

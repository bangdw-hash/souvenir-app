import { useState } from 'react';
import { X, Copy, Mail, Phone } from 'lucide-react';

export default function ShareSheet({ isOpen, onClose, title, text, url }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullText = [text, url].filter(Boolean).join('\n');

  function copyText() {
    navigator.clipboard?.writeText(url || fullText || '');
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1500);
  }

  function shareKakao() {
    const msg = [title, text, url].filter(Boolean).join('\n');
    window.location.href = `kakaotalk://msg/send?text=${encodeURIComponent(msg)}`;
  }

  function shareEmail() {
    const body = [text, url].filter(Boolean).join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(title || '')}&body=${encodeURIComponent(body)}`;
  }

  function shareSMS() {
    window.location.href = `sms:?body=${encodeURIComponent(fullText)}`;
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 space-y-4 safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900 text-base">공유하기</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {fullText && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 max-h-20 overflow-hidden whitespace-pre-line">
            {fullText}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={shareKakao}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 transition-colors"
          >
            <span className="text-2xl leading-none">💬</span>
            <span className="text-xs font-medium text-gray-700">카카오톡</span>
          </button>
          <button
            onClick={shareSMS}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-green-50 hover:bg-green-100 active:bg-green-200 transition-colors"
          >
            <Phone size={22} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700">문자 메시지</span>
          </button>
          <button
            onClick={shareEmail}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
          >
            <Mail size={22} className="text-blue-500" />
            <span className="text-xs font-medium text-gray-700">이메일</span>
          </button>
        </div>

        <button
          onClick={copyText}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
        >
          {copied ? '복사됨 ✓' : '링크 복사'}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600"
        >
          취소
        </button>
      </div>
    </div>
  );
}

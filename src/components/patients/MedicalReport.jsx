import { X, Share2, FileText, Calendar, Pill } from 'lucide-react';
import { formatDate, formatDateShort } from '../../utils/dateUtils';

export default function MedicalReport({ patient, appointments, records, medications, onClose }) {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const age = patient.birth ? new Date().getFullYear() - new Date(patient.birth).getFullYear() : null;

  const completedAppts = appointments
    .filter((a) => a.status === '진료완료')
    .sort((a, b) => b.date?.localeCompare(a.date));

  const recentRecords = records
    .sort((a, b) => (b.visitDate || b.createdAt?.seconds || 0) > (a.visitDate || a.createdAt?.seconds || 0) ? 1 : -1)
    .slice(0, 10);

  const activeMeds = medications?.filter((m) => m.active !== false) || [];

  function buildReportText() {
    const lines = [
      `[가족 건강 허브] 의료진 리포트`,
      `작성일: ${today}`,
      ``,
      `━━━ 환자 정보 ━━━`,
      `이름: ${patient.name}${age !== null ? ` (만 ${age}세)` : ''}`,
      patient.bloodType ? `혈액형: ${patient.bloodType}형` : '',
      patient.birth ? `생년월일: ${formatDate(patient.birth)}` : '',
      patient.conditions ? `주요 질환: ${patient.conditions}` : '',
      patient.allergies ? `알레르기: ${patient.allergies}` : '',
    ];

    if (completedAppts.length > 0) {
      lines.push(``, `━━━ 진료 이력 (최근 ${Math.min(completedAppts.length, 5)}건) ━━━`);
      completedAppts.slice(0, 5).forEach((a) => {
        lines.push(`• ${a.date} | ${a.hospital}${a.dept ? ` (${a.dept})` : ''}${a.doctor ? ` | ${a.doctor} 선생님` : ''}`);
      });
    }

    if (recentRecords.length > 0) {
      lines.push(``, `━━━ 진료 기록 ━━━`);
      recentRecords.forEach((r) => {
        lines.push(`• [${r.visitDate || '날짜 미상'}] ${r.diagnosis || '진단명 없음'}`);
        if (r.memo) lines.push(`  소견: ${r.memo}`);
        if (r.prescriptions?.length) lines.push(`  처방약: ${r.prescriptions.join(', ')}`);
        if (r.nextVisitDate) lines.push(`  다음 예약: ${r.nextVisitDate}`);
      });
    }

    if (activeMeds.length > 0) {
      lines.push(``, `━━━ 복약 정보 ━━━`);
      activeMeds.forEach((m) => {
        lines.push(`• ${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` / ${m.frequency}` : ''}`);
      });
    }

    lines.push(``, `— 가족 건강 허브 앱으로 생성된 리포트입니다 —`);
    return lines.filter((l) => l !== undefined && l !== null).join('\n');
  }

  async function handleShare() {
    const text = buildReportText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${patient.name} 의료진 리포트`, text });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    navigator.clipboard?.writeText(text);
    alert('리포트가 클립보드에 복사됐습니다.');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">의료진 리포트</h2>
            <p className="text-xs text-gray-400 mt-0.5">{today} 기준</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className={`rounded-2xl p-4 ${patient.color?.bg || 'bg-blue-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 ${patient.color?.dot || 'bg-blue-500'} rounded-xl flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{patient.name[0]}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{patient.name}</p>
                <p className={`text-xs ${patient.color?.text || 'text-blue-700'}`}>
                  {patient.role}{age !== null ? ` · 만 ${age}세` : ''}{patient.bloodType ? ` · ${patient.bloodType}형` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patient.conditions?.split(',').filter(Boolean).map((c, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{c.trim()}</span>
              ))}
              {patient.allergies?.split(',').filter(Boolean).map((a, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">⚠ {a.trim()}</span>
              ))}
              {!patient.conditions && !patient.allergies && (
                <span className="text-xs text-gray-400">등록된 질환·알레르기 없음</span>
              )}
            </div>
          </div>

          {completedAppts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-blue-500" />
                <p className="text-sm font-semibold text-gray-700">진료 이력 (최근 {Math.min(completedAppts.length, 5)}건)</p>
              </div>
              <div className="space-y-2">
                {completedAppts.slice(0, 5).map((a, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-700">
                    <span className="font-medium">{a.date}</span>
                    <span className="text-gray-400 mx-1">|</span>
                    <span>{a.hospital}{a.dept ? ` (${a.dept})` : ''}</span>
                    {a.doctor && <span className="text-gray-400"> · {a.doctor} 선생님</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentRecords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} className="text-green-500" />
                <p className="text-sm font-semibold text-gray-700">진료 기록</p>
              </div>
              <div className="space-y-2">
                {recentRecords.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{r.visitDate || '날짜 미상'}</span>
                      <span className="font-medium">{r.diagnosis || '진단명 없음'}</span>
                    </div>
                    {r.memo && <p className="text-gray-500 leading-relaxed">{r.memo}</p>}
                    {r.prescriptions?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.prescriptions.map((p, j) => (
                          <span key={j} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                    {r.nextVisitDate && (
                      <p className="text-blue-600">다음 예약: {r.nextVisitDate}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMeds.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pill size={14} className="text-purple-500" />
                <p className="text-sm font-semibold text-gray-700">복약 중인 약 ({activeMeds.length}개)</p>
              </div>
              <div className="space-y-1.5">
                {activeMeds.map((m, i) => (
                  <div key={i} className="bg-purple-50 rounded-xl px-3 py-2 text-xs text-purple-800 flex items-center justify-between">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-purple-500">{m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedAppts.length === 0 && recentRecords.length === 0 && activeMeds.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              등록된 진료 기록이 없습니다.
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-3 border-t border-gray-100">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-500 text-white rounded-2xl text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            <Share2 size={16} />
            리포트 공유하기
          </button>
        </div>
      </div>
    </div>
  );
}

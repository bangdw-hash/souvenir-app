import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { addRecord, updateRecord } from '../../services/records';
import { logActivity } from '../../services/groups';

export default function RecordForm({ groupId, patients, appointments, initial, onSuccess, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    patientId: initial?.patientId || patients[0]?.id || '',
    apptId: initial?.apptId || '', visitDate: initial?.visitDate || '',
    diagnosis: initial?.diagnosis || '', memo: initial?.memo || '',
    prescriptions: initial?.prescriptions || [], nextVisitDate: initial?.nextVisitDate || '',
  });
  const [newRx, setNewRx] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const filteredAppts = appointments.filter((a) => a.patientId === form.patientId && a.status !== '취소');

  function addRx() {
    if (!newRx.trim()) return;
    setForm((f) => ({ ...f, prescriptions: [...f.prescriptions, newRx.trim()] }));
    setNewRx('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientId) { setError('환자를 선택해 주세요.'); return; }
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === form.patientId);
      if (isEdit) { await updateRecord(groupId, initial.id, form); }
      else {
        await addRecord(groupId, form);
        await logActivity(groupId, { type: 'record', message: `${patient?.name || ''}의 진료 기록이 등록되었습니다.${form.diagnosis ? ` (${form.diagnosis})` : ''}` });
      }
      onSuccess?.();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">환자 *</label>
        <select value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value, apptId: '' }))} className={inputCls}>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">진료일</label><input type="date" value={form.visitDate} onChange={set('visitDate')} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">연결된 예약</label>
          <select value={form.apptId} onChange={set('apptId')} className={inputCls}>
            <option value="">선택 안 함</option>
            {filteredAppts.map((a) => <option key={a.id} value={a.id}>{a.hospital} {a.date}</option>)}
          </select>
        </div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">진단명</label><input type="text" value={form.diagnosis} onChange={set('diagnosis')} placeholder="예: 급성 상기도 감염" className={inputCls} /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">소견 / 메모</label><textarea value={form.memo} onChange={set('memo')} placeholder="의사 소견, 주의사항 등" rows={3} className={`${inputCls} resize-none`} /></div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">처방약</label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={newRx} onChange={(e) => setNewRx(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRx())} placeholder="약품명 입력 후 추가" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <button type="button" onClick={addRx} className="px-3 py-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"><Plus size={16} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.prescriptions.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
              {p}<button type="button" onClick={() => setForm((f) => ({ ...f, prescriptions: f.prescriptions.filter((_, idx) => idx !== i) }))}><X size={12} /></button>
            </span>
          ))}
        </div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">다음 예약일</label><input type="date" value={form.nextVisitDate} onChange={set('nextVisitDate')} className={inputCls} /></div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">취소</button>
        <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{saving ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}</button>
      </div>
    </form>
  );
}

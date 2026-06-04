import { useState } from 'react';
import { addAppointment, updateAppointment } from '../../services/appointments';
import { logActivity } from '../../services/groups';

const STATUS_OPTIONS = ['예약완료', '미확인', '진료완료', '취소'];

export default function AppointmentForm({ groupId, patients, initial, onSuccess, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    patientId: initial?.patientId || patients[0]?.id || '',
    hospital: initial?.hospital || '',
    dept: initial?.dept || '',
    doctor: initial?.doctor || '',
    date: initial?.date || '',
    time: initial?.time || '',
    status: initial?.status || '예약완료',
    note: initial?.note || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientId || !form.hospital || !form.date) { setError('환자, 병원명, 날짜는 필수입니다.'); return; }
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === form.patientId);
      if (isEdit) { await updateAppointment(groupId, initial.id, form); }
      else {
        await addAppointment(groupId, form);
        await logActivity(groupId, { type: 'appointment', message: `${patient?.name || ''}의 ${form.hospital} 진료 일정이 등록되었습니다.` });
      }
      onSuccess?.();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">환자 *</label>
        <select value={form.patientId} onChange={set('patientId')} className={inputCls}>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">병원명 *</label>
        <input type="text" value={form.hospital} onChange={set('hospital')} placeholder="예: 서울성모병원" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">진료과</label><input type="text" value={form.dept} onChange={set('dept')} placeholder="예: 내과" className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">담당의</label><input type="text" value={form.doctor} onChange={set('doctor')} placeholder="예: 김철수" className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label><input type="date" value={form.date} onChange={set('date')} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">시간</label><input type="time" value={form.time} onChange={set('time')} className={inputCls} /></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, status: s }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.status === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>{s}</button>
          ))}
        </div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea value={form.note} onChange={set('note')} placeholder="추가 메모 사항" rows={3} className={`${inputCls} resize-none`} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
        <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-60">{saving ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}</button>
      </div>
    </form>
  );
}

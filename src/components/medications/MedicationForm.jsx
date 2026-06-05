import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { addMedication, updateMedication } from '../../services/medications';

const DAYS = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];
const ALL_DAYS = DAYS.map((d) => d.key);

export default function MedicationForm({ groupId, patients, initial, onSuccess, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    patientId: initial?.patientId || patients[0]?.id || '',
    name: initial?.name || '',
    dosage: initial?.dosage || '',
    times: initial?.times || ['08:00'],
    daysOfWeek: initial?.daysOfWeek || ALL_DAYS,
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
    instructions: initial?.instructions || '',
    notifyBrowser: initial?.notifyBrowser ?? true,
    active: initial?.active ?? true,
  });
  const [newTime, setNewTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function addTime() {
    if (!newTime || form.times.includes(newTime)) return;
    setForm((f) => ({ ...f, times: [...f.times, newTime].sort() }));
    setNewTime('');
  }

  function removeTime(t) {
    setForm((f) => ({ ...f, times: f.times.filter((x) => x !== t) }));
  }

  function toggleDay(key) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(key)
        ? f.daysOfWeek.filter((d) => d !== key)
        : [...f.daysOfWeek, key],
    }));
  }

  function toggleAllDays() {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.length === 7 ? [] : [...ALL_DAYS],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('약 이름을 입력해 주세요.'); return; }
    if (form.times.length === 0) { setError('복용 시간을 최소 1개 추가해 주세요.'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateMedication(groupId, initial.id, form);
      } else {
        await addMedication(groupId, form);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">복용자 *</label>
        <select
          value={form.patientId}
          onChange={set('patientId')}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">약 이름 *</label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="예: 아모잘탄"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">용량</label>
          <input
            type="text"
            value={form.dosage}
            onChange={set('dosage')}
            placeholder="예: 5mg 1정"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">복용 시간 *</label>
        <div className="flex gap-2 mb-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTime())}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            type="button"
            onClick={addTime}
            className="px-3 py-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.times.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
              {t}
              <button type="button" onClick={() => removeTime(t)} className="hover:text-purple-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">복용 요일</label>
          <button type="button" onClick={toggleAllDays} className="text-xs text-purple-500">
            {form.daysOfWeek.length === 7 ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        <div className="flex gap-1">
          {DAYS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleDay(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors
                ${form.daysOfWeek.includes(key)
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">복용 시작일</label>
          <input
            type="date"
            value={form.startDate}
            onChange={set('startDate')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">복용 종료일</label>
          <input
            type="date"
            value={form.endDate}
            onChange={set('endDate')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">복용 방법 / 주의사항</label>
        <textarea
          value={form.instructions}
          onChange={set('instructions')}
          placeholder="예: 식후 30분, 물과 함께 복용"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
        />
      </div>

      <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.notifyBrowser}
            onChange={(e) => setForm((f) => ({ ...f, notifyBrowser: e.target.checked }))}
            className="w-4 h-4 accent-purple-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-800">앱 알림 사용</p>
            <p className="text-xs text-gray-500">복용 시간에 브라우저 알림을 전송합니다</p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-purple-600"
        >
          {saving ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
        </button>
      </div>
    </form>
  );
}

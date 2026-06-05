import { useState } from 'react';
import { addPatient, updatePatient } from '../../services/patients';
import { logActivity } from '../../services/groups';

const BLOOD_TYPES = ['A', 'B', 'O', 'AB'];
const ROLES = ['부모', '자녀', '조부모', '기타'];

export default function PatientForm({ groupId, initial, onSuccess, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    name: initial?.name || '',
    birth: initial?.birth || '',
    bloodType: initial?.bloodType || '',
    role: initial?.role || '기타',
    conditions: initial?.conditions || '',
    allergies: initial?.allergies || '',
    primaryDoctor: initial?.primaryDoctor || '',
    insuranceNum: initial?.insuranceNum || '',
    phone: initial?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) {
      setError('이름을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updatePatient(groupId, initial.id, form);
      } else {
        await addPatient(groupId, form);
        await logActivity(groupId, {
          type: 'patient',
          message: `${form.name}님이 가족으로 등록되었습니다.`,
        });
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
        <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
        <input
          type="text"
          value={form.name}
          onChange={set('name')}
          placeholder="홍길동"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
          <input
            type="date"
            value={form.birth}
            onChange={set('birth')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">혈액형</label>
          <select
            value={form.bloodType}
            onChange={set('bloodType')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">선택</option>
            {BLOOD_TYPES.map((t) => (
              <option key={t} value={t}>{t}형</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: r }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${form.role === r
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">기저질환</label>
        <input
          type="text"
          value={form.conditions}
          onChange={set('conditions')}
          placeholder="당뇨, 고혈압 (쉼표로 구분)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">알레르기</label>
        <input
          type="text"
          value={form.allergies}
          onChange={set('allergies')}
          placeholder="페니실린, 땅콩 (쉼표로 구분)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">주치의</label>
          <input
            type="text"
            value={form.primaryDoctor}
            onChange={set('primaryDoctor')}
            placeholder="김철수 선생님"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">보험증 번호 (선택)</label>
          <input
            type="text"
            value={form.insuranceNum}
            onChange={set('insuranceNum')}
            placeholder="보험증 번호"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 번호 (선택)</label>
        <input
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="010-0000-0000"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {saving ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
        </button>
      </div>
    </form>
  );
}

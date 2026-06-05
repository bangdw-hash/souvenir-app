import { useState } from 'react';
import { Plus, X, Hospital } from 'lucide-react';
import { addPatient, updatePatient } from '../../services/patients';
import { logActivity } from '../../services/groups';

const BLOOD_TYPES = ['A', 'B', 'O', 'AB'];
const ROLES = ['부모', '자녀', '조부모', '기타'];

function emptyHospital() {
  return { hospital: '', doctor: '', patientNum: '', coordinator: '', coordinatorPhone: '' };
}

function getInitialHospitals(initial) {
  if (initial?.hospitals?.length) return initial.hospitals;
  if (initial?.primaryDoctor || initial?.insuranceNum) {
    return [{ hospital: '', doctor: initial.primaryDoctor || '', patientNum: initial.insuranceNum || '', coordinator: '', coordinatorPhone: '' }];
  }
  return [];
}

export default function PatientForm({ groupId, initial, onSuccess, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    name: initial?.name || '',
    birth: initial?.birth || '',
    bloodType: initial?.bloodType || '',
    role: initial?.role || '기타',
    conditions: initial?.conditions || '',
    allergies: initial?.allergies || '',
    phone: initial?.phone || '',
    hospitals: getInitialHospitals(initial),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function addHospital() {
    setForm((f) => ({ ...f, hospitals: [...f.hospitals, emptyHospital()] }));
  }

  function removeHospital(i) {
    setForm((f) => ({ ...f, hospitals: f.hospitals.filter((_, idx) => idx !== i) }));
  }

  function setHospitalField(i, field, value) {
    setForm((f) => {
      const hospitals = f.hospitals.map((h, idx) => idx === i ? { ...h, [field]: value } : h);
      return { ...f, hospitals };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) { setError('이름을 입력해 주세요.'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        primaryDoctor: form.hospitals[0]?.doctor || '',
        insuranceNum: form.hospitals[0]?.patientNum || '',
      };
      if (isEdit) {
        await updatePatient(groupId, initial.id, data);
      } else {
        await addPatient(groupId, data);
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
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
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

      {/* 병원 정보 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">병원 정보</label>
          <button
            type="button"
            onClick={addHospital}
            className="flex items-center gap-1 text-xs text-blue-500 font-medium hover:text-blue-700"
          >
            <Plus size={13} /> 병원 추가
          </button>
        </div>

        {form.hospitals.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-xl">
            + 병원 추가 버튼을 눌러 병원을 등록하세요
          </p>
        )}

        <div className="space-y-3">
          {form.hospitals.map((h, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2.5 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Hospital size={13} className="text-blue-400" /> 병원 {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeHospital(i)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <input
                type="text"
                value={h.hospital}
                onChange={(e) => setHospitalField(i, 'hospital', e.target.value)}
                placeholder="병원명 (예: 서울성모병원)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={h.doctor}
                  onChange={(e) => setHospitalField(i, 'doctor', e.target.value)}
                  placeholder="담당의 이름"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <input
                  type="text"
                  value={h.patientNum}
                  onChange={(e) => setHospitalField(i, 'patientNum', e.target.value)}
                  placeholder="환자 번호"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={h.coordinator}
                  onChange={(e) => setHospitalField(i, 'coordinator', e.target.value)}
                  placeholder="코디네이터 이름"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <input
                  type="tel"
                  value={h.coordinatorPhone}
                  onChange={(e) => setHospitalField(i, 'coordinatorPhone', e.target.value)}
                  placeholder="코디 전화번호"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          ))}
        </div>
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

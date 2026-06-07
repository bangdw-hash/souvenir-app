import { useState, useRef } from 'react';
import { ImageIcon, Loader, CheckSquare, Square, Sparkles, AlertCircle } from 'lucide-react';
import { addAppointment } from '../../services/appointments';
import { logActivity } from '../../services/groups';

const STATUS_OPTIONS = ['예약완료', '진료완료'];

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractWithClaudeVision(imageFile) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다. GitHub Secret에 VITE_ANTHROPIC_API_KEY를 추가해 주세요.');
  }

  const base64 = await fileToBase64(imageFile);
  const mediaType = (imageFile.type && imageFile.type.startsWith('image/')) ? imageFile.type : 'image/jpeg';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `이 이미지는 병원 예약 확인 화면입니다.
이미지가 90도 회전되어 있거나 카메라로 비스듬히 찍은 사진일 수 있습니다.
이미지 전체를 분석하여 진료 예약 정보를 모두 추출하고, 아래 JSON 배열 형식으로만 반환하세요.

[
  {
    "hospital": "병원명 (위치/장소 정보에서 파악. 예: 삼성서울병원)",
    "dept": "진료과명 (예: 비뇨의학과, 방사선종양학과)",
    "doctor": "담당의 이름만 (교수·의사·선생님 등 직함 제외. 예: 서상일)",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "note": "위치·층수 정보 등 (예: 암병원 2층 비뇨의학과)"
  }
]

추출 규칙:
- 예약 1건 = 배열 요소 1개, 여러 건이면 모두 포함
- 날짜: '2027.02.03(수)' → '2027-02-03'
- 시간: '09:00', '09:30' 24시간제
- 담당의: '서상일 교수' → '서상일', '박완 교수' → '박완'
- 병원명: 화면에 없으면 위치 필드에서 추정 (예: '암병원 2층' → '암병원')
- 없는 정보는 빈 문자열 ""
- JSON 배열만 반환, 설명 텍스트 없이`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API 오류 (${response.status})`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('이미지에서 예약 정보를 인식하지 못했습니다.');

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('예약 정보가 없거나 인식할 수 없는 이미지입니다.');
  }

  return parsed.map((a) => ({ ...a, status: '예약완료' }));
}

export default function ImageParseModal({ groupId, patients, defaultPatientId, onSuccess, onClose }) {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [parsed, setParsed] = useState([]);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const hasApiKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setParsed([]);
    setEdits({});
    setProgress('');
    setError('');
  }

  async function handleProcess() {
    if (!images.length) return;
    setProcessing(true);
    setProgress('AI가 이미지를 분석하고 있습니다...');
    setError('');

    try {
      const allAppts = [];
      for (let i = 0; i < images.length; i++) {
        if (images.length > 1) setProgress(`이미지 ${i + 1}/${images.length} 분석 중...`);
        const results = await extractWithClaudeVision(images[i]);
        allAppts.push(...results);
      }

      const withMeta = allAppts.map((a, idx) => ({
        ...a,
        patientId: defaultPatientId || patients[0]?.id || '',
        _id: idx,
        _selected: true,
      }));
      setParsed(withMeta);
      setEdits(Object.fromEntries(withMeta.map((a) => [a._id, { ...a }])));
      setProgress('');
    } catch (err) {
      setError(err.message);
      setProgress('');
    } finally {
      setProcessing(false);
    }
  }

  function update(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSave() {
    const toSave = Object.values(edits).filter((a) => a._selected);
    if (!toSave.length) return;
    setSaving(true);
    try {
      for (const item of toSave) {
        const { _id, _selected, ...data } = item;
        const patient = patients.find((p) => p.id === data.patientId);
        await addAppointment(groupId, data);
        await logActivity(groupId, {
          type: 'appointment',
          message: `${patient?.name || ''}의 ${data.hospital} 진료 일정이 등록되었습니다.`,
        });
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = Object.values(edits).filter((a) => a._selected).length;

  return (
    <div className="space-y-4">
      {parsed.length === 0 && (
        <>
          {/* API 키 없음 경고 */}
          {!hasApiKey && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 leading-relaxed">
                <p className="font-semibold mb-0.5">AI OCR 설정 필요</p>
                <p>GitHub Settings → Secrets에 <code className="bg-amber-100 px-1 rounded">VITE_ANTHROPIC_API_KEY</code>를 추가해야 합니다.</p>
                <p className="mt-0.5 text-amber-600">console.anthropic.com에서 API 키 발급</p>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-10 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center gap-3 hover:bg-blue-50 transition-colors"
          >
            <div className="relative">
              <ImageIcon size={36} className="text-blue-300" />
              <Sparkles size={16} className="text-purple-400 absolute -top-1 -right-2" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">예약 화면 사진 선택</p>
              <p className="text-xs text-gray-400 mt-1">
                카메라 촬영 사진도 OK · 여러 장 동시 분석 가능
              </p>
              <p className="text-xs text-purple-500 mt-0.5 font-medium">✨ AI가 회전된 사진도 자동 인식</p>
            </div>
          </button>

          {previews.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">{previews.length}장 선택됨</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`이미지 ${i + 1}`}
                    className="w-20 h-28 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {progress && (
            <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 rounded-xl px-3 py-2">
              <Loader size={14} className="animate-spin flex-shrink-0" />
              <span>{progress}</span>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleProcess}
            disabled={!images.length || processing || !hasApiKey}
            className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><Loader size={14} className="animate-spin" /> 분석 중...</>
            ) : (
              <><Sparkles size={14} /> AI로 예약 정보 자동 추출</>
            )}
          </button>
        </>
      )}

      {parsed.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              {parsed.length}건 발견 — {selectedCount}건 선택됨
            </p>
            <button
              onClick={() => { setParsed([]); setImages([]); setPreviews([]); }}
              className="text-xs text-blue-500 hover:underline"
            >
              다시 선택
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {parsed.map((appt) => {
              const edit = edits[appt._id] || {};
              const selected = edit._selected !== false;
              return (
                <div
                  key={appt._id}
                  className={`rounded-2xl border overflow-hidden transition-all
                    ${selected ? 'border-blue-300 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}
                >
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-left"
                    onClick={() => update(appt._id, '_selected', !selected)}
                  >
                    {selected
                      ? <CheckSquare size={16} className="text-blue-500" />
                      : <Square size={16} className="text-gray-400" />}
                    <span className="text-xs font-medium text-gray-600">
                      {selected ? '저장 선택됨' : '저장 안 함'}
                    </span>
                  </button>

                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">환자 *</label>
                      <select
                        value={edit.patientId || ''}
                        onChange={(e) => update(appt._id, 'patientId', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">병원명</label>
                        <input
                          type="text"
                          value={edit.hospital || ''}
                          onChange={(e) => update(appt._id, 'hospital', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">진료과</label>
                        <input
                          type="text"
                          value={edit.dept || ''}
                          onChange={(e) => update(appt._id, 'dept', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">날짜</label>
                        <input
                          type="date"
                          value={edit.date || ''}
                          onChange={(e) => update(appt._id, 'date', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">시간</label>
                        <input
                          type="time"
                          value={edit.time || ''}
                          onChange={(e) => update(appt._id, 'time', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">담당의</label>
                      <input
                        type="text"
                        value={edit.doctor || ''}
                        onChange={(e) => update(appt._id, 'doctor', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">메모 (위치 등)</label>
                      <textarea
                        value={edit.note || ''}
                        onChange={(e) => update(appt._id, 'note', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      />
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update(appt._id, 'status', s)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                            ${edit.status === s
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-600"
            >
              {saving ? '저장 중...' : `${selectedCount}건 저장`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

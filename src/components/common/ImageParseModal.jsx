import { useState, useRef } from 'react';
import { ImageIcon, Loader, X, CheckSquare, Square } from 'lucide-react';
import { parseImageText } from '../../utils/imageParser';
import { addAppointment } from '../../services/appointments';
import { logActivity } from '../../services/groups';

const STATUS_OPTIONS = ['예약완료', '미확인', '진료완료', '취소'];

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
    setProgress('OCR 엔진 로딩 중... (첫 실행 시 30초 소요)');
    setError('');

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('kor', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`텍스트 인식 중... ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });

      const allAppts = [];
      for (let i = 0; i < images.length; i++) {
        setProgress(`이미지 ${i + 1}/${images.length} 분석 중...`);
        const { data: { text } } = await worker.recognize(images[i]);
        const results = parseImageText(text);
        allAppts.push(...results);
      }
      await worker.terminate();

      if (allAppts.length === 0) {
        setError('일정 정보를 찾지 못했습니다. 예약 확인 화면이 잘 보이는 이미지를 사용해 주세요.');
        setProgress('');
        setProcessing(false);
        return;
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
      setError('분석 중 오류가 발생했습니다: ' + err.message);
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-10 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center gap-3 hover:bg-blue-50 transition-colors"
          >
            <ImageIcon size={36} className="text-blue-300" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">사진 선택 (여러 장 가능)</p>
              <p className="text-xs text-gray-400 mt-1">
                사진첩 또는 카메라로 쳙영 가능
              </p>
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
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-xl px-3 py-2">
              <Loader size={14} className="animate-spin flex-shrink-0" />
              <span>{progress}</span>
            </div>
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <button
            onClick={handleProcess}
            disabled={!images.length || processing}
            className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {processing ? '분석 중...' : '이미지 분석 시작'}
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
                      <label className="block text-xs font-medium text-gray-500 mb-1">메모</label>
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

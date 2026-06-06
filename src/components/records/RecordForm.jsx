import { useState, useRef } from 'react';
import { Plus, X, Paperclip, FileText, Loader, Camera, Image, Folder } from 'lucide-react';
import { addRecord, updateRecord } from '../../services/records';
import { uploadRecordFile, formatFileSize } from '../../services/storage';
import { logActivity } from '../../services/groups';

export default function RecordForm({ groupId, patients, appointments, initial, onSuccess, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    patientId: initial?.patientId || patients[0]?.id || '',
    apptId: initial?.apptId || '',
    visitDate: initial?.visitDate || '',
    diagnosis: initial?.diagnosis || '',
    memo: initial?.memo || '',
    prescriptions: initial?.prescriptions || [],
    nextVisitDate: initial?.nextVisitDate || '',
    nextVisitTime: initial?.nextVisitTime || '',
  });
  const [existingAttachments] = useState(initial?.attachments || []);
  const [newFiles, setNewFiles] = useState([]);
  const [newPrescription, setNewPrescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [showFilePicker, setShowFilePicker] = useState(false);

  const cameraRef = useRef();
  const galleryRef = useRef();
  const fileRef = useRef();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const filteredAppts = appointments.filter(
    (a) => a.patientId === form.patientId && a.status !== '취소'
  );

  function addPrescription() {
    if (!newPrescription.trim()) return;
    setForm((f) => ({ ...f, prescriptions: [...f.prescriptions, newPrescription.trim()] }));
    setNewPrescription('');
  }

  function removePrescription(i) {
    setForm((f) => ({ ...f, prescriptions: f.prescriptions.filter((_, idx) => idx !== i) }));
  }

  function handleFileAdd(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) setNewFiles((prev) => [...prev, ...files]);
    e.target.value = '';
    setShowFilePicker(false);
  }

  function removeNewFile(i) {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patientId) { setError('환자를 선택해 주세요.'); return; }
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === form.patientId);
      let recordId;

      if (isEdit) {
        await updateRecord(groupId, initial.id, form);
        recordId = initial.id;
      } else {
        const docRef = await addRecord(groupId, form);
        recordId = docRef.id;
        await logActivity(groupId, {
          type: 'record',
          message: `${patient?.name || ''}의 진료 기록이 등록되었습니다.${form.diagnosis ? ` (${form.diagnosis})` : ''}`,
        });
      }

      if (newFiles.length > 0) {
        const uploaded = [];
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const meta = await uploadRecordFile(groupId, recordId, file, (pct) => {
            setUploadProgress((prev) => ({ ...prev, [i]: pct }));
          });
          uploaded.push(meta);
        }
        const allAttachments = [...existingAttachments, ...uploaded];
        await updateRecord(groupId, recordId, { attachments: allAttachments });
      }

      onSuccess?.();
    } catch (err) {
      setError('저장 오류: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const isUploading = saving && newFiles.length > 0;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">환자 *</label>
          <select
            value={form.patientId}
            onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value, apptId: '' }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">진료일</label>
            <input
              type="date"
              value={form.visitDate}
              onChange={set('visitDate')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연결된 예약</label>
            <select
              value={form.apptId}
              onChange={set('apptId')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">선택 안 함</option>
              {filteredAppts.map((a) => (
                <option key={a.id} value={a.id}>{a.hospital} {a.date}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">진단명</label>
          <input
            type="text"
            value={form.diagnosis}
            onChange={set('diagnosis')}
            placeholder="예: 급성 상기도 감염"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">소견 / 메모</label>
          <textarea
            value={form.memo}
            onChange={set('memo')}
            placeholder="의사 소견, 주의사항 등"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">처방약</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newPrescription}
              onChange={(e) => setNewPrescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPrescription())}
              placeholder="약품명 입력 후 추가"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="button"
              onClick={addPrescription}
              className="px-3 py-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.prescriptions.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
                {p}
                <button type="button" onClick={() => removePrescription(i)}><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">다음 예약일</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.nextVisitDate}
              onChange={set('nextVisitDate')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="time"
              value={form.nextVisitTime}
              onChange={set('nextVisitTime')}
              disabled={!form.nextVisitDate}
              placeholder="시간 (선택)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40 disabled:bg-gray-50"
            />
          </div>
          {form.nextVisitDate && form.nextVisitTime && (
            <p className="text-xs text-blue-500 mt-1.5">
              다음 예약: {form.nextVisitDate} {form.nextVisitTime}
            </p>
          )}
        </div>

        {/* 첨부파일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">첨부파일 (영수증, 처방전 등)</label>

          {/* Hidden file inputs — 3 separate inputs for different sources */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileAdd}
            className="hidden"
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileAdd}
            className="hidden"
          />
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.txt,image/*,application/pdf"
            multiple
            onChange={handleFileAdd}
            className="hidden"
          />

          {existingAttachments.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {existingAttachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                  <FileText size={13} className="text-blue-400 flex-shrink-0" />
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-blue-600 hover:underline">
                    {att.name}
                  </a>
                  <span className="text-gray-400 whitespace-nowrap">{formatFileSize(att.size)}</span>
                </div>
              ))}
            </div>
          )}

          {newFiles.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {newFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                  <FileText size={13} className="text-blue-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{f.name}</span>
                  {isUploading && uploadProgress[i] !== undefined ? (
                    <span className="text-blue-500 whitespace-nowrap">{uploadProgress[i]}%</span>
                  ) : (
                    <button type="button" onClick={() => removeNewFile(i)} className="text-gray-400 hover:text-red-400">
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowFilePicker(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-blue-200 rounded-xl text-sm text-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Paperclip size={14} />
            영수증 · 처방전 · PDF 첨부
          </button>
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
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader size={14} className="animate-spin" /> {isUploading ? '업로드 중...' : '저장 중...'}</>
            ) : (
              isEdit ? '수정하기' : '등록하기'
            )}
          </button>
        </div>
      </form>

      {/* 파일 선택 바텀 시트 */}
      {showFilePicker && (
        <div className="fixed inset-0 z-50" onClick={() => setShowFilePicker(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 space-y-3 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700 mb-4 text-center">파일 첨부 방법 선택</p>

            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-left"
            >
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Camera size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">카메라 촬영</p>
                <p className="text-xs text-gray-400 mt-0.5">지금 바로 촬영하여 첨부</p>
              </div>
            </button>

            <button
              onClick={() => galleryRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-left"
            >
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Image size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">갤러리에서 선택</p>
                <p className="text-xs text-gray-400 mt-0.5">사진 및 동영상 앨범에서 선택</p>
              </div>
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-left"
            >
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Folder size={22} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">파일 업로드</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, 문서, 이미지 파일 선택</p>
              </div>
            </button>

            <button
              onClick={() => setShowFilePicker(false)}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 mt-1"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
}

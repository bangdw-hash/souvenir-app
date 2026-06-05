import { useState, useRef } from 'react';
import { Plus, X, Paperclip, FileText, Loader, Camera, Image, Folder } from 'lucide-react';
import { addAppointment, updateAppointment } from '../../services/appointments';
import { uploadAppointmentFile, formatFileSize } from '../../services/storage';
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
  const [existingAttachments] = useState(initial?.attachments || []);
  const [newFiles, setNewFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cameraRef = useRef();
  const galleryRef = useRef();
  const fileRef = useRef();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
    if (!form.patientId || !form.hospital || !form.date) {
      setError('환자, 병원명, 날짜는 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === form.patientId);
      let apptId;

      if (isEdit) {
        await updateAppointment(groupId, initial.id, form);
        apptId = initial.id;
      } else {
        const docRef = await addAppointment(groupId, form);
        apptId = docRef.id;
        await logActivity(groupId, {
          type: 'appointment',
          message: `${patient?.name || ''}의 ${form.hospital} 진료 일정이 등록되었습니다.`,
        });
      }

      if (newFiles.length > 0) {
        const uploaded = [];
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const meta = await uploadAppointmentFile(groupId, apptId, file, (pct) => {
            setUploadProgress((prev) => ({ ...prev, [i]: pct }));
          });
          uploaded.push(meta);
        }
        const allAttachments = [...existingAttachments, ...uploaded];
        await updateAppointment(groupId, apptId, { attachments: allAttachments });
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message);
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
            onChange={set('patientId')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">병원명 *</label>
          <input
            type="text"
            value={form.hospital}
            onChange={set('hospital')}
            placeholder="예: 서울성모병원"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">진료과</label>
            <input
              type="text"
              value={form.dept}
              onChange={set('dept')}
              placeholder="예: 내과"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당의</label>
            <input
              type="text"
              value={form.doctor}
              onChange={set('doctor')}
              placeholder="예: 김철수"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
            <input
              type="date"
              value={form.date}
              onChange={set('date')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
            <input
              type="time"
              value={form.time}
              onChange={set('time')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${form.status === s
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea
            value={form.note}
            onChange={set('note')}
            placeholder="추가 메모 사항"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />
        </div>

        {/* 첨부파일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">첨부파일 (예약증, 변원 안내문 등)</label>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileAdd} className="hidden" />
          <input ref={galleryRef} type="file" accept="image/*,video/*" multiple onChange={handleFileAdd} className="hidden" />
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.txt,image/*,application/pdf" multiple onChange={handleFileAdd} className="hidden" />

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
            예약증 · 백신증 · 참고 파일 첨부
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

      {/* 파일 선택 바텀 시트 — 3-column grid */}
      {showFilePicker && (
        <div className="fixed inset-0 z-50" onClick={() => setShowFilePicker(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-sm font-semibold text-gray-800 mb-4 text-center">첨부 파일 추가</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center gap-2.5 py-5 bg-gray-50 rounded-2xl hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Camera size={24} className="text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-700">카메라</span>
              </button>

              <button
                onClick={() => galleryRef.current?.click()}
                className="flex flex-col items-center gap-2.5 py-5 bg-gray-50 rounded-2xl hover:bg-green-50 active:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Image size={24} className="text-green-600" />
                </div>
                <span className="text-xs font-semibold text-gray-700">사진</span>
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2.5 py-5 bg-gray-50 rounded-2xl hover:bg-purple-50 active:bg-purple-100 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Folder size={24} className="text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-gray-700">파일</span>
              </button>
            </div>

            <button
              onClick={() => setShowFilePicker(false)}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
}

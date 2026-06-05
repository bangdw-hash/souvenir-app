import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus, Paperclip, X, FolderOpen } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RecordCard from '../components/records/RecordCard';
import RecordForm from '../components/records/RecordForm';
import RecordDetail from '../components/records/RecordDetail';
import Modal from '../components/common/Modal';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { useRecords } from '../hooks/useRecords';
import { deleteRecord, updateRecord } from '../services/records';
import { deleteRecordFile, formatFileSize } from '../services/storage';

const TABS = ['진료 기록', '첨부파일 관리'];

export default function RecordsPage() {
  const { slug } = useParams();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);
  const { appointments } = useAppointments(group?.id);
  const { records, loading: recordsLoading } = useRecords(group?.id);

  const [activeTab, setActiveTab] = useState(0);
  const [patientFilter, setPatientFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  if (groupLoading) return <LoadingSpinner />;

  const filtered = patientFilter === 'all'
    ? records
    : records.filter((r) => r.patientId === patientFilter);

  function getPatient(id) { return patients.find((p) => p.id === id); }
  function getAppointment(id) { return appointments.find((a) => a.id === id); }

  async function handleDeleteRecord(record) {
    if (!confirm('이 진료 기록을 삭제하시겠습니까?')) return;
    for (const att of record.attachments || []) {
      if (att.path) await deleteRecordFile(att.path).catch(() => {});
    }
    await deleteRecord(group.id, record.id);
    setViewingRecord(null);
  }

  async function handleDeleteRecordAttachment(record, attIndex) {
    const updated = (record.attachments || []).filter((_, i) => i !== attIndex);
    await updateRecord(group.id, record.id, { attachments: updated });
    setViewingRecord((prev) => prev ? { ...prev, attachments: updated } : null);
  }

  const attachmentRecords = filtered.filter((r) => r.attachments?.length > 0);
  const totalAttachments = attachmentRecords.reduce((sum, r) => sum + (r.attachments?.length || 0), 0);

  async function handleDeleteAttachment(record, attIndex) {
    const updated = (record.attachments || []).filter((_, i) => i !== attIndex);
    await updateRecord(group.id, record.id, { attachments: updated });
  }

  return (
    <Layout
      group={group}
      title="진료 기록"
      headerRight={
        activeTab === 0 ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full"
          >
            <Plus size={14} /> 기록 추가
          </button>
        ) : null
      }
    >
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === i ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'}`}
            >
              {tab}
              {i === 1 && totalAttachments > 0 && (
                <span className="ml-1 text-xs text-gray-400">({totalAttachments})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {patients.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setPatientFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${patientFilter === 'all' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              전체
            </button>
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setPatientFilter(p.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${patientFilter === p.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
                style={patientFilter === p.id ? { backgroundColor: p.color?.hex || '#10b981' } : {}}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {activeTab === 0 && (
          recordsLoading ? (
            <LoadingSpinner text="" />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText size={48} className="text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-400 mb-1">등록된 진료 기록이 없습니다</p>
              <p className="text-xs text-gray-300 mb-6">진료 후 기록을 등록해 보세요</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-2xl text-sm font-semibold"
              >
                <Plus size={14} /> 첫 진료 기록 추가
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <RecordCard
                  key={r.id}
                  record={r}
                  patient={getPatient(r.patientId)}
                  appointment={getAppointment(r.apptId)}
                  onClick={() => setViewingRecord(r)}
                />
              ))}
            </div>
          )
        )}

        {activeTab === 1 && (
          attachmentRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen size={48} className="text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-400 mb-1">첨부파일이 없습니다</p>
              <p className="text-xs text-gray-300">진료 기록에 파일을 첨부하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attachmentRecords.map((record) => {
                const patient = getPatient(record.patientId);
                return (
                  <div key={record.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <div className={`w-5 h-5 ${patient?.color?.dot || 'bg-gray-300'} rounded-full flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {record.diagnosis || '진단명 없음'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {patient?.name} · {record.visitDate || '날짜 미상'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{record.attachments.length}개</span>
                    </div>
                    <div className="px-4 py-2 space-y-1.5">
                      {record.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5">
                          <Paperclip size={12} className="text-blue-400 flex-shrink-0" />
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-xs text-blue-600 hover:underline"
                          >
                            {att.name}
                          </a>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {att.size ? formatFileSize(att.size) : ''}
                          </span>
                          <button
                            onClick={() => handleDeleteAttachment(record, i)}
                            className="text-gray-300 hover:text-red-400 flex-shrink-0 p-1"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="진료 기록 추가">
        <RecordForm
          groupId={group?.id}
          patients={patients}
          appointments={appointments}
          onSuccess={() => setShowAddForm(false)}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      <Modal isOpen={Boolean(viewingRecord)} onClose={() => setViewingRecord(null)} title="진료 기록 상세">
        {viewingRecord && (
          <RecordDetail
            record={viewingRecord}
            patient={getPatient(viewingRecord.patientId)}
            appointment={getAppointment(viewingRecord.apptId)}
            onDelete={() => handleDeleteRecord(viewingRecord)}
            onDeleteAttachment={(i) => handleDeleteRecordAttachment(viewingRecord, i)}
          />
        )}
      </Modal>
    </Layout>
  );
}

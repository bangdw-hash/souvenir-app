import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
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
import { deleteRecord } from '../services/records';
import { deleteRecordFile } from '../services/storage';

export default function RecordsPage() {
  const { slug } = useParams();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);
  const { appointments } = useAppointments(group?.id);
  const { records, loading: recordsLoading } = useRecords(group?.id);

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

  return (
    <Layout
      group={group}
      title="진료 기록"
      headerRight={
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full"
        >
          <Plus size={14} /> 기록 추가
        </button>
      }
    >
      <div className="p-4 space-y-4">
        {/* 환자 필터 */}
        {patients.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setPatientFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${patientFilter === 'all'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-600 border-gray-200'}`}
            >
              전체
            </button>
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setPatientFilter(p.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${patientFilter === p.id
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200'}`}
                style={patientFilter === p.id ? { backgroundColor: p.color?.hex || '#10b981' } : {}}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* 기록 목록 */}
        {recordsLoading ? (
          <LoadingSpinner text="" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={48} className="text-gray-200 mb-4" />
            <p className="text-sm font-medium text-gray-400 mb-1">등록된 진료 기록이 없습니다</p>
            <p className="text-xs text-gray-300 mb-6">진료 후 기록을 등록해 보세요</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-2xl text-sm font-semibold hover:bg-green-600 transition-colors"
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

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="진료 기록 상세"
      >
        {viewingRecord && (
          <RecordDetail
            record={viewingRecord}
            patient={getPatient(viewingRecord.patientId)}
            appointment={getAppointment(viewingRecord.apptId)}
            onDelete={() => handleDeleteRecord(viewingRecord)}
          />
        )}
      </Modal>
    </Layout>
  );
}

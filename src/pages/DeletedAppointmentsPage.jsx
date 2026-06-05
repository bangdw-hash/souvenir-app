import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Trash2, CalendarX } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useDeletedAppointments } from '../hooks/useAppointments';
import { restoreAppointment, deleteAppointment } from '../services/appointments';
import { formatDateShort } from '../utils/dateUtils';

export default function DeletedAppointmentsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);
  const { appointments: deleted, loading } = useDeletedAppointments(group?.id);

  if (groupLoading) return <LoadingSpinner />;

  function getPatient(id) { return patients.find((p) => p.id === id); }

  async function handleRestore(apptId) {
    await restoreAppointment(group.id, apptId);
  }

  async function handlePermanentDelete(apptId) {
    if (!confirm('완전히 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    await deleteAppointment(group.id, apptId);
  }

  return (
    <Layout group={group} title="삭제된 일정">
      <div className="p-4">
        <button
          onClick={() => navigate(`/group/${slug}/calendar`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 hover:text-gray-700"
        >
          <ChevronLeft size={16} /> 캘린더로 돌아가기
        </button>

        <p className="text-xs text-gray-400 mb-4">
          삭제된 일정은 여기에서 복구하거나 완전히 제거할 수 있습니다.
        </p>

        {loading ? (
          <LoadingSpinner text="" />
        ) : deleted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarX size={48} className="text-gray-200 mb-4" />
            <p className="text-sm font-medium text-gray-400 mb-1">삭제된 일정이 없습니다</p>
            <p className="text-xs text-gray-300">일정 삭제 시 여기에 보관됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deleted.map((a) => {
              const patient = getPatient(a.patientId);
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${patient?.color?.dot || 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{a.hospital}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        {patient && <span className={`px-1.5 py-0.5 rounded-full ${patient.color?.bg} ${patient.color?.text}`}>{patient.name}</span>}
                        <span>·</span>
                        <span>{formatDateShort(a.date)}{a.time ? ` ${a.time}` : ''}</span>
                      </div>
                      {a.dept && <p className="text-xs text-gray-400 mt-0.5">{a.dept}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRestore(a.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <RotateCcw size={12} />
                      일정 복구
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(a.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={12} />
                      완전 삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

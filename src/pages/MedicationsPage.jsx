import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pill, Bell, BellOff, CheckCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import MedicationCard from '../components/medications/MedicationCard';
import MedicationForm from '../components/medications/MedicationForm';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useMedications } from '../hooks/useMedications';
import { updateMedication, deleteMedication } from '../services/medications';
import {
  requestNotificationPermission,
  isNotificationGranted,
  scheduleTodayMedications,
} from '../utils/notifications';

export default function MedicationsPage() {
  const { slug } = useParams();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);
  const { medications, loading: medLoading } = useMedications(group?.id);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [patientFilter, setPatientFilter] = useState('all');
  const [notifGranted, setNotifGranted] = useState(isNotificationGranted());

  useEffect(() => {
    if (medications.length > 0 && patients.length > 0 && isNotificationGranted()) {
      scheduleTodayMedications(medications, patients);
    }
  }, [medications, patients]);

  if (groupLoading) return <LoadingSpinner />;

  const filtered = patientFilter === 'all'
    ? medications
    : medications.filter((m) => m.patientId === patientFilter);

  function getPatient(id) { return patients.find((p) => p.id === id); }

  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
  const todayMeds = medications.filter(
    (m) => m.active && (!m.daysOfWeek || m.daysOfWeek.includes(todayKey))
  );

  async function handleToggle(med, active) {
    await updateMedication(group.id, med.id, { active });
  }

  async function handleDelete(med) {
    if (!confirm(`${med.name} 복약 정보를 삭제하시겠습니까?`)) return;
    await deleteMedication(group.id, med.id);
  }

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      scheduleTodayMedications(medications, patients);
    }
  }

  return (
    <Layout
      group={group}
      title="복약 관리"
      headerRight={
        <button
          onClick={() => { setEditingMed(null); setShowForm(true); }}
          className="flex items-center gap-1.5 text-sm font-medium text-purple-500 bg-purple-50 px-3 py-1.5 rounded-full"
        >
          <Plus size={14} /> 추가
        </button>
      }
    >
      <div className="p-4 space-y-4">
        {/* 오늘의 복약 */}
        {todayMeds.length > 0 && (
          <section className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-100">
            <h2 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <Pill size={14} /> 오늘의 복약 ({todayMeds.length}건)
            </h2>
            <div className="space-y-2">
              {todayMeds.map((m) => {
                const patient = getPatient(m.patientId);
                return (
                  <div key={m.id} className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {patient?.name} · {m.times?.join(', ')}
                        {m.dosage ? ` · ${m.dosage}` : ''}
                      </p>
                    </div>
                    <CheckCircle size={18} className="text-purple-300 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 알림 허용 안내 */}
        {'Notification' in window && !notifGranted && (
          <button
            onClick={handleEnableNotifications}
            className="w-full flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition-colors"
          >
            <Bell size={18} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">복약 알림 허용하기</p>
              <p className="text-xs text-amber-600">탭하면 복약 시간에 알림을 받을 수 있습니다</p>
            </div>
          </button>
        )}
        {notifGranted && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">
            <Bell size={13} /> 복약 알림이 활성화되어 있습니다
          </div>
        )}

        {/* 환자 필터 */}
        {patients.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setPatientFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${patientFilter === 'all' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              전체
            </button>
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setPatientFilter(p.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${patientFilter === p.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
                style={patientFilter === p.id ? { backgroundColor: p.color?.hex } : {}}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* 목록 */}
        {medLoading ? (
          <LoadingSpinner text="" />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <Pill size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-4">등록된 복약 정보가 없습니다.</p>
            <button
              onClick={() => { setEditingMed(null); setShowForm(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium"
            >
              <Plus size={14} /> 복약 추가
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MedicationCard
                key={m.id}
                medication={m}
                patient={getPatient(m.patientId)}
                onEdit={() => { setEditingMed(m); setShowForm(true); }}
                onDelete={() => handleDelete(m)}
                onToggle={(active) => handleToggle(m, active)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingMed(null); }}
        title={editingMed ? '복약 수정' : '복약 추가'}
      >
        <MedicationForm
          groupId={group?.id}
          patients={patients}
          initial={editingMed}
          onSuccess={() => { setShowForm(false); setEditingMed(null); }}
          onCancel={() => { setShowForm(false); setEditingMed(null); }}
        />
      </Modal>
    </Layout>
  );
}

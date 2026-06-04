import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Copy, Bell, Activity, User, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AppointmentCard from '../components/appointments/AppointmentCard';
import PatientCard from '../components/patients/PatientCard';
import Modal from '../components/common/Modal';
import PatientForm from '../components/patients/PatientForm';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { formatDate } from '../utils/dateUtils';

export default function GroupDashboard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { group, activity, loading: groupLoading, error } = useGroup(slug);
  const { patients, loading: patientsLoading } = usePatients(group?.id);
  const { appointments, loading: apptLoading } = useAppointments(group?.id);

  const [showPatientForm, setShowPatientForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const loading = groupLoading || patientsLoading || apptLoading;

  if (groupLoading) return <LoadingSpinner text="그룹 정보를 불러오는 중..." />;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const nextWeekStr = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const upcomingAppts = appointments
    .filter((a) => a.date >= todayStr && a.date <= nextWeekStr && a.status !== '취소')
    .slice(0, 5);

  const recentAppts = appointments
    .filter((a) => a.date < todayStr)
    .slice(-3)
    .reverse();

  function getPatient(patientId) {
    return patients.find((p) => p.id === patientId);
  }

  function getApptCountForPatient(patientId) {
    return appointments.filter((a) => a.patientId === patientId).length;
  }

  function copyLink() {
    const url = `${window.location.origin}/group/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Layout
      group={group}
      title={group?.name || '가족 건강 허브'}
      headerRight={
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full"
        >
          <Copy size={12} />
          {copied ? '복사됨!' : '링크 공유'}
        </button>
      }
    >
      <div className="p-4 space-y-6">
        {/* 이번 주 진료 일정 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Bell size={14} className="text-blue-500" />
              이번 주 진료 일정
            </h2>
            <button
              onClick={() => navigate(`/group/${slug}/calendar`)}
              className="text-xs text-blue-500"
            >
              전체 보기
            </button>
          </div>

          {patientsLoading || apptLoading ? (
            <LoadingSpinner text="" />
          ) : upcomingAppts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">이번 주 예정된 진료가 없습니다.</p>
              <button
                onClick={() => navigate(`/group/${slug}/add`)}
                className="mt-3 text-xs text-blue-500 flex items-center gap-1 mx-auto"
              >
                <Plus size={12} /> 일정 추가
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAppts.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  patient={getPatient(a.patientId)}
                  compact
                  onClick={() => navigate(`/group/${slug}/calendar`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 가족 구성원 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <User size={14} className="text-blue-500" />
              가족 구성원
            </h2>
            <button
              onClick={() => setShowPatientForm(true)}
              className="text-xs text-blue-500 flex items-center gap-1"
            >
              <Plus size={12} /> 추가
            </button>
          </div>

          {patients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">가족 구성원을 등록해 주세요.</p>
              <button
                onClick={() => setShowPatientForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium"
              >
                <Plus size={14} /> 구성원 추가
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  appointmentCount={getApptCountForPatient(p.id)}
                  onClick={() => navigate(`/group/${slug}/patient/${p.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 최근 활동 */}
        {activity.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
              <Activity size={14} className="text-blue-500" />
              최근 활동
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {activity.slice(0, 5).map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <p className="text-sm text-gray-700">{item.message}</p>
                  {item.createdAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(item.createdAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal
        isOpen={showPatientForm}
        onClose={() => setShowPatientForm(false)}
        title="가족 구성원 추가"
      >
        <PatientForm
          groupId={group?.id}
          onSuccess={() => setShowPatientForm(false)}
          onCancel={() => setShowPatientForm(false)}
        />
      </Modal>
    </Layout>
  );
}

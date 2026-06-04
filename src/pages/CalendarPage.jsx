import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MonthlyCalendar from '../components/calendar/MonthlyCalendar';
import AppointmentCard from '../components/appointments/AppointmentCard';
import Modal from '../components/common/Modal';
import AppointmentForm from '../components/appointments/AppointmentForm';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { isSameDay, formatDateShort } from '../utils/dateUtils';
import { deleteAppointment, updateAppointment } from '../services/appointments';
import { Plus } from 'lucide-react';

export default function CalendarPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);
  const { appointments, loading: apptLoading } = useAppointments(group?.id);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [patientFilter, setPatientFilter] = useState('all');

  if (groupLoading) return <LoadingSpinner />;

  const filteredAppts = patientFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.patientId === patientFilter);

  const dayAppts = selectedDate
    ? filteredAppts.filter((a) => a.date && isSameDay(a.date, format(selectedDate, 'yyyy-MM-dd')))
    : [];

  const upcoming = filteredAppts
    .filter((a) => a.date >= new Date().toISOString().slice(0, 10) && a.status !== '취소')
    .slice(0, 10);

  function getPatient(patientId) {
    return patients.find((p) => p.id === patientId);
  }

  async function handleStatusChange(apptId, status) {
    await updateAppointment(group.id, apptId, { status });
  }

  async function handleDelete(apptId) {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    await deleteAppointment(group.id, apptId);
  }

  return (
    <Layout
      group={group}
      title="캘린더"
      headerRight={
        <button
          onClick={() => { setEditingAppt(null); setShowAddForm(true); }}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full"
        >
          <Plus size={14} /> 일정 추가
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
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200'}`}
            >
              전체
            </button>
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setPatientFilter(p.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${patientFilter === p.id
                    ? `${p.color?.dot || 'bg-blue-500'} text-white border-transparent`
                    : `bg-white text-gray-600 border-gray-200`}`}
                style={patientFilter === p.id ? { backgroundColor: p.color?.hex } : {}}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* 월간 캘린더 */}
        <MonthlyCalendar
          appointments={filteredAppts}
          patients={patients}
          selectedDate={selectedDate}
          onDayClick={(day) => {
            setSelectedDate((prev) => {
              if (prev && format(prev, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) return null;
              return day;
            });
          }}
        />

        {/* 선택된 날 일정 */}
        {selectedDate && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {formatDateShort(selectedDate)} 일정
            </h3>
            {dayAppts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-400">이 날 예약된 일정이 없습니다.</p>
                <button
                  onClick={() => { setEditingAppt(null); setShowAddForm(true); }}
                  className="mt-2 text-xs text-blue-500 flex items-center gap-1 mx-auto"
                >
                  <Plus size={12} /> 일정 추가
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppts.map((a) => (
                  <AppointmentDetailCard
                    key={a.id}
                    appointment={a}
                    patient={getPatient(a.patientId)}
                    onEdit={() => { setEditingAppt(a); setShowAddForm(true); }}
                    onDelete={() => handleDelete(a.id)}
                    onStatusChange={(s) => handleStatusChange(a.id, s)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 다가오는 일정 */}
        {!selectedDate && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">다가오는 일정</h3>
            {apptLoading ? (
              <LoadingSpinner text="" />
            ) : upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-400">예정된 진료 일정이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentDetailCard
                    key={a.id}
                    appointment={a}
                    patient={getPatient(a.patientId)}
                    onEdit={() => { setEditingAppt(a); setShowAddForm(true); }}
                    onDelete={() => handleDelete(a.id)}
                    onStatusChange={(s) => handleStatusChange(a.id, s)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddForm}
        onClose={() => { setShowAddForm(false); setEditingAppt(null); }}
        title={editingAppt ? '진료 일정 수정' : '진료 일정 추가'}
      >
        {patients.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">먼저 가족 구성원을 등록해 주세요.</p>
            <button
              onClick={() => { setShowAddForm(false); navigate(`/group/${slug}`); }}
              className="mt-3 text-sm text-blue-500"
            >
              구성원 등록하러 가기
            </button>
          </div>
        ) : (
          <AppointmentForm
            groupId={group?.id}
            patients={patients}
            initial={editingAppt}
            onSuccess={() => { setShowAddForm(false); setEditingAppt(null); }}
            onCancel={() => { setShowAddForm(false); setEditingAppt(null); }}
          />
        )}
      </Modal>
    </Layout>
  );
}

function AppointmentDetailCard({ appointment, patient, onEdit, onDelete, onStatusChange }) {
  const [showActions, setShowActions] = useState(false);
  const statuses = ['예약완료', '진료완료', '취소', '미확인'];

  return (
    <div className="relative">
      <AppointmentCard
        appointment={appointment}
        patient={patient}
        onClick={() => setShowActions((v) => !v)}
      />
      {showActions && (
        <div className="mt-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 mb-2">상태 변경</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => { onStatusChange(s); setShowActions(false); }}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors
                  ${appointment.status === s
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onEdit(); setShowActions(false); }}
              className="flex-1 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              수정
            </button>
            <button
              onClick={onDelete}
              className="flex-1 py-2 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

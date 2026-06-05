import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, Plus, CalendarDays, Clock4, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MonthlyCalendar from '../components/calendar/MonthlyCalendar';
import AppointmentCard from '../components/appointments/AppointmentCard';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import AppointmentForm from '../components/appointments/AppointmentForm';
import RecordForm from '../components/records/RecordForm';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { isSameDay, formatDateShort } from '../utils/dateUtils';
import { softDeleteAppointment, updateAppointment } from '../services/appointments';
import { getDisplayStatus, isTodayStr } from '../utils/appointmentUtils';

const TABS = ['오늘의 일정', '다가오는 일정', '삭제된 일정'];

export default function CalendarPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);
  const { appointments, loading: apptLoading } = useAppointments(group?.id);

  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [patientFilter, setPatientFilter] = useState('all');
  const [recordPromptAppt, setRecordPromptAppt] = useState(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (groupLoading) return <LoadingSpinner />;

  const today = new Date().toISOString().slice(0, 10);

  const filteredAppts = patientFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.patientId === patientFilter);

  const todayAppts = filteredAppts.filter((a) => isTodayStr(a.date));
  const upcomingAppts = filteredAppts.filter((a) => a.date > today).slice(0, 10);
  const dayAppts = selectedDate
    ? filteredAppts.filter((a) => a.date && isSameDay(a.date, format(selectedDate, 'yyyy-MM-dd')))
    : [];

  function getPatient(id) { return patients.find((p) => p.id === id); }

  function handleTabClick(i) {
    if (i === 2) {
      navigate(`/group/${slug}/deleted-appointments`);
      return;
    }
    setActiveTab(i);
    setSelectedDate(null);
  }

  async function handleStatusChange(apptId, status) {
    await updateAppointment(group.id, apptId, { status });
    if (status === '진료완료') {
      const appt = appointments.find((a) => a.id === apptId);
      if (appt) { setShowRecordForm(false); setRecordPromptAppt(appt); }
    }
  }

  function requestDelete(apptId) {
    setConfirmDeleteId(apptId);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    await softDeleteAppointment(group.id, confirmDeleteId);
    setConfirmDeleteId(null);
  }

  function closeRecordPrompt() {
    setRecordPromptAppt(null);
    setShowRecordForm(false);
  }

  const showList = selectedDate ? dayAppts : activeTab === 0 ? todayAppts : upcomingAppts;
  const listTitle = selectedDate
    ? `${formatDateShort(selectedDate)} 일정`
    : activeTab === 0 ? '오늘의 일정' : '다가오는 일정';

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
      <div className="p-4 space-y-3">
        {patients.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setPatientFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${patientFilter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              전체
            </button>
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setPatientFilter(p.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${patientFilter === p.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
                style={patientFilter === p.id ? { backgroundColor: p.color?.hex } : {}}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <MonthlyCalendar
          appointments={filteredAppts}
          patients={patients}
          selectedDate={selectedDate}
          onDayClick={(day) => {
            setSelectedDate((prev) =>
              prev && format(prev, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ? null : day
            );
          }}
        />

        <div className="flex border-b border-gray-100">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => handleTabClick(i)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors relative
                ${i === 2
                  ? 'border-transparent text-gray-400 hover:text-gray-600'
                  : activeTab === i && !selectedDate
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
              {i === 0 && todayAppts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pink-500" />
              )}
            </button>
          ))}
        </div>

        {!selectedDate && todayAppts.length > 0 && activeTab === 1 && (
          <div className="bg-pink-50 border border-pink-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock4 size={14} className="text-pink-500" />
              <p className="text-xs font-semibold text-pink-700">오늘의 진료 일정</p>
              <span className="ml-auto text-xs text-pink-500 font-medium">{todayAppts.length}건</span>
            </div>
            <div className="space-y-2">
              {todayAppts.map((a) => (
                <div key={a.id} className="bg-white rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className={`w-1 self-stretch rounded-full ${getPatient(a.patientId)?.color?.dot || 'bg-pink-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{a.hospital}</p>
                    <p className="text-xs text-gray-400">{getPatient(a.patientId)?.name}{a.time ? ` · ${a.time}` : ''}</p>
                  </div>
                  <StatusBadge status="진료 당일" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          {!selectedDate && (
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              {activeTab === 0 ? <Clock4 size={14} className="text-pink-500" /> : <CalendarDays size={14} className="text-blue-500" />}
              {listTitle}
            </h3>
          )}
          {selectedDate && (
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{listTitle}</h3>
          )}

          {apptLoading ? (
            <LoadingSpinner text="" />
          ) : showList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400">
                {selectedDate ? '이 날 예약된 일정이 없습니다.' : activeTab === 0 ? '오늘 예정된 진료가 없습니다.' : '예정된 진료 일정이 없습니다.'}
              </p>
              <button
                onClick={() => { setEditingAppt(null); setShowAddForm(true); }}
                className="mt-2 text-xs text-blue-500 flex items-center gap-1 mx-auto"
              >
                <Plus size={12} /> 일정 추가
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {showList.map((a) => (
                <AppointmentDetailCard
                  key={a.id}
                  appointment={a}
                  patient={getPatient(a.patientId)}
                  onEdit={() => { setEditingAppt(a); setShowAddForm(true); }}
                  onDelete={() => requestDelete(a.id)}
                  onStatusChange={(s) => handleStatusChange(a.id, s)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddForm}
        onClose={() => { setShowAddForm(false); setEditingAppt(null); }}
        title={editingAppt ? '진료 일정 수정' : '진료 일정 추가'}
      >
        {patients.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">먼저 가족 구성원을 등록해 주세요.</p>
            <button onClick={() => { setShowAddForm(false); navigate(`/group/${slug}`); }} className="mt-3 text-sm text-blue-500">
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

      <Modal
        isOpen={Boolean(recordPromptAppt)}
        onClose={closeRecordPrompt}
        title={showRecordForm ? '진료 기록 작성' : '진료 완료'}
      >
        {!showRecordForm ? (
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
              <FileText size={28} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">진료 기록을 작성하시겠어요?</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-700">{recordPromptAppt?.hospital}</span> 진료가 완료되었습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={closeRecordPrompt} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">나중에</button>
              <button onClick={() => setShowRecordForm(true)} className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold">지금 작성</button>
            </div>
          </div>
        ) : (
          <RecordForm
            groupId={group?.id}
            patients={patients}
            appointments={appointments}
            initial={{ patientId: recordPromptAppt?.patientId, apptId: recordPromptAppt?.id, visitDate: recordPromptAppt?.date }}
            onSuccess={closeRecordPrompt}
            onCancel={() => setShowRecordForm(false)}
          />
        )}
      </Modal>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative w-full bg-white rounded-t-3xl px-5 pt-5 pb-8 safe-area-pb">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-2xl mx-auto mb-3">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <p className="text-center font-semibold text-gray-900 mb-1">일정 삭제</p>
            <p className="text-center text-sm text-gray-500 mb-5 leading-relaxed">
              해당 일정은 삭제하시겠습니까?<br />
              <span className="text-xs text-gray-400">삭제된 일정 탭에서 복구할 수 있습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                아니오
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-semibold hover:bg-red-600"
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function AppointmentDetailCard({ appointment, patient, onEdit, onDelete, onStatusChange }) {
  const [showActions, setShowActions] = useState(false);
  const displayStatus = getDisplayStatus(appointment);
  const STATUS_OPTS = [
    { value: '예약완료', label: '예약 중' },
    { value: '진료완료', label: '진료완료' },
  ];

  return (
    <div className="relative">
      <AppointmentCard
        appointment={appointment}
        patient={patient}
        onClick={() => setShowActions((v) => !v)}
        showGcal={true}
      />
      {showActions && (
        <div className="mt-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 mb-2">상태 변경</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {STATUS_OPTS.map((s) => (
              <button
                key={s.value}
                onClick={() => { onStatusChange(s.value); setShowActions(false); }}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors
                  ${appointment.status === s.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
              >
                {s.label}
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
              onClick={() => { onDelete(); setShowActions(false); }}
              className="flex-1 py-2 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 size={11} /> 일정삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

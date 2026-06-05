import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Edit2, ChevronLeft, Trash2, Plus, Hospital, Phone } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AppointmentCard from '../components/appointments/AppointmentCard';
import RecordCard from '../components/records/RecordCard';
import RecordDetail from '../components/records/RecordDetail';
import Modal from '../components/common/Modal';
import PatientForm from '../components/patients/PatientForm';
import AppointmentForm from '../components/appointments/AppointmentForm';
import RecordForm from '../components/records/RecordForm';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { useRecords } from '../hooks/useRecords';
import { deletePatient } from '../services/patients';
import { deleteRecord } from '../services/records';
import { deleteRecordFile } from '../services/storage';
import { formatDate } from '../utils/dateUtils';

const TABS = ['진료 일정', '진료 기록'];

export default function PatientPage() {
  const { slug, patientId } = useParams();
  const navigate = useNavigate();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients, loading: patientsLoading } = usePatients(group?.id);
  const { appointments } = useAppointments(group?.id);
  const { records } = useRecords(group?.id);

  const [activeTab, setActiveTab] = useState(0);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  if (groupLoading || patientsLoading) return <LoadingSpinner />;

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">구성원을 찾을 수 없습니다.</p>
          <button onClick={() => navigate(`/group/${slug}`)} className="text-blue-500 text-sm">돌아가기</button>
        </div>
      </div>
    );
  }

  const patientAppts = appointments.filter((a) => a.patientId === patientId);
  const patientRecords = records.filter((r) => r.patientId === patientId);
  const age = patient.birth ? new Date().getFullYear() - new Date(patient.birth).getFullYear() : null;

  const hospitals = patient.hospitals?.length
    ? patient.hospitals
    : patient.primaryDoctor
      ? [{ hospital: '', doctor: patient.primaryDoctor, patientNum: patient.insuranceNum || '', coordinator: '', coordinatorPhone: '' }]
      : [];

  async function handleDeletePatient() {
    if (!confirm(`${patient.name}님을 삭제하시겠습니까? 관련 데이터는 유지됩니다.`)) return;
    await deletePatient(group.id, patientId);
    navigate(`/group/${slug}`);
  }

  async function handleDeleteRecord(record) {
    if (!confirm('이 진료 기록을 삭제하시겠습니까?')) return;
    for (const att of record.attachments || []) {
      if (att.path) await deleteRecordFile(att.path).catch(() => {});
    }
    await deleteRecord(group.id, record.id);
    setViewingRecord(null);
  }

  return (
    <Layout group={group} title="">
      {/* 헤더 배너 */}
      <div className={`${patient.color?.bg || 'bg-blue-100'} px-4 pt-4 pb-6`}>
        <button onClick={() => navigate(`/group/${slug}`)} className="flex items-center gap-1 text-sm text-gray-600 mb-4">
          <ChevronLeft size={16} /> 뒤로
        </button>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 ${patient.color?.dot || 'bg-blue-500'} rounded-2xl flex items-center justify-center`}>
            <User size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
            <p className={`text-sm ${patient.color?.text || 'text-blue-700'} mt-0.5`}>
              {patient.role}
              {age !== null ? ` · 만 ${age}세` : ''}
              {patient.bloodType ? ` · ${patient.bloodType}형` : ''}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowEditPatient(true)} className="p-2 bg-white/70 rounded-xl">
              <Edit2 size={16} className="text-gray-600" />
            </button>
            <button onClick={handleDeletePatient} className="p-2 bg-white/70 rounded-xl">
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {patient.conditions?.split(',').filter(Boolean).map((c, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{c.trim()}</span>
          ))}
          {patient.allergies?.split(',').filter(Boolean).map((a, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">⚠ {a.trim()}</span>
          ))}
        </div>

        {(patient.birth || hospitals.length > 0) && (
          <div className="mt-3 bg-white/60 rounded-xl p-3 text-xs text-gray-600 space-y-2">
            {patient.birth && (
              <div className="flex justify-between">
                <span className="text-gray-400">생년월일</span>
                <span>{formatDate(patient.birth)}</span>
              </div>
            )}
            {hospitals.map((h, i) => (
              <div key={i} className={`space-y-1 ${i > 0 ? 'border-t border-white/40 pt-2' : ''}`}>
                {h.hospital && (
                  <div className="flex items-center gap-1 font-medium text-gray-700">
                    <Hospital size={11} className="text-blue-400" />
                    <span>{h.hospital}</span>
                  </div>
                )}
                {h.doctor && <div className="flex justify-between"><span className="text-gray-400">담당의</span><span>{h.doctor} 선생님</span></div>}
                {h.patientNum && <div className="flex justify-between"><span className="text-gray-400">환자번호</span><span>{h.patientNum}</span></div>}
                {h.coordinator && <div className="flex justify-between"><span className="text-gray-400">코디네이터</span><span>{h.coordinator}</span></div>}
                {h.coordinatorPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">코디 전화</span>
                    <a href={`tel:${h.coordinatorPhone}`} className="text-blue-600 flex items-center gap-0.5">
                      <Phone size={10} />{h.coordinatorPhone}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="flex">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === i ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
            >
              {tab}
              <span className="ml-1 text-xs text-gray-400">
                ({i === 0 ? patientAppts.length : patientRecords.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 0 && (
          <>
            <button
              onClick={() => setShowAddAppt(true)}
              className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-sm text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} /> 진료 일정 추가
            </button>
            {patientAppts.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">등록된 진료 일정이 없습니다.</p>
            ) : (
              patientAppts.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  patient={patient}
                  onClick={() => navigate(`/group/${slug}/calendar`)}
                />
              ))
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            <button
              onClick={() => setShowAddRecord(true)}
              className="w-full py-3 border-2 border-dashed border-green-200 rounded-2xl text-sm text-green-400 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
            >
              <Plus size={16} /> 진료 기록 추가
            </button>
            {patientRecords.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">등록된 진료 기록이 없습니다.</p>
            ) : (
              patientRecords.map((r) => (
                <RecordCard
                  key={r.id}
                  record={r}
                  patient={patient}
                  appointment={appointments.find((a) => a.id === r.apptId)}
                  onClick={() => setViewingRecord(r)}
                />
              ))
            )}
          </>
        )}
      </div>

      <Modal isOpen={showEditPatient} onClose={() => setShowEditPatient(false)} title="구성원 정보 수정">
        <PatientForm groupId={group?.id} initial={patient} onSuccess={() => setShowEditPatient(false)} onCancel={() => setShowEditPatient(false)} />
      </Modal>

      <Modal isOpen={showAddAppt} onClose={() => setShowAddAppt(false)} title="진료 일정 추가">
        <AppointmentForm groupId={group?.id} patients={patients} initial={{ patientId }} onSuccess={() => setShowAddAppt(false)} onCancel={() => setShowAddAppt(false)} />
      </Modal>

      <Modal isOpen={showAddRecord} onClose={() => setShowAddRecord(false)} title="진료 기록 추가">
        <RecordForm groupId={group?.id} patients={patients} appointments={patientAppts} initial={{ patientId }} onSuccess={() => setShowAddRecord(false)} onCancel={() => setShowAddRecord(false)} />
      </Modal>

      {/* 진료 기록 상세 */}
      <Modal isOpen={Boolean(viewingRecord)} onClose={() => setViewingRecord(null)} title="진료 기록 상세">
        {viewingRecord && (
          <RecordDetail
            record={viewingRecord}
            patient={patient}
            appointment={appointments.find((a) => a.id === viewingRecord.apptId)}
            onDelete={() => handleDeleteRecord(viewingRecord)}
            onEdit={() => { setEditingRecord(viewingRecord); setViewingRecord(null); }}
          />
        )}
      </Modal>

      {/* 진료 기록 수정 */}
      <Modal isOpen={Boolean(editingRecord)} onClose={() => setEditingRecord(null)} title="진료 기록 수정">
        {editingRecord && (
          <RecordForm
            groupId={group?.id}
            patients={patients}
            appointments={patientAppts}
            initial={editingRecord}
            onSuccess={() => setEditingRecord(null)}
            onCancel={() => setEditingRecord(null)}
          />
        )}
      </Modal>
    </Layout>
  );
}

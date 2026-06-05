import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, FileText, Edit2, ChevronLeft, Trash2, Plus, Paperclip, Hospital, Phone } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AppointmentCard from '../components/appointments/AppointmentCard';
import RecordCard from '../components/records/RecordCard';
import Modal from '../components/common/Modal';
import PatientForm from '../components/patients/PatientForm';
import AppointmentForm from '../components/appointments/AppointmentForm';
import RecordForm from '../components/records/RecordForm';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { useRecords } from '../hooks/useRecords';
import { deletePatient } from '../services/patients';
import { formatDate, formatDateShort } from '../utils/dateUtils';
import { formatFileSize } from '../services/storage';

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

  if (groupLoading || patientsLoading) return <LoadingSpinner />;

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">구성원을 찾을 수 없습니다.</p>
          <button onClick={() => navigate(`/group/${slug}`)} className="text-blue-500 text-sm">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const patientAppts = appointments.filter((a) => a.patientId === patientId);
  const patientRecords = records.filter((r) => r.patientId === patientId);
  const age = patient.birth
    ? new Date().getFullYear() - new Date(patient.birth).getFullYear()
    : null;

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

  return (
    <Layout group={group} title="">
      {/* 헤더 배너 */}
      <div className={`${patient.color?.bg || 'bg-blue-100'} px-4 pt-4 pb-6`}>
        <button
          onClick={() => navigate(`/group/${slug}`)}
          className="flex items-center gap-1 text-sm text-gray-600 mb-4"
        >
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
            <button
              onClick={() => setShowEditPatient(true)}
              className="p-2 bg-white/70 rounded-xl"
            >
              <Edit2 size={16} className="text-gray-600" />
            </button>
            <button
              onClick={handleDeletePatient}
              className="p-2 bg-white/70 rounded-xl"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* 기저질환 / 알레르기 태그 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {patient.conditions?.split(',').filter(Boolean).map((c, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{c.trim()}</span>
          ))}
          {patient.allergies?.split(',').filter(Boolean).map((a, i) => (
            <span key={i} className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">⚠ {a.trim()}</span>
          ))}
        </div>

        {/* 상세 정보 */}
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
                {h.doctor && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">담당의</span>
                    <span>{h.doctor} 선생님</span>
                  </div>
                )}
                {h.patientNum && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">환자번호</span>
                    <span>{h.patientNum}</span>
                  </div>
                )}
                {h.coordinator && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">코디네이터</span>
                    <span>{h.coordinator}</span>
                  </div>
                )}
                {h.coordinatorPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">코디 전화</span>
                    <a href={`tel:${h.coordinatorPhone}`} className="text-blue-600 flex items-center gap-0.5">
                      <Phone size={10} />
                      {h.coordinatorPhone}
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
                ${activeTab === i
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500'}`}
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
        <PatientForm
          groupId={group?.id}
          initial={patient}
          onSuccess={() => setShowEditPatient(false)}
          onCancel={() => setShowEditPatient(false)}
        />
      </Modal>

      <Modal isOpen={showAddAppt} onClose={() => setShowAddAppt(false)} title="진료 일정 추가">
        <AppointmentForm
          groupId={group?.id}
          patients={patients}
          initial={{ patientId }}
          onSuccess={() => setShowAddAppt(false)}
          onCancel={() => setShowAddAppt(false)}
        />
      </Modal>

      <Modal isOpen={showAddRecord} onClose={() => setShowAddRecord(false)} title="진료 기록 추가">
        <RecordForm
          groupId={group?.id}
          patients={patients}
          appointments={patientAppts}
          initial={{ patientId }}
          onSuccess={() => setShowAddRecord(false)}
          onCancel={() => setShowAddRecord(false)}
        />
      </Modal>

      {/* 진료 기록 상세 보기 */}
      <Modal isOpen={Boolean(viewingRecord)} onClose={() => setViewingRecord(null)} title="진료 기록 상세">
        {viewingRecord && (
          <RecordDetail
            record={viewingRecord}
            patient={patient}
            appointment={appointments.find((a) => a.id === viewingRecord.apptId)}
          />
        )}
      </Modal>
    </Layout>
  );
}

function RecordDetail({ record, patient, appointment }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{record.diagnosis || '진단명 없음'}</h3>
          {patient && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${patient.color?.bg} ${patient.color?.text}`}>
              {patient.name}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatDateShort(record.visitDate || record.createdAt)}</span>
      </div>

      {appointment && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <Calendar size={12} />
          <span>{appointment.hospital}</span>
          {appointment.date && <span>· {appointment.date}</span>}
        </div>
      )}

      {record.memo && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">소견 / 메모</p>
          <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">{record.memo}</p>
        </div>
      )}

      {record.prescriptions?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">처방약</p>
          <div className="flex flex-wrap gap-1.5">
            {record.prescriptions.map((p, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      )}

      {record.nextVisitDate && (
        <div className="flex items-center justify-between text-xs bg-blue-50 rounded-lg px-3 py-2">
          <span className="text-gray-500">다음 예약일</span>
          <span className="font-medium text-blue-700">{record.nextVisitDate}</span>
        </div>
      )}

      {record.attachments?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">첨부파일</p>
          <div className="space-y-1.5">
            {record.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 hover:bg-blue-50 transition-colors"
              >
                <Paperclip size={13} className="text-blue-400 flex-shrink-0" />
                <span className="flex-1 truncate text-blue-600 text-xs">{att.name}</span>
                <span className="text-gray-400 text-xs whitespace-nowrap">{formatFileSize(att.size)}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

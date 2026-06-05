import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, FileText, ClipboardPaste, ChevronRight, ImageIcon } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import PatientForm from '../components/patients/PatientForm';
import AppointmentForm from '../components/appointments/AppointmentForm';
import RecordForm from '../components/records/RecordForm';
import ImageParseModal from '../components/common/ImageParseModal';
import { useGroup } from '../hooks/useGroup';
import { usePatients } from '../hooks/usePatients';
import { useAppointments } from '../hooks/useAppointments';
import { parseHospitalSMS } from '../utils/smsParser';

export default function AddPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { group, loading: groupLoading } = useGroup(slug);
  const { patients } = usePatients(group?.id);
  const { appointments } = useAppointments(group?.id);

  const [activeModal, setActiveModal] = useState(null);
  const [smsText, setSmsText] = useState('');
  const [parsedAppt, setParsedAppt] = useState(null);
  const [parseError, setParseError] = useState('');
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [imagePatientId, setImagePatientId] = useState('');

  if (groupLoading) return <LoadingSpinner />;

  function handleParse() {
    setParseError('');
    const result = parseHospitalSMS(smsText);
    if (result) {
      setParsedAppt(result);
      setActiveModal('appointment');
      setShowSmsInput(false);
    } else {
      setParseError('문자 형식을 인식하지 못했습니다. 직접 입력해 주세요.');
    }
  }

  const actions = [
    { icon: UserPlus, label: '가족 구성원 추가', desc: '새로운 가족을 등록합니다', color: 'text-blue-500 bg-blue-50', onClick: () => setActiveModal('patient') },
    { icon: Calendar, label: '진료 일정 추가', desc: '진료 예약을 수동으로 입력합니다', color: 'text-indigo-500 bg-indigo-50', onClick: () => { setParsedAppt(null); setActiveModal('appointment'); }, disabled: patients.length === 0 },
    { icon: ImageIcon, label: '예약현황 사진 업로드', desc: '예약 확인 이미지에서 일정 자동 파싱', color: 'text-orange-500 bg-orange-50', onClick: () => { setImagePatientId(patients[0]?.id || ''); setActiveModal('image'); }, disabled: patients.length === 0 },
    { icon: ClipboardPaste, label: '카카오톡 문자 파싱', desc: '병원 예약 문자를 붙여넣어 자동 등록', color: 'text-yellow-600 bg-yellow-50', onClick: () => setShowSmsInput(true), disabled: patients.length === 0 },
    { icon: FileText, label: '진료 기록 추가', desc: '진료 후 소견 및 처방을 기록합니다', color: 'text-green-500 bg-green-50', onClick: () => setActiveModal('record'), disabled: patients.length === 0 },
  ];

  return (
    <Layout group={group} title="빠른 추가">
      <div className="p-4 space-y-3">
        {patients.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">먼저 가족 구성원을 등록해야 진료 정보를 추가할 수 있습니다.</div>
        )}
        {actions.map(({ icon: Icon, label, desc, color, onClick, disabled }) => (
          <button key={label} onClick={onClick} disabled={disabled} className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-left hover:shadow-md transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-gray-200'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={22} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
        {showSmsInput && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">카카오톡 문자 붙여넣기</h3>
            <textarea value={smsText} onChange={(e) => setSmsText(e.target.value)} placeholder="병원에서 받은 예약 안내 문자를 여기에 붙여넣으세요." rows={5} autoFocus className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            {parseError && <p className="text-xs text-red-500">{parseError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowSmsInput(false); setParseError(''); setSmsText(''); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">취소</button>
              <button onClick={handleParse} disabled={!smsText.trim()} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-blue-600">파싱하기</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={activeModal === 'patient'} onClose={() => setActiveModal(null)} title="가족 구성원 추가">
        <PatientForm groupId={group?.id} onSuccess={() => { setActiveModal(null); navigate(`/group/${slug}`); }} onCancel={() => setActiveModal(null)} />
      </Modal>
      <Modal isOpen={activeModal === 'appointment'} onClose={() => { setActiveModal(null); setParsedAppt(null); }} title="진료 일정 추가">
        <AppointmentForm groupId={group?.id} patients={patients} initial={parsedAppt} onSuccess={() => { setActiveModal(null); setParsedAppt(null); navigate(`/group/${slug}/calendar`); }} onCancel={() => { setActiveModal(null); setParsedAppt(null); }} />
      </Modal>
      <Modal isOpen={activeModal === 'image'} onClose={() => setActiveModal(null)} title="예약현황 사진 파싱" size="lg">
        <ImageParseModal groupId={group?.id} patients={patients} defaultPatientId={imagePatientId} onSuccess={() => { setActiveModal(null); navigate(`/group/${slug}/calendar`); }} onClose={() => setActiveModal(null)} />
      </Modal>
      <Modal isOpen={activeModal === 'record'} onClose={() => setActiveModal(null)} title="진료 기록 추가">
        <RecordForm groupId={group?.id} patients={patients} appointments={appointments} onSuccess={() => { setActiveModal(null); navigate(`/group/${slug}`); }} onCancel={() => setActiveModal(null)} />
      </Modal>
    </Layout>
  );
}

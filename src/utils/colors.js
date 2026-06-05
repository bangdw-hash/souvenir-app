export const PATIENT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500', hex: '#3b82f6' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', dot: 'bg-pink-500', hex: '#ec4899' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500', hex: '#10b981' },
  { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', dot: 'bg-violet-500', hex: '#8b5cf6' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500', hex: '#f97316' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500', hex: '#14b8a6' },
];

export const STATUS_COLORS = {
  예약완료: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  '예약 중': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  '진료 당일': { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500', border: 'border-pink-200' },
  진료완료: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
  취소: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' },
  일정삭제: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', border: 'border-gray-200' },
  미확인: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', border: 'border-orange-200' },
};

export function getPatientColor(index) {
  return PATIENT_COLORS[index % PATIENT_COLORS.length];
}

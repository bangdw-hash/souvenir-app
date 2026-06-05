// Hospital appointment screenshot OCR text parser
const KNOWN_HOSPITALS = [
  { keywords: ['서울성모병원', '가톨릭대학교'], name: '가톨릭대학교 서울성모병원' },
  { keywords: ['서울대학교병원', '서울대병원'], name: '서울대학교병원' },
  { keywords: ['삼성서울병원'], name: '삼성서울병원' },
  { keywords: ['서울아산병원', '아산병원'], name: '서울아산병원' },
  { keywords: ['세브란스병원'], name: '세브란스병원' },
  { keywords: ['고려대학교병원', '고대병원'], name: '고려대학교병원' },
  { keywords: ['한양대학교병원', '한양대병원'], name: '한양대학교병원' },
  { keywords: ['중앙대학교병원'], name: '중앙대학교병원' },
];

function extractHospital(text) {
  for (const { keywords, name } of KNOWN_HOSPITALS) {
    if (keywords.some((kw) => text.includes(kw))) return name;
  }
  const m = text.match(/([가-힣]{2,12}(?:병원|의원|클리닉|의료원))/);
  return m ? m[1] : '';
}

function extractDatetime(block) {
  const full = block.match(/([\d]{4})\.([\d]{1,2})\.([\d]{1,2})\s*[\(（]?[월화수목금토일][\)）]?\s*([\d]{1,2})[:시]\s*([\d]{2})/);
  if (full) {
    return { date: `${full[1]}-${full[2].padStart(2, '0')}-${full[3].padStart(2, '0')}`, time: `${full[4].padStart(2, '0')}:${full[5]}` };
  }
  const dateOnly = block.match(/([\d]{4})\.([\d]{1,2})\.([\d]{1,2})\s*[\(（]?[월화수목금토일][\)）]?/);
  if (dateOnly) {
    const timeM = block.match(/([\d]{1,2})[:시]\s*([\d]{2})/);
    return { date: `${dateOnly[1]}-${dateOnly[2].padStart(2, '0')}-${dateOnly[3].padStart(2, '0')}`, time: timeM ? `${timeM[1].padStart(2, '0')}:${timeM[2]}` : '' };
  }
  return { date: '', time: '' };
}

function extractDoctorDept(block) {
  const slash = block.match(/([가-힣]{2,4})\s*[\/\\]\s*([가-힣]{2,12}(?:과|학과|의학과|센터)?)/);
  if (slash) return { doctor: slash[1], dept: slash[2] };
  const deptFirst = block.match(/([가-힣]{2,10}(?:내과|외과|이비인후과|안과|피부과|정형외과|신경외과|비뇨의학과|산부인과|소아청소년과|흉부외과|신경과|성형외과|재활의학과|마취통증의학과|영상의학과|응급의학과|정신건강의학과|방사선종양학과|혈액종양내과|소화기내과|순환기내과|호흡기내과|내분비내과|신장내과|감염내과|류마티스내과))\s+([가-힣]{2,4})/);
  if (deptFirst) return { doctor: deptFirst[2], dept: deptFirst[1] };
  const deptOnly = block.match(/([가-힣]{2,10}(?:내과|외과|이비인후과|안과|피부과|정형외과|신경외과|비뇨의학과|산부인과|소아청소년과|흉부외과|신경과|성형외과|재활의학과))/);
  return { doctor: '', dept: deptOnly ? deptOnly[1] : '' };
}

function extractNote(block) {
  const parts = [];
  const loc = block.match(/장소\s+([^\n]+)/);
  if (loc) parts.push(`장소: ${loc[1].trim()}`);
  const specialty = block.match(/분야\s+([\s\S]+?)(?=\n구분|\n장소|예약취소|$)/);
  if (specialty) { const cleaned = specialty[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(); if (cleaned) parts.push(`분야: ${cleaned}`); }
  if (block.includes('초진')) parts.push('초진 - 해당 외래 진료과 접수 필요');
  return parts.join(' | ');
}

function parseBlock(block, hospital) {
  const { date, time } = extractDatetime(block);
  if (!date) return null;
  const { doctor, dept } = extractDoctorDept(block);
  const note = extractNote(block);
  return { hospital: hospital || '', date, time, dept, doctor, note, status: '예약완료' };
}

export function parseImageText(ocrText) {
  if (!ocrText || ocrText.trim().length < 5) return [];
  const text = ocrText;
  const hospital = extractHospital(text);
  const dateRegex = /\d{4}\.\d{1,2}\.\d{1,2}/g;
  const dateMatches = [...text.matchAll(dateRegex)];
  if (dateMatches.length === 0) return [];
  if (dateMatches.length === 1) {
    const result = parseBlock(text, hospital);
    return result ? [result] : [];
  }
  const results = [];
  for (let i = 0; i < dateMatches.length; i++) {
    const start = Math.max(0, dateMatches[i].index - 60);
    const end = i + 1 < dateMatches.length ? dateMatches[i + 1].index : text.length;
    const block = text.slice(start, end);
    const appt = parseBlock(block, hospital);
    if (appt) results.push(appt);
  }
  return results;
}

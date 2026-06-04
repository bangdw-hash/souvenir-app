const HOSPITAL_PATTERNS = [
  { name: '서울성모병원', patterns: [/가톨릭대학교\s*서울성모병원/i, /서울성모/i] },
  { name: '서울대학교병원', patterns: [/서울대학교병원|서울대병원/i] },
  { name: '삼성서울병원', patterns: [/삼성서울병원|삼성서울/i] },
  { name: '서울아산병원', patterns: [/서울아산병원|아산병원/i] },
  { name: '세브란스병원', patterns: [/세브란스병원|연세대.*세브란스/i] },
  { name: '고려대학교병원', patterns: [/고려대학교병원|고대병원/i] },
  { name: '한양대학교병원', patterns: [/한양대학교병원|한양대병원/i] },
];

const DATE_PATTERNS = [
  /(\d{4})[년.\-\/]?\s*(\d{1,2})[월.\-\/]?\s*(\d{1,2})일?/,
  /(\d{2,4})\.(\d{1,2})\.(\d{1,2})/,
  /(\d{4})-(\d{2})-(\d{2})/,
];

function parseDate(text) {
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const year = m[1].length === 2 ? `20${m[1]}` : m[1];
      return `${year}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    }
  }
  return '';
}

function parseTime(text) {
  const pm = text.match(/오후\s*(\d{1,2})시\s*(\d{2})?분?/);
  if (pm) {
    let h = parseInt(pm[1]);
    if (h < 12) h += 12;
    return `${String(h).padStart(2, '0')}:${pm[2] || '00'}`;
  }
  const am = text.match(/오전\s*(\d{1,2})시\s*(\d{2})?분?/);
  if (am) return `${am[1].padStart(2, '0')}:${am[2] || '00'}`;
  const colon = text.match(/(\d{1,2}):(\d{2})/);
  if (colon) return `${colon[1].padStart(2, '0')}:${colon[2]}`;
  return '';
}

function parseHospitalName(text) {
  for (const { name, patterns } of HOSPITAL_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return name;
  }
  const m = text.match(/([가-힣]{2,10}(?:병원|의원|클리닉|의료원|센터))/);
  return m ? m[1] : '';
}

function parseDept(text) {
  const m = text.match(/진료과[:\s]*([가-힣]+과?)/) ||
             text.match(/([가-힣]{2,6}(?:내과|외과|과|의학과|센터))/);
  return m ? m[1] : '';
}

function parseDoctor(text) {
  const m = text.match(/담당의[:\s]*([가-힣]{2,4})/) ||
             text.match(/([가-힣]{2,4})\s*(?:교수님|선생님|원장님)/);
  return m ? m[1] : '';
}

function parseApptNum(text) {
  const m = text.match(/예약번호[:\s]*([A-Z0-9\-]+)/i) ||
             text.match(/접수번호[:\s]*([A-Z0-9\-]+)/i);
  return m ? m[1] : '';
}

export function parseHospitalSMS(text) {
  if (!text || text.trim().length < 10) return null;
  const hospital = parseHospitalName(text);
  const date = parseDate(text);
  if (!hospital && !date) return null;
  const apptNum = parseApptNum(text);
  return {
    hospital,
    date,
    time: parseTime(text),
    dept: parseDept(text),
    doctor: parseDoctor(text),
    note: apptNum ? `예약번호: ${apptNum}` : '',
    status: '예약완료',
    parsedFrom: text,
  };
}

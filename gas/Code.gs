// ===== 설정값 (배포 전 반드시 수정) =====
var SPREADSHEET_ID = '1UpGI0FXQ5RNOrTHnmRR00dPglvuk6kAntPF_DyI7SX0';
var TELEGRAM_BOT_TOKEN = '8864903445:AAEQpEy-_Hv60-zFqnzIw2PTtXH6CRu9yX8';
var TELEGRAM_CHAT_ID = '5259312151';
var ADMIN_PASSWORD = 'admin1234';             // 관리자 비밀번호 (변경 권장)
// ==========================================

var SHEET_REQUESTS = '신청내역';
var SHEET_ITEMS = '물품목록';

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'getItems') return getItems();
  return ContentService.createTextOutput('OK');
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: '잘못된 요청입니다.' });
  }

  var action = data.action;

  if (action === 'submit') return submitRequest(data);
  if (action === 'addItem') return addItem(data);
  if (action === 'updateItem') return updateItem(data);
  if (action === 'deleteItem') return deleteItem(data);

  return jsonResponse({ success: false, message: '알 수 없는 요청입니다.' });
}

// ── 신청 제출 ──────────────────────────────────────────
function submitRequest(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_REQUESTS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_REQUESTS);
    sheet.appendRow(['타임스탬프', '성명', '소속', '물품명', '수량', '사용처/목적', '신청일', '사용일']);
  }

  var items = data.items || [];
  var timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  items.forEach(function(item) {
    sheet.appendRow([
      timestamp,
      data.name,
      data.department,
      item.name,
      item.qty,
      data.purpose,
      data.requestDate,
      data.useDate
    ]);
  });

  sendTelegramNotification(data, items, timestamp);

  return jsonResponse({ success: true, message: '신청이 완료되었습니다.' });
}

// ── 물품 목록 조회 ─────────────────────────────────────
function getItems() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);

  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: true, items: getDefaultItems() });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  var items = rows
    .filter(function(r) { return r[3] === true || r[3] === '활성'; })
    .map(function(r) { return { id: r[0], name: r[1], description: r[2] }; });

  if (items.length === 0) items = getDefaultItems();
  return jsonResponse({ success: true, items: items });
}

function getDefaultItems() {
  return [
    { id: 1, name: '화장품 세트 대형', description: '크림 대형 1통 + 에센스 1통' },
    { id: 2, name: '화장품 세트 중형', description: '크림 1통 + 에센스 1통' },
    { id: 3, name: '화장품 세트 소형', description: '크림 1통' }
  ];
}

// ── 물품 추가 ──────────────────────────────────────────
function addItem(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ITEMS);
    sheet.appendRow(['물품ID', '물품명', '설명', '활성여부']);
  }

  var lastId = sheet.getLastRow() < 2 ? 0 : sheet.getRange(sheet.getLastRow(), 1).getValue();
  sheet.appendRow([lastId + 1, data.name, data.description, '활성']);

  return jsonResponse({ success: true, message: '물품이 추가되었습니다.' });
}

// ── 물품 수정 ──────────────────────────────────────────
function updateItem(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);
  if (!sheet) return jsonResponse({ success: false, message: '물품목록 시트가 없습니다.' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.getRange(i + 1, 2).setValue(data.name);
      sheet.getRange(i + 1, 3).setValue(data.description);
      sheet.getRange(i + 1, 4).setValue(data.active ? '활성' : '비활성');
      return jsonResponse({ success: true, message: '수정되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '해당 물품을 찾을 수 없습니다.' });
}

// ── 물품 삭제(비활성화) ────────────────────────────────
function deleteItem(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  data.active = false;
  return updateItem(data);
}

// ── 텔레그램 알림 ──────────────────────────────────────
function sendTelegramNotification(data, items, timestamp) {
  var itemList = items.map(function(i) { return '  • ' + i.name + ' × ' + i.qty + '개'; }).join('\n');
  var message =
    '📦 *기념품 불출 신청 접수*\n\n' +
    '🕐 ' + timestamp + '\n' +
    '👤 성명: ' + data.name + '\n' +
    '🏢 소속: ' + data.department + '\n' +
    '📅 신청일: ' + data.requestDate + '\n' +
    '📅 사용일: ' + data.useDate + '\n' +
    '📍 사용처/목적: ' + data.purpose + '\n\n' +
    '🛍️ 신청물품:\n' + itemList;

  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    }),
    muteHttpExceptions: true
  });
}

// ── 공통 응답 ──────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

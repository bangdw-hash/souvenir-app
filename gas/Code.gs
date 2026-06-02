// ===== 설정값 =====
var SPREADSHEET_ID = '1UpGI0FXQ5RNOrTHnmRR00dPglvuk6kAntPF_DyI7SX0';
var TELEGRAM_BOT_TOKEN = '8864903445:AAEQpEy-_Hv60-zFqnzIw2PTtXH6CRu9yX8';
var TELEGRAM_CHAT_ID = '5259312151';
var ADMIN_PASSWORD = 'admin1234'; // 변경 권장
// ==================

var SHEET_REQUESTS   = '신청내역';
var SHEET_ITEMS      = '물품목록';
var SHEET_ADJUST     = '재고조정내역';
var SHEET_RECEIVE    = '입고내역';
var SHEET_DEPTS      = '소속목록';

var DEFAULT_DEPTS = [
  '임원','기획처','행정관리처','교육지원처','입학처',
  '항공정비계열','스마트안전진단계열','항공관광계열','항공보안계열','국방경찰계열',
  '기종교육원','무인항공교육원','비행교육원','아세아직업전문학교','기타'
];

// ── 컬럼 인덱스 (물품목록 시트, 1-based) ──
// 1:물품ID 2:물품명 3:설명 4:총량 5:잔여량 6:안전재고 7:활성여부 8:월한도

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'getItems')    return getItems();
  if (action === 'getStock')    return getStockSummary();
  if (action === 'getDepts')    return getDepts();
  return jsonResponse({ success: true });
}

function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); }
  catch (err) { return jsonResponse({ success: false, message: '잘못된 요청입니다.' }); }

  var action = data.action;
  if (action === 'submit')        return submitRequest(data);
  if (action === 'addItem')       return addItem(data);
  if (action === 'updateItem')    return updateItem(data);
  if (action === 'toggleItem')    return toggleItem(data);
  if (action === 'adjustStock')   return adjustStock(data);
  if (action === 'addDept')       return addDept(data);
  if (action === 'updateDept')    return updateDept(data);
  if (action === 'deleteDept')    return deleteDept(data);
  if (action === 'reorderDepts')  return reorderDepts(data);
  if (action === 'receiveStock')  return receiveStock(data);
  if (action === 'setMonthLimit') return setMonthLimit(data);

  return jsonResponse({ success: false, message: '알 수 없는 요청' });
}

// ── 신청 제출 ──────────────────────────────────────────
function submitRequest(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var reqSheet = getOrCreateSheet(ss, SHEET_REQUESTS,
    ['타임스탬프','성명','소속','물품명','수량','사용처/목적','신청일','사용일']);
  var itemSheet = getOrCreateSheet(ss, SHEET_ITEMS,
    ['물품ID','물품명','설명','총량','잔여량','안전재고','활성여부','월한도']);

  var items = data.items || [];
  var timestamp = getKSTTimestamp();

  // 1인당 월 한도 체크
  var monthLimitCheck = checkMonthLimit(reqSheet, itemSheet, data.name, items, timestamp);
  if (!monthLimitCheck.ok) {
    return jsonResponse({ success: false, message: monthLimitCheck.message });
  }

  // 재고 확인 및 차감
  var stockCheck = checkAndDeductStock(itemSheet, items);
  if (!stockCheck.ok) {
    return jsonResponse({ success: false, message: stockCheck.message });
  }

  // 신청내역 기록
  items.forEach(function(item) {
    reqSheet.appendRow([timestamp, data.name, data.department,
      item.name, item.qty, data.purpose, data.requestDate, data.useDate]);
  });

  // 텔레그램 신청 알림
  sendTelegramNotification(data, items, timestamp);

  // 재고 경고 알림 체크
  checkStockWarnings(itemSheet, items);

  return jsonResponse({ success: true, message: '신청이 완료되었습니다.' });
}

// ── 재고 확인 및 차감 ──────────────────────────────────
function checkAndDeductStock(sheet, items) {
  var rows = sheet.getDataRange().getValues();

  // 먼저 전체 재고 확인
  for (var k = 0; k < items.length; k++) {
    var item = items[k];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === item.name) {
        var active = rows[i][6];
        var remaining = parseInt(rows[i][4]) || 0;
        if (active === '비활성' || active === false) {
          return { ok: false, message: '"' + item.name + '" 은(는) 현재 신청이 비활성화된 물품입니다.' };
        }
        if (remaining < item.qty) {
          return { ok: false, message: '"' + item.name + '" 의 재고가 부족합니다. (잔여: ' + remaining + '개)' };
        }
        break;
      }
    }
  }

  // 실제 차감
  for (var k = 0; k < items.length; k++) {
    var item = items[k];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === item.name) {
        var newQty = (parseInt(rows[i][4]) || 0) - item.qty;
        sheet.getRange(i + 1, 5).setValue(newQty);
        rows[i][4] = newQty;
        // 재고 0이면 자동 비활성화
        if (newQty <= 0) {
          sheet.getRange(i + 1, 7).setValue('비활성');
        }
        break;
      }
    }
  }
  return { ok: true };
}

// ── 1인당 월 한도 체크 ─────────────────────────────────
function checkMonthLimit(reqSheet, itemSheet, name, items, timestamp) {
  var itemRows = itemSheet.getDataRange().getValues();
  var reqRows = reqSheet.getLastRow() > 1
    ? reqSheet.getRange(2, 1, reqSheet.getLastRow() - 1, 8).getValues()
    : [];

  var now = new Date();
  var thisMonth = now.getFullYear() + '-' + (now.getMonth() + 1);

  for (var k = 0; k < items.length; k++) {
    var item = items[k];

    // 월 한도 찾기
    var monthLimit = 0;
    for (var i = 1; i < itemRows.length; i++) {
      if (itemRows[i][1] === item.name) {
        monthLimit = parseInt(itemRows[i][7]) || 0;
        break;
      }
    }
    if (monthLimit <= 0) continue; // 한도 없음

    // 이번 달 이미 신청한 수량
    var alreadyQty = 0;
    for (var j = 0; j < reqRows.length; j++) {
      var row = reqRows[j];
      var rowDate = new Date(row[0]);
      var rowMonth = rowDate.getFullYear() + '-' + (rowDate.getMonth() + 1);
      if (row[1] === name && row[3] === item.name && rowMonth === thisMonth) {
        alreadyQty += parseInt(row[4]) || 0;
      }
    }

    if (alreadyQty + item.qty > monthLimit) {
      return {
        ok: false,
        message: '"' + item.name + '" 의 월 신청 한도를 초과합니다. ' +
          '(한도: ' + monthLimit + '개 / 이미 신청: ' + alreadyQty + '개)'
      };
    }
  }
  return { ok: true };
}

// ── 재고 경고 텔레그램 알림 ────────────────────────────
function checkStockWarnings(sheet, changedItems) {
  var rows = sheet.getDataRange().getValues();
  changedItems.forEach(function(item) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === item.name) {
        var total     = parseInt(rows[i][3]) || 1;
        var remaining = parseInt(rows[i][4]) || 0;
        var safety    = parseInt(rows[i][5]) || 0;
        var pct = Math.round((remaining / total) * 100);

        var msg = null;
        if (remaining <= 0) {
          msg = '❌ *재고 소진*\n"' + item.name + '" 재고가 모두 소진되었습니다.';
        } else if (remaining <= safety) {
          msg = '🚨 *재고 부족 (안전재고 도달)*\n"' + item.name + '" 잔여: ' + remaining + '개 (' + pct + '%)';
        } else if (pct <= 20) {
          msg = '🚨 *재고 부족*\n"' + item.name + '" 잔여: ' + remaining + '개 (' + pct + '%)';
        } else if (pct <= 50) {
          msg = '⚠️ *재고 주의*\n"' + item.name + '" 잔여: ' + remaining + '개 (' + pct + '%)';
        }

        if (msg) sendTelegram(msg);
        break;
      }
    }
  });
}

// ── 물품 목록 조회 ─────────────────────────────────────
function getItems() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);

  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: true, items: [] });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  var items = rows
    .filter(function(r) { return r[0] !== ''; })
    .map(function(r) {
      return {
        id:          r[0],
        name:        r[1],
        description: r[2],
        total:       parseInt(r[3]) || 0,
        remaining:   parseInt(r[4]) || 0,
        safety:      parseInt(r[5]) || 0,
        active:      r[6] !== '비활성',
        monthLimit:  parseInt(r[7]) || 0
      };
    });

  return jsonResponse({ success: true, items: items });
}

// ── 재고 현황 요약 ─────────────────────────────────────
function getStockSummary() {
  var res = JSON.parse(getItems().getContent());
  return jsonResponse({ success: true, items: res.items });
}

// ── 물품 추가 ──────────────────────────────────────────
function addItem(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, SHEET_ITEMS,
    ['물품ID','물품명','설명','총량','잔여량','안전재고','활성여부','월한도']);

  var lastId = sheet.getLastRow() < 2 ? 0 : parseInt(sheet.getRange(sheet.getLastRow(), 1).getValue()) || 0;
  var total = parseInt(data.total) || 0;
  sheet.appendRow([lastId + 1, data.name, data.description || '',
    total, total, parseInt(data.safety) || 0, '활성', parseInt(data.monthLimit) || 0]);

  // 입고내역 기록
  recordReceive(ss, data.name, total, '초기 등록');
  return jsonResponse({ success: true, message: '물품이 추가되었습니다.' });
}

// ── 물품 수정 ──────────────────────────────────────────
function updateItem(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);
  if (!sheet) return jsonResponse({ success: false, message: '시트 없음' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.getRange(i + 1, 2).setValue(data.name);
      sheet.getRange(i + 1, 3).setValue(data.description || '');
      sheet.getRange(i + 1, 6).setValue(parseInt(data.safety) || 0);
      sheet.getRange(i + 1, 8).setValue(parseInt(data.monthLimit) || 0);
      return jsonResponse({ success: true, message: '수정되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '물품을 찾을 수 없습니다.' });
}

// ── ON/OFF 토글 ────────────────────────────────────────
function toggleItem(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);
  if (!sheet) return jsonResponse({ success: false, message: '시트 없음' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      var newStatus = data.active ? '활성' : '비활성';
      sheet.getRange(i + 1, 7).setValue(newStatus);
      return jsonResponse({ success: true, message: '"' + rows[i][1] + '" ' + (data.active ? '활성화' : '비활성화') + ' 되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '물품을 찾을 수 없습니다.' });
}

// ── 재고 중간 조정 ─────────────────────────────────────
function adjustStock(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);
  if (!sheet) return jsonResponse({ success: false, message: '시트 없음' });

  var adjSheet = getOrCreateSheet(ss, SHEET_ADJUST,
    ['타임스탬프','물품명','조정전','조정후','조정량','조정사유']);

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      var before = parseInt(rows[i][4]) || 0;
      var after  = parseInt(data.newQty);
      var diff   = after - before;
      sheet.getRange(i + 1, 5).setValue(after);

      // 재고 0이하면 자동 비활성화, 아니면 재활성화
      if (after <= 0) {
        sheet.getRange(i + 1, 7).setValue('비활성');
      } else if (rows[i][6] === '비활성' && after > 0) {
        sheet.getRange(i + 1, 7).setValue('활성');
      }

      adjSheet.appendRow([getKSTTimestamp(), rows[i][1], before, after, diff, data.reason || '수동조정']);

      sendTelegram('🔧 *재고 조정 완료*\n물품: ' + rows[i][1] +
        '\n조정 전: ' + before + '개 → 조정 후: ' + after + '개 (차이: ' + (diff >= 0 ? '+' : '') + diff + '개)' +
        '\n사유: ' + (data.reason || '수동조정'));

      return jsonResponse({ success: true, message: '재고가 조정되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '물품을 찾을 수 없습니다.' });
}

// ── 입고 처리 ──────────────────────────────────────────
function receiveStock(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);
  if (!sheet) return jsonResponse({ success: false, message: '시트 없음' });

  var qty = parseInt(data.qty) || 0;

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      var oldTotal     = parseInt(rows[i][3]) || 0;
      var oldRemaining = parseInt(rows[i][4]) || 0;
      var newTotal     = oldTotal + qty;
      var newRemaining = oldRemaining + qty;

      sheet.getRange(i + 1, 4).setValue(newTotal);
      sheet.getRange(i + 1, 5).setValue(newRemaining);
      // 재고 생기면 활성화
      if (rows[i][6] === '비활성' && newRemaining > 0) {
        sheet.getRange(i + 1, 7).setValue('활성');
      }

      recordReceive(ss, rows[i][1], qty, data.memo || '');

      sendTelegram('📦 *입고 완료*\n물품: ' + rows[i][1] +
        '\n입고량: +' + qty + '개' +
        '\n총량: ' + newTotal + '개 / 잔여: ' + newRemaining + '개' +
        (data.memo ? '\n비고: ' + data.memo : ''));

      return jsonResponse({ success: true, message: qty + '개 입고 처리되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '물품을 찾을 수 없습니다.' });
}

// ── 월 한도 설정 ───────────────────────────────────────
function setMonthLimit(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ITEMS);
  if (!sheet) return jsonResponse({ success: false, message: '시트 없음' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.getRange(i + 1, 8).setValue(parseInt(data.monthLimit) || 0);
      return jsonResponse({ success: true, message: '월 한도가 설정되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '물품을 찾을 수 없습니다.' });
}

// ── 입고내역 기록 헬퍼 ────────────────────────────────
function recordReceive(ss, itemName, qty, memo) {
  var sheet = getOrCreateSheet(ss, SHEET_RECEIVE,
    ['타임스탬프','물품명','입고량','비고']);
  sheet.appendRow([getKSTTimestamp(), itemName, qty, memo]);
}

// ── 텔레그램 신청 알림 ─────────────────────────────────
function sendTelegramNotification(data, items, timestamp) {
  var itemList = items.map(function(i) { return '  • ' + i.name + ' × ' + i.qty + '개'; }).join('\n');
  var msg =
    '📦 *기념품 불출 신청 접수*\n\n' +
    '🕐 ' + timestamp + '\n' +
    '👤 성명: ' + data.name + '\n' +
    '🏢 소속: ' + data.department + '\n' +
    '📅 신청일: ' + data.requestDate + '\n' +
    '📅 사용일: ' + data.useDate + '\n' +
    '📍 사용처/목적: ' + data.purpose + '\n\n' +
    '🛍️ 신청물품:\n' + itemList;
  sendTelegram(msg);
}

function sendTelegram(text) {
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'Markdown' }),
      muteHttpExceptions: true
    });
  } catch(e) {}
}

// ── 유틸 ──────────────────────────────────────────────
function getKSTTimestamp() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 소속 목록 조회 ─────────────────────────────────────
function getDepts() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_DEPTS);

  if (!sheet || sheet.getLastRow() < 2) {
    // 시트 없으면 기본값으로 초기화
    sheet = initDeptSheet(ss);
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  var depts = rows
    .filter(function(r) { return r[0] !== '' && r[2] !== '비활성'; })
    .map(function(r) { return { id: r[0], name: r[1], active: r[2] !== '비활성' }; });

  return jsonResponse({ success: true, depts: depts });
}

// ── 소속 초기화 (기본값 삽입) ──────────────────────────
function initDeptSheet(ss) {
  var sheet = getOrCreateSheet(ss, SHEET_DEPTS, ['순번','소속명','활성여부']);
  DEFAULT_DEPTS.forEach(function(name, idx) {
    sheet.appendRow([idx + 1, name, '활성']);
  });
  return sheet;
}

// ── 소속 추가 ──────────────────────────────────────────
function addDept(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_DEPTS);
  if (!sheet || sheet.getLastRow() < 2) sheet = initDeptSheet(ss);

  var lastId = sheet.getLastRow() < 2 ? 0 : parseInt(sheet.getRange(sheet.getLastRow(), 1).getValue()) || 0;
  sheet.appendRow([lastId + 1, data.name, '활성']);
  return jsonResponse({ success: true, message: '"' + data.name + '" 소속이 추가되었습니다.' });
}

// ── 소속 수정 ──────────────────────────────────────────
function updateDept(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_DEPTS);
  if (!sheet) return jsonResponse({ success: false, message: '소속목록 시트 없음' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.getRange(i + 1, 2).setValue(data.name);
      return jsonResponse({ success: true, message: '수정되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '소속을 찾을 수 없습니다.' });
}

// ── 소속 삭제 ──────────────────────────────────────────
function deleteDept(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_DEPTS);
  if (!sheet) return jsonResponse({ success: false, message: '소속목록 시트 없음' });

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.getRange(i + 1, 3).setValue('비활성');
      return jsonResponse({ success: true, message: '"' + rows[i][1] + '" 소속이 삭제되었습니다.' });
    }
  }
  return jsonResponse({ success: false, message: '소속을 찾을 수 없습니다.' });
}

// ── 소속 순서 변경 ─────────────────────────────────────
function reorderDepts(data) {
  if (data.password !== ADMIN_PASSWORD) return jsonResponse({ success: false, message: '비밀번호가 틀렸습니다.' });
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_DEPTS);
  if (!sheet) return jsonResponse({ success: false, message: '소속목록 시트 없음' });

  var rows = sheet.getDataRange().getValues();
  var ids = data.ids; // 새 순서의 id 배열

  ids.forEach(function(id, newIdx) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == id) {
        sheet.getRange(i + 1, 1).setValue(newIdx + 1);
        break;
      }
    }
  });

  // 순번으로 정렬
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).sort(1);
  return jsonResponse({ success: true, message: '순서가 변경되었습니다.' });
}

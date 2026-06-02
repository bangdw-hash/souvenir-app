var GAS_URL = 'https://script.google.com/macros/s/AKfycbyuLkODpQZAvIoVK7PBJjq1xENofT9XcWl2bPXuEmumq88Yu-WVbVs_o8Vp-VaqLp3lvw/exec';

var adminPassword = '';
var currentItems  = [];
var editingId     = null;
var modalMode     = ''; // 'add' | 'edit' | 'adjust' | 'receive'

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('passwordInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') login();
  });
});

// ── 로그인 ─────────────────────────────────────────────
function login() {
  var pw = document.getElementById('passwordInput').value;
  if (!pw) return;
  adminPassword = pw;
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('adminSection').style.display = 'block';
  loadItems();
}

// ── 물품 목록 로드 ─────────────────────────────────────
function loadItems() {
  var list = document.getElementById('adminItemList');
  list.innerHTML = '<p style="color:#999;font-size:0.85rem;">불러오는 중...</p>';

  fetch(GAS_URL + '?action=getItems')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) { currentItems = res.items; renderItems(res.items); }
      else showAlert('물품 목록을 불러올 수 없습니다.', 'error');
    })
    .catch(function () { showAlert('네트워크 오류', 'error'); });
}

function renderItems(items) {
  var list = document.getElementById('adminItemList');
  if (!items || items.length === 0) {
    list.innerHTML = '<p style="color:#999;font-size:0.85rem;text-align:center;padding:20px 0;">등록된 물품이 없습니다.</p>';
    return;
  }

  list.innerHTML = '';
  items.forEach(function (item) {
    var pct = item.total > 0 ? Math.round((item.remaining / item.total) * 100) : 0;
    var stockColor = item.remaining <= 0 ? '#e53e3e' : pct <= 20 ? '#e53e3e' : pct <= 50 ? '#e07b39' : '#2d9e5f';
    var safetyWarn = item.remaining <= item.safety && item.remaining > 0
      ? '<span style="color:#e07b39;font-size:0.75rem;"> ⚠️안전재고</span>' : '';

    var card = document.createElement('div');
    card.className = 'item-admin-card';
    card.innerHTML =
      // 헤더
      '<div class="item-admin-header">' +
        '<div>' +
          '<div class="item-name">' + esc(item.name) + safetyWarn + '</div>' +
          '<div class="item-desc">' + esc(item.description || '') + '</div>' +
        '</div>' +
        '<label class="toggle-switch" title="신청 ON/OFF">' +
          '<input type="checkbox" ' + (item.active ? 'checked' : '') + ' onchange="toggleItem(' + item.id + ', this.checked)">' +
          '<span class="toggle-slider"></span>' +
        '</label>' +
      '</div>' +
      // 재고 현황
      '<div class="stock-summary">' +
        '<div class="stock-stat"><span class="stat-label">총량</span><span class="stat-val">' + item.total + '</span></div>' +
        '<div class="stock-stat"><span class="stat-label">잔여</span><span class="stat-val" style="color:' + stockColor + ';font-weight:700;">' + item.remaining + '</span></div>' +
        '<div class="stock-stat"><span class="stat-label">안전재고</span><span class="stat-val">' + item.safety + '</span></div>' +
        '<div class="stock-stat"><span class="stat-label">월한도</span><span class="stat-val">' + (item.monthLimit > 0 ? item.monthLimit : '제한없음') + '</span></div>' +
      '</div>' +
      // 진행바
      '<div class="progress-wrap" style="margin:8px 0 12px;">' +
        '<div class="progress-bar" style="width:' + pct + '%;background:' + stockColor + ';"></div>' +
      '</div>' +
      '<div style="text-align:right;font-size:0.75rem;color:' + stockColor + ';margin-bottom:10px;">' + pct + '% 남음</div>' +
      // 버튼
      '<div class="item-actions">' +
        '<button class="btn-action btn-receive" onclick="openReceiveModal(' + item.id + ', \'' + escJs(item.name) + '\')">📦 입고</button>' +
        '<button class="btn-action btn-adjust" onclick="openAdjustModal(' + item.id + ', \'' + escJs(item.name) + '\', ' + item.remaining + ')">🔧 재고조정</button>' +
        '<button class="btn-action btn-edit" onclick="openEditModal(' + item.id + ', \'' + escJs(item.name) + '\', \'' + escJs(item.description || '') + '\', ' + item.safety + ', ' + item.monthLimit + ')">✏️ 수정</button>' +
        '<button class="btn-action btn-danger" onclick="confirmDelete(' + item.id + ', \'' + escJs(item.name) + '\')">🗑️ 삭제</button>' +
      '</div>';

    list.appendChild(card);
  });
}

// ── 모달: 물품 추가 ────────────────────────────────────
function openAddModal() {
  modalMode = 'add';
  editingId = null;
  document.getElementById('modalTitle').textContent = '물품 추가';
  document.getElementById('modalBody').innerHTML = modalAddHTML();
  document.getElementById('itemModal').classList.add('open');
}

function modalAddHTML() {
  return '<div class="form-group"><label>물품명 <span class="required">*</span></label>' +
    '<input type="text" id="mName" placeholder="예: 화장품 세트 대형"></div>' +
    '<div class="form-group"><label>설명</label>' +
    '<input type="text" id="mDesc" placeholder="예: 크림 대형 1통 + 에센스 1통"></div>' +
    '<div class="form-group"><label>초기 총량 (개) <span class="required">*</span></label>' +
    '<input type="number" id="mTotal" min="0" value="0"></div>' +
    '<div class="form-group"><label>안전재고 (개)</label>' +
    '<input type="number" id="mSafety" min="0" value="0" placeholder="이 수량 이하면 경고 알림"></div>' +
    '<div class="form-group"><label>1인당 월 신청 한도 (0=제한없음)</label>' +
    '<input type="number" id="mMonthLimit" min="0" value="0"></div>';
}

// ── 모달: 물품 수정 ────────────────────────────────────
function openEditModal(id, name, desc, safety, monthLimit) {
  modalMode = 'edit';
  editingId = id;
  document.getElementById('modalTitle').textContent = '물품 수정';
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group"><label>물품명 <span class="required">*</span></label>' +
    '<input type="text" id="mName" value="' + esc(name) + '"></div>' +
    '<div class="form-group"><label>설명</label>' +
    '<input type="text" id="mDesc" value="' + esc(desc) + '"></div>' +
    '<div class="form-group"><label>안전재고 (개)</label>' +
    '<input type="number" id="mSafety" min="0" value="' + safety + '"></div>' +
    '<div class="form-group"><label>1인당 월 신청 한도 (0=제한없음)</label>' +
    '<input type="number" id="mMonthLimit" min="0" value="' + monthLimit + '"></div>';
  document.getElementById('itemModal').classList.add('open');
}

// ── 모달: 재고 조정 ────────────────────────────────────
function openAdjustModal(id, name, remaining) {
  modalMode = 'adjust';
  editingId = id;
  document.getElementById('modalTitle').textContent = '재고 중간 조정 — ' + name;
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group"><label>현재 잔여량</label>' +
    '<input type="text" value="' + remaining + '개" disabled style="background:#f0f4f8;"></div>' +
    '<div class="form-group"><label>조정 후 잔여량 <span class="required">*</span></label>' +
    '<input type="number" id="mNewQty" min="0" value="' + remaining + '"></div>' +
    '<div class="form-group"><label>조정 사유 <span class="required">*</span></label>' +
    '<input type="text" id="mReason" placeholder="예: 실사 결과 수량 오류 수정"></div>';
  document.getElementById('itemModal').classList.add('open');
}

// ── 모달: 입고 처리 ────────────────────────────────────
function openReceiveModal(id, name) {
  modalMode = 'receive';
  editingId = id;
  document.getElementById('modalTitle').textContent = '입고 처리 — ' + name;
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group"><label>입고 수량 <span class="required">*</span></label>' +
    '<input type="number" id="mQty" min="1" value="1" placeholder="입고할 개수"></div>' +
    '<div class="form-group"><label>비고</label>' +
    '<input type="text" id="mMemo" placeholder="예: 2024년 2차 입고"></div>';
  document.getElementById('itemModal').classList.add('open');
}

function closeModal() {
  document.getElementById('itemModal').classList.remove('open');
  editingId = null;
  modalMode = '';
}

// ── 저장 분기 ──────────────────────────────────────────
function saveModal() {
  if (modalMode === 'add')     return doAddItem();
  if (modalMode === 'edit')    return doEditItem();
  if (modalMode === 'adjust')  return doAdjustStock();
  if (modalMode === 'receive') return doReceiveStock();
}

function doAddItem() {
  var name  = (document.getElementById('mName').value || '').trim();
  var desc  = (document.getElementById('mDesc').value || '').trim();
  var total = parseInt(document.getElementById('mTotal').value) || 0;
  var safety = parseInt(document.getElementById('mSafety').value) || 0;
  var monthLimit = parseInt(document.getElementById('mMonthLimit').value) || 0;
  if (!name) return alert('물품명을 입력하세요.');
  postAction({ action: 'addItem', password: adminPassword, name: name, description: desc, total: total, safety: safety, monthLimit: monthLimit });
}

function doEditItem() {
  var name  = (document.getElementById('mName').value || '').trim();
  var desc  = (document.getElementById('mDesc').value || '').trim();
  var safety = parseInt(document.getElementById('mSafety').value) || 0;
  var monthLimit = parseInt(document.getElementById('mMonthLimit').value) || 0;
  if (!name) return alert('물품명을 입력하세요.');
  postAction({ action: 'updateItem', password: adminPassword, id: editingId, name: name, description: desc, safety: safety, monthLimit: monthLimit });
}

function doAdjustStock() {
  var newQty  = document.getElementById('mNewQty').value;
  var reason  = (document.getElementById('mReason').value || '').trim();
  if (newQty === '') return alert('조정 후 잔여량을 입력하세요.');
  if (!reason) return alert('조정 사유를 입력하세요.');
  postAction({ action: 'adjustStock', password: adminPassword, id: editingId, newQty: parseInt(newQty), reason: reason });
}

function doReceiveStock() {
  var qty  = parseInt(document.getElementById('mQty').value) || 0;
  var memo = (document.getElementById('mMemo').value || '').trim();
  if (qty <= 0) return alert('입고 수량을 1 이상 입력하세요.');
  postAction({ action: 'receiveStock', password: adminPassword, id: editingId, qty: qty, memo: memo });
}

function toggleItem(id, active) {
  postAction({ action: 'toggleItem', password: adminPassword, id: id, active: active });
}

function confirmDelete(id, name) {
  if (!confirm('"' + name + '" 을(를) 비활성화 처리하시겠습니까?')) return;
  postAction({ action: 'toggleItem', password: adminPassword, id: id, active: false });
}

// ── API 공통 호출 ──────────────────────────────────────
function postAction(payload) {
  fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      showAlert(res.message, res.success ? 'success' : 'error');
      if (res.success) { closeModal(); loadItems(); }
    })
    .catch(function () { showAlert('네트워크 오류', 'error'); });
}

function showAlert(msg, type) {
  var el = document.getElementById('adminAlert');
  el.textContent = msg;
  el.className = 'alert ' + type;
  setTimeout(function () { el.className = 'alert'; el.textContent = ''; }, 4000);
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escJs(str) {
  return String(str).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

var GAS_URL = 'https://script.google.com/macros/s/AKfycbyuLkODpQZAvIoVK7PBJjq1xENofT9XcWl2bPXuEmumq88Yu-WVbVs_o8Vp-VaqLp3lvw/exec';

var adminPassword = '';
var editingId = null;

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
  loadAdminItems();
}

// ── 물품 목록 로드 ─────────────────────────────────────
function loadAdminItems() {
  var list = document.getElementById('adminItemList');
  list.innerHTML = '<p style="color:#999;font-size:0.85rem;">불러오는 중...</p>';

  fetch(GAS_URL + '?action=getItems')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) renderAdminItems(res.items);
      else showAdminAlert('물품 목록을 불러올 수 없습니다.', 'error');
    })
    .catch(function () { showAdminAlert('네트워크 오류', 'error'); });
}

function renderAdminItems(items) {
  var list = document.getElementById('adminItemList');
  if (items.length === 0) {
    list.innerHTML = '<p style="color:#999;font-size:0.85rem;text-align:center;padding:20px 0;">등록된 물품이 없습니다.</p>';
    return;
  }

  list.innerHTML = '';
  items.forEach(function (item) {
    var row = document.createElement('div');
    row.className = 'item-admin-row';
    var isActive = item.active !== false;
    row.innerHTML =
      '<div class="item-admin-info">' +
        '<div class="item-name">' + escHtml(item.name) + '</div>' +
        '<div class="item-desc">' + escHtml(item.description || '') + '</div>' +
      '</div>' +
      '<span class="badge ' + (isActive ? 'active' : 'inactive') + '">' + (isActive ? '활성' : '비활성') + '</span>' +
      '<button class="btn-edit" onclick="openEditModal(' + item.id + ', \'' + escJs(item.name) + '\', \'' + escJs(item.description || '') + '\', ' + isActive + ')">수정</button>' +
      '<button class="btn-danger" onclick="confirmDelete(' + item.id + ', \'' + escJs(item.name) + '\')">삭제</button>';
    list.appendChild(row);
  });
}

// ── 물품 추가 모달 ─────────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = '물품 추가';
  document.getElementById('modalItemName').value = '';
  document.getElementById('modalItemDesc').value = '';
  document.getElementById('modalActiveWrap').style.display = 'none';
  document.getElementById('itemModal').classList.add('open');
}

function openEditModal(id, name, desc, active) {
  editingId = id;
  document.getElementById('modalTitle').textContent = '물품 수정';
  document.getElementById('modalItemName').value = name;
  document.getElementById('modalItemDesc').value = desc;
  document.getElementById('modalActive').checked = active;
  document.getElementById('modalActiveWrap').style.display = 'flex';
  document.getElementById('itemModal').classList.add('open');
}

function closeModal() {
  document.getElementById('itemModal').classList.remove('open');
  editingId = null;
}

function saveItem() {
  var name = document.getElementById('modalItemName').value.trim();
  var desc = document.getElementById('modalItemDesc').value.trim();
  if (!name) { alert('물품명을 입력해주세요.'); return; }

  var payload = { password: adminPassword, name: name, description: desc };

  if (editingId !== null) {
    payload.action = 'updateItem';
    payload.id = editingId;
    payload.active = document.getElementById('modalActive').checked;
  } else {
    payload.action = 'addItem';
  }

  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) {
        closeModal();
        showAdminAlert(res.message, 'success');
        loadAdminItems();
      } else {
        showAdminAlert(res.message, 'error');
      }
    })
    .catch(function () { showAdminAlert('네트워크 오류', 'error'); });
}

function confirmDelete(id, name) {
  if (!confirm('"' + name + '" 물품을 삭제하시겠습니까?\n(비활성 처리되며 신청 폼에서 사라집니다.)')) return;

  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'deleteItem', password: adminPassword, id: id, name: name, description: '', active: false })
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      showAdminAlert(res.message, res.success ? 'success' : 'error');
      if (res.success) loadAdminItems();
    })
    .catch(function () { showAdminAlert('네트워크 오류', 'error'); });
}

function showAdminAlert(msg, type) {
  var el = document.getElementById('adminAlert');
  el.textContent = msg;
  el.className = 'alert ' + type;
  setTimeout(function () { el.className = 'alert'; el.textContent = ''; }, 4000);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escJs(str) {
  return String(str).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

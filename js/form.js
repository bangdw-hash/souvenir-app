var GAS_URL = 'https://script.google.com/macros/s/AKfycbyuLkODpQZAvIoVK7PBJjq1xENofT9XcWl2bPXuEmumq88Yu-WVbVs_o8Vp-VaqLp3lvw/exec';

var selectedDept = '';

document.addEventListener('DOMContentLoaded', function () {
  setTodayDates();
  loadItems();
  bindDeptButtons();
});

function setTodayDates() {
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('requestDate').value = today;
  document.getElementById('useDate').value = today;
}

function bindDeptButtons() {
  document.querySelectorAll('.dept-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.dept-btn').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedDept = btn.dataset.value;
    });
  });
}

// ── 물품 목록 로드 ─────────────────────────────────────
function loadItems() {
  var list = document.getElementById('itemList');
  list.innerHTML = '<p style="color:#999;font-size:0.85rem;padding:10px 0;">물품 목록 불러오는 중...</p>';

  fetch(GAS_URL + '?action=getItems')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) renderItems(res.items);
      else list.innerHTML = '<p style="color:#e53e3e;font-size:0.85rem;">물품 목록을 불러올 수 없습니다.</p>';
    })
    .catch(function () {
      list.innerHTML = '<p style="color:#e53e3e;font-size:0.85rem;">네트워크 오류. 새로고침 해주세요.</p>';
    });
}

function renderItems(items) {
  var list = document.getElementById('itemList');
  if (!items || items.length === 0) {
    list.innerHTML = '<p style="color:#999;font-size:0.85rem;text-align:center;padding:20px 0;">등록된 물품이 없습니다.</p>';
    return;
  }

  list.innerHTML = '';
  items.forEach(function (item) {
    var pct = item.total > 0 ? Math.round((item.remaining / item.total) * 100) : 0;
    var isDisabled = !item.active || item.remaining <= 0;
    var stockColor = pct <= 20 ? '#e53e3e' : pct <= 50 ? '#e07b39' : '#2d9e5f';
    var stockLabel = item.remaining <= 0 ? '재고 없음' : '잔여 ' + item.remaining + '개';
    var stockBadge = isDisabled
      ? '<span class="stock-badge out">신청불가</span>'
      : '<span class="stock-badge" style="background:' + stockColor + '20;color:' + stockColor + ';">' + stockLabel + '</span>';

    var row = document.createElement('div');
    row.className = 'item-row' + (isDisabled ? ' item-disabled' : '');
    row.innerHTML =
      '<input type="checkbox" class="item-check" id="item_' + item.id + '"' +
        ' data-id="' + item.id + '" data-name="' + escAttr(item.name) + '"' +
        (isDisabled ? ' disabled' : '') + '>' +
      '<label class="item-info" for="item_' + item.id + '" style="cursor:' + (isDisabled ? 'not-allowed' : 'pointer') + ';font-weight:normal;">' +
        '<div class="item-name">' + item.name + (isDisabled ? ' <span style="color:#aaa;font-size:0.75rem;">(신청불가)</span>' : '') + '</div>' +
        '<div class="item-desc">' + (item.description || '') + '</div>' +
        '<div class="stock-row">' + stockBadge + progressBar(pct, stockColor) + '</div>' +
      '</label>' +
      '<div class="item-qty" id="qty_wrap_' + item.id + '" style="display:none;">' +
        '<button type="button" class="qty-btn" onclick="changeQty(' + item.id + ', -1, ' + item.remaining + ')">−</button>' +
        '<input type="number" class="qty-value" id="qty_' + item.id + '" value="1" min="1" max="' + item.remaining + '">' +
        '<button type="button" class="qty-btn" onclick="changeQty(' + item.id + ', 1, ' + item.remaining + ')">+</button>' +
      '</div>';

    if (!isDisabled) {
      var cb = row.querySelector('.item-check');
      cb.addEventListener('change', function () {
        document.getElementById('qty_wrap_' + item.id).style.display = this.checked ? 'flex' : 'none';
      });
    }
    list.appendChild(row);
  });
}

function progressBar(pct, color) {
  return '<div class="progress-wrap"><div class="progress-bar" style="width:' + pct + '%;background:' + color + ';"></div></div>';
}

function changeQty(id, delta, max) {
  var input = document.getElementById('qty_' + id);
  var val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > max) val = max;
  input.value = val;
}

// ── 폼 제출 ────────────────────────────────────────────
document.getElementById('souvenirForm').addEventListener('submit', function (e) {
  e.preventDefault();
  clearAlert();

  var name        = document.getElementById('name').value.trim();
  var purpose     = document.getElementById('purpose').value.trim();
  var requestDate = document.getElementById('requestDate').value;
  var useDate     = document.getElementById('useDate').value;

  if (!name)         return showAlert('성명을 입력해주세요.', 'error');
  if (!selectedDept) return showAlert('소속을 선택해주세요.', 'error');

  var selectedItems = [];
  document.querySelectorAll('.item-check:checked').forEach(function (cb) {
    var id = cb.dataset.id;
    selectedItems.push({ name: cb.dataset.name, qty: parseInt(document.getElementById('qty_' + id).value) || 1 });
  });

  if (selectedItems.length === 0) return showAlert('신청 물품을 1개 이상 선택해주세요.', 'error');
  if (!purpose)     return showAlert('사용처 및 목적을 입력해주세요.', 'error');
  if (!requestDate) return showAlert('신청일을 선택해주세요.', 'error');
  if (!useDate)     return showAlert('사용일을 선택해주세요.', 'error');

  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '제출 중...';

  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'submit', name: name, department: selectedDept,
      items: selectedItems, purpose: purpose,
      requestDate: requestDate, useDate: useDate
    })
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) {
        document.getElementById('formWrap').style.display = 'none';
        document.getElementById('successScreen').style.display = 'block';
      } else {
        showAlert(res.message || '오류가 발생했습니다.', 'error');
      }
    })
    .catch(function () { showAlert('네트워크 오류가 발생했습니다.', 'error'); })
    .finally(function () { btn.disabled = false; btn.textContent = '신청 제출'; });
});

function resetForm() {
  document.getElementById('souvenirForm').reset();
  document.getElementById('formWrap').style.display = 'block';
  document.getElementById('successScreen').style.display = 'none';
  selectedDept = '';
  document.querySelectorAll('.dept-btn').forEach(function (b) { b.classList.remove('selected'); });
  setTodayDates();
  clearAlert();
  loadItems();
  window.scrollTo(0, 0);
}

function showAlert(msg, type) {
  var el = document.getElementById('alertBox');
  el.textContent = msg;
  el.className = 'alert ' + type;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clearAlert() {
  var el = document.getElementById('alertBox');
  el.className = 'alert';
  el.textContent = '';
}
function escAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

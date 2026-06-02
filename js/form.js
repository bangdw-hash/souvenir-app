// Apps Script 웹앱 URL (배포 후 교체)
var GAS_URL = 'https://script.google.com/macros/s/AKfycbyuLkODpQZAvIoVK7PBJjq1xENofT9XcWl2bPXuEmumq88Yu-WVbVs_o8Vp-VaqLp3lvw/exec';

var selectedDept = '';
var itemData = [];

document.addEventListener('DOMContentLoaded', function () {
  setTodayDates();
  loadItems();
  bindDeptButtons();
});

// ── 날짜 기본값 ────────────────────────────────────────
function setTodayDates() {
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('requestDate').value = today;
  document.getElementById('useDate').value = today;
}

// ── 소속 버튼 ──────────────────────────────────────────
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
  list.innerHTML = '<p style="color:#999;font-size:0.85rem;">물품 목록 불러오는 중...</p>';

  fetch(GAS_URL + '?action=getItems')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) renderItems(res.items);
      else renderItems(getDefaultItems());
    })
    .catch(function () { renderItems(getDefaultItems()); });
}

function getDefaultItems() {
  return [
    { id: 1, name: '화장품 세트 대형', description: '크림 대형 1통 + 에센스 1통' },
    { id: 2, name: '화장품 세트 중형', description: '크림 1통 + 에센스 1통' },
    { id: 3, name: '화장품 세트 소형', description: '크림 1통' }
  ];
}

function renderItems(items) {
  itemData = items;
  var list = document.getElementById('itemList');
  list.innerHTML = '';

  items.forEach(function (item) {
    var row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML =
      '<input type="checkbox" class="item-check" id="item_' + item.id + '" data-id="' + item.id + '" data-name="' + item.name + '">' +
      '<label class="item-info" for="item_' + item.id + '" style="cursor:pointer;font-weight:normal;">' +
        '<div class="item-name">' + item.name + '</div>' +
        '<div class="item-desc">' + item.description + '</div>' +
      '</label>' +
      '<div class="item-qty" id="qty_wrap_' + item.id + '" style="display:none;">' +
        '<button type="button" class="qty-btn" onclick="changeQty(' + item.id + ', -1)">−</button>' +
        '<input type="number" class="qty-value" id="qty_' + item.id + '" value="1" min="1" max="99">' +
        '<button type="button" class="qty-btn" onclick="changeQty(' + item.id + ', 1)">+</button>' +
      '</div>';

    var checkbox = row.querySelector('.item-check');
    checkbox.addEventListener('change', function () {
      document.getElementById('qty_wrap_' + item.id).style.display = this.checked ? 'flex' : 'none';
    });

    list.appendChild(row);
  });
}

function changeQty(id, delta) {
  var input = document.getElementById('qty_' + id);
  var val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 99) val = 99;
  input.value = val;
}

// ── 폼 제출 ────────────────────────────────────────────
document.getElementById('souvenirForm').addEventListener('submit', function (e) {
  e.preventDefault();
  clearAlert();

  var name = document.getElementById('name').value.trim();
  var purpose = document.getElementById('purpose').value.trim();
  var requestDate = document.getElementById('requestDate').value;
  var useDate = document.getElementById('useDate').value;

  if (!name) return showAlert('성명을 입력해주세요.', 'error');
  if (!selectedDept) return showAlert('소속을 선택해주세요.', 'error');

  var selectedItems = [];
  document.querySelectorAll('.item-check:checked').forEach(function (cb) {
    var id = cb.dataset.id;
    selectedItems.push({
      name: cb.dataset.name,
      qty: parseInt(document.getElementById('qty_' + id).value) || 1
    });
  });

  if (selectedItems.length === 0) return showAlert('신청 물품을 1개 이상 선택해주세요.', 'error');
  if (!purpose) return showAlert('사용처 및 목적을 입력해주세요.', 'error');
  if (!requestDate) return showAlert('신청일을 선택해주세요.', 'error');
  if (!useDate) return showAlert('사용일을 선택해주세요.', 'error');

  var submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '제출 중...';

  fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'submit',
      name: name,
      department: selectedDept,
      items: selectedItems,
      purpose: purpose,
      requestDate: requestDate,
      useDate: useDate
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
    .catch(function () {
      showAlert('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    })
    .finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '신청 제출';
    });
});

function resetForm() {
  document.getElementById('souvenirForm').reset();
  document.getElementById('formWrap').style.display = 'block';
  document.getElementById('successScreen').style.display = 'none';
  selectedDept = '';
  document.querySelectorAll('.dept-btn').forEach(function (b) { b.classList.remove('selected'); });
  document.querySelectorAll('.item-qty').forEach(function (el) { el.style.display = 'none'; });
  setTodayDates();
  clearAlert();
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

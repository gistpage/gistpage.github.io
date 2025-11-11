function ensureExtra() {
  if (!currentJson || typeof currentJson.extra !== 'object' || currentJson.extra === null) {
    currentJson.extra = {};
  }
}

function loadExtraConfig() {
  ensureExtra();
  renderExtraList();
  updateExtraPreview();
}

function renderExtraList() {
  ensureExtra();
  const list = document.getElementById('extraList');
  if (!list) return;
  list.innerHTML = '';
  const keys = Object.keys(currentJson.extra || {});
  if (keys.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'url-validation info';
    empty.textContent = 'ℹ️ 暂无字段，点击下方“添加字段”。';
    list.appendChild(empty);
    return;
  }
  keys.forEach(key => {
    list.appendChild(createExtraRow(key));
  });
}

function createExtraRow(key) {
  const row = document.createElement('div');
  row.className = 'kv-row';
  const keyInput = document.createElement('input');
  keyInput.className = 'kv-key';
  keyInput.placeholder = '键';
  keyInput.value = key;
  keyInput.dataset.key = key;
  keyInput.oninput = function () {
    onExtraKeyChange(this.dataset.key, this.value.trim());
  };
  const valueInput = document.createElement('input');
  valueInput.className = 'kv-value';
  valueInput.placeholder = '值';
  const val = currentJson.extra[key];
  valueInput.value = (typeof val === 'string') ? val : JSON.stringify(val);
  valueInput.dataset.key = key;
  valueInput.oninput = function () {
    onExtraValueChange(this.dataset.key, this.value);
  };
  const rmBtn = document.createElement('button');
  rmBtn.className = 'remove-extra-btn';
  rmBtn.textContent = '🗑️';
  rmBtn.title = '移除';
  rmBtn.dataset.key = key;
  rmBtn.onclick = function () {
    removeExtraField(this.dataset.key);
  };
  row.appendChild(keyInput);
  row.appendChild(valueInput);
  row.appendChild(rmBtn);
  return row;
}

function addExtraField() {
  ensureExtra();
  let base = 'field';
  let i = 1;
  while (currentJson.extra.hasOwnProperty(base + '_' + i)) i++;
  const k = base + '_' + i;
  currentJson.extra[k] = '';
  const list = document.getElementById('extraList');
  if (list) {
    // 若列表是空状态提示，先清空
    if (list.children.length === 1 && list.children[0].classList.contains('url-validation')) {
      list.innerHTML = '';
    }
    const row = createExtraRow(k);
    list.appendChild(row);
    const ki = row.querySelector('.kv-key');
    if (ki) setTimeout(() => ki.focus(), 50);
  }
  updateExtraPreview();
  if (typeof resetVersionValidation === 'function') resetVersionValidation();
}

function removeExtraField(key) {
  ensureExtra();
  requestConfirmDelete(key).then(ok => {
    if (!ok) return;
    delete currentJson.extra[key];
    const list = document.getElementById('extraList');
    if (list) {
      const rows = Array.from(list.querySelectorAll('.kv-row'));
      const row = rows.find(r => {
        const ki = r.querySelector('.kv-key');
        return ki && ki.dataset.key === key;
      });
      if (row) list.removeChild(row);
      if (!Object.keys(currentJson.extra).length) {
        const empty = document.createElement('div');
        empty.className = 'url-validation info';
        empty.textContent = 'ℹ️ 暂无字段，点击下方“添加字段”。';
        list.appendChild(empty);
      }
    }
    updateExtraPreview();
    if (typeof resetVersionValidation === 'function') resetVersionValidation();
  });
}

// 统一风格删除确认弹窗逻辑
let confirmDeleteResolver = null;
function requestConfirmDelete(key) {
  return new Promise(resolve => {
    confirmDeleteResolver = resolve;
    const overlay = document.getElementById('confirmModal');
    const keyPreview = document.getElementById('confirmDeleteKey');
    if (overlay) overlay.style.display = 'flex';
    if (keyPreview) {
      keyPreview.textContent = key;
      // 将焦点置于“删除”按钮，便于键盘确认
      setTimeout(() => {
        const delBtn = overlay.querySelector('.btn-danger');
        if (delBtn) delBtn.focus();
      }, 50);
    }
  });
}

function confirmDeleteModalCancel() {
  const overlay = document.getElementById('confirmModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = confirmDeleteResolver; confirmDeleteResolver = null;
  if (resolve) resolve(false);
}

function confirmDeleteModalOk() {
  const overlay = document.getElementById('confirmModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = confirmDeleteResolver; confirmDeleteResolver = null;
  if (resolve) resolve(true);
}

function onExtraKeyChange(oldKey, newKey) {
  ensureExtra();
  const list = document.getElementById('extraList');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.kv-row'));
  const targetRow = rows.find(r => {
    const ki = r.querySelector('.kv-key');
    return ki && ki.dataset.key === oldKey;
  });
  const keyInput = targetRow ? targetRow.querySelector('.kv-key') : null;
  const valueInput = targetRow ? targetRow.querySelector('.kv-value') : null;
  // 校验
  if (!newKey || newKey === oldKey) {
    // 空或未变化：还原显示即可
    if (keyInput) keyInput.value = oldKey;
    return;
  }
  if (currentJson.extra.hasOwnProperty(newKey)) {
    showTopNotification('⚠️ 重复的键名：已存在 ' + newKey, 'warning');
    // 恢复旧值并聚焦
    if (keyInput) {
      keyInput.value = oldKey;
      keyInput.focus();
    }
    return;
  }
  // 仅更新当前条目映射与该行的 dataset，不影响其它行
  const val = currentJson.extra[oldKey];
  delete currentJson.extra[oldKey];
  currentJson.extra[newKey] = val;
  if (keyInput) keyInput.dataset.key = newKey;
  if (valueInput) valueInput.dataset.key = newKey;
  updateExtraPreview();
  if (typeof resetVersionValidation === 'function') resetVersionValidation();
}

function tryParseValue(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

function onExtraValueChange(key, text) {
  ensureExtra();
  currentJson.extra[key] = tryParseValue(text);
  updateExtraPreview();
  if (typeof resetVersionValidation === 'function') resetVersionValidation();
}

function updateExtraPreview() {
  const el = document.getElementById('previewExtraText');
  if (!el) return;
  const count = currentJson && currentJson.extra && typeof currentJson.extra === 'object' ? Object.keys(currentJson.extra).length : 0;
  el.textContent = count ? (count + ' 项') : '无';
  el.style.color = count ? '#0ea5e9' : '#6b7280';
}

async function generateAndCopyExtraJson() {
  try {
    ensureExtra();
    const jsonStr = JSON.stringify(currentJson.extra || {}, null, 2);
    const preview = document.getElementById('extraExportPreview');
    const v = document.getElementById('extraExportValidation');
    if (preview) preview.textContent = jsonStr;
    let copied = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(jsonStr);
      copied = true;
    } else {
      // 兼容旧浏览器的复制逻辑
      const temp = document.createElement('textarea');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      temp.value = jsonStr;
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
      document.body.removeChild(temp);
    }
    if (v) {
      v.className = copied ? 'url-validation valid' : 'url-validation info';
      v.innerHTML = copied ? '✅ 已复制到剪贴板' : '⚠️ 已生成，请手动复制预览内容';
      v.style.display = 'block';
    }
    if (typeof showTopNotification === 'function' && copied) {
      showTopNotification('📄 扩展字段JSON已复制', 'success');
    }
  } catch (e) {
    const v = document.getElementById('extraExportValidation');
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 生成失败：' + e.message;
      v.style.display = 'block';
    }
  }
}
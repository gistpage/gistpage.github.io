function normalizeCountryCodes(rawCodes) {
  const seen = new Set();
  const valid = [];
  const invalid = [];
  (rawCodes || []).forEach(c => {
    const code = (c || '').trim().toUpperCase();
    if (!code) return;
    if (/^[A-Z]{2}$/.test(code)) {
      if (!seen.has(code)) {
        seen.add(code);
        valid.push(code);
      }
    } else {
      invalid.push(code);
    }
  });
  return { valid, invalid };
}

function loadAccessConfig() {
  if (!currentJson) return;
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  currentJson.allowCountries = allowed;
  const input = document.getElementById('allowedCountriesInput');
  if (input) input.value = allowed.join(', ');
  const v = document.getElementById('accessValidation');
  if (v) v.style.display = 'none';
  updateAccessPreview();
}

function updateAccessPreview() {
  const el = document.getElementById('previewAccessText');
  if (!el) return;
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  if (!allowed.length) {
    el.textContent = '不限制';
    el.style.color = '#6b7280';
  } else {
    el.textContent = '只允许：' + allowed.join(', ');
    el.style.color = '#0ea5e9';
  }
}

function updateAllowedCountries() {
  const input = document.getElementById('allowedCountriesInput');
  if (!input) return;
  const raw = input.value.split(/[\s,]+/);
  const { valid, invalid } = normalizeCountryCodes(raw);
  currentJson.allowCountries = valid;
  const v = document.getElementById('accessValidation');
  if (invalid.length) {
    v.className = 'url-validation invalid';
    v.innerHTML = '⚠️ 无效国家代码：' + invalid.join(', ');
    v.style.display = 'block';
  } else {
    v.className = 'url-validation valid';
    v.innerHTML = valid.length ? ('✅ 已配置国家：' + valid.join(', ')) : 'ℹ️ 未限制';
    v.style.display = 'block';
  }
  updateAccessPreview();
  if (typeof resetVersionValidation === 'function') {
    resetVersionValidation();
  }
}

function addCountryCode(code) {
  const input = document.getElementById('allowedCountriesInput');
  const existing = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  const next = normalizeCountryCodes([...(input && input.value ? input.value.split(/[\s,]+/) : []), code]).valid;
  currentJson.allowCountries = next;
  if (input) input.value = next.join(', ');
  const v = document.getElementById('accessValidation');
  v.className = 'url-validation valid';
  v.innerHTML = '✅ 已添加 ' + code.toUpperCase();
  v.style.display = 'block';
  updateAccessPreview();
  if (typeof resetVersionValidation === 'function') {
    resetVersionValidation();
  }
}

function clearAllowedCountries() {
  currentJson.allowCountries = [];
  const input = document.getElementById('allowedCountriesInput');
  if (input) input.value = '';
  const v = document.getElementById('accessValidation');
  v.className = 'url-validation info';
  v.innerHTML = '🔄 已清空访问限制';
  v.style.display = 'block';
  updateAccessPreview();
  if (typeof resetVersionValidation === 'function') {
    resetVersionValidation();
  }
}
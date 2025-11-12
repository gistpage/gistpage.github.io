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
  const cSwitch = document.getElementById('countryCheckEnabled');
  const tSwitch = document.getElementById('timezoneCheckEnabled');
  const iSwitch = document.getElementById('ipCheckEnabled');
  if (cSwitch) cSwitch.checked = !!currentJson.isCountryCheckEnabled;
  if (tSwitch) tSwitch.checked = !!currentJson.isTimezoneCheckEnabled;
  if (iSwitch) iSwitch.checked = !!currentJson.isIpAttributionCheckEnabled;
  updateCountryCheckStatus();
  updateTimezoneCheckStatus();
  updateIpCheckStatus();
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
    const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
    const needAnyCheck = valid.length > 0 && !anyEnabled;
    if (needAnyCheck) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 已填写允许国家，需至少启用一个判断项';
      v.style.display = 'block';
    } else {
      v.className = 'url-validation valid';
      v.innerHTML = valid.length ? ('✅ 已配置国家：' + valid.join(', ')) : 'ℹ️ 未限制';
      v.style.display = 'block';
    }
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
  const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
  const needAnyCheck = next.length > 0 && !anyEnabled;
  if (needAnyCheck) {
    v.className = 'url-validation invalid';
    v.innerHTML = '❌ 已填写允许国家，需至少启用一个判断项';
    v.style.display = 'block';
  } else {
    v.className = 'url-validation valid';
    v.innerHTML = '✅ 已添加 ' + code.toUpperCase();
    v.style.display = 'block';
  }
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

function updateCountryCheckStatus() {
  const status = document.getElementById('countryCheckStatus');
  const enabled = !!currentJson.isCountryCheckEnabled;
  if (!status) return;
  status.textContent = enabled ? '已启用' : '未启用';
  status.className = 'switch-status ' + (enabled ? 'enabled' : 'disabled');
}

function updateTimezoneCheckStatus() {
  const status = document.getElementById('timezoneCheckStatus');
  const enabled = !!currentJson.isTimezoneCheckEnabled;
  if (!status) return;
  status.textContent = enabled ? '已启用' : '未启用';
  status.className = 'switch-status ' + (enabled ? 'enabled' : 'disabled');
}

function updateIpCheckStatus() {
  const status = document.getElementById('ipCheckStatus');
  const enabled = !!currentJson.isIpAttributionCheckEnabled;
  if (!status) return;
  status.textContent = enabled ? '已启用' : '未启用';
  status.className = 'switch-status ' + (enabled ? 'enabled' : 'disabled');
}

function toggleCountryCheckEnabled() {
  const enabled = document.getElementById('countryCheckEnabled').checked;
  currentJson.isCountryCheckEnabled = !!enabled;
  updateCountryCheckStatus();
  const v = document.getElementById('accessValidation');
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
  const needAnyCheck = allowed.length > 0 && !anyEnabled;
  if (needAnyCheck) {
    v.className = 'url-validation invalid';
    v.innerHTML = '❌ 已填写允许国家，需至少启用一个判断项';
    v.style.display = 'block';
  } else if (v) {
    v.style.display = 'none';
  }
}

function toggleTimezoneCheckEnabled() {
  const enabled = document.getElementById('timezoneCheckEnabled').checked;
  currentJson.isTimezoneCheckEnabled = !!enabled;
  updateTimezoneCheckStatus();
  const v = document.getElementById('accessValidation');
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
  const needAnyCheck = allowed.length > 0 && !anyEnabled;
  if (needAnyCheck) {
    v.className = 'url-validation invalid';
    v.innerHTML = '❌ 已填写允许国家，需至少启用一个判断项';
    v.style.display = 'block';
  } else if (v) {
    v.style.display = 'none';
  }
}

function toggleIpCheckEnabled() {
  const enabled = document.getElementById('ipCheckEnabled').checked;
  currentJson.isIpAttributionCheckEnabled = !!enabled;
  updateIpCheckStatus();
  const v = document.getElementById('accessValidation');
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
  const needAnyCheck = allowed.length > 0 && !anyEnabled;
  if (needAnyCheck) {
    v.className = 'url-validation invalid';
    v.innerHTML = '❌ 已填写允许国家，需至少启用一个判断项';
    v.style.display = 'block';
  } else if (v) {
    v.style.display = 'none';
  }
}
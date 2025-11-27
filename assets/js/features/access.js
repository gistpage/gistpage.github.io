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
  const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
  if (v && anyEnabled && allowed.length === 0) {
    v.className = 'url-validation invalid';
    v.innerHTML = '❌ 已启用判断项，需先填写允许国家';
    v.style.display = 'block';
  }
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
    const needCountries = anyEnabled && valid.length === 0;
    if (needCountries) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 已启用判断项，需先填写允许国家';
      v.style.display = 'block';
    } else if (needAnyCheck) {
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
  
  // 自动关闭三个判断开关
  const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
  if (anyEnabled) {
    // 关闭国家码判断
    currentJson.isCountryCheckEnabled = false;
    const countrySwitch = document.getElementById('countryCheckEnabled');
    if (countrySwitch) countrySwitch.checked = false;
    updateCountryCheckStatus();
    
    // 关闭时区判断
    currentJson.isTimezoneCheckEnabled = false;
    const timezoneSwitch = document.getElementById('timezoneCheckEnabled');
    if (timezoneSwitch) timezoneSwitch.checked = false;
    updateTimezoneCheckStatus();
    
    // 关闭IP归属判断
    currentJson.isIpAttributionCheckEnabled = false;
    const ipSwitch = document.getElementById('ipCheckEnabled');
    if (ipSwitch) ipSwitch.checked = false;
    updateIpCheckStatus();
  }
  
  const v = document.getElementById('accessValidation');
  v.className = 'url-validation info';
  v.innerHTML = '🔄 已清空访问限制';
  v.style.display = 'block';
  
  updateAccessPreview();
  
  // 更新配置预览（包括三个判断开关的状态）
  if (typeof updateConfigPreview === 'function') {
    updateConfigPreview();
  }
  
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
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  if (enabled && allowed.length === 0) {
    const v = document.getElementById('accessValidation');
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 启用判断前需先填写允许国家';
      v.style.display = 'block';
    }
    document.getElementById('countryCheckEnabled').checked = false;
    currentJson.isCountryCheckEnabled = false;
    updateCountryCheckStatus();
    return;
  }
  currentJson.isCountryCheckEnabled = !!enabled;
  updateCountryCheckStatus();
  const v = document.getElementById('accessValidation');
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
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  if (enabled && allowed.length === 0) {
    const v = document.getElementById('accessValidation');
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 启用判断前需先填写允许国家';
      v.style.display = 'block';
    }
    document.getElementById('timezoneCheckEnabled').checked = false;
    currentJson.isTimezoneCheckEnabled = false;
    updateTimezoneCheckStatus();
    return;
  }
  currentJson.isTimezoneCheckEnabled = !!enabled;
  updateTimezoneCheckStatus();
  const v = document.getElementById('accessValidation');
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
  const allowed = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  if (enabled && allowed.length === 0) {
    const v = document.getElementById('accessValidation');
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 启用判断前需先填写允许国家';
      v.style.display = 'block';
    }
    document.getElementById('ipCheckEnabled').checked = false;
    currentJson.isIpAttributionCheckEnabled = false;
    updateIpCheckStatus();
    return;
  }
  currentJson.isIpAttributionCheckEnabled = !!enabled;
  updateIpCheckStatus();
  const v = document.getElementById('accessValidation');
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
// 配置读取、更新与预览（拆分自 app.js）

function loadRedirectConfig() {
  if (!currentJson) return;
  const version = currentJson.version || '1';
  const isEnabled = currentJson.isRedirectEnabled || false;
  let redirectUrl = currentJson.redirectUrl;
  if (!redirectUrl || redirectUrl === null) {
    redirectUrl = 'https://example.com';
    currentJson.redirectUrl = redirectUrl;
  }
  document.getElementById('versionInput').value = parseInt(version);
  document.getElementById('redirectEnabled').checked = isEnabled;
  document.getElementById('redirectUrlInput').value = redirectUrl;
  const urlConfigField = document.getElementById('urlConfigField');
  urlConfigField.style.display = isEnabled ? 'block' : 'none';
  const versionValidation = document.getElementById('versionValidation');
  const urlValidation = document.getElementById('urlValidation');
  versionValidation.style.display = 'none';
  urlValidation.style.display = 'none';
  updateRedirectStatus();
  updateConfigPreview();
  if (isEnabled) {
    validateUrl();
  }
}

function updateRedirectEnabled() {
  const isEnabled = document.getElementById('redirectEnabled').checked;
  currentJson.isRedirectEnabled = isEnabled;
  const urlConfigField = document.getElementById('urlConfigField');
  if (isEnabled) {
    urlConfigField.style.display = 'block';
  } else {
    urlConfigField.style.display = 'none';
    if (!currentJson.redirectUrl || currentJson.redirectUrl.trim() === '') {
      currentJson.redirectUrl = 'https://example.com';
      document.getElementById('redirectUrlInput').value = currentJson.redirectUrl;
    }
  }
  updateRedirectStatus();
  updateConfigPreview();
  resetVersionValidation();
}

function resetVersionValidation() {
  const validation = document.getElementById('versionValidation');
  validation.className = 'url-validation info';
  validation.innerHTML = '🤖 自动管理';
  validation.style.display = 'block';
}

function updateRedirectUrl() {
  let url = document.getElementById('redirectUrlInput').value.trim();
  const validation = document.getElementById('urlValidation');
  if (!url) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ 目标跳转地址不能为空，请输入有效的网址';
    validation.style.display = 'block';
    return;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && !url.startsWith('/') && !url.includes(' ')) {
      url = 'https://' + url;
      document.getElementById('redirectUrlInput').value = url;
    }
  }
  currentJson.redirectUrl = url;
  updateConfigPreview();
  resetVersionValidation();
  validation.style.display = 'none';
}

function setQuickUrl(url) {
  document.getElementById('redirectUrlInput').value = url;
  currentJson.redirectUrl = url;
  updateConfigPreview();
  validateUrl();
  resetVersionValidation();
}

function clearUrl() {
  const defaultUrl = 'https://example.com';
  document.getElementById('redirectUrlInput').value = defaultUrl;
  currentJson.redirectUrl = defaultUrl;
  updateConfigPreview();
  resetVersionValidation();
  validateUrl();
  const validation = document.getElementById('urlValidation');
  validation.className = 'url-validation info';
  validation.innerHTML = '🔄 已重置为默认地址';
  validation.style.display = 'block';
}

function updateRedirectStatus() {
  const isEnabled = document.getElementById('redirectEnabled').checked;
  const statusElement = document.getElementById('redirectStatus');
  if (isEnabled) {
    statusElement.textContent = '已启用';
    statusElement.className = 'switch-status enabled';
  } else {
    statusElement.textContent = '已禁用';
    statusElement.className = 'switch-status disabled';
  }
}

function updateConfigPreview() {
  const version = currentJson.version || '1';
  const isEnabled = currentJson.isRedirectEnabled;
  const redirectUrl = currentJson.redirectUrl || 'https://example.com';
  document.getElementById('previewVersionText').textContent = `第 ${version} 版`;
  document.getElementById('previewVersionText').style.color = '#9333ea';
  const enabledText = isEnabled ? '已开启' : '已关闭';
  document.getElementById('previewEnabledText').textContent = enabledText;
  document.getElementById('previewEnabledText').style.color = isEnabled ? '#10b981' : '#ef4444';
  if (isEnabled) {
    document.getElementById('previewUrlText').textContent = redirectUrl;
    document.getElementById('previewUrlText').style.color = '#1d4ed8';
  } else {
    document.getElementById('previewUrlText').textContent = '已隐藏（重定向关闭时不显示）';
    document.getElementById('previewUrlText').style.color = '#6b7280';
  }
}
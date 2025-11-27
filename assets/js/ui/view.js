// 页面切换与折叠（拆分自 app.js）

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function toggleConfigMechanism() {
  const content = document.getElementById('mechanismContent');
  const toggle = document.getElementById('mechanismToggle');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggle.textContent = '▲';
    toggle.classList.add('expanded');
  } else {
    content.style.display = 'none';
    toggle.textContent = '▼';
    toggle.classList.remove('expanded');
  }
}

function toggleVersionMechanism() {
  const content = document.getElementById('versionContent');
  const toggle = document.getElementById('versionToggle');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggle.textContent = '▲';
    toggle.classList.add('expanded');
  } else {
    content.style.display = 'none';
    toggle.textContent = '▼';
    toggle.classList.remove('expanded');
  }
}

function backToLogin() {
  currentJson = null;
  currentGistId = null;
  currentToken = null;
  currentFileName = null;
  currentFileInfo = null;
  try {
    sessionStorage.removeItem('gist_session_id');
    sessionStorage.removeItem('gist_session_token');
  } catch (e) {}
  // 清除加密状态与口令（不写入任何远端配置，仅本地内存）
  try {
    if (typeof updateEncryptionStatus === 'function') {
      encryptionEnabled = false;
      encryptionPassphrase = '';
      const encSwitch = document.getElementById('encryptionEnabled');
      const passInput = document.getElementById('encryptionPassphrase');
      const methodField = document.getElementById('encryptionMethodField');
      const passField = document.getElementById('encryptionPassphraseField');
      if (encSwitch) encSwitch.checked = false;
      if (passInput) passInput.value = '';
      if (methodField) methodField.style.display = 'none';
      if (passField) passField.style.display = 'none';
      updateEncryptionStatus();
    }
  } catch (e) {}
  document.getElementById('currentAppId').textContent = '-';
  document.getElementById('currentFileName').textContent = '-';
  showPage('loginPage');
  showLoginMsg('请输入应用凭据以访问配置管理控制台', 'info');
}
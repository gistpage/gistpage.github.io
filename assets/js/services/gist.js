// GitHub Gist 服务（拆分自 app.js）

async function connectToGist() {
  const gistInput = document.getElementById('gistId').value.trim();
  const token = document.getElementById('token').value.trim();
  const gistId = parseGistId(gistInput);
  if (!gistId) return showLoginMsg('请输入有效的应用标识符', 'error');
  if (!token) return showLoginMsg('请输入访问令牌以获得管理权限', 'warning');
  document.getElementById('connectBtn').disabled = true;
  showLoginMsg('正在验证身份并连接到APP应用...', 'info');
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'App-Config-Manager/1.0',
      'Authorization': `Bearer ${token}`
    };
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'GET',
      headers: headers,
      mode: 'cors'
    });
    if (!res.ok) {
      if (res.status === 404) {
        showLoginMsg('应用资源不存在或您无权访问', 'error');
      } else if (res.status === 403) {
        showLoginMsg('访问权限不足，请检查您的访问令牌权限', 'error');
      } else if (res.status === 401) {
        showLoginMsg('身份验证失败，请检查访问令牌是否正确', 'error');
      } else {
        showLoginMsg(`APP应用连接失败：${res.status} ${res.statusText}`, 'error');
      }
      return;
    }
    const data = await res.json();
    let found = false;
    let fileName = null;
    let fileInfo = null;
    let jsonText = null;
    let parsedJson = null;
    for (const [k, v] of Object.entries(data.files)) {
      try {
        let content = v.content;
        if (!content) {
          const rawRes = await fetch(v.raw_url, { method: 'GET', headers: headers, mode: 'cors' });
          if (!rawRes.ok) continue;
          content = await rawRes.text();
        }
        let simpleCleanJson = content
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\uFEFF/, '')
          .trim();
        try {
          parsedJson = JSON.parse(simpleCleanJson);
          fileName = k;
          fileInfo = v;
          jsonText = content;
          found = true;
          break;
        } catch (simpleError) {
          const cleanJsonText = removeJsonComments(content);
          try {
            parsedJson = JSON.parse(cleanJsonText);
            fileName = k;
            fileInfo = v;
            jsonText = content;
            found = true;
            break;
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        continue;
      }
    }
    if (!found) {
      showLoginMsg('未找到有效的配置文件，请确保至少有一个文件内容为合法JSON', 'error');
      return;
    }
    showLoginMsg('正在加载应用配置数据...', 'info');
    try {
      let simpleCleanJson = jsonText
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\uFEFF/, '')
        .trim();
      try {
        currentJson = JSON.parse(simpleCleanJson);
      } catch (simpleError) {
        const cleanJsonText = removeJsonComments(jsonText);
        currentJson = JSON.parse(cleanJsonText);
      }
    } catch (e) {
      showLoginMsg('配置数据格式错误：' + e.message, 'error');
      return;
    }
    if (currentJson && currentJson.__encrypted__ === true) {
      let attempts = 0;
      let decrypted = false;
      while (attempts < 3 && !decrypted) {
        let pass = (typeof getEncryptionPassphrase === 'function') ? getEncryptionPassphrase() : '';
        if (!pass && typeof requestPassphrase === 'function') {
          pass = await requestPassphrase();
        }
        if (!pass) {
          showLoginMsg('配置使用加密保存，请提供解密口令后重试连接', 'warning');
          return;
        }
        try {
          const plain = await decryptJson(currentJson, pass);
          encryptionPassphrase = pass;
          encryptionEnabled = true;
          currentJson = plain;
          decrypted = true;
        } catch (e) {
          attempts++;
          if (typeof showPassphraseError === 'function') {
            showPassphraseError('❌ 解密失败：口令不正确或配置已被篡改/损坏。\n建议：请重新输入口令；确认 Gist 内容未被手动修改；如仍失败可稍后重试。');
          }
          if (attempts >= 3) {
            showLoginMsg('解密失败：多次尝试未成功。请检查口令或配置内容后重试。', 'error');
            return;
          }
          // 再次等待用户在同一弹窗中输入（保留错误提示）
          if (typeof requestPassphrase === 'function') {
            pass = await requestPassphrase(true);
            // 下一轮循环将使用新的 pass 再次尝试解密
            encryptionPassphrase = ''; // 避免 getEncryptionPassphrase 误返回旧值
          }
          continue;
        }
      }
    }
    currentGistId = gistId;
    currentToken = token;
    currentFileName = fileName;
    currentFileInfo = fileInfo;
    if (!currentJson.hasOwnProperty('version')) {
      currentJson.version = '1';
    }
    if (!currentJson.hasOwnProperty('isRedirectEnabled')) {
      currentJson.isRedirectEnabled = false;
    }
    if (!currentJson.hasOwnProperty('redirectUrl') || !currentJson.redirectUrl) {
      currentJson.redirectUrl = 'https://example.com';
    }
    if (!Array.isArray(currentJson.allowCountries)) {
      if (!currentJson.hasOwnProperty('allowCountries')) {
        currentJson.allowCountries = [];
      } else {
        currentJson.allowCountries = [];
      }
    }
    if (!currentJson.hasOwnProperty('isCountryCheckEnabled')) {
      currentJson.isCountryCheckEnabled = false;
    }
    if (!currentJson.hasOwnProperty('isTimezoneCheckEnabled')) {
      currentJson.isTimezoneCheckEnabled = false;
    }
    if (!currentJson.hasOwnProperty('isIpAttributionCheckEnabled')) {
      currentJson.isIpAttributionCheckEnabled = false;
    }
    if (!currentJson.hasOwnProperty('extra') || typeof currentJson.extra !== 'object' || currentJson.extra === null) {
      currentJson.extra = {};
    }
    loadRedirectConfig();
    if (typeof loadEncryptionConfig === 'function') {
      loadEncryptionConfig();
    }
    if (typeof loadAccessConfig === 'function') {
      loadAccessConfig();
    }
    if (typeof loadExtraConfig === 'function') {
      loadExtraConfig();
    }
    originalConfig = JSON.parse(JSON.stringify(currentJson));
    // 完整显示 APP ID
    document.getElementById('currentAppId').textContent = gistId;
    // 显示文件名
    document.getElementById('currentFileName').textContent = fileName || '-';
    showPage('editPage');
    showTopNotification('🎉 APP应用连接成功，配置数据已加载！', 'success');
    // 会话持久化：在当前浏览器会话中记住凭据，刷新后自动恢复
    try {
      sessionStorage.setItem('gist_session_id', gistId);
      sessionStorage.setItem('gist_session_token', token);
    } catch (e) {
      console.warn('会话存储失败：', e);
    }
  } catch (e) {
    console.error('连接APP应用时发生错误:', e);
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      showLoginMsg('网络连接失败，请检查网络连接和应用标识符', 'error');
    } else if (e.message.includes('CORS')) {
      showLoginMsg('网络请求被阻止，请稍后再试', 'error');
    } else {
      showLoginMsg(`APP应用连接异常：${e.message}`, 'error');
    }
  } finally {
    document.getElementById('connectBtn').disabled = false;
  }
}

// 注册：使用令牌创建一个新的 Secret Gist 并写入初始化配置
async function registerNewGist() {
  const token = await ensureTokenForAction('register');
  if (!token) return;
  const configName = await ensureConfigNameForRegistration();
  if (!configName) return;
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) registerBtn.disabled = true;
  showLoginMsg('正在创建新APP应用...', 'info');
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'App-Config-Manager/1.0',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const initialJson = {
      version: '1',
      isRedirectEnabled: false,
      redirectUrl: 'https://example.com',
      allowCountries: [],
      isCountryCheckEnabled: false,
      isTimezoneCheckEnabled: false,
      isIpAttributionCheckEnabled: false,
      extra: {}
    };
    const requestBody = {
      description: configName || 'App Config (created by App-Config-Manager)',
      public: false,
      files: {
        'app_config.json': {
          content: JSON.stringify(initialJson, null, 2)
        }
      }
    };
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      mode: 'cors',
      body: JSON.stringify(requestBody)
    });
    if (!res.ok) {
      if (res.status === 401) {
        showLoginMsg('身份验证失败，访问令牌可能无效或已过期', 'error');
      } else if (res.status === 403) {
        showLoginMsg('没有创建权限，请检查访问令牌的gist写入权限', 'error');
      } else {
        showLoginMsg(`创建失败：${res.status} ${res.statusText}`, 'error');
      }
      return;
    }
    const data = await res.json();
    const newGistId = data.id;
    showTopNotification('🎉 已创建新APP应用', 'success');
    showRegisterSuccessModal(newGistId, token, configName);
  } catch (e) {
    console.error('创建新APP应用时发生错误:', e);
    showLoginMsg(`创建失败：${e.message}`, 'error');
  } finally {
    if (registerBtn) registerBtn.disabled = false;
  }
}

function showRegisterSuccessModal(gistId, token, configName) {
  const overlay = document.getElementById('registerSuccessModal');
  const idEl = document.getElementById('registeredGistIdModal');
  const tokenEl = document.getElementById('registeredTokenModal');
  const nameEl = document.getElementById('registeredConfigNameModal');
  if (idEl) idEl.textContent = gistId;
  if (tokenEl) tokenEl.textContent = token.replace(/(.{4}).*(.{4})/, '$1…$2');
  if (nameEl && configName) nameEl.textContent = configName;
  if (overlay) {
    overlay.style.display = 'flex';
    // 将焦点置于一键填入按钮
    setTimeout(() => {
      const primary = overlay.querySelector('.btn-primary');
      if (primary) primary.focus();
    }, 50);
  }
}

function registerSuccessModalClose() {
  const overlay = document.getElementById('registerSuccessModal');
  if (overlay) overlay.style.display = 'none';
}

function fillRegisteredInfoFromModal() {
  const idText = document.getElementById('registeredGistIdModal')?.textContent || '';
  const gistInput = document.getElementById('gistId');
  if (gistInput) gistInput.value = idText;
  showLoginMsg('✅ 已填入 APP ID。请确认访问令牌后点击连接。', 'success');
  registerSuccessModalClose();
}

async function copyRegisteredInfoFromModal() {
  const idText = document.getElementById('registeredGistIdModal')?.textContent || '';
  const tokenInputValue = document.getElementById('token')?.value || '';
  const text = `APP ID: ${idText}\nToken: ${tokenInputValue || '(已脱敏显示，请在输入框中使用原令牌)'}`;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showTopNotification('📋 已复制 APP ID 与访问令牌', 'success');
    } else {
      const temp = document.createElement('textarea');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      temp.value = text;
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showTopNotification('📋 已复制 APP ID 与访问令牌', 'success');
    }
  } catch (e) {
    showLoginMsg('复制失败：' + e.message, 'error');
  }
}

// ------------------ 我的 Gists 列表 ------------------
let gistListItems = [];
let gistListPage = 1;
let gistListHasMore = false;

function openGistListModal() {
  ensureTokenForAction('list').then(token => {
    if (!token) return;
    const overlay = document.getElementById('gistListModal');
    const v = document.getElementById('gistListValidation');
    const container = document.getElementById('gistListContainer');
    gistListItems = []; gistListPage = 1; gistListHasMore = false;
    if (overlay) overlay.style.display = 'flex';
    if (v) { v.style.display = 'none'; }
    if (container) container.innerHTML = '';
    fetchUserGists(1);
  });
}

function closeGistListModal() {
  const overlay = document.getElementById('gistListModal');
  if (overlay) overlay.style.display = 'none';
}

async function fetchUserGists(page = 1) {
  const token = document.getElementById('token').value.trim();
  const v = document.getElementById('gistListValidation');
  if (!token) {
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 请输入访问令牌以查看您的 Gists';
      v.style.display = 'block';
    }
    return;
  }
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'App-Config-Manager/1.0'
    };
    const perPage = 30;
    const res = await fetch(`https://api.github.com/gists?per_page=${perPage}&page=${page}`, { headers, mode: 'cors' });
    if (!res.ok) {
      if (v) {
        v.className = 'url-validation invalid';
        v.innerHTML = `❌ 加载失败：${res.status} ${res.statusText}`;
        v.style.display = 'block';
      }
      return;
    }
    const link = res.headers.get('Link') || '';
    gistListHasMore = /rel="next"/.test(link);
    const data = await res.json();
    gistListItems = gistListItems.concat(data || []);
    gistListPage = page;
    renderGistList();
  } catch (e) {
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 加载失败：' + e.message;
      v.style.display = 'block';
    }
  }
}

// ------------------ Token 弹窗逻辑与校验 ------------------
let tokenModalResolver = null;
async function ensureTokenForAction(action) {
  let token = document.getElementById('token').value.trim();
  if (token) return token;
  token = await requestTokenInput();
  if (!token) {
    showLoginMsg('需要访问令牌以执行该操作，请重试', 'warning');
    return null;
  }
  const tokenEl = document.getElementById('token');
  if (tokenEl) tokenEl.value = token;
  return token;
}

function requestTokenInput() {
  return new Promise(resolve => {
    tokenModalResolver = resolve;
    const overlay = document.getElementById('tokenModal');
    const input = document.getElementById('tokenModalInput');
    const v = document.getElementById('tokenModalValidation');
    if (overlay) overlay.style.display = 'flex';
    if (v) v.style.display = 'none';
    if (input) {
      const existing = document.getElementById('token')?.value || '';
      input.value = existing;
      setTimeout(() => input.focus(), 50);
      input.onkeydown = (e) => {
        if (e.key === 'Enter') confirmTokenModal();
        else if (e.key === 'Escape') cancelTokenModal();
      };
    }
  });
}

// ------------------ 配置名称弹窗逻辑 ------------------
let configNameModalResolver = null;
async function ensureConfigNameForRegistration() {
  const defaultName = 'App Config (created by App-Config-Manager)';
  // 弹窗请求用户输入名称
  const name = await requestConfigNameInput(defaultName);
  if (!name) {
    showLoginMsg('需要配置名称以创建APP应用，请重试', 'warning');
    return null;
  }
  return name;
}

function requestConfigNameInput(defaultName) {
  return new Promise(resolve => {
    configNameModalResolver = resolve;
    const overlay = document.getElementById('configNameModal');
    const input = document.getElementById('configNameModalInput');
    const v = document.getElementById('configNameModalValidation');
    if (overlay) overlay.style.display = 'flex';
    if (v) v.style.display = 'none';
    if (input) {
      input.value = defaultName;
      setTimeout(() => input.focus(), 50);
      input.onkeydown = (e) => {
        if (e.key === 'Enter') confirmConfigNameModal();
        else if (e.key === 'Escape') cancelConfigNameModal();
      };
    }
  });
}

function cancelConfigNameModal() {
  const overlay = document.getElementById('configNameModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = configNameModalResolver; configNameModalResolver = null;
  if (resolve) resolve(null);
}

function confirmConfigNameModal() {
  const input = document.getElementById('configNameModalInput');
  const v = document.getElementById('configNameModalValidation');
  const val = (input && input.value) ? input.value.trim() : '';
  if (!val) {
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 配置名称不能为空';
      v.style.display = 'block';
    }
    return;
  }
  const overlay = document.getElementById('configNameModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = configNameModalResolver; configNameModalResolver = null;
  if (resolve) resolve(val);
}

function cancelTokenModal() {
  const overlay = document.getElementById('tokenModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = tokenModalResolver; tokenModalResolver = null;
  if (resolve) resolve(null);
}

function confirmTokenModal() {
  const input = document.getElementById('tokenModalInput');
  const v = document.getElementById('tokenModalValidation');
  const val = (input && input.value) ? input.value.trim() : '';
  if (!val) {
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 令牌不能为空';
      v.style.display = 'block';
    }
    return;
  }
  const overlay = document.getElementById('tokenModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = tokenModalResolver; tokenModalResolver = null;
  if (resolve) resolve(val);
}

function renderGistList() {
  const container = document.getElementById('gistListContainer');
  if (!container) return;
  container.innerHTML = '';
  const search = (document.getElementById('gistSearchInput')?.value || '').toLowerCase();
  const items = gistListItems
    .slice()
    .sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at))
    .filter(g => {
      const id = (g.id || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      return !search || id.includes(search) || desc.includes(search);
    });
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'url-validation info';
    empty.textContent = 'ℹ️ 暂无结果，尝试更换搜索词或点击“加载更多”。';
    container.appendChild(empty);
    return;
  }
  items.forEach(g => {
    const row = document.createElement('div'); row.className = 'gist-item';
    const meta = document.createElement('div'); meta.className = 'gist-meta';
    const idEl = document.createElement('div'); idEl.className = 'gist-id'; idEl.textContent = g.id;
    const descEl = document.createElement('div'); descEl.className = 'gist-desc'; descEl.textContent = g.description || '(无描述)';
    const subEl = document.createElement('div'); subEl.className = 'gist-desc';
    const vis = g.public ? '公开' : '秘密';
    const updated = new Date(g.updated_at).toLocaleString();
    const filesCount = g.files ? Object.keys(g.files).length : 0;
    subEl.textContent = `${vis} · 更新：${updated} · 文件：${filesCount}`;
    meta.appendChild(idEl); meta.appendChild(descEl); meta.appendChild(subEl);
    const actions = document.createElement('div'); actions.className = 'gist-actions';
    const openBtn = document.createElement('button'); openBtn.className = 'admin-btn btn-secondary btn-compact'; openBtn.textContent = '🔗 详情';
    openBtn.onclick = () => {
      const owner = (g.owner && g.owner.login) ? g.owner.login : 'gist';
      const url = `https://gist.github.com/${owner}/${g.id}`;
      window.open(url, '_blank');
    };
    const fillBtn = document.createElement('button'); fillBtn.className = 'admin-btn btn-primary btn-compact'; fillBtn.textContent = '🪄 填入ID';
    fillBtn.onclick = () => {
      const gistInput = document.getElementById('gistId');
      if (gistInput) gistInput.value = g.id;
      showLoginMsg('✅ 已填入 APP ID，点击“连接到APP应用”继续。', 'success');
      closeGistListModal();
    };
    const copyBtn = document.createElement('button'); copyBtn.className = 'admin-btn btn-secondary btn-compact'; copyBtn.textContent = '📋 复制';
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(g.id);
        showTopNotification('📋 已复制 Gist ID', 'success');
      } catch (e) {
        showLoginMsg('复制失败：' + e.message, 'error');
      }
    };
    actions.appendChild(openBtn); actions.appendChild(fillBtn); actions.appendChild(copyBtn);
    row.appendChild(meta); row.appendChild(actions);
    container.appendChild(row);
  });
}

function filterGistList() { renderGistList(); }

function loadMoreGists() {
  if (gistListHasMore) {
    fetchUserGists(gistListPage + 1);
  } else {
    const v = document.getElementById('gistListValidation');
    if (v) {
      v.className = 'url-validation info';
      v.innerHTML = '📦 已无更多数据';
      v.style.display = 'block';
    }
  }
}

async function saveToGist() {
  if (!currentGistId || !currentToken || !currentFileName || !currentJson) {
    showEditMsg('缺少必要信息，请重新连接到APP应用', 'error');
    return;
  }
  if (currentJson.isRedirectEnabled) {
    if (!currentJson.redirectUrl || currentJson.redirectUrl.trim() === '') {
      showEditMsg('❌ 目标跳转地址不能为空，请填写有效的网址', 'error');
      document.getElementById('redirectUrlInput').focus();
      return;
    }
    if (!validateUrl()) {
      showEditMsg('❌ 请修正目标跳转地址的格式错误后再保存', 'error');
      return;
    }
  } else {
    if (!currentJson.redirectUrl || currentJson.redirectUrl.trim() === '') {
      currentJson.redirectUrl = 'https://example.com';
    }
  }
  const countries = Array.isArray(currentJson.allowCountries) ? currentJson.allowCountries : [];
  const anyEnabled = !!(currentJson.isCountryCheckEnabled || currentJson.isTimezoneCheckEnabled || currentJson.isIpAttributionCheckEnabled);
  if (countries.length > 0 && !anyEnabled) {
    showEditMsg('❌ 已填写允许国家，需至少启用一个判断项', 'error');
    const cSwitch = document.getElementById('countryCheckEnabled');
    if (cSwitch) cSwitch.focus();
    return;
  }
  if (anyEnabled && countries.length === 0) {
    showEditMsg('❌ 启用了判断项但未填写允许国家，请完善后再保存', 'error');
    const cInput = document.getElementById('allowedCountriesInput');
    if (cInput) cInput.focus();
    return;
  }
  const switchChanged = originalConfig && currentJson.isRedirectEnabled !== originalConfig.isRedirectEnabled;
  const urlChangedWhenEnabled = originalConfig && currentJson.isRedirectEnabled === true && currentJson.redirectUrl !== originalConfig.redirectUrl;
  const shouldIncrementVersion = switchChanged || urlChangedWhenEnabled;
  if (shouldIncrementVersion) {
    const oldVersion = parseInt(currentJson.version) || 0;
    const newVersion = oldVersion + 1;
    currentJson.version = String(newVersion);
    document.getElementById('versionInput').value = newVersion;
    const validation = document.getElementById('versionValidation');
    validation.className = 'url-validation valid';
    validation.innerHTML = `📝 版本 ${oldVersion} → ${newVersion}`;
    validation.style.display = 'block';
    updateConfigPreview();
  }
  document.getElementById('saveBtn').disabled = true;
  showEditMsg('正在保存配置到APP应用...', 'info');
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'App-Config-Manager/1.0',
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    };
    let contentStr = null;
    if (encryptionEnabled) {
      if (!encryptionPassphrase || encryptionPassphrase.trim() === '') {
        showEditMsg('❌ 启用了加密但未填写口令，请完善后重试', 'error');
        return;
      }
      const envelope = await encryptJson(currentJson, encryptionPassphrase, encryptionMethod);
      contentStr = JSON.stringify(envelope, null, 2);
    } else {
      contentStr = JSON.stringify(currentJson, null, 2);
    }
    const requestBody = {
      files: {
        [currentFileName]: {
          content: contentStr
        }
      }
    };
    const res = await fetch(`https://api.github.com/gists/${currentGistId}`, {
      method: 'PATCH',
      headers: headers,
      mode: 'cors',
      body: JSON.stringify(requestBody)
    });
    if (!res.ok) {
      document.getElementById('editMsg').style.display = 'none';
      if (res.status === 404) {
        showEditMsg('应用资源不存在或已被删除', 'error');
      } else if (res.status === 403) {
        showEditMsg('没有编辑权限，请检查您的访问令牌权限', 'error');
      } else if (res.status === 401) {
        showEditMsg('身份验证失败，访问令牌可能已过期', 'error');
      } else {
        showEditMsg(`保存失败：${res.status} ${res.statusText}`, 'error');
      }
      return;
    }
    const data = await res.json();
    document.getElementById('editMsg').style.display = 'none';
    showTopNotification('🎊 太棒了！配置已成功保存并同步完成', 'success');
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    saveBtn.style.transform = 'scale(1.05)';
    saveBtn.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
    setTimeout(() => {
      saveBtn.style.background = '';
      saveBtn.style.transform = '';
      saveBtn.style.boxShadow = '';
    }, 2000);
    currentFileInfo = data.files[currentFileName];
    originalConfig = JSON.parse(JSON.stringify(currentJson));
  } catch (e) {
    console.error('保存配置时发生错误:', e);
    document.getElementById('editMsg').style.display = 'none';
    showEditMsg(`保存失败：${e.message}`, 'error');
  } finally {
    document.getElementById('saveBtn').disabled = false;
  }
}
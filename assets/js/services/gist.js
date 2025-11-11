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
    loadRedirectConfig();
    originalConfig = JSON.parse(JSON.stringify(currentJson));
    const displayAppId = gistId.length > 8 ? gistId.substring(0, 8) + '...' : gistId;
    document.getElementById('currentAppId').textContent = displayAppId;
    showPage('editPage');
    showTopNotification('🎉 APP应用连接成功，配置数据已加载！', 'success');
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
    const requestBody = {
      files: {
        [currentFileName]: {
          content: JSON.stringify(currentJson, null, 2)
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
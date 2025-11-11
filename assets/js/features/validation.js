// URL 校验与测试（拆分自 app.js）

function validateUrlStrict(url) {
  if (!url || typeof url !== 'string') return false;
  url = url.trim();
  if (!url) return false;
  if (url.includes(' ')) return false;
  if (/[\u4e00-\u9fff]/.test(url)) return false;
  if (!/^[a-zA-Z0-9\-._~:\/?#[\]@!$&'()*+,;=%]+$/.test(url)) return false;
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
  if (!urlRegex.test(url)) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function validateUrl() {
  const input = document.getElementById('redirectUrlInput');
  const url = input.value.trim();
  const validation = document.getElementById('urlValidation');
  if (!url) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ 目标跳转地址不能为空，请输入有效的网址';
    validation.style.display = 'block';
    return false;
  }
  if (url.includes(' ')) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ URL中不能包含空格，请检查网址';
    validation.style.display = 'block';
    return false;
  }
  if (/[\u4e00-\u9fff]/.test(url)) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ URL中不能包含中文字符，请使用英文网址';
    validation.style.display = 'block';
    return false;
  }
  if (!/^[a-zA-Z0-9\-._~:\/?#[\]@!$&'()*+,;=%]+$/.test(url)) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ URL包含无效字符，请检查网址格式';
    validation.style.display = 'block';
    return false;
  }
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
  if (!urlRegex.test(url)) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ 无效的URL格式，请检查网址是否正确';
    validation.style.display = 'block';
    return false;
  }
  if (validateUrlStrict(url)) {
    validation.className = 'url-validation valid';
    validation.innerHTML = '✅ URL格式正确';
    validation.style.display = 'block';
    return true;
  } else {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ 无效的URL格式，请检查网址是否正确';
    validation.style.display = 'block';
    return false;
  }
}

function testUrl() {
  const input = document.getElementById('redirectUrlInput');
  const url = input.value.trim();
  const validation = document.getElementById('urlValidation');
  const testBtn = document.getElementById('testBtn');
  if (!url) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ 请先输入要测试的网址';
    validation.style.display = 'block';
    return;
  }
  if (!validateUrlStrict(url)) {
    validation.className = 'url-validation invalid';
    validation.innerHTML = '❌ 请输入有效的网址格式';
    validation.style.display = 'block';
    return;
  }
  validation.className = 'url-validation testing';
  validation.innerHTML = '🔄 正在测试链接可访问性...';
  validation.style.display = 'block';
  testBtn.disabled = true;
  testBtn.innerHTML = '⏳';
  fetch(url, { method: 'HEAD', mode: 'no-cors', timeout: 5000 })
    .then(() => {
      validation.className = 'url-validation valid';
      validation.innerHTML = '✅ 链接测试成功，网站可正常访问';
    })
    .catch(() => {
      validation.className = 'url-validation valid';
      validation.innerHTML = '⚠️ 由于跨域限制无法完全验证，但URL格式正确<br><small>建议手动点击验证：<a href="' + url + '" target="_blank" style="color:#1677ff;">打开链接测试</a></small>';
    })
    .finally(() => {
      testBtn.disabled = false;
      testBtn.innerHTML = '🔗';
    });
}
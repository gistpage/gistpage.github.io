function updateEncryptionStatus() {
  const status = document.getElementById('encryptionStatus');
  if (!status) return;
  if (encryptionEnabled) {
    status.textContent = '已启用';
    status.className = 'switch-status enabled';
  } else {
    status.textContent = '未启用';
    status.className = 'switch-status disabled';
  }
}

function toggleEncryptionEnabled() {
  const enabled = document.getElementById('encryptionEnabled').checked;
  encryptionEnabled = enabled;
  document.getElementById('encryptionMethodField').style.display = enabled ? 'block' : 'none';
  document.getElementById('encryptionPassphraseField').style.display = enabled ? 'block' : 'none';
  const v = document.getElementById('encryptionValidation');
  if (enabled && (!encryptionPassphrase || encryptionPassphrase.trim() === '')) {
    v.className = 'url-validation invalid';
    v.innerHTML = '❌ 请输入加密口令';
    v.style.display = 'block';
  } else {
    v.style.display = 'none';
  }
  updateEncryptionStatus();
  if (typeof updateConfigPreview === 'function') updateConfigPreview();
}

function updateEncryptionMethod() {
  const sel = document.getElementById('encryptionMethod');
  encryptionMethod = sel ? sel.value : 'AES-GCM';
  if (typeof updateConfigPreview === 'function') updateConfigPreview();
}

function updateEncryptionPassphrase() {
  const input = document.getElementById('encryptionPassphrase');
  encryptionPassphrase = input ? input.value : '';
  const v = document.getElementById('encryptionValidation');
  if (!encryptionPassphrase || encryptionPassphrase.trim() === '') {
    v.className = 'url-validation invalid';
    v.innerHTML = '❌ 加密口令不能为空';
    v.style.display = 'block';
  } else {
    v.className = 'url-validation valid';
    v.innerHTML = '✅ 已填写加密口令';
    v.style.display = 'block';
  }
}

function togglePassphraseVisibility() {
  const input = document.getElementById('encryptionPassphrase');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function loadEncryptionConfig() {
  const enabledEl = document.getElementById('encryptionEnabled');
  if (enabledEl) enabledEl.checked = encryptionEnabled;
  const methodEl = document.getElementById('encryptionMethod');
  if (methodEl) methodEl.value = encryptionMethod;
  const passEl = document.getElementById('encryptionPassphrase');
  if (passEl) passEl.value = encryptionPassphrase;
  document.getElementById('encryptionMethodField').style.display = encryptionEnabled ? 'block' : 'none';
  document.getElementById('encryptionPassphraseField').style.display = encryptionEnabled ? 'block' : 'none';
  updateEncryptionStatus();
}

function toBase64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getRandomBytes(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return arr;
}

async function deriveAesGcmKey(passphrase, salt, iterations = 100000) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptJson(obj, passphrase, method = 'AES-GCM') {
  if (method !== 'AES-GCM') throw new Error('不支持的加密方式');
  const salt = getRandomBytes(16);
  const iv = getRandomBytes(12);
  const key = await deriveAesGcmKey(passphrase, salt);
  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(obj));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    __encrypted__: true,
    encryption: {
      alg: 'AES-GCM',
      kdf: 'PBKDF2',
      digest: 'SHA-256',
      iterations: 100000,
      salt: toBase64(salt),
      iv: toBase64(iv)
    },
    cipherText: toBase64(cipher),
    version: obj.version || '1'
  };
}

async function decryptJson(envelope, passphrase) {
  if (!envelope || envelope.__encrypted__ !== true) return envelope;
  const info = envelope.encryption || {};
  if (info.alg !== 'AES-GCM') throw new Error('不支持的加密方式');
  const salt = fromBase64(info.salt || '');
  const iv = fromBase64(info.iv || '');
  const key = await deriveAesGcmKey(passphrase, salt, info.iterations || 100000);
  const cipherBytes = fromBase64(envelope.cipherText || '');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
  const dec = new TextDecoder();
  const txt = dec.decode(plain);
  return JSON.parse(txt);
}

function getEncryptionPassphrase() {
  return encryptionPassphrase || '';
}

// ------------------ 自定义弹窗：请求口令（统一风格） ------------------
let passphraseModalResolver = null;
function requestPassphrase(preserveValidation = false) {
  return new Promise(resolve => {
    passphraseModalResolver = resolve;
    const overlay = document.getElementById('passphraseModal');
    const input = document.getElementById('passphraseModalInput');
    const v = document.getElementById('passphraseModalValidation');
    if (overlay) overlay.style.display = 'flex';
    if (v && !preserveValidation) v.style.display = 'none';
    if (input) {
      if (!preserveValidation) input.value = '';
      setTimeout(() => input.focus(), 50);
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          confirmPassphraseModal();
        } else if (e.key === 'Escape') {
          cancelPassphraseModal();
        }
      };
    }
  });
}

function cancelPassphraseModal() {
  const overlay = document.getElementById('passphraseModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = passphraseModalResolver; passphraseModalResolver = null;
  if (resolve) resolve(null);
}

function confirmPassphraseModal() {
  const input = document.getElementById('passphraseModalInput');
  const v = document.getElementById('passphraseModalValidation');
  const val = (input && input.value) ? input.value.trim() : '';
  if (!val) {
    if (v) {
      v.className = 'url-validation invalid';
      v.innerHTML = '❌ 口令不能为空';
      v.style.display = 'block';
    }
    return;
  }
  const overlay = document.getElementById('passphraseModal');
  if (overlay) overlay.style.display = 'none';
  const resolve = passphraseModalResolver; passphraseModalResolver = null;
  if (resolve) resolve(val);
}

// 在弹窗中显示解密失败的错误提示，并允许用户重试输入
function showPassphraseError(message) {
  const overlay = document.getElementById('passphraseModal');
  const v = document.getElementById('passphraseModalValidation');
  const input = document.getElementById('passphraseModalInput');
  if (overlay) overlay.style.display = 'flex';
  if (v) {
    v.className = 'url-validation invalid';
    v.innerHTML = message || '❌ 解密失败：口令不正确或配置已损坏，请重试';
    v.style.display = 'block';
  }
  if (input) setTimeout(() => input.focus(), 50);
}
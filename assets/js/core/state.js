// 全局状态（拆分自 app.js）
let currentJson = null;
let originalConfig = null; // 保存原始配置，用于版本管理
let currentGistId = null;
let currentToken = null;
let currentFileName = null;
let currentFileInfo = null;
let encryptionEnabled = false;
let encryptionMethod = 'AES-GCM';
let encryptionPassphrase = '';
// 消息显示系统（拆分自 app.js）

function showMessage(targetId, msg, type = 'info', options = {}) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = msg;
  el.className = `msg ${type}`;
  el.style.display = 'block';
  if (type === 'success') {
    el.style.transform = 'scale(1.02)';
    el.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.25)';
    setTimeout(() => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = 'none';
    }, 2000);
  }
  const autoHideMs = options.autoHideMs !== undefined ? options.autoHideMs : (type === 'success' ? 4000 : null);
  if (autoHideMs) {
    setTimeout(() => { el.style.display = 'none'; }, autoHideMs);
  }
  if (options.scrollIntoView) {
    setTimeout(() => { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  }
}

function showLoginMsg(msg, type = 'info') {
  showTopNotification(msg, type);
}

function showEditMsg(msg, type = 'info') {
  showTopNotification(msg, type);
}

function setNotificationTheme(el, type) {
  const map = {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    info: 'linear-gradient(135deg, #667eea 0%, #5a67d8 100%)'
  };
  const bg = map[type] || map.info;
  el.style.background = bg;
  el.style.color = 'white';
}

function showTopNotification(msg, type = 'success') {
  const notification = document.getElementById('topNotification');
  notification.textContent = msg;
  notification.className = 'top-notification show';
  setNotificationTheme(notification, type);
  setTimeout(() => {
    notification.style.top = '-100px';
    notification.style.transform = 'translateX(-50%) scale(0.8)';
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.classList.remove('show');
      notification.style.top = '';
      notification.style.transform = '';
      notification.style.opacity = '';
    }, 500);
  }, 4000);
}
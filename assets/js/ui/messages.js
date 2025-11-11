// 消息显示系统（拆分自 app.js）

function showLoginMsg(msg, type = 'info') {
  const msgElement = document.getElementById('loginMsg');
  msgElement.textContent = msg;
  msgElement.className = `msg ${type}`;
  msgElement.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => {
      msgElement.style.display = 'none';
    }, 3000);
  }
}

function showEditMsg(msg, type = 'info') {
  const msgElement = document.getElementById('editMsg');
  msgElement.textContent = msg;
  msgElement.className = `msg ${type}`;
  msgElement.style.display = 'block';
  if (type === 'success') {
    msgElement.style.transform = 'scale(1.02)';
    msgElement.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.25)';
    msgElement.style.border = '2px solid #10b981';
    let flashCount = 0;
    const flashInterval = setInterval(() => {
      msgElement.style.backgroundColor = flashCount % 2 === 0 ? '#d1fae5' : '#ecfdf5';
      flashCount++;
      if (flashCount >= 6) {
        clearInterval(flashInterval);
        msgElement.style.backgroundColor = '#ecfdf5';
      }
    }, 300);
    setTimeout(() => {
      msgElement.style.transform = 'scale(1)';
      msgElement.style.boxShadow = 'none';
      msgElement.style.border = 'none';
      msgElement.style.display = 'none';
    }, 10000);
    setTimeout(() => {
      msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}

function showTopNotification(msg, type = 'success') {
  const notification = document.getElementById('topNotification');
  notification.textContent = msg;
  notification.className = 'top-notification show';
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
// 入口占位：业务逻辑已拆分到 core/ui/features/services 子模块。
// 保持原有全局函数可用（各子文件中的函数在全局作用域中声明）。

// 可选：如需在加载时设置默认页面或其他初始化，可在此添加。
// 会话自动恢复：在同一浏览器会话内刷新后自动重新连接
document.addEventListener('DOMContentLoaded', () => {
  try {
    const gistId = sessionStorage.getItem('gist_session_id');
    const token = sessionStorage.getItem('gist_session_token');
    if (gistId && token) {
      // 填充输入框以复用现有连接逻辑
      const gistInputEl = document.getElementById('gistId');
      const tokenEl = document.getElementById('token');
      if (gistInputEl) gistInputEl.value = gistId;
      if (tokenEl) tokenEl.value = token;
      // 自动尝试连接（可能仍需输入解密口令）
      connectToGist();
    } else {
      // 默认展示登录页
      showPage('loginPage');
    }
  } catch (e) {
    showPage('loginPage');
  }
});
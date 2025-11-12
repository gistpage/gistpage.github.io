# 应用配置管理平台（App Config Manager）

一个纯前端的应用配置管理控制台，用于集中管理应用参数并存储在 GitHub Gist 中。支持重定向设置、访问控制、扩展字段、加密保存和版本管理，适合移动端/前端应用按需拉取配置。

## 功能特性
- 重定向管理：开关控制与目标地址校验、快速模板、可访问性测试
- 访问控制：按国家码（ISO 3166-1 Alpha-2）限制，支持国家/时区/公网 IP 归属判断开关
- 扩展字段：任意键值对编辑、删除确认、JSON 一键导出与复制
- 加密保存：AES-GCM + PBKDF2 口令派生，端到端加密，口令不存储
- 版本管理：关键变更自动递增版本号，便于客户端差量更新
- 我的 Gists：基于令牌列出/搜索/填入 ID，快速跳转详情页
- 会话记忆：在同一浏览器会话内自动恢复 APP ID 与令牌
- 完全静态：无需后端，即开即用，便于 GitHub Pages 发布

## 在线/本地预览
- 直接双击或用浏览器打开 `index.html` 即可运行
- 推荐本地服务器（避免部分浏览器的文件协议限制）：
  ```bash
  python3 -m http.server 8000
  ```
  然后访问 `http://localhost:8000/`

## 快速开始
1. 获取 GitHub 访问令牌（仅需 `gist` 权限，建议设置过期时间）
   - 进入 GitHub → Settings → Developer settings → Personal access tokens
   - 创建 Classic 或 Fine-grained PAT，并仅授予 `gist` 权限
2. 创建或连接 APP 应用
   - 创建：点击登录页的“注册新APP应用”，输入配置名称，生成 Secret Gist 与 `APP ID`
   - 连接：填入 `APP ID`（支持 Gist URL 或 ID）与访问令牌，点击“连接到APP应用”
3. 编辑与保存配置
   - 根据需要开启重定向、填写目标地址并通过“测试链接”校验
   - 配置允许国家与判断项开关、添加扩展字段、按需启用加密
   - 点击“保存配置”，将写回到 Gist

## 使用说明
- 重定向管理
  - 开启后必须填写有效 URL；支持自动补全 `https://` 前缀与格式校验
  - “快速配置模板”可一键填入常用地址，“测试链接”会尝试 HEAD 请求并给出跨域提示
- 访问控制
  - `允许国家`填入逗号/空格分隔的 2 位国家码（如 `US, CN`），无效值会提示
  - 当填写了允许国家时，需至少启用一个判断项（国家/时区/IP 归属）
- 扩展字段
  - 可新增、重命名、删除键值对；删除前有统一风格确认弹窗
  - 支持一键生成并复制 JSON，便于客户端直接使用
- 加密保存
  - 启用后保存到 Gist 的内容为加密包（Envelope），包含算法、盐、IV、迭代次数与密文
  - 口令仅在本地内存与输入框中存在，不会写入 Gist 或持久化存储
  - 读取到加密内容时会弹窗请求口令，最多尝试 3 次并提供错误提示
- 版本管理
  - 当重定向开关或启用状态下的目标地址发生变化时自动递增版本号
  - 管理页“配置概览”展示当前版本，便于客户端比较远端与本地版本
- 我的 Gists
  - 使用访问令牌分页拉取、搜索 Gist；支持“详情”跳转、“填入ID”、“复制”快捷操作

## 配置结构示例
```json
{
  "version": "1",
  "isRedirectEnabled": false,
  "redirectUrl": "https://example.com",
  "allowCountries": [],
  "isCountryCheckEnabled": false,
  "isTimezoneCheckEnabled": false,
  "isIpAttributionCheckEnabled": false,
  "extra": {}
}
```

### 加密包（Envelope）示例（开启加密保存时）
```json
{
  "__encrypted__": true,
  "encryption": {
    "alg": "AES-GCM",
    "kdf": "PBKDF2",
    "digest": "SHA-256",
    "iterations": 100000,
    "salt": "...base64...",
    "iv": "...base64..."
  },
  "cipherText": "...base64...",
  "version": "2"
}
```

## 安全与隐私
- 令牌使用范围建议最小化：仅授予 `gist` 权限，设置过期时间或细粒度访问控制
- 令牌仅存在于浏览器会话（`sessionStorage`），不会写入任何远端或持久化到磁盘
- 所有网络通信均通过 HTTPS，建议在可信网络环境中使用
- 开启加密后，配置内容以密文存储在 Gist；口令不在任何地方持久化

## 部署到 GitHub Pages
1. 在 GitHub 创建仓库并推送本项目代码
2. 进入仓库 → Settings → Pages
3. 将 Source 设置为 `main` 分支 `/root`（或 `docs` 路径）
4. 保存后等待几分钟，访问生成的 Pages 地址即可
5. 若使用自定义域名，按提示设置 DNS 并在 Pages 中配置

## 项目结构
```
.
├─ index.html
├─ assets/
│  ├─ css/
│  │  ├─ style.css            # 汇总样式，按模块引入
│  │  └─ modules/
│  │     ├─ style-part1.css
│  │     ├─ style-part2.css
│  │     └─ style-part3.css
│  └─ js/
│     ├─ core/                # 全局状态与工具
│     │  ├─ state.js
│     │  └─ utils.js
│     ├─ features/            # 业务功能模块
│     │  ├─ validation.js
│     │  ├─ config.js
│     │  ├─ access.js
│     │  ├─ encryption.js
│     │  └─ extra.js
│     ├─ ui/                  # 消息与视图切换
│     │  ├─ messages.js
│     │  └─ view.js
│     ├─ services/            # GitHub Gist 交互
│     │  └─ gist.js
│     └─ app.js               # 入口与会话恢复
└─ .gitignore
```

## 技术栈与兼容性
- 纯 HTML/CSS/JavaScript，无构建步骤，无第三方依赖
- 现代浏览器（Chrome/Edge/Safari/Firefox 最新版）
- 使用 GitHub REST API v3（CORS），需网络可达 `api.github.com`

## 常见问题
- 测试链接显示“由于跨域限制无法完全验证”？
  - 浏览器对跨域 `no-cors` 请求的可见性有限，但格式校验已通过。可点击提示中的“打开链接测试”进行人工确认。
- 公共部署是否安全？
  - 本项目不在服务器侧接收令牌；令牌仅在用户浏览器内使用。请始终使用最小权限、短期令牌，并妥善保管。

## 许可证
请根据实际需要添加许可证文件（例如 MIT）。
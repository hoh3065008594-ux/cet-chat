# CET Chat 阿里云 OSS 静态托管部署

## 目标

将 CET Chat 纯静态 SPA 部署到阿里云 OSS，通过公网 URL 分享给其他用户使用。

## 部署架构

```
用户浏览器 ── OSS 公网地址 ── 静态文件 (HTML/CSS/JS/JSON)
用户浏览器 ── OpenAI 兼容 API (DeepSeek 等) ── 直连，不经 OSS
```

- 无后端服务器，无数据库
- API Key 存用户浏览器 localStorage
- 对话记录存用户浏览器 IndexedDB
- 每个用户独立使用，互不影响

## 费用预估

| 项目 | 规格 | 月费 |
|------|------|------|
| OSS 存储 | 360KB 文件 | < ¥1 |
| OSS 外网流量 | 1000 次访问 × 360KB | < ¥1 |
| 资源包 | 40GB 存储 + 100GB 流量 | ¥9/年 |
| **合计** | | **< ¥2/月** |

## 实施步骤

### 1. 阿里云账号准备

- 注册阿里云账号 (aliyun.com)
- 完成个人实名认证（身份证 + 人脸识别，约 1-2 天）
- 购买 OSS 资源包（¥9/年 40GB 存储 + 100GB 流量）

### 2. OSS 配置

- 创建 Bucket
  - 名称: `cet-chat`
  - 区域: 选离自己最近的（如杭州）
  - 存储类型: 标准存储
  - ACL 访问权限: **公共读**
- 开启静态网站托管
  - 默认首页: `index.html`
  - 404 页面: `index.html`（支持 React Router 前端路由）

### 3. 上传部署

- 本地 `npm run build`
- 上传 `dist/` 目录下所有文件到 OSS 根目录
- 文件清单:
  - `index.html`
  - `assets/*.js` (1 个 JS 文件)
  - `assets/*.css` (1 个 CSS 文件)
  - `vocab-data/cet4.json`
  - `vocab-data/cet6.json`

### 4. 获取访问地址

- OSS 控制台 → Bucket 概览 → 静态页面托管 → 复制公网访问 URL
- URL 格式: `http://cet-chat.oss-cn-<region>.aliyuncs.com`
- 后续可通过 OSS 管理工具或 CLI 一键更新

## 之后可选扩展

- PWA 支持（可安装到桌面、离线可用）
- 自定义域名 + CDN 加速（需备案域名）
- GitHub Actions 自动部署（push 即自动上传 OSS）

## 验证方式

- 浏览器打开 OSS URL → 显示 CET Chat 主界面
- 侧边栏导航正常（对话/词库/统计/设置）
- 词库页面正常显示 768 词/971 词
- 填入 API Key 后可正常对话

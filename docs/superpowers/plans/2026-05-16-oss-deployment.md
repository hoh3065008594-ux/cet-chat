# CET Chat OSS 部署实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 CET Chat 静态站点部署到阿里云 OSS，获得公网访问地址

**架构:** 纯静态托管 — dist/ 文件上传 OSS → 公网 URL，无需服务器

**Tech Stack:** 阿里云 OSS, ossutil (OSS CLI), Vite build

---

## 前置条件（用户手动完成）

- [ ] 注册阿里云账号 https://account.aliyun.com
- [ ] 完成个人实名认证（身份证+人脸，约 1-2 天）
- [ ] 购买 OSS 资源包 ¥9/年（40GB 存储 + 100GB 流量）: https://common-buy.aliyun.com/?commodityCode=ossbag

---

### Task 1: 安装 ossutil CLI 工具

**Files:** 无

- [ ] **Step 1: 下载 ossutil**

```bash
# Windows 64-bit
curl -o ossutil64.zip "https://gosspublic.alicdn.com/ossutil/v2/ossutil-v2.0.4-windows-amd64.zip"
```

- [ ] **Step 2: 解压到 PATH 目录**

```bash
unzip ossutil64.zip -d "$HOME/ossutil"
export PATH="$HOME/ossutil:$PATH"
ossutil64 version
```

Expected: 显示版本号

---

### Task 2: 配置 ossutil 连接阿里云

**Files:** `~/.ossutil`

- [ ] **Step 1: 获取 AccessKey**

1. 登录阿里云控制台 → 右上角头像 → AccessKey 管理
2. 创建 AccessKey（保存 AccessKey ID 和 Secret）

- [ ] **Step 2: 配置 ossutil**

```bash
ossutil64 config -i <你的AccessKeyID> -k <你的AccessKeySecret> -e oss-cn-hangzhou.aliyuncs.com
```

- [ ] **Step 3: 验证连接**

```bash
ossutil64 ls
```

Expected: 无报错（可能无 Bucket，这正常）

---

### Task 3: 创建 OSS Bucket 并配置静态托管

- [ ] **Step 1: 创建 Bucket**

```bash
ossutil64 mb oss://cet-chat --acl public-read --storage-class Standard
```

- [ ] **Step 2: 配置静态网站托管**

在阿里云控制台操作（ossutil 不支持此设置）：
1. OSS 控制台 → 点击 `cet-chat` Bucket
2. 左侧菜单「数据管理」→「静态页面」
3. 默认首页: `index.html`
4. 404 页面: `index.html`
5. 点击「保存」

- [ ] **Step 3: 获取公网访问地址**

Bucket 概览页面 → 「访问端口」→ 复制「Bucket 域名」
格式: `cet-chat.oss-cn-hangzhou.aliyuncs.com`

---

### Task 4: 构建并上传文件

- [ ] **Step 1: 构建生产版本**

```bash
cd C:/Users/Administrator/cet-chat
npm run build
```

- [ ] **Step 2: 上传 dist 目录到 OSS**

```bash
ossutil64 cp -r C:/Users/Administrator/cet-chat/dist/ oss://cet-chat/ --include "*" --recursive
```

- [ ] **Step 3: 验证文件已上传**

```bash
ossutil64 ls oss://cet-chat/
```

Expected 输出应包含:
```
index.html
assets/
vocab-data/
```

---

### Task 5: 验证部署

- [ ] **Step 1: 浏览器访问**

打开 `http://cet-chat.oss-cn-hangzhou.aliyuncs.com`

- [ ] **Step 2: 检查功能**

- [ ] 侧边栏显示「CET Chat」标题
- [ ] 点击「设置」→ 填入 API Key
- [ ] 点击「词库预览」→ 显示 768 个 CET-4 单词
- [ ] 切到 CET-6 → 显示 971 个单词
- [ ] 返回首页 → 新建对话 → 能正常发送接收消息

---

### Task 6: 后续更新流程

每次代码更新后：

```bash
cd C:/Users/Administrator/cet-chat
npm run build
ossutil64 cp -r dist/ oss://cet-chat/ --include "*" --recursive --force
```

刷新浏览器即可看到更新。

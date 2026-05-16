# CET Chat — 英语四六级对话学习工具

AI 聊天伙伴 + 考纲词库浸润式学习。点击任意单词即可查询音标和中文释义。

## 功能

- 🤖 AI 对话伙伴，自动使用四六级考纲词汇回复
- 📖 CET-4 (3739词) / CET-6 (2078词) 完整词库
- 🔍 点击消息中任意单词弹窗查释义
- 💬 多段对话历史，IndexedDB 本地存储
- 📊 学习统计：考纲词覆盖率追踪
- 📱 响应式设计，手机/电脑均可使用

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 使用说明

1. 打开「设置」→ 填入 API Key (DeepSeek / OpenAI 兼容)
2. 选择词库级别 (四级/六级)
3. 点击「新建对话」开始聊天
4. 点击消息中任意英语单词查看释义

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- React Router v7
- IndexedDB (idb)
- OpenAI 兼容 API

## 构建部署

```bash
npm run build
# dist/ 目录即为完整的静态站点，可部署到任何静态服务器
```

## 许可

MIT

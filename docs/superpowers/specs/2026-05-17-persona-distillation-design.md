# 人格蒸馏系统 — 设计文档

## 概述

为 CET Chat 添加自定义 AI 伙伴人格系统。用户可手动创建人格（昵称必填，其他随意），也可导入微信/QQ 聊天记录由 AI 自动分析生成人格画像。创建后的人格永久存储，可在首页点击头像直接进入对话。

## 数据模型

### Persona

```typescript
interface Persona {
  id: string
  name: string          // 昵称（必填）
  slug: string
  avatar: string         // base64
  profile: {
    role: string         // 老师/朋友/笔友/面试官
    mbti: string
    zodiac: string
    traits: string[]     // ["幽默", "毒舌"]
  }
  speech: {
    catchphrases: string[]
    tone: string
    messageStyle: '短句' | '长句' | '混合'
    emojiUsage: '频繁' | '偶尔' | '不用'
  }
  topics: { like: string[], avoid: string[] }
  sourceType: 'manual' | 'imported'
  createdAt: number
  updatedAt: number
}
```

### IndexedDB Schema v3

- 新增 `personas` store（keyPath: id）
- 新增 `activePersonaId` 字段到 settings

## 文件变更

### 新增
- `src/types/persona.ts` — Persona 类型定义
- `src/services/personas.ts` — IndexedDB CRUD
- `src/pages/PersonaWorkshop.tsx` — 创建向导（多步）
- `src/pages/PersonaSelectPage.tsx` — 首页人格选择网格

### 修改
- `src/services/db.ts` — schema v3 升级
- `src/services/settings.ts` — 加 activePersonaId
- `src/services/ai.ts` — system prompt 注入人格
- `src/App.tsx` — 新路由 + 首页改选人格
- `src/components/Sidebar.tsx` — 导航入口
- `src/pages/SettingsPage.tsx` — 活跃人格切换

## 用户流程

1. 首页 → 看到人格卡片网格（含默认 Alex）
2. 点击卡片 → 进入/恢复与该人格的对话
3. 底部「+ 创建人格」→ PersonaWorkshop 向导
4. 向导：昵称 → 标签(可选) → 导入聊天记录(可选) → AI 分析 → 预览确认 → 保存
5. 对话中可点击 Header 头像切换人格
6. Settings 中可管理/删除人格

## 聊天记录蒸馏流程

1. 用户上传 .txt 文件 → FileReader 读取
2. 原始文本发给 DeepSeek，用分析 prompt 提取人格特征
3. AI 返回结构化 JSON → 回填表单
4. 用户审核/修改 → 保存

## 技术约束

- 纯前端，无后端
- 所有数据 IndexedDB 本地存储
- 文件解析在浏览器端完成
- AI 分析复用现有 DeepSeek API

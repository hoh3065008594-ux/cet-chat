# CET Chat 更新日志

## v1.3 — 2026-05-18

### UI/UX 设计系统

- **颜色系统统一** — 全局使用 OKLCH 品牌紫（`oklch(45% 0.21 310)`），消除 DiaryPage 的 Morandi 棕色系、PersonaSelectPage 的硬编码灰色
- **图标升级** — 人格角色图标从 emoji（👩‍🏫👋✉️）替换为 Lucide SVG 图标
- **Hover 交互** — 词库卡片和侧栏伙伴列表的 JS `onMouseEnter/Leave` 改为 CSS `:hover`，更流畅
- **Type scale** — 定义 xs/sm/base/lg/xl/2xl 六级字号体系，添加 `font-size` 和 `line-height` 规范
- **全局细节** — 统一 `cursor-pointer`、focus-visible ring、150ms 过渡动画

### 日记系统重构

- **手动发布** — 移除 600ms 自动保存，改为点击「发布」按钮手动保存到数据库
- **多篇共存** — 日记 key 从 `date`（一天一篇）改为 `id`（UUID），同一天支持多篇日记
- **多人评论** — 评论从单条字段改为 `comments[]` 数组，多个伙伴的评论全部保留
- **DB v4 迁移** — diary store 新增 `date` 索引，支持按日期查询多篇
- **旧格式兼容** — 发布时自动将旧版单评论格式迁移为数组格式

### Bug 修复

- 自动保存覆盖伙伴评论问题
- 发布新评论时已有回复被丢弃
- 写日记时输入第一个字母后焦点丢失
- 点击「写日记」载入历史日记内容的问题
- 新日记覆盖同一天已发布日记

### 文件

| 文件 | 改动 |
|------|------|
| `src/services/db.ts` | DiaryEntry 新增 id，keyPath date→id，v4 迁移，新增 getEntriesByDate |
| `src/pages/DiaryPage.tsx` | 颜色统一、发布流程、多篇支持、多评论、旧格式迁移 |
| `src/pages/PersonaSelectPage.tsx` | 硬编码色消除、emoji→Lucide 图标、颜色常量 |
| `src/pages/VocabularyPage.tsx` | 硬编码色消除、CSS hover 替代 JS |
| `src/components/Sidebar.tsx` | CSS hover 替代 JS、cursor-pointer |
| `src/index.css` | type scale、word-card/persona-item hover 规则、body line-height |

---

## v1.2 — 2026-05-17

- 人格蒸馏系统（创建向导 + AI 分析 + 对话注入）
- 日记伙伴评论与回复
- OKLCH 颜色系统、品牌紫
- IndexedDB v3（personas store）

## v1.0 — 2026-05

- 初始版本：CET-4/CET-6 英语 AI 对话学习
- 5,817 词考纲词库浸润式学习
- 人格系统、学习统计

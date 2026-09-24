<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 專案規範

- 所有 commit 與 push 必須透過 `@canis22788/git-czx`；停用會自動建立 commit 的腳手架選項。
- Commit message 必須包含 type、scope、subject、body；subject 與 body 使用中文，body 優先使用 Markdown 列點，不使用專案名稱作為 scope。
- `components/ui/` 僅使用 shadcn CLI 安裝的原生 Base UI 元件，不自行修改；不足時使用 Dice UI。
- 使用 `b1YmqvjO4` preset（base-nova）。更新元件時整套維持同一 preset，不混用其他 style；下拉選單使用 Select，日期使用 Calendar＋Popover，不使用瀏覽器原生選單或日期選擇器。
- 刪除操作必須經過 destructive Alert Dialog 確認；表單使用 zod 與 FieldError；載入、空資料及操作回饋分別使用 Skeleton、Empty、Toast。
- 完整支援手機、平板、桌面 RWD。手機不得顯示 Tooltip；目前所有頁面均使用文字或可讀標籤，不使用 Tooltip。

# 債務手帳

`debt.canis.world` 的獨立債務管理前端。Next.js App Router、TypeScript、Tailwind v4，使用指定的 shadcn preset `b1YmqvjO4`（Base UI / nova / Lucide）。全部 `components/ui` 由 CLI 依同一 preset 重新安裝，保留官方原始樣式，不自行修改。現有元件已足夠，因此沒有引入 Dice UI。

## 功能

Calendar 使用 `react-day-picker` 9.x，以維持官方元件的日期欄寬；升級到 10.x 前須重新驗證日曆排版。

- 個人總覽：累計借款、還款、剩餘債務、結清筆數與還款百分比；搜尋名稱／備註、篩選結清狀態。
- 債務、借款與還款紀錄使用原生 Pagination，預設每頁 10 筆，可切換 10／20／50／100 筆；總覽統計仍涵蓋全部債務。明細在 Sheet 中查看，借款／還款以 Tabs 切換，各自分頁。
- 手機使用 Sidebar 收納導覽與登出；桌面、手機及登入／註冊頁的頂部列皆 sticky。
- 「新增借款」可選擇累加至同一筆債務，或帶入對方及約定還款方式後建立新債務；首次借款及後續加借分別保留日期、金額與備註。加借可編輯、經確認後刪除，禁止將總借款降至已還金額以下。
- 債務與還款新增／編輯 Dialog；日期、正整數金額、還款方式、銀行資訊及備註驗證。
- 表單必填欄位標示 `*`，日期使用 Calendar＋Popover；金額、搜尋、可顯示／隱藏密碼的欄位使用 Input Group。
- 所有下拉選單使用 shadcn Select；主題選項包含系統、太陽與月亮圖示。一般確認使用官方 Dialog；刪除確認使用 destructive Alert Dialog 的小尺寸置中圖示版本，保留原生動畫與背景模糊。
- 還款預設臺北當天日期與債務約定的還款方式，禁止超額還款及將借款調低至已還款以下。
- 所有刪除均使用 destructive Alert Dialog；刪除債務同時刪除其全部還款。
- 獨立註冊、登入、HttpOnly session。公開註冊先待核准，管理員核准後才可登入。
- `/admin` 提供核准、不核准、停用與恢復帳號。管理員也只能管理自己的債務，不能讀取他人的帳本。
- Skeleton、Empty、Toast、zod／FieldError，nextjs-toploader、next-themes、Prettier。
- 手機／平板直向列表，桌面表格；手機借還款明細採緊湊排版，Dialog 可隨視窗高度捲動。沒有使用 Tooltip。
- 頁尾沿用其他專案的 Canis 版權與個人網站連結；帳號啟停用採鎖頭 Toggle 並以一般 Dialog 確認。
- PWA manifest、192／512 圖示、service worker 與離線提示。只快取公開離線頁和靜態資源，不快取帳號與債務 API，也不支援離線新增／修改。
- Geist 英數、Noto Sans TC 中文、Geist Mono 金額；字體由 Next.js 在建置時下載並自行託管。

## Docker 啟動

先依 `../backend` 的既有方式啟動 Express＋MongoDB，再在本目錄執行：

```bash
docker compose up -d --force-recreate
```

網址為 `http://localhost:7345`。容器啟動時執行 `npm ci` 與 production build，第一次需等候依賴與字體下載。

Compose 預設透過 `http://host.docker.internal:7344` 存取後端，不需建立 `.env`。可設定 `DEBT_PORT` 修改對外 port、`INTERNAL_API_BASE_URL` 修改後端位址。每個 repo 保持獨立 Compose。

Windows 請先確認 `docker context show` 是本機 `desktop-linux`；Linux Server 請 SSH 後在 Server 的 repo 目錄執行指令。

## 第一位管理員

在 backend 目錄執行：

```bash
npm run create-debt-admin
```

或在既有 backend 容器內執行：

```bash
docker exec -it backend_canis_world npm run create-debt-admin
```

互動輸入名稱、email、至少 12 字元的密碼（最多 72 UTF-8 bytes）。密碼不放命令列。已存在的債務帳號需要互動確認才升級／重設；此操作會使該帳號的舊 session 失效。不會變更其他網站帳號。

## 後端與資料

瀏覽器只呼叫本站 `/api/debt/*`，Next.js server 轉送到 backend。所有操作在 backend 驗證登入、帳號狀態、owner 與 zod schema，不依賴前端控制。

MongoDB 使用 `debt_users`、`debt_sessions`、`debt_records` 獨立集合。加借與還款是債務文件的子文件，使用版本比對與 MongoDB 單文件原子更新，能在單機 MongoDB 保證餘額限制與連帶刪除。借款、還款日期存 `YYYY-MM-DD`；`createdAt`、`updatedAt` 使用 Mongoose timestamps / MongoDB Date 保存完整 UTC 時間。

Session 使用隨機 token，DB 只存 SHA-256 摘要，7 天有效、TTL 清理，登出／停用會撤銷。Cookie 為 host-only、HttpOnly、SameSite=Strict，HTTPS 時使用 Secure。管理員帳號僅透過伺服器命令管理，避免誤停用最後一位管理員。

金額上限每筆 NT$999,999,999,999，單筆債務最多各 5,000 筆借款（含首次）與還款；首頁總計使用 BigInt 避免加總精度遺失。登入／註冊有速率限制。版本衝突會提示重新載入，避免覆寫其他分頁的修改。

## 正式網域

反向代理 `https://debt.canis.world` 到前端 `7345`。必須正確轉送 Host 與 HTTPS 協定，backend 的 `7344` 保持內部存取：

```nginx
location / {
    proxy_pass http://127.0.0.1:7345;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

PWA 安裝與 service worker 需 HTTPS，localhost 開發環境例外。瀏覽器的安裝選單或「加入主畫面」即可安裝。

## 本機開發與驗證

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run format:check
```

本機開發預設後端 `http://127.0.0.1:7344`；必要時依 `.env.example` 設定。

後端測試在 backend 執行 `npm test`。端到端測試需相鄰 backend 安裝依賴，且前端先完成 production build：

```bash
npx playwright install chromium
npm run test:e2e
```

測試會自行啟動臨時 MongoDB、`17444` API 與 `17345` 前端；完全不使用現有 MongoDB 資料。涵蓋手機／桌面 CRUD、欄位錯誤、註冊核准、管理員頁面、320–1440px 溢位檢查，以及 PWA 離線行為。測試帳密僅存在臨時測試環境。

所有 commit／push 必須使用 `@canis22788/git-czx`；commit 的 subject、body 為中文，scope 不使用專案名稱。

- 登入可勾選「記住帳號」，只在此瀏覽器儲存電子郵件，取消勾選立即移除。
- `/settings` 可驗證目前密碼後設定新密碼，成功後撤銷所有登入並重新登入。

- 帳號設定提供名稱修改與密碼變更；「使用者管理」為獨立的 `/admin` 頁面，僅系統管理員可見及存取，舊 `/settings/users` 導向 `/admin`。各頁提供 Breadcrumb 與依內容配置的 Skeleton。

- 債務摘要以已結清筆數與整體已還百分比搭配原生 Progress 顯示還款進度。

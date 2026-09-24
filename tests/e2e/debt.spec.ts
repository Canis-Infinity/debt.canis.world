import { test, expect, type Page } from "@playwright/test"

async function login(page: Page, email = "user@debt.test") {
  await page.goto("/login")
  await page.getByRole("textbox", { name: "電子郵件", exact: true }).fill(email)
  await page.locator("#password").fill("debt-e2e-only-password")
  await page.getByRole("button", { name: "登入", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "債務總覽", exact: true })
  ).toBeVisible()
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await expect(page.getByRole("tooltip")).toHaveCount(0)
}
test("borrowing, validation, repayment defaults, editing, deletion and responsive layout", async ({
  page,
}, info) => {
  const motion: { slot: string; closing: boolean }[] = []
  await page.exposeFunction(
    "recordMotion",
    (event: { slot: string; closing: boolean }) => motion.push(event)
  )
  await page.addInitScript(() => {
    for (const type of ["animationstart", "transitionrun"]) {
      document.addEventListener(
        type,
        (event) => {
          const target = event.target as HTMLElement
          const slot = target.getAttribute?.("data-slot")
          if (
            slot &&
            [
              "dialog-content",
              "alert-dialog-content",
              "sheet-content",
            ].includes(slot)
          ) {
            ;(
              window as unknown as { recordMotion: (value: unknown) => void }
            ).recordMotion({
              slot,
              closing:
                target.hasAttribute("data-closed") ||
                target.hasAttribute("data-ending-style"),
            })
          }
        },
        true
      )
    }
  })
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await login(page)
  await expect(page.getByText("從第一筆債務開始")).toBeVisible()
  await page.getByRole("button", { name: "新增債務", exact: true }).click()
  const dialog = page.getByRole("dialog", {
    name: /^(新增|編輯)(債務|還款|借款)$/,
  })
  await dialog.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(dialog.getByText("請填寫跟誰借")).toBeVisible()
  await expect(
    dialog
      .locator("label")
      .filter({ hasText: "日期" })
      .locator('[aria-hidden="true"]')
  ).toHaveText("*")
  await dialog.getByRole("button", { name: "日期", exact: true }).click()
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible()
  await page.screenshot({
    animations: "allow",
    path: `test-results/${info.project.name}-calendar.png`,
  })
  await page
    .locator('[data-slot="calendar"] button[data-day]')
    .filter({ hasText: /^1$/ })
    .first()
    .click()
  await dialog.getByLabel("借了多少（NT$）").fill("10000")
  await dialog.getByLabel("跟誰借").fill("家人測試借款")
  await dialog.getByRole("combobox", { name: "約定還款方式" }).click()
  await page.getByRole("option", { name: "匯款", exact: true }).click()
  await dialog.getByLabel("銀行代碼").fill("004")
  await dialog.getByLabel("銀行帳號").fill("001234567890")
  await dialog.getByLabel("備註（選填）").fill("日常周轉，分次償還。")
  await dialog.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(dialog).toHaveCount(0)
  await page
    .getByRole("button", {
      name: info.project.name === "mobile" ? "還款明細" : "明細",
      exact: true,
    })
    .click()
  await page.getByRole("button", { name: "新增還款", exact: true }).click()
  const expectedDate = await page.evaluate(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  )
  await expect(dialog.locator('input[name="date"]')).toHaveValue(expectedDate)
  await expect(
    dialog.getByRole("combobox", { name: "還款方式", exact: true })
  ).toContainText("匯款")
  await expect(dialog.getByLabel("銀行帳號")).toHaveValue("001234567890")
  await dialog.getByLabel("還了多少（NT$）").fill("10001")
  await dialog.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(dialog.getByText(/本次最多可還/).last()).toBeVisible()
  await dialog.getByLabel("還了多少（NT$）").fill("3000")
  await dialog.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: "還款紀錄 · 1 筆" })
  ).toBeVisible()
  await page
    .getByRole("button", { name: `編輯 ${expectedDate} 的還款` })
    .click()
  await dialog.getByLabel("還了多少（NT$）").fill("4000")
  await dialog.getByRole("combobox", { name: "還款方式", exact: true }).click()
  await page.getByRole("option", { name: "iPass Money", exact: true }).click()
  await dialog.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole("button", { name: "編輯債務", exact: true }).click()
  await dialog.getByLabel("借了多少（NT$）").fill("3999")
  await dialog.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(dialog.getByText(/借款不可少於已還金額/)).toBeVisible()
  await dialog.getByRole("button", { name: "取消", exact: true }).click()
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await noOverflow(page)
  }
  await page.setViewportSize(
    info.project.name === "mobile"
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 }
  )
  await page.screenshot({
    animations: "allow",
    path: `test-results/${info.project.name}-overview.png`,
    fullPage: true,
  })
  await page.getByRole("button", { name: "刪除債務", exact: true }).click()
  await expect(page.getByRole("alertdialog")).toBeVisible()
  await expect(page.locator('[data-slot="alert-dialog-overlay"]')).toHaveCSS(
    "backdrop-filter",
    /blur\(/
  )
  await expect(page.locator('[data-slot="alert-dialog-media"]')).toBeVisible()
  await page.screenshot({
    animations: "allow",
    path: `test-results/${info.project.name}-delete-dialog.png`,
  })
  await page.getByRole("alertdialog").evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished)
    )
  })
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "取消" })
    .click()
  await expect(
    page.getByRole("heading", { name: "還款紀錄 · 1 筆" })
  ).toBeVisible()
  await page
    .getByRole("button", { name: `刪除 ${expectedDate} 的還款` })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "確認刪除" })
    .click()
  await expect(page.getByText("尚未有還款紀錄")).toBeVisible()
  await page.getByRole("button", { name: "刪除債務", exact: true }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "確認刪除" })
    .click()
  await expect(page.getByText("從第一筆債務開始")).toBeVisible()
  for (const slot of [
    "dialog-content",
    "alert-dialog-content",
    "sheet-content",
  ]) {
    await expect
      .poll(() => motion.some((event) => event.slot === slot && !event.closing))
      .toBe(true)
    await expect
      .poll(
        () => motion.some((event) => event.slot === slot && event.closing),
        { message: `${slot} exit: ${JSON.stringify(motion)}` }
      )
      .toBe(true)
  }
  expect(errors).toEqual([])
})

test("public signup requires admin approval and admin page works on mobile", async ({
  page,
}, info) => {
  const email = `${info.project.name}-${Date.now()}@example.test`
  await page.goto("/register")
  await expect(page.getByRole("contentinfo")).toContainText("Canis")
  await page
    .getByRole("textbox", { name: "名稱", exact: true })
    .fill("待審核測試帳號")
  await page.getByRole("textbox", { name: "電子郵件", exact: true }).fill(email)
  await page.locator("#password").fill("debt-e2e-only-password")
  await page.getByLabel("再次輸入密碼").fill("debt-e2e-only-password")
  await page.getByRole("button", { name: "送出註冊申請" }).click()
  await expect(page.getByRole("heading", { name: "申請已送出" })).toBeVisible()
  await page.goto("/login")
  await page.getByRole("textbox", { name: "電子郵件", exact: true }).fill(email)
  await page.locator("#password").fill("debt-e2e-only-password")
  await page.getByRole("button", { name: "登入", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "帳號正在等待管理員核准" })
  ).toBeVisible()
  await login(page, "admin@debt.test")
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "開啟導覽選單" }).click()
    await expect(
      page.getByRole("navigation", { name: "手機導覽" })
    ).toBeVisible()
    await page.screenshot({
      path: "test-results/mobile-sidebar.png",
      animations: "disabled",
    })
  }
  await page.getByRole("link", { name: "使用者管理", exact: true }).click()
  await expect(page.getByRole("navigation", { name: "手機導覽" })).toHaveCount(
    0
  )
  await expect(page.getByRole("heading", { name: "使用者管理" })).toBeVisible()
  await page.getByLabel("搜尋帳號").fill(email)
  await noOverflow(page)
  await page.screenshot({
    animations: "disabled",
    path: `test-results/${info.project.name}-admin.png`,
    fullPage: true,
  })
  await page.getByRole("button", { name: "不核准", exact: true }).click()
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCSS(
    "backdrop-filter",
    /blur\(/
  )
  await page.screenshot({
    animations: "disabled",
    path: `test-results/${info.project.name}-reject-dialog.png`,
  })
  await page.getByRole("dialog").getByRole("button", { name: "取消" }).click()
  await page.getByRole("button", { name: "核准", exact: true }).click()
  await page.screenshot({
    animations: "disabled",
    path: `test-results/${info.project.name}-approve-dialog.png`,
  })
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "確認變更" })
    .click()
  await expect(page.getByText("目前沒有符合的帳號")).toBeVisible()
  await page.getByRole("combobox", { name: "帳號狀態" }).click()
  await page.getByRole("option", { name: "全部帳號", exact: true }).click()
  const enabled = page.getByRole("button", { name: "啟用帳號", exact: true })
  await expect(enabled).toHaveAttribute("aria-pressed", "true")
  await expect(enabled.locator("svg")).toBeVisible()
  await enabled.click()
  await page.getByRole("dialog").getByRole("button", { name: "取消" }).click()
  await expect(enabled).toHaveAttribute("aria-pressed", "true")
  await enabled.click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "確認變更" })
    .click()
  await expect(enabled).toHaveAttribute("aria-pressed", "false")
  await enabled.click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "確認變更" })
    .click()
  await expect(enabled).toHaveAttribute("aria-pressed", "true")

  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "開啟導覽選單" }).click()
  }
  await page.getByRole("button", { name: "登出", exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await login(page, email)
  await page.goto("/admin")
  await expect(page.getByText("無法存取此頁面")).toBeVisible()
})

test("PWA metadata and offline fallback never cache debt APIs", async ({
  page,
  context,
}) => {
  await page.goto("/login")
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json()
  expect(manifest.display).toBe("standalone")
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  await page.reload()
  await context.setOffline(true)
  await page.goto("/offline-check")
  await expect(page.getByText("目前沒有網路連線")).toBeVisible()
  const cached = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((request) => request.url)
        )
      )
    ).flat()
  )
  expect(cached.some((url) => url.includes("/api/"))).toBe(false)
  await context.setOffline(false)
})

test("native shadcn selectors, theme icons and password visibility", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/register")
  await expect(page.getByRole("contentinfo")).toContainText("Canis")
  const password = page.locator("#password")
  const confirmation = page.locator("#confirmPassword")
  await password.fill("debt-e2e-only-password")
  await confirmation.fill("debt-e2e-only-password")
  await expect(password).toHaveAttribute("type", "password")
  await page
    .getByRole("button", { name: "顯示密碼", exact: true })
    .first()
    .click()
  await expect(password).toHaveAttribute("type", "text")
  await expect(confirmation).toHaveAttribute("type", "password")
  await page.getByRole("button", { name: "隱藏密碼", exact: true }).click()
  await expect(password).toHaveAttribute("type", "password")
  await page.getByRole("combobox", { name: "色彩主題" }).click()
  for (const name of ["跟隨系統", "淺色模式", "深色模式"]) {
    await expect(
      page.getByRole("option", { name, exact: true }).locator("svg").first()
    ).toBeVisible()
  }
  await page.getByRole("option", { name: "深色模式" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("combobox", { name: "色彩主題" }).click()
  await page.screenshot({
    animations: "disabled",
    path: `test-results/${info.project.name}-theme-options.png`,
  })
  await page.keyboard.press("Escape")
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.getByRole("combobox", { name: "色彩主題" })).toContainText(
    "深色模式"
  )
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await noOverflow(page)
  }
  await page.setViewportSize(
    info.project.name === "mobile"
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 }
  )
  await page.screenshot({
    animations: "disabled",
    path: `test-results/${info.project.name}-register.png`,
    fullPage: true,
  })
  await login(page)
  await page.getByRole("button", { name: "新增債務", exact: true }).click()
  const dialog = page.getByRole("dialog", {
    name: /^(新增|編輯)(債務|還款|借款)$/,
  })
  await expect(dialog.locator('input[type="date"]')).toHaveCount(0)
  await expect(
    dialog.locator('[data-slot="input-group"]').filter({ hasText: "NT$" })
  ).toBeVisible()
  await page.screenshot({
    animations: "disabled",
    path: `test-results/${info.project.name}-debt-form.png`,
  })
  await dialog.getByRole("combobox", { name: "約定還款方式" }).click()
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.screenshot({
    animations: "disabled",
    path: `test-results/${info.project.name}-payment-options.png`,
  })
  await page
    .getByRole("option", { name: "LINE Pay Money", exact: true })
    .click()
  await expect(
    dialog.getByRole("combobox", { name: "約定還款方式" })
  ).toContainText("LINE Pay Money")
  await expect(page.locator("select:visible")).toHaveCount(0)
  await expect(page.getByRole("tooltip")).toHaveCount(0)
  await dialog.getByRole("button", { name: "取消", exact: true }).click()
  expect(errors).toEqual([])
})

test("sticky header and responsive sidebar navigation", async ({
  page,
}, info) => {
  await login(page, "admin@debt.test")
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 500 })
    await noOverflow(page)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect
      .poll(async () => (await page.getByRole("banner").boundingBox())?.y)
      .toBe(0)
    const trigger = page.getByRole("button", { name: "開啟導覽選單" })
    if (width < 768) {
      await trigger.click()
      await expect(
        page.getByRole("navigation", { name: "手機導覽" })
      ).toBeVisible()
      await expect(page.getByRole("tooltip")).toHaveCount(0)
      await page.getByRole("button", { name: "關閉導覽選單" }).click()
      await expect(
        page.getByRole("navigation", { name: "手機導覽" })
      ).toHaveCount(0)
    } else {
      await expect(trigger).toBeHidden()
      await expect(
        page.getByRole("navigation", { name: "主要導覽" })
      ).toBeVisible()
    }
  }
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1440,
    height: 700,
  })
  await page.screenshot({
    path: `test-results/${info.project.name}-sticky-header.png`,
    animations: "disabled",
  })
})

test("debt and repayment pagination keeps the overview compact", async ({
  page,
}, info) => {
  const repayments = Array.from({ length: 21 }, (_, index) => ({
    id: `repayment-${index}`,
    date: `2026-09-${String(index + 1).padStart(2, "0")}`,
    amount: 10,
    payment: { method: "cash" },
    note: "",
    createdAt: "2026-09-24T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
  }))
  const debts = Array.from({ length: 21 }, (_, index) => ({
    id: `debt-${index}`,
    date: "2026-09-24",
    lender: `分頁測試 ${String(index + 1).padStart(2, "0")}`,
    amount: 1000,
    paid: 210,
    remaining: 790,
    payment: { method: "cash" },
    note: "",
    repayments,
    version: 0,
    createdAt: "2026-09-24T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
  }))
  await page.route("**/api/debt/debts", (route) =>
    route.fulfill({ json: { debts } })
  )
  await login(page)
  const pager = page.getByRole("navigation", { name: "債務分頁", exact: true })
  const detailButtons = page.getByRole("button", {
    name: info.project.name === "mobile" ? "還款明細" : "明細",
    exact: true,
  })
  await expect(detailButtons).toHaveCount(10)
  await expect(
    page.getByRole("region", { name: "完整債務統計" })
  ).toContainText("$21,000")
  await pager.getByRole("button", { name: "第 3 頁" }).click()
  await expect(detailButtons).toHaveCount(1)
  await detailButtons.first().click()
  const sheet = page.getByRole("dialog", { name: "跟 分頁測試 21 借的債務" })
  await expect(sheet).toBeVisible()
  const borrowButton = sheet.getByRole("button", {
    name: "新增借款",
    exact: true,
  })
  const repayButton = sheet.getByRole("button", {
    name: "新增還款",
    exact: true,
  })
  expect((await borrowButton.boundingBox())!.height).toBe(
    (await repayButton.boundingBox())!.height
  )
  await expect(
    sheet.getByRole("button", { name: /編輯 .* 的還款/ }).first()
  ).toHaveText("")
  await expect(
    sheet.getByRole("button", { name: /刪除 .* 的還款/ }).first()
  ).toHaveText("")
  const pagination = sheet.getByRole("navigation", {
    name: "還款分頁",
    exact: true,
  })
  const alignment = await pagination.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const parent = element.parentElement!.getBoundingClientRect()
    return Math.abs(rect.right - parent.right)
  })
  expect(alignment).toBeLessThan(2)

  await expect(
    sheet.getByRole("button", { name: /編輯 .* 的還款/ })
  ).toHaveCount(10)
  const repaymentsPager = sheet.getByRole("navigation", {
    name: "還款分頁",
    exact: true,
  })
  await repaymentsPager.getByRole("button", { name: "第 3 頁" }).click()
  await expect(
    sheet.getByRole("button", { name: /編輯 .* 的還款/ })
  ).toHaveCount(1)
  await noOverflow(page)
  await page.screenshot({
    path: `test-results/${info.project.name}-paginated-detail.png`,
    animations: "disabled",
  })
  await sheet.getByRole("button", { name: "關閉債務明細" }).click()
  await expect(pager.getByRole("button", { name: "第 3 頁" })).toHaveAttribute(
    "aria-current",
    "page"
  )
  await page.getByRole("textbox", { name: "搜尋債務" }).fill("分頁測試 01")
  await expect(detailButtons).toHaveCount(1)
  await expect(pager.getByRole("button", { name: "第 1 頁" })).toHaveAttribute(
    "aria-current",
    "page"
  )
  await page.getByRole("textbox", { name: "搜尋債務" }).fill("")
  await page.getByRole("combobox", { name: "債務每頁筆數" }).click()
  await page.getByRole("option", { name: "每頁 20 筆", exact: true }).click()
  await expect(detailButtons).toHaveCount(20)
  await page.getByRole("combobox", { name: "債務狀態" }).click()
  await page.getByRole("option", { name: "已結清", exact: true }).click()
  await expect(page.getByText("找不到符合的紀錄")).toBeVisible()
  await page.getByRole("button", { name: "清除篩選" }).click()
  await page.getByRole("combobox", { name: "債務每頁筆數" }).click()
  await page.getByRole("option", { name: "每頁 10 筆", exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({
    path: `test-results/${info.project.name}-paginated-overview.png`,
    fullPage: true,
    animations: "disabled",
  })
  await noOverflow(page)
})

test("additional borrowing can join this debt or create a separate debt", async ({
  page,
}, info) => {
  await login(page)
  await page.getByRole("button", { name: "新增債務", exact: true }).click()
  const form = page.getByRole("dialog", { name: /^(新增|編輯)(債務|借款)$/ })
  await form.getByLabel("借了多少（NT$）").fill("1000")
  await form.getByLabel("跟誰借").fill("加借測試親友")
  await form.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(form).toHaveCount(0)
  const details = page.getByRole("button", {
    name: info.project.name === "mobile" ? "還款明細" : "明細",
    exact: true,
  })
  await details.first().click()
  await page.getByRole("button", { name: "新增借款", exact: true }).click()
  await expect(form.getByRole("combobox", { name: "記錄方式" })).toContainText(
    "累加至這筆債務"
  )
  await form.getByLabel("借了多少（NT$）").fill("500")
  await form.getByLabel("備註（選填）").fill("第二次借款")
  await form.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(form).toHaveCount(0)
  await page.getByRole("tab", { name: "借款紀錄", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "借款紀錄 · 2 筆" })
  ).toBeVisible()
  await expect(page.getByText("第二次借款", { exact: true })).toBeVisible()
  await page
    .getByRole("article")
    .filter({ hasText: "第二次借款" })
    .getByRole("button", { name: /編輯 .* 的借款/ })
    .click()
  await form.getByLabel("借了多少（NT$）").fill("600")
  await form.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(form).toHaveCount(0)
  await page.getByRole("button", { name: "編輯債務", exact: true }).click()
  await expect(form.getByLabel("借了多少（NT$）")).toHaveValue("1000")
  await form.getByLabel("借了多少（NT$）").fill("1100")
  await form.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(form).toHaveCount(0)

  await page.getByRole("button", { name: "新增借款", exact: true }).click()
  await form.getByRole("combobox", { name: "記錄方式" }).click()
  await page.getByRole("option", { name: "建立新債務", exact: true }).click()
  await expect(form.getByLabel("跟誰借")).toHaveValue("加借測試親友")
  await expect(
    form.getByRole("combobox", { name: "約定還款方式" })
  ).toContainText("現金")
  await form.getByLabel("借了多少（NT$）").fill("200")
  await form.getByLabel("跟誰借").fill("加借測試親友（獨立）")
  await form.getByRole("button", { name: "儲存紀錄" }).click()
  await expect(form).toHaveCount(0)
  await page.getByRole("button", { name: "關閉債務明細" }).click()
  await expect(details).toHaveCount(2)
  await expect(
    page.getByRole("region", { name: "完整債務統計" })
  ).toContainText("$1,900")
  // Remove only records created by this test, through destructive confirmation.
  for (let i = 0; i < 2; i++) {
    await details.first().click()
    await page.getByRole("button", { name: "刪除債務", exact: true }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "確認刪除" })
      .click()
    await expect(page.getByRole("alertdialog")).toHaveCount(0)
  }
  await expect(page.getByText("從第一筆債務開始")).toBeVisible()
})

test("remember email and change password", async ({ page }, info) => {
  await page.goto("/login")
  await page
    .getByRole("textbox", { name: "電子郵件", exact: true })
    .fill("user@debt.test")
  await page.locator("#password").fill("debt-e2e-only-password")
  await page.getByRole("checkbox", { name: "記住帳號" }).check()
  await page.getByRole("button", { name: "登入", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "債務總覽", exact: true })
  ).toBeVisible()
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "開啟導覽選單" }).click()
  await page.getByRole("link", { name: "帳號設定", exact: true }).click()
  await expect(page.getByRole("heading", { name: "修改密碼" })).toBeVisible()
  await page.locator("#currentPassword").fill("wrong-password")
  await page.locator("#newPassword").fill("changed-e2e-password")
  await page.locator("#confirmPassword").fill("different")
  await page.getByRole("button", { name: "更新密碼" }).click()
  await expect(page.getByText("兩次密碼不一致")).toBeVisible()
  await page.locator("#confirmPassword").fill("changed-e2e-password")
  await page.getByRole("button", { name: "更新密碼" }).click()
  await expect(page.getByText("目前密碼不正確").first()).toBeVisible()
  await page.locator("#currentPassword").fill("debt-e2e-only-password")
  await page.getByRole("button", { name: "更新密碼" }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator("#email")).toHaveValue("user@debt.test")
  await expect(page.locator("#password")).toHaveValue("")
  await page.reload()
  await expect(page.locator("#email")).toHaveValue("user@debt.test")
  await page.getByRole("checkbox", { name: "記住帳號" }).uncheck()
  await page.reload()
  await expect(page.locator("#email")).toHaveValue("")
  await page.locator("#email").fill("user@debt.test")
  await page.locator("#password").fill("changed-e2e-password")
  await page.getByRole("button", { name: "登入", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "債務總覽", exact: true })
  ).toBeVisible()
  // Restore the isolated fixture for the next browser project.
  const restored = await page.request.post("/api/debt/auth/password", {
    headers: { "X-Debt-Request": "1", Origin: "http://localhost:17345" },
    data: {
      currentPassword: "changed-e2e-password",
      newPassword: "debt-e2e-only-password",
      confirmPassword: "debt-e2e-only-password",
    },
  })
  expect(restored.ok()).toBe(true)
})

test("account navigation, breadcrumbs and detailed loading states", async ({
  page,
}, info) => {
  let releaseAuth!: () => void
  const authGate = new Promise<void>((resolve) => {
    releaseAuth = resolve
  })
  await page.route("**/api/debt/auth/me", async (route) => {
    await authGate
    await route.continue()
  })
  await page.goto("/login")
  await expect(page.getByRole("status", { name: "正在載入內容" })).toBeVisible()
  expect(await page.locator('[data-slot="skeleton"]').count()).toBeGreaterThan(
    10
  )
  await noOverflow(page)
  releaseAuth()
  await expect(page.locator("#email")).toBeVisible()
  await page.unroute("**/api/debt/auth/me")
  await login(page, "admin@debt.test")
  await expect(
    page.getByRole("navigation", { name: "頁面路徑" })
  ).toContainText("債務總覽")
  if (info.project.name === "desktop") {
    const nav = await page
      .getByRole("navigation", { name: "主要導覽" })
      .boundingBox()
    const logout = await page
      .getByRole("button", { name: "登出", exact: true })
      .boundingBox()
    expect(logout!.x).toBeGreaterThan(nav!.x + nav!.width)
  } else await page.getByRole("button", { name: "開啟導覽選單" }).click()
  await page.getByRole("link", { name: "帳號設定", exact: true }).click()
  await expect(page.getByRole("heading", { name: "帳號資料" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "修改密碼" })).toBeVisible()
  await page.screenshot({
    path: `test-results/${info.project.name}-account-settings.png`,
    fullPage: true,
  })
  let releaseUsers!: () => void
  const usersGate = new Promise<void>((resolve) => {
    releaseUsers = resolve
  })
  await page.route("**/api/debt/admin/users", async (route) => {
    await usersGate
    await route.continue()
  })
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "開啟導覽選單" }).click()
  await page.getByRole("link", { name: "使用者管理", exact: true }).click()
  await expect(page.getByRole("status", { name: "正在載入內容" })).toBeVisible()
  await expect(page.getByRole("banner")).toBeVisible()
  expect(await page.locator('[data-slot="skeleton"]').count()).toBeGreaterThan(
    20
  )
  await page.screenshot({
    path: `test-results/${info.project.name}-users-skeleton.png`,
    fullPage: true,
  })
  releaseUsers()
  await expect(page.getByRole("heading", { name: "使用者管理" })).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "頁面路徑" })
  ).toContainText("使用者管理")
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 })
    await noOverflow(page)
  }
  await page.goto("/settings/users")
  await expect(page).toHaveURL(/\/admin$/)
})

test("personal name editing and separate administrator navigation", async ({
  page,
}, info) => {
  await login(page)
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "開啟導覽選單" }).click()
  await expect(
    page.getByRole("link", { name: "使用者管理", exact: true })
  ).toHaveCount(0)
  await page.getByRole("link", { name: "帳號設定", exact: true }).click()
  await expect(page.getByRole("tab")).toHaveCount(0)
  await page.getByRole("textbox", { name: "名稱", exact: true }).fill("   ")
  await page.getByRole("button", { name: "儲存名稱" }).click()
  await expect(page.getByText("請輸入名稱", { exact: true })).toBeVisible()
  const name = `更新名稱-${info.project.name}`
  await page.getByRole("textbox", { name: "名稱", exact: true }).fill(name)
  await page.getByRole("button", { name: "儲存名稱" }).click()
  await expect(page.getByText("帳號名稱已更新", { exact: true })).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("textbox", { name: "名稱", exact: true })
  ).toHaveValue(name)
  await expect(page.getByRole("heading", { name: "修改密碼" })).toBeVisible()
  await page.goto("/admin")
  await expect(page.getByText("無法存取此頁面", { exact: true })).toBeVisible()
})

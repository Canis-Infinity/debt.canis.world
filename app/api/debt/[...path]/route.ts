import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
const noStore = { "Cache-Control": "no-store" }
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  if (path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part)))
    return Response.json(
      { message: "無效的路徑" },
      { status: 400, headers: noStore }
    )
  const write = !["GET", "HEAD"].includes(request.method)
  if (write) {
    // Origin is compared to the public Host rather than forwarded host headers.
    const origin = request.headers.get("origin")
    let sameOrigin = false
    try {
      sameOrigin =
        !!origin && new URL(origin).host === request.headers.get("host")
    } catch {
      /* invalid Origin */
    }
    if (
      !sameOrigin ||
      request.headers.get("x-debt-request") !== "1" ||
      request.headers.get("sec-fetch-site") === "cross-site"
    ) {
      return Response.json(
        { message: "請由本站提交操作" },
        { status: 403, headers: noStore }
      )
    }
  }
  const base = process.env.INTERNAL_API_BASE_URL || "http://127.0.0.1:7344"
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Debt-Request": "1",
  })
  const cookie = request.cookies.get("debt_session")?.value
  if (cookie && /^[a-f0-9]{64}$/.test(cookie))
    headers.set("Cookie", `debt_session=${cookie}`)
  // Set on this server, never relay arbitrary client proxy headers.
  headers.set("X-Forwarded-Proto", request.nextUrl.protocol.replace(":", ""))
  try {
    const body = write ? await request.text() : undefined
    if (body && new TextEncoder().encode(body).length > 65536)
      return Response.json(
        { message: "資料過大" },
        { status: 413, headers: noStore }
      )
    const response = await fetch(`${base}/api/debt/${path.join("/")}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    })
    const resultHeaders = new Headers({
      ...noStore,
      "Content-Type": "application/json",
    })
    for (const value of response.headers.getSetCookie())
      resultHeaders.append("Set-Cookie", value)
    return new Response(await response.text(), {
      status: response.status,
      headers: resultHeaders,
    })
  } catch {
    return Response.json(
      { message: "暫時無法連線至服務，請稍後重試" },
      { status: 502, headers: noStore }
    )
  }
}
export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
}

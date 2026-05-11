/**
 * 纯函数：手机形态 + 竖屏 → 显示横屏引导（便于单测与 SSR 注入 UA）。
 */

const MOBILE_UA_RE = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i

export function isMobileUiCandidate(
  ua: string | undefined,
  userAgentDataMobile?: boolean | null
): boolean {
  const s = ua ?? ''
  /** UA 优先：Playwright / Chromium 可能在移动端 UA 下仍将 userAgentData.mobile 置为 false */
  if (MOBILE_UA_RE.test(s)) return true
  if (userAgentDataMobile === true) return true
  return false
}

/**
 * @param width 视口 CSS 宽度
 * @param height 视口 CSS 高度
 * @param ua `navigator.userAgent`（测试可注入）
 * @param userAgentDataMobile `navigator.userAgentData?.mobile`（Chromium Client Hints）
 */
export function shouldShowPortraitGate(
  width: number,
  height: number,
  ua?: string,
  userAgentDataMobile?: boolean | null
): boolean {
  if (!isMobileUiCandidate(ua, userAgentDataMobile)) return false
  return height > width
}

/** 手机形态且横屏（与 `html.layout--mobile-landscape` 判定一致） */
export function isMobileLandscapeViewport(
  width: number,
  height: number,
  ua?: string,
  userAgentDataMobile?: boolean | null
): boolean {
  if (!isMobileUiCandidate(ua, userAgentDataMobile)) return false
  return width >= height
}

/**
 * 手机横屏对局专用壳层是否启用（与竖屏引导互斥：竖屏时遮罩在上层，此值为 false）。
 * 判定与 `isMobileLandscapeViewport` 一致：移动候选且宽≥高。
 */
export function shouldUseMobileLandscapeGameShell(
  width: number,
  height: number,
  ua?: string,
  userAgentDataMobile?: boolean | null
): boolean {
  return isMobileLandscapeViewport(width, height, ua, userAgentDataMobile)
}

/**
 * 在浏览器开发者工具 Console 中粘贴运行（游戏界面打开时）。
 * 会打印「出牌」按钮中心点的 elementFromPoint 链，用于判断是否被遮挡。
 */
;(function diagnoseGuandanPlayButton() {
  const btn = document.querySelector('[data-testid="btn-play-cards"]')
  if (!btn) {
    console.warn('[diagnose] 未找到 .game-controls .control-btn.play')
    return
  }
  const r = btn.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const top = document.elementFromPoint(cx, cy)
  console.log('[diagnose] 出牌 disabled:', btn.disabled, 'rect:', r)
  console.log('[diagnose] elementFromPoint(', cx, ',', cy, '):', top)
  let el = top
  let i = 0
  while (el && i++ < 12) {
    const st = window.getComputedStyle(el)
    console.log(
      i,
      el.tagName,
      el.className,
      'z-index:',
      st.zIndex,
      'pointer-events:',
      st.pointerEvents,
      'position:',
      st.position,
    )
    el = el.parentElement
  }
})()

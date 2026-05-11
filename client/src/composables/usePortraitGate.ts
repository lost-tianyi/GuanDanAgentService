import { ref, onMounted, onUnmounted } from 'vue'
import { isMobileUiCandidate, shouldShowPortraitGate } from '@/utils/viewport'

type NavWithHints = Navigator & { userAgentData?: { mobile?: boolean } }

function readDimensions(): { w: number; h: number } {
  return {
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  }
}

function syncVisible(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const { w, h } = readDimensions()
  const nav = navigator as NavWithHints
  const clientHintsMobile = nav.userAgentData?.mobile
  return shouldShowPortraitGate(w, h, navigator.userAgent, clientHintsMobile)
}

/** 与 design 一致：手机横屏壳层用 `html` class 驱动全局 CSS（安全区、触控、密度） */
function applyRootLayoutShell(): void {
  if (typeof document === 'undefined') return
  const { w, h } = readDimensions()
  const nav = typeof navigator !== 'undefined' ? (navigator as NavWithHints) : undefined
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const mobile = isMobileUiCandidate(ua, nav?.userAgentData?.mobile)
  const landscape = w >= h
  const root = document.documentElement
  root.classList.toggle('layout--mobile', mobile)
  root.classList.toggle('layout--mobile-portrait', mobile && !landscape)
  root.classList.toggle('layout--mobile-landscape', mobile && landscape)
}

export function usePortraitGate() {
  const visible = ref(false)
  let orientationMq: MediaQueryList | null = null

  function update() {
    visible.value = syncVisible()
    applyRootLayoutShell()
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    orientationMq = window.matchMedia('(orientation: portrait)')
    orientationMq.addEventListener('change', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
    orientationMq?.removeEventListener('change', update)
    orientationMq = null
  })

  return { visible, update }
}

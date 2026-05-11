import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isMobileLandscapeViewport } from '@/utils/viewport'
import {
  computeUniformScale,
  MOBILE_LANDSCAPE_DESIGN_HEIGHT,
  MOBILE_LANDSCAPE_DESIGN_WIDTH,
  MOBILE_LANDSCAPE_VISUAL_COMPACT,
} from '@/utils/layout-scale'

type NavWithHints = Navigator & { userAgentData?: { mobile?: boolean } }

/**
 * 手机横屏时：将 #app 内主舞台设为固定逻辑分辨率并整体 scale，保持子布局相对关系；
 * 在「铺满视口」的 fit scale 上再乘 `MOBILE_LANDSCAPE_VISUAL_COMPACT`，整块 UI 等比略缩小、四周留白。
 * 非该模式下行内流式布局（宽 100%、min-height 100dvh）。
 */
export function useMobileLandscapeUniformScale() {
  const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
  const vh = ref(typeof window !== 'undefined' ? window.innerHeight : 0)

  function measure() {
    vw.value = window.innerWidth
    vh.value = window.innerHeight
  }

  const stageUniformActive = computed(() => {
    if (typeof navigator === 'undefined') return false
    const nav = navigator as NavWithHints
    return isMobileLandscapeViewport(
      vw.value,
      vh.value,
      nav.userAgent,
      nav.userAgentData?.mobile,
    )
  })

  const scale = computed(() => {
    if (!stageUniformActive.value) return 1
    const fit = computeUniformScale(
      vw.value,
      vh.value,
      MOBILE_LANDSCAPE_DESIGN_WIDTH,
      MOBILE_LANDSCAPE_DESIGN_HEIGHT,
    )
    return fit * MOBILE_LANDSCAPE_VISUAL_COMPACT
  })

  const stageInlineStyle = computed((): Record<string, string> => {
    if (!stageUniformActive.value) {
      return {
        width: '100%',
        minHeight: '100dvh',
      }
    }
    return {
      width: `${MOBILE_LANDSCAPE_DESIGN_WIDTH}px`,
      height: `${MOBILE_LANDSCAPE_DESIGN_HEIGHT}px`,
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `translate(-50%, -50%) scale(${scale.value})`,
      transformOrigin: 'center center',
    }
  })

  onMounted(() => {
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', measure)
    window.removeEventListener('orientationchange', measure)
  })

  return {
    stageUniformActive,
    scale,
    stageInlineStyle,
  }
}

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { shouldUseMobileLandscapeGameShell } from '@/utils/viewport'

function readHintsMobile(): boolean | null {
  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean }
  }
  const m = nav.userAgentData?.mobile
  return typeof m === 'boolean' ? m : null
}

/**
 * 是否使用手机横屏专用对局壳层（全幅 felt + 顶栏/底栏叠层）。
 */
export function useMobileLandscapeGameShellActive() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 0)

  function measure() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  const active = computed(() =>
    shouldUseMobileLandscapeGameShell(
      width.value,
      height.value,
      typeof navigator !== 'undefined' ? navigator.userAgent : '',
      readHintsMobile(),
    ),
  )

  onMounted(() => {
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', measure)
    window.removeEventListener('orientationchange', measure)
  })

  return { active }
}

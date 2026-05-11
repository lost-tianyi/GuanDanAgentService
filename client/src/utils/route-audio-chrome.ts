/** 非对局路由显示 App 层悬浮音频控件；对局路由改由 GameView 顶栏承载 */
export function showFloatingAudioChrome(routeName: string | symbol | null | undefined): boolean {
  return routeName !== 'game'
}

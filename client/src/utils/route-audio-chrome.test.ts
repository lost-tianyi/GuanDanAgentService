import { describe, expect, it } from 'vitest'
import { showFloatingAudioChrome } from './route-audio-chrome'

describe('showFloatingAudioChrome', () => {
  it('hides floating chrome on game route', () => {
    expect(showFloatingAudioChrome('game')).toBe(false)
  })

  it('shows floating chrome on home', () => {
    expect(showFloatingAudioChrome('home')).toBe(true)
  })

  it('shows floating chrome when route unknown', () => {
    expect(showFloatingAudioChrome(undefined)).toBe(true)
  })
})

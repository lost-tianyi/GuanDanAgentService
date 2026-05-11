import { describe, expect, it } from 'vitest'
import { isMobileUiCandidate, shouldShowPortraitGate } from './viewport'

const iphoneUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const desktopChromeUa =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

describe('isMobileUiCandidate', () => {
  it('returns true when userAgentData.mobile is true regardless of UA', () => {
    expect(isMobileUiCandidate(desktopChromeUa, true)).toBe(true)
  })

  it('mobile UA overrides inconsistent userAgentData.mobile false (Chromium / automation)', () => {
    expect(isMobileUiCandidate(iphoneUa, false)).toBe(true)
  })

  it('detects mobile from UA when hints absent', () => {
    expect(isMobileUiCandidate(iphoneUa, undefined)).toBe(true)
    expect(isMobileUiCandidate(desktopChromeUa, undefined)).toBe(false)
  })
})

describe('shouldShowPortraitGate', () => {
  it('mobile + portrait → gate', () => {
    expect(shouldShowPortraitGate(390, 844, iphoneUa)).toBe(true)
  })

  it('mobile + landscape → no gate', () => {
    expect(shouldShowPortraitGate(844, 390, iphoneUa)).toBe(false)
  })

  it('desktop + portrait → no gate', () => {
    expect(shouldShowPortraitGate(600, 900, desktopChromeUa)).toBe(false)
  })

  it('respects userAgentData.mobile when UA is desktop-class', () => {
    expect(shouldShowPortraitGate(390, 844, desktopChromeUa, true)).toBe(true)
    expect(shouldShowPortraitGate(390, 844, desktopChromeUa, false)).toBe(false)
  })

  it('iPhone UA shows portrait gate even if hints say non-mobile', () => {
    expect(shouldShowPortraitGate(390, 844, iphoneUa, false)).toBe(true)
  })
})

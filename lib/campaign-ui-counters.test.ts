import { describe, expect, it } from 'vitest'
import { computeCampaignUiCounters } from './campaign-ui-counters'

describe('computeCampaignUiCounters', () => {
  it('prefere o maior valor entre campaign e live (não regredir)', () => {
    const counters = computeCampaignUiCounters({
      campaign: { sent: 173, delivered: 165, read: 13, failed: 0 },
      live: { sent: 173, delivered: 50, read: 36, failed: 0 },
    })

    expect(counters.sent).toBe(173)
    // delivered não pode cair para 50
    expect(counters.delivered).toBe(165)
    // read deve refletir o maior observado
    expect(counters.read).toBe(36)
  })

  it('garante progressão: delivered >= read', () => {
    const counters = computeCampaignUiCounters({
      campaign: { delivered: 10, read: 12 },
      live: null,
    })

    expect(counters.read).toBe(12)
    expect(counters.delivered).toBeGreaterThanOrEqual(counters.read)
    expect(counters.delivered).toBe(12)
  })

  it('usa live quando live é maior que campaign', () => {
    const counters = computeCampaignUiCounters({
      campaign: { sent: 10, delivered: 5, read: 1, failed: 0 },
      live: { sent: 12, delivered: 6, read: 2, failed: 1 },
    })

    expect(counters.sent).toBe(12)
    expect(counters.delivered).toBe(6)
    expect(counters.read).toBe(2)
    expect(counters.failed).toBe(1)
  })
})

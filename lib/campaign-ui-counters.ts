export type CounterSnapshot = {
  sent?: number | null
  delivered?: number | null
  read?: number | null
  failed?: number | null
}

export function computeCampaignUiCounters(input: {
  campaign: CounterSnapshot
  live?: CounterSnapshot | null
}): { sent: number; delivered: number; read: number; failed: number } {
  const campaignSent = Number(input.campaign.sent ?? 0)
  const campaignDelivered = Number(input.campaign.delivered ?? 0)
  const campaignRead = Number(input.campaign.read ?? 0)
  const campaignFailed = Number(input.campaign.failed ?? 0)

  const liveSent = Number(input.live?.sent ?? 0)
  const liveDelivered = Number(input.live?.delivered ?? 0)
  const liveRead = Number(input.live?.read ?? 0)
  const liveFailed = Number(input.live?.failed ?? 0)

  const sent = Math.max(campaignSent, liveSent)
  const read = Math.max(campaignRead, liveRead)
  // Garantia de progressão: delivered >= read
  const delivered = Math.max(campaignDelivered, liveDelivered, read)
  const failed = Math.max(campaignFailed, liveFailed)

  return { sent, delivered, read, failed }
}

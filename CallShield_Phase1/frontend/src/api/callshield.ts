const API_BASE_URL = '/v1'

export type NumberIntelligence = {
  number: string
  status: string
  risk: {
    score: number
    classification: string
  }
  reports: number
  uniqueReporters: number
  campaigns: {
    id: string
    name: string
    status: string
  }[]
  carrier: string | null
  telecomRegion: string | null
  location: {
    value: string | null
    confidence: string
    source: string | null
  }
  intelligenceConfidence: string
}

export async function getNumberIntelligence(
  e164: string,
): Promise<NumberIntelligence> {
  const response = await fetch(
    `${API_BASE_URL}/numbers/${encodeURIComponent(e164)}`,
  )

  if (!response.ok) {
    throw new Error(`Number lookup failed: ${response.status}`)
  }

  return response.json()
}

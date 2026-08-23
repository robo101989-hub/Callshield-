const API_BASE_URL = '/v1'

export type NumberIntelligence = {
  number: string
  status: string
  blocked: boolean
  blockReason: string | null
  trusted: boolean
  trustNote: string | null
  risk: {
    score: number
    classification: string
  }
  reports: number
  uniqueReporters: number
  categoryCounts: Record<string, number>
  recentReports: { category: string; severity: string; description: string | null; createdAt: string }[]
  campaigns: {
    id: string
    name: string
    status: string
    confidence: number
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

export type ReportCategory =
  | 'UPI_FRAUD'
  | 'BANK_FRAUD'
  | 'POLICE_IMPERSONATION'
  | 'KYC_FRAUD'
  | 'LOAN_HARASSMENT'
  | 'JOB_SCAM'
  | 'INVESTMENT_SCAM'
  | 'DELIVERY_SCAM'
  | 'TECH_SUPPORT'
  | 'OTHER'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options)

  if (!response.ok) {
    let message = `Request failed: ${response.status}`

    try {
      const body = await response.json()
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  return response.json()
}

export function getNumberIntelligence(
  e164: string,
): Promise<NumberIntelligence> {
  return request<NumberIntelligence>(
    `${API_BASE_URL}/numbers/${encodeURIComponent(e164)}`,
  )
}

export function submitReport(
  e164: string,
  category: ReportCategory,
  severity: Severity,
  description?: string,
) {
  return request(
    `${API_BASE_URL}/numbers/${encodeURIComponent(e164)}/reports`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        severity,
        description,
      }),
    },
  )
}

export function blockNumber(
  e164: string,
  reason?: string,
) {
  return request(
    `${API_BASE_URL}/blocklist`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        e164,
        reason,
      }),
    },
  )
}

export function whitelistNumber(
  e164: string,
  note?: string,
) {
  return request(
    `${API_BASE_URL}/whitelist`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        e164,
        note,
      }),
    },
  )
}

export type CampaignNumber = {
  number: string
  status: string
  confidence: number
  riskScore: number
  intelligenceConfidence: string
  reports: number
}

export type CampaignSummary = {
  id: string
  name: string
  description: string | null
  status: string
  storedStatus: string
  createdAt: string
  updatedAt: string
  numberCount: number
  reportCount: number
  recentReportCount: number
  campaignRiskScore: number
  highRiskNumbers: number
  highConfidenceNumbers: number
  categoryCounts: Record<string, number>
  topCategories: { category: string; count: number }[]
  severityCounts: Record<string, number>
  firstSeen: string | null
  lastSeen: string | null
  intelligenceConfidence: string
  numbers: CampaignNumber[]
}

export type CampaignReport = {
  id: string
  category: string
  severity: string
  description: string | null
  createdAt: string
  reporterId: string | null
}

export type CampaignDetail = CampaignSummary & {
  recentReports: CampaignReport[]
}

export function getCampaigns(): Promise<CampaignSummary[]> {
  return request<CampaignSummary[]>(`${API_BASE_URL}/campaigns`)
}

export function getCampaign(
  campaignId: string,
): Promise<CampaignDetail> {
  return request<CampaignDetail>(
    `${API_BASE_URL}/campaigns/${encodeURIComponent(campaignId)}`,
  )
}

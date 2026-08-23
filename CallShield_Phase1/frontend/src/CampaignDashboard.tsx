import { useEffect, useState } from 'react'
import {
  getCampaign,
  getCampaigns,
  type CampaignDetail,
  type CampaignSummary,
} from './api/callshield'

type Props = {
  onBack: () => void
}

function riskClass(score: number) {
  if (score >= 75) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 25) return 'medium'
  return 'low'
}

function CampaignDashboard({ onBack }: Props) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [selected, setSelected] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCampaigns = async () => {
    setLoading(true)
    setError('')

    try {
      setCampaigns(await getCampaigns())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load campaigns.')
    } finally {
      setLoading(false)
    }
  }

  const openCampaign = async (id: string) => {
    setDetailLoading(true)
    setError('')

    try {
      setSelected(await getCampaign(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load campaign.')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    void loadCampaigns()
  }, [])

  const active = campaigns.filter((c) => c.status === 'ACTIVE').length
  const emerging = campaigns.filter((c) => c.status === 'EMERGING').length
  const declining = campaigns.filter((c) => c.status === 'DECLINING').length
  const totalReports = campaigns.reduce((sum, c) => sum + c.reportCount, 0)
  const highRisk = campaigns.reduce((sum, c) => sum + c.highRiskNumbers, 0)

  return (
    <main className="campaign-dashboard">
      <header className="dashboard-header">
        <div>
          <button className="back-button" onClick={onBack}>
            ← BACK TO NUMBER INTELLIGENCE
          </button>

          <div className="eyebrow">
            <span>03</span>
            THREAT OPERATIONS
          </div>

          <h1>
            Campaign
            <br />
            <em>Intelligence.</em>
          </h1>

          <p>
            Correlate scam numbers, reports and threat signals into
            investigation-ready intelligence.
          </p>
        </div>

        <button className="refresh-button" onClick={() => void loadCampaigns()}>
          ↻ REFRESH INTELLIGENCE
        </button>
      </header>

      {error && <div className="message error-message">{error}</div>}

      <section className="campaign-metrics">
        <div>
          <span>ACTIVE CAMPAIGNS</span>
          <strong>{active}</strong>
        </div>

        <div>
          <span>EMERGING</span>
          <strong>{emerging}</strong>
        </div>

        <div>
          <span>DECLINING</span>
          <strong>{declining}</strong>
        </div>

        <div>
          <span>THREAT REPORTS</span>
          <strong>{totalReports}</strong>
        </div>

        <div>
          <span>HIGH-RISK NUMBERS</span>
          <strong>{highRisk}</strong>
        </div>
      </section>

      {loading ? (
        <div className="dashboard-loading">
          <div className="scan-line" />
          <strong>Loading threat campaigns...</strong>
          <span>Correlating CallShield intelligence</span>
        </div>
      ) : (
        <section className="campaign-layout">
          <div className="campaign-list">
            <div className="section-title">
              <span>DETECTED CAMPAIGNS</span>
              <small>{campaigns.length} CAMPAIGNS</small>
            </div>

            {campaigns.length === 0 ? (
              <div className="empty-state">
                <strong>No campaigns detected</strong>
                <span>
                  Campaign intelligence will appear here as numbers become
                  correlated.
                </span>
              </div>
            ) : (
              campaigns.map((campaign) => {
                const cls = riskClass(campaign.campaignRiskScore)

                return (
                  <button
                    className={`campaign-row ${
                      selected?.id === campaign.id ? 'selected' : ''
                    }`}
                    key={campaign.id}
                    onClick={() => void openCampaign(campaign.id)}
                  >
                    <div className={`campaign-risk ${cls}`}>
                      {campaign.campaignRiskScore}
                    </div>

                    <div className="campaign-main">
                      <div className="campaign-heading">
                        <strong>{campaign.name}</strong>
                        <span className={`campaign-status ${campaign.status.toLowerCase()}`}>
                          {campaign.status}
                        </span>
                      </div>

                      <p>{campaign.description || 'No campaign description.'}</p>

                      <div className="campaign-meta">
                        <span>{campaign.numberCount} numbers</span>
                        <span>{campaign.reportCount} reports</span>
                        <span>{campaign.intelligenceConfidence} confidence</span>
                      </div>
                    </div>

                    <span className="campaign-arrow">→</span>
                  </button>
                )
              })
            )}
          </div>

          <div className="campaign-detail">
            {detailLoading ? (
              <div className="dashboard-loading">
                <div className="scan-line" />
                <strong>Analyzing campaign...</strong>
                <span>Building threat picture</span>
              </div>
            ) : selected ? (
              <>
                <div className="detail-heading">
                  <div>
                    <span className="label">CAMPAIGN INTELLIGENCE</span>
                    <h2>{selected.name}</h2>
                    <p>{selected.description}</p>
                  </div>

                  <div
                    className={`campaign-score ${riskClass(
                      selected.campaignRiskScore,
                    )}`}
                  >
                    <span>RISK</span>
                    <strong>{selected.campaignRiskScore}</strong>
                    <small>/100</small>
                  </div>
                </div>

                <div className="detail-stats">
                  <div>
                    <span>STATUS</span>
                    <strong>{selected.status}</strong>
                  </div>

                  <div>
                    <span>NUMBERS</span>
                    <strong>{selected.numberCount}</strong>
                  </div>

                  <div>
                    <span>REPORTS</span>
                    <strong>{selected.reportCount}</strong>
                  </div>

                  <div>
                    <span>HIGH RISK</span>
                    <strong>{selected.highRiskNumbers}</strong>
                  </div>
                </div>

                <div className="intelligence-section">
                  <div className="section-title">
                    <span>ASSOCIATED NUMBERS</span>
                    <small>THREAT GRAPH</small>
                  </div>

                  <div className="number-list">
                    {selected.numbers.map((item) => (
                      <div className="campaign-number" key={item.number}>
                        <div>
                          <strong>{item.number}</strong>
                          <span>
                            {item.reports} reports · {item.intelligenceConfidence}{' '}
                            confidence
                          </span>
                        </div>

                        <div className={`number-risk ${riskClass(item.riskScore)}`}>
                          <strong>{item.riskScore}</strong>
                          <span>{item.status.replaceAll('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="intelligence-section">
                  <div className="section-title">
                    <span>THREAT PATTERNS</span>
                    <small>CATEGORY DISTRIBUTION</small>
                  </div>

                  <div className="pattern-list">
                    {selected.topCategories.map((item) => (
                      <div className="pattern-row" key={item.category}>
                        <span>{item.category.replaceAll('_', ' ')}</span>
                        <strong>{item.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="intelligence-section">
                  <div className="section-title">
                    <span>RECENT REPORTS</span>
                    <small>LIVE INTELLIGENCE</small>
                  </div>

                  <div className="report-list">
                    {selected.recentReports.length === 0 ? (
                      <div className="empty-state">
                        <span>No reports associated with this campaign.</span>
                      </div>
                    ) : (
                      selected.recentReports.map((report) => (
                        <div className="report-item" key={report.id}>
                          <div className="report-marker">
                            <i />
                          </div>

                          <div className="report-content">
                            <div className="report-heading">
                              <strong>
                                {report.category.replaceAll('_', ' ')}
                              </strong>
                              <span>{report.severity}</span>
                            </div>

                            {report.description && <p>{report.description}</p>}

                            <small>
                              {new Date(report.createdAt).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="campaign-placeholder">
                <div>◈</div>
                <strong>Select a campaign</strong>
                <span>
                  Choose a detected campaign to inspect its numbers,
                  reports and threat signals.
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  )
}

export default CampaignDashboard

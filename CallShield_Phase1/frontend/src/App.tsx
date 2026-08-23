import { useEffect, useState } from 'react'
import './App.css'
import ProtectionDashboard from './ProtectionDashboard'
import {
  blockNumber,
  getNumberIntelligence,
  getCampaigns,
  submitReport,
  whitelistNumber,
  type CampaignSummary,
  type NumberIntelligence,
  type ReportCategory,
  type Severity,
} from './api/callshield'

const categories: { value: ReportCategory; label: string }[] = [
  { value: 'UPI_FRAUD', label: 'UPI Fraud' },
  { value: 'BANK_FRAUD', label: 'Bank Fraud' },
  { value: 'POLICE_IMPERSONATION', label: 'Police Impersonation' },
  { value: 'KYC_FRAUD', label: 'KYC Fraud' },
  { value: 'LOAN_HARASSMENT', label: 'Loan Harassment' },
  { value: 'JOB_SCAM', label: 'Job Scam' },
  { value: 'INVESTMENT_SCAM', label: 'Investment Scam' },
  { value: 'DELIVERY_SCAM', label: 'Delivery Scam' },
  { value: 'TECH_SUPPORT', label: 'Tech Support' },
  { value: 'OTHER', label: 'Other' },
]

const severities: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function App() {
  const [view, setView] = useState<'protection' | 'intelligence'>('protection')
  const [number, setNumber] = useState('')
  const [searchedNumber, setSearchedNumber] = useState('')
  const [result, setResult] = useState<NumberIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<ReportCategory>('UPI_FRAUD')
  const [severity, setSeverity] = useState<Severity>('HIGH')
  const [description, setDescription] = useState('')
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsError, setCampaignsError] = useState('')

  useEffect(() => {
    let active = true

    const loadCampaigns = async () => {
      setCampaignsLoading(true)
      setCampaignsError('')

      try {
        const data = await getCampaigns()
        if (active) {
          setCampaigns(data)
        }
      } catch (err) {
        if (active) {
          setCampaignsError(
            err instanceof Error
              ? err.message
              : 'Unable to load campaign intelligence.',
          )
        }
      } finally {
        if (active) {
          setCampaignsLoading(false)
        }
      }
    }

    loadCampaigns()

    return () => {
      active = false
    }
  }, [])

  const searchNumber = async () => {
    const value = number.trim().replace(/[^0-9+]/g, '')

    if (!value) {
      setError('Enter a phone number first.')
      return
    }

    setSearchedNumber(value)
    setResult(null)
    setError('')
    setMessage('')
    setLoading(true)

    try {
      setResult(await getNumberIntelligence(value))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check this number.')
    } finally {
      setLoading(false)
    }
  }

  const refreshIntelligence = async () => {
    if (!searchedNumber) return
    setResult(await getNumberIntelligence(searchedNumber))
  }

  const reportNumber = async () => {
    if (!searchedNumber) return

    setActionLoading('report')
    setError('')
    setMessage('')

    try {
      await submitReport(
        searchedNumber,
        category,
        severity,
        description.trim() || undefined,
      )
      setMessage('Report received. CallShield intelligence updated.')
      setDescription('')
      await refreshIntelligence()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the report.')
    } finally {
      setActionLoading('')
    }
  }

  const block = async () => {
    if (!searchedNumber) return

    setActionLoading('block')
    setError('')
    setMessage('')

    try {
      await blockNumber(searchedNumber, 'Blocked from CallShield')
      setMessage('Number blocked by CallShield.')
      await refreshIntelligence()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to block this number.')
    } finally {
      setActionLoading('')
    }
  }

  const whitelist = async () => {
    if (!searchedNumber) return

    setActionLoading('whitelist')
    setError('')
    setMessage('')

    try {
      await whitelistNumber(searchedNumber, 'Trusted by CallShield user')
      setMessage('Number added to your trusted list.')
      await refreshIntelligence()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to whitelist this number.')
    } finally {
      setActionLoading('')
    }
  }

  const riskScore = result?.risk.score ?? 0
  const riskLevel = result?.risk.classification?.replace(/_RISK$/, "").replace(/_/g, " ") ?? "UNKNOWN"
  const riskClass = riskLevel.toLowerCase().replace(/ /g, "-")

  const openIntelligence = (
    selectedNumber: string,
    intelligence: NumberIntelligence,
  ) => {
    setNumber(selectedNumber)
    setSearchedNumber(selectedNumber)
    setResult(intelligence)
    setError('')
    setMessage('')
    setView('intelligence')
  }

  return (
    <>
      {view === 'protection' ? (
        <ProtectionDashboard onOpenIntelligence={openIntelligence} />
      ) : (
        <main className="app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="navbar">
        <div className="brand">
          <div className="brand-mark">
            <span>◈</span>
          </div>

          <div>
            <strong>CALLSHIELD</strong>
            <span>REAL-TIME THREAT INTELLIGENCE</span>
          </div>
        </div>

        <div className="live-indicator">
          <i />
          PROTECTION ENGINE ONLINE
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="eyebrow">
            <span>01</span>
            DIGITAL SHIELD
          </div>

          <h1>
            Don't just answer.
            <br />
            <em>Know who is calling.</em>
          </h1>

          <p className="hero-copy">
            CallShield turns phone intelligence into real-time protection.
            Check a number, understand the threat, and take action before
            a scammer gets your trust.
          </p>

          <div className="search-box">
            <div className="search-icon">⌕</div>

            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchNumber()
              }}
            />

            <button onClick={searchNumber} disabled={loading}>
              {loading ? 'ANALYZING...' : 'CHECK NUMBER'}
              <span>→</span>
            </button>
          </div>

          <div className="trust-line">
            <span>●</span>
            Intelligence-powered protection
            <span>•</span>
            Built to protect people
          </div>

          {searchedNumber && (
            <section className="intelligence-card">
              <div className="card-topline">
                <div>
                  <span className="label">NUMBER ANALYZED</span>
                  <strong>{searchedNumber}</strong>
                </div>

                <div className={`status-pill ${riskClass}`}>
                  <i />
                  {riskLevel} RISK
                </div>
              </div>

              {error && <div className="message error-message">{error}</div>}
              {message && <div className="message success-message">{message}</div>}

              {loading && (
                <div className="analysis-state">
                  <div className="scan-line" />
                  <strong>Analyzing CallShield intelligence...</strong>
                  <span>Checking reputation, reports and threat signals</span>
                </div>
              )}

              {result && (
                <>
                  <div className="risk-display">
                    <div className={`risk-orb ${riskClass}`}>
                      <div className="orb-inner">
                        <span>RISK</span>
                        <strong>{riskScore}</strong>
                        <small>/ 100</small>
                      </div>
                    </div>

                    <div className="risk-details">
                      <span className="label">THREAT ASSESSMENT</span>
                      <h2>{riskLevel} RISK</h2>
                      <p>
                        {result.blocked
                          ? 'This number is blocked by CallShield based on available intelligence.'
                          : result.trusted
                            ? 'This number is marked as trusted by a CallShield user.'
                            : riskScore >= 75
                              ? 'CallShield has detected strong indicators of malicious activity.'
                              : riskScore >= 50
                                ? 'Multiple signals indicate this number may be unsafe.'
                                : result.reports >= 3
                                  ? 'Multiple community reports indicate suspicious activity.'
                                  : 'No significant threat signals have been detected yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="trust-status-grid">
                    <div className={`trust-status ${result.blocked ? 'active-danger' : ''}`}>
                      <span>BLOCKLIST</span>
                      <strong>{result.blocked ? 'BLOCKED' : 'NOT BLOCKED'}</strong>
                      {result.blockReason && <small>{result.blockReason}</small>}
                    </div>

                    <div className={`trust-status ${result.trusted ? 'active-safe' : ''}`}>
                      <span>TRUST STATUS</span>
                      <strong>{result.trusted ? 'TRUSTED' : 'NOT TRUSTED'}</strong>
                      {result.trustNote && <small>{result.trustNote}</small>}
                    </div>
                  </div>

                  <div className="signal-grid">
                    <div className="signal">
                      <span>REPORTS</span>
                      <strong>{result.reports}</strong>
                    </div>

                    <div className="signal">
                      <span>CONFIDENCE</span>
                      <strong>{result.intelligenceConfidence}</strong>
                    </div>

                    <div className="signal">
                      <span>STATUS</span>
                      <strong>{result.status}</strong>
                    </div>

                    <div className="signal">
                      <span>LOCATION</span>
                      <strong>{result.location.value ?? 'UNKNOWN'}</strong>
                    </div>
                  </div>

                  {Object.keys(result.categoryCounts).length > 0 && (
                    <div className="intelligence-section">
                      <div className="section-title">
                        <span>THREAT PATTERNS</span>
                        <small>COMMUNITY SIGNALS</small>
                      </div>

                      <div className="category-list">
                        {Object.entries(result.categoryCounts).map(([name, count]) => (
                          <div className="category-row" key={name}>
                            <div>
                              <i />
                              <strong>{name.replaceAll('_', ' ')}</strong>
                            </div>
                            <span>{count} reports</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.recentReports.length > 0 && (
                    <div className="intelligence-section">
                      <div className="section-title">
                        <span>RECENT INTELLIGENCE</span>
                        <small>LIVE REPORT HISTORY</small>
                      </div>

                      <div className="report-list">
                        {result.recentReports.map((report, index) => (
                          <div className="report-item" key={`${report.createdAt}-${index}`}>
                            <div className="report-marker">
                              <i />
                            </div>

                            <div className="report-content">
                              <div className="report-heading">
                                <strong>{report.category.replaceAll('_', ' ')}</strong>
                                <span>{report.severity}</span>
                              </div>

                              {report.description && (
                                <p>{report.description}</p>
                              )}

                              <small>
                                {new Date(report.createdAt).toLocaleString()}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="intelligence-section">
                    <div className="section-title">
                      <span>AVAILABLE SIGNALS</span>
                      <small>CALLSHIELD INTELLIGENCE GRAPH</small>
                    </div>

                    <div className="details-grid">
                      <div>
                        <span>Carrier</span>
                        <strong>{result.carrier ?? 'Unknown'}</strong>
                      </div>

                      <div>
                        <span>Telecom Region</span>
                        <strong>{result.telecomRegion ?? 'Unknown'}</strong>
                      </div>

                      <div>
                        <span>Location Confidence</span>
                        <strong>{result.location.confidence}</strong>
                      </div>

                      <div>
                        <span>Unique Reporters</span>
                        <strong>{result.uniqueReporters}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="protect-section">
                    <div>
                      <span className="label">PROTECTION ACTIONS</span>
                      <h3>What do you want CallShield to do?</h3>
                    </div>

                    <div className="action-buttons">
                      <button
                        className="danger-button"
                        onClick={block}
                        disabled={actionLoading !== ''}
                      >
                        {actionLoading === 'block' ? 'BLOCKING...' : 'BLOCK NUMBER'}
                      </button>

                      <button
                        className="safe-button"
                        onClick={whitelist}
                        disabled={actionLoading !== ''}
                      >
                        {actionLoading === 'whitelist' ? 'SAVING...' : 'TRUST NUMBER'}
                      </button>
                    </div>
                  </div>

                  <div className="report-panel">
                    <div className="section-title">
                      <span>HELP THE NETWORK</span>
                      <small>REPORT SUSPICIOUS ACTIVITY</small>
                    </div>

                    <div className="form-grid">
                      <label>
                        SCAM CATEGORY
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ReportCategory)}
                        >
                          {categories.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        SEVERITY
                        <select
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value as Severity)}
                        >
                          {severities.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      WHAT HAPPENED?
                      <textarea
                        rows={4}
                        maxLength={2000}
                        placeholder="Describe the suspicious activity..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </label>

                    <button
                      className="report-button"
                      onClick={reportNumber}
                      disabled={actionLoading !== ''}
                    >
                      {actionLoading === 'report'
                        ? 'SUBMITTING...'
                        : 'SUBMIT INTELLIGENCE →'}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </section>

      <section className="campaign-section">
        <div className="eyebrow">
          <span>03</span>
          SCAM CAMPAIGN INTELLIGENCE
        </div>

        <div className="campaign-heading">
          <div>
            <h2>
              See the attack
              <br />
              <em>behind the number.</em>
            </h2>
            <p>
              CallShield correlates reported numbers into emerging scam
              campaigns so investigators can understand patterns instead of
              isolated calls.
            </p>
          </div>

          <div className="campaign-live">
            <i />
            LIVE INTELLIGENCE
          </div>
        </div>

        {campaignsError && (
          <div className="message error-message">{campaignsError}</div>
        )}

        {campaignsLoading ? (
          <div className="campaign-loading">
            <div className="scan-line" />
            <strong>Loading campaign intelligence...</strong>
            <span>Correlating numbers, reports and threat signals</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="campaign-empty">
            <strong>No scam campaigns detected yet.</strong>
            <span>Campaign intelligence will appear as numbers become correlated.</span>
          </div>
        ) : (
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <article className="campaign-card" key={campaign.id}>
                <div className="campaign-card-top">
                  <div>
                    <span className="label">CAMPAIGN</span>
                    <h3>{campaign.name}</h3>
                  </div>

                  <span className={`campaign-status ${campaign.status.toLowerCase()}`}>
                    {campaign.status}
                  </span>
                </div>

                {campaign.description && (
                  <p className="campaign-description">{campaign.description}</p>
                )}

                <div className="campaign-risk">
                  <div>
                    <span className="label">CAMPAIGN RISK</span>
                    <strong>{campaign.campaignRiskScore}<small>/100</small></strong>
                  </div>

                  <div>
                    <span className="label">CONFIDENCE</span>
                    <strong>{campaign.intelligenceConfidence}</strong>
                  </div>
                </div>

                <div className="campaign-stats">
                  <div>
                    <span>NUMBERS</span>
                    <strong>{campaign.numberCount}</strong>
                  </div>
                  <div>
                    <span>REPORTS</span>
                    <strong>{campaign.reportCount}</strong>
                  </div>
                  <div>
                    <span>HIGH RISK</span>
                    <strong>{campaign.highRiskNumbers}</strong>
                  </div>
                  <div>
                    <span>RECENT</span>
                    <strong>{campaign.recentReportCount}</strong>
                  </div>
                </div>

                <div className="campaign-numbers">
                  <div className="section-title">
                    <span>LINKED NUMBERS</span>
                    <small>THREAT GRAPH</small>
                  </div>

                  {campaign.numbers.map((item) => (
                    <div className="campaign-number" key={item.number}>
                      <div>
                        <strong>{item.number}</strong>
                        <small>
                          {item.reports} reports · {item.intelligenceConfidence} confidence
                        </small>
                      </div>

                      <div className="campaign-number-risk">
                        <strong>{item.riskScore}</strong>
                        <span>{item.status.replaceAll('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {campaign.topCategories.length > 0 && (
                  <div className="campaign-categories">
                    <div className="section-title">
                      <span>TOP ATTACK PATTERNS</span>
                      <small>REPORT CORRELATION</small>
                    </div>

                    {campaign.topCategories.slice(0, 3).map((item) => (
                      <div className="campaign-category" key={item.category}>
                        <span>{item.category.replaceAll('_', ' ')}</span>
                        <strong>{item.count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="vision-section">
        <div className="eyebrow">
          <span>02</span>
          THE CALLSHIELD NETWORK
        </div>

        <h2>
          Protection gets stronger
          <br />
          <em>with every signal.</em>
        </h2>

        <div className="vision-grid">
          <article>
            <span>01</span>
            <h3>Detect</h3>
            <p>Identify suspicious numbers and emerging scam patterns.</p>
          </article>

          <article>
            <span>02</span>
            <h3>Correlate</h3>
            <p>Connect numbers, reports and campaigns into threat intelligence.</p>
          </article>

          <article>
            <span>03</span>
            <h3>Protect</h3>
            <p>Give people a clear warning and the right action at the right time.</p>
          </article>

          <article>
            <span>04</span>
            <h3>Investigate</h3>
            <p>Preserve legitimate evidence and build investigation-ready incident records.</p>
          </article>
        </div>
      </section>

      <footer>
        <div>
          <strong>CALLSHIELD</strong>
          <span>REAL-TIME DIGITAL PROTECTION</span>
        </div>

        <span>PHASE 1 · INTELLIGENCE ENGINE</span>
      </footer>
        </main>
      )}
    </>
  )
}

export default App

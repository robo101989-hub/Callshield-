import { useState } from 'react'
import './App.css'
import {
  blockNumber,
  getNumberIntelligence,
  submitReport,
  whitelistNumber,
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

const severities: Severity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]

function App() {
  const [number, setNumber] = useState('')
  const [searchedNumber, setSearchedNumber] = useState('')
  const [result, setResult] = useState<NumberIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [category, setCategory] =
    useState<ReportCategory>('UPI_FRAUD')
  const [severity, setSeverity] =
    useState<Severity>('HIGH')
  const [description, setDescription] = useState('')

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
      const data = await getNumberIntelligence(value)
      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to check this number.',
      )
    } finally {
      setLoading(false)
    }
  }

  const refreshIntelligence = async () => {
    if (!searchedNumber) return

    const data = await getNumberIntelligence(searchedNumber)
    setResult(data)
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

      setMessage('Report submitted successfully.')
      setDescription('')

      await refreshIntelligence()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit the report.',
      )
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
      await blockNumber(
        searchedNumber,
        'Blocked from CallShield Phase 1',
      )

      setMessage('Number added to the CallShield blocklist.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to block this number.',
      )
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
      await whitelistNumber(
        searchedNumber,
        'Trusted by CallShield user',
      )

      setMessage('Number added to the CallShield whitelist.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to whitelist this number.',
      )
    } finally {
      setActionLoading('')
    }
  }

  const riskClass =
    result?.risk.classification?.toLowerCase().replace(/\s+/g, '-') ?? ''

  const riskLevel = result ? (result.risk.score >= 75 ? 'CRITICAL' : result.risk.score >= 50 ? 'HIGH' : result.risk.score >= 25 ? 'MEDIUM' : 'LOW') : ''

  return (
    <main className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CallShield</strong>
            <span>Phone Intelligence</span>
          </div>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#lookup">Number Lookup</a>
          <a href="#report">Report</a>
        </nav>
      </header>

      <section id="home" className="hero-section">
        <div className="hero-content">
          <div className="badge">CALLSHIELD INTELLIGENCE</div>

          <h1>
            Know who's calling.
            <br />
            Stay protected.
          </h1>

          <p>
            Check a phone number against CallShield intelligence,
            understand its risk level, and report suspicious calls.
          </p>

          <div id="lookup" className="search-box">
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchNumber()
              }}
            />

            <button
              onClick={searchNumber}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Number'}
            </button>
          </div>

          {searchedNumber && (
            <div className="result-card">
              <span>Number checked</span>
              <strong>{searchedNumber}</strong>

              {loading && (
                <p>Checking CallShield intelligence...</p>
              )}

              {error && (
                <p className="error-message">{error}</p>
              )}

              {message && (
                <p className="success-message">{message}</p>
              )}

              {result && (
                <>
                  <div className="risk-summary risk-summary-enhanced">
                    <div>
                      <span>Risk score</span>
                      <strong>{result.risk.score}/100</strong><small className="risk-level">{riskLevel} RISK</small>
                    </div>

                    <div>
                      <span>Classification</span>
                      <strong className={`risk-${riskClass}`}>
                        {result.risk.classification}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>{result.status}</strong>
                    </div>
                  </div>

                  <div className="intelligence-result">
                    <p>
                      <strong>Reports:</strong>{' '}
                      {result.reports}
                    </p>

                    <p>
                      <strong>Unique Reporters:</strong>{' '}
                      {result.uniqueReporters}
                    </p>

                    <p>
                      <strong>Intelligence Confidence:</strong>{' '}
                      {result.intelligenceConfidence}
                    </p>

                    <p>
                      <strong>Carrier:</strong>{' '}
                      {result.carrier ?? 'Unknown'}
                    </p>

                    <p>
                      <strong>Telecom Region:</strong>{' '}
                      {result.telecomRegion ?? 'Unknown'}
                    </p>

                    <p>
                      <strong>Location:</strong>{' '}
                      {result.location.value ?? 'Unknown'}
                    </p>

                    <p>
                      <strong>Location Confidence:</strong>{' '}
                      {result.location.confidence}
                    </p>

                    {result.campaigns.length > 0 && (
                      <div>
                        <strong>Scam Campaigns:</strong>

                        {result.campaigns.map((campaign) => (
                          <p key={campaign.id}>
                            {campaign.name} — {campaign.status}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="actions">
                    <h3>Protect this number</h3>

                    <div className="action-buttons">
                      <button
                        className="danger-button"
                        onClick={block}
                        disabled={actionLoading !== ''}
                      >
                        {actionLoading === 'block'
                          ? 'Blocking...'
                          : 'Block Number'}
                      </button>

                      <button
                        className="safe-button"
                        onClick={whitelist}
                        disabled={actionLoading !== ''}
                      >
                        {actionLoading === 'whitelist'
                          ? 'Saving...'
                          : 'Whitelist Number'}
                      </button>
                    </div>
                  </div>

                  <div id="report" className="report-panel">
                    <h3>Report this number</h3>

                    <div className="form-grid">
                      <label>
                        Scam category
                        <select
                          value={category}
                          onChange={(e) =>
                            setCategory(
                              e.target.value as ReportCategory,
                            )
                          }
                        >
                          {categories.map((item) => (
                            <option
                              key={item.value}
                              value={item.value}
                            >
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Severity
                        <select
                          value={severity}
                          onChange={(e) =>
                            setSeverity(
                              e.target.value as Severity,
                            )
                          }
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
                      Description (optional)
                      <textarea
                        rows={4}
                        maxLength={2000}
                        placeholder="Describe what happened..."
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value)
                        }
                      />
                    </label>

                    <button
                      className="report-button"
                      onClick={reportNumber}
                      disabled={actionLoading !== ''}
                    >
                      {actionLoading === 'report'
                        ? 'Submitting...'
                        : 'Submit Report'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="features">
        <div className="section-heading">
          <span>PROTECTION TOOLS</span>
          <h2>CallShield Phase 1</h2>
        </div>

        <div className="feature-grid">
          <article>
            <div className="feature-icon">⌕</div>
            <h3>Number Intelligence</h3>
            <p>
              Check risk score, classification, reports,
              campaigns, and intelligence confidence.
            </p>
          </article>

          <article>
            <div className="feature-icon">!</div>
            <h3>Report a Number</h3>
            <p>
              Help the community identify suspicious and
              fraudulent phone numbers.
            </p>
          </article>

          <article>
            <div className="feature-icon">✓</div>
            <h3>Block & Whitelist</h3>
            <p>
              Manage numbers that should be blocked or trusted.
            </p>
          </article>
        </div>
      </section>

      <footer>
        <strong>CallShield</strong>
        <span>Phase 1 Intelligence Platform</span>
      </footer>
    </main>
  )
}

export default App

import { useState } from 'react'
import {
  blockNumber,
  getNumberIntelligence,
  submitReport,
  whitelistNumber,
  type NumberIntelligence,
  type ReportCategory,
  type Severity,
} from './api/callshield'

function ProtectionDashboard() {
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkedNumber, setCheckedNumber] = useState('')
  const [result, setResult] = useState<NumberIntelligence | null>(null)
  const [actionLoading, setActionLoading] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [category, setCategory] = useState<ReportCategory>('UPI_FRAUD')
  const [severity, setSeverity] = useState<Severity>('HIGH')
  const [description, setDescription] = useState('')

  const block = async () => {
    if (!checkedNumber) return

    setActionLoading('block')
    setActionMessage('')
    setActionError('')

    try {
      await blockNumber(checkedNumber, 'Blocked from CallShield')
      setActionMessage('Number blocked by CallShield.')
      const intelligence = await getNumberIntelligence(checkedNumber)
      setResult(intelligence)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to block this number.',
      )
    } finally {
      setActionLoading('')
    }
  }

  const whitelist = async () => {
    if (!checkedNumber) return

    setActionLoading('whitelist')
    setActionMessage('')
    setActionError('')

    try {
      await whitelistNumber(checkedNumber, 'Trusted by CallShield user')
      setActionMessage('Number added to your trusted list.')
      const intelligence = await getNumberIntelligence(checkedNumber)
      setResult(intelligence)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to trust this number.',
      )
    } finally {
      setActionLoading('')
    }
  }

  const reportNumber = async () => {
    if (!checkedNumber) return

    setActionLoading('report')
    setActionMessage('')
    setActionError('')

    try {
      await submitReport(
        checkedNumber,
        category,
        severity,
        description.trim() || undefined,
      )
      setActionMessage('Report received. CallShield intelligence updated.')
      setDescription('')
      const intelligence = await getNumberIntelligence(checkedNumber)
      setResult(intelligence)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to submit the report.',
      )
    } finally {
      setActionLoading('')
    }
  }

  const checkNumber = async () => {
    const value = number.trim().replace(/[^0-9+]/g, '')

    if (!value) {
      setError('Enter a phone number first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const intelligence = await getNumberIntelligence(value)
      setCheckedNumber(value)
      setResult(intelligence)
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

  return (
    <main className="protection-dashboard">
      <header className="protection-header">
        <div className="protection-brand">
          <div className="protection-logo">◈</div>

          <div>
            <strong>CALLSHIELD</strong>
            <span>PERSONAL CALL PROTECTION</span>
          </div>
        </div>

        <div className="protection-status">
          <i />
          PROTECTION ENGINE ONLINE
        </div>
      </header>

      <section className="protection-hero">
        <div className="protection-eyebrow">
          <span>CALL PROTECTION</span>
          <i />
          LIVE
        </div>

        <h1>
          Know the risk
          <br />
          <em>before you trust the caller.</em>
        </h1>

        <p>
          Check a phone number against CallShield's threat intelligence
          network before returning a call, sending money, or sharing
          sensitive information.
        </p>

        <div className="protection-search">
          <span>⌕</span>

          <input
            type="tel"
            value={number}
            placeholder="+91 98765 43210"
            onChange={(event) => setNumber(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                checkNumber()
              }
            }}
          />

          <button onClick={checkNumber} disabled={loading}>
            {loading ? 'CHECKING...' : 'CHECK NUMBER'}
            <span>→</span>
          </button>
        </div>

        {error && <div className="protection-error">{error}</div>}

        <div className="protection-note">
          <span>●</span>
          Community-powered threat intelligence
        </div>

        {result && (
          <section className={`protection-result protection-result-${result.risk.classification.toLowerCase()}`}>
            <div className="protection-result-header">
              <div>
                <span className="card-label">CALLSHIELD PROTECTION RESULT</span>
                <strong>{checkedNumber}</strong>
              </div>

              <div className="protection-risk-badge">
                <span>{result.risk.classification}</span>
                <strong>{result.risk.score}/100</strong>
              </div>
            </div>

            <div className="protection-result-body">
              <div>
                <span className="result-label">THREAT ASSESSMENT</span>
                <h2>
                  {result.risk.classification === 'DANGEROUS'
                    ? 'Do not trust this caller.'
                    : result.risk.classification === 'HIGH_RISK'
                      ? 'High risk detected.'
                      : 'No immediate high-risk signal detected.'}
                </h2>

                <p>
                  {result.risk.classification === 'DANGEROUS'
                    ? 'CallShield detected strong indicators of malicious activity from community reports and threat intelligence.'
                    : 'CallShield has analyzed the available reputation, reports and threat signals for this number.'}
                </p>
              </div>

              <div className="protection-result-stats">
                <div>
                  <span>CONFIDENCE</span>
                  <strong>{result.intelligenceConfidence}</strong>
                </div>

                <div>
                  <span>REPORTS</span>
                  <strong>{result.reports}</strong>
                </div>

                <div>
                  <span>CAMPAIGNS</span>
                  <strong>{result.campaigns.length}</strong>
                </div>
              </div>
            </div>

            {result.campaigns.length > 0 && (
              <div className="protection-campaign-signal">
                <span>SCAM CAMPAIGN SIGNAL</span>
                <strong>{result.campaigns[0].name}</strong>
                <small>
                  {result.campaigns[0].confidence}% confidence · {result.campaigns[0].status}
                </small>
              </div>
            )}

            <div className="protection-result-actions">
              <button
                className="danger-action"
                onClick={block}
                disabled={actionLoading !== ''}
              >
                {actionLoading === 'block' ? 'BLOCKING...' : 'BLOCK NUMBER'}
              </button>

              <button
                className="secondary-action"
                onClick={whitelist}
                disabled={actionLoading !== ''}
              >
                {actionLoading === 'whitelist' ? 'SAVING...' : 'TRUST NUMBER'}
              </button>
            </div>

            {(actionMessage || actionError) && (
              <div className={`protection-action-message ${actionError ? 'is-error' : ''}`}>
                {actionError || actionMessage}
              </div>
            )}

            <div className="protection-report-form">
              <div className="report-form-heading">
                <span className="result-label">HELP THE NETWORK</span>
                <strong>REPORT SUSPICIOUS ACTIVITY</strong>
              </div>

              <div className="report-form-grid">
                <label>
                  SCAM CATEGORY
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as ReportCategory)
                    }
                    disabled={actionLoading !== ''}
                  >
                    <option value="UPI_FRAUD">UPI Fraud</option>
                    <option value="BANK_FRAUD">Bank Fraud</option>
                    <option value="POLICE_IMPERSONATION">Police Impersonation</option>
                    <option value="KYC_FRAUD">KYC Fraud</option>
                    <option value="LOAN_HARASSMENT">Loan Harassment</option>
                    <option value="JOB_SCAM">Job Scam</option>
                    <option value="INVESTMENT_SCAM">Investment Scam</option>
                    <option value="DELIVERY_SCAM">Delivery Scam</option>
                    <option value="TECH_SUPPORT">Tech Support</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label>
                  SEVERITY
                  <select
                    value={severity}
                    onChange={(event) =>
                      setSeverity(event.target.value as Severity)
                    }
                    disabled={actionLoading !== ''}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </label>
              </div>

              <label>
                WHAT HAPPENED?
                <textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Describe the suspicious activity..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={actionLoading !== ''}
                />
              </label>

              <button
                className="report-action"
                onClick={reportNumber}
                disabled={actionLoading !== ''}
              >
                {actionLoading === 'report'
                  ? 'SUBMITTING...'
                  : 'SUBMIT INTELLIGENCE →'}
              </button>
            </div>
          </section>
        )}
      </section>

      <section className="protection-grid">
        <article className="protection-card protection-card-primary">
          <span className="card-index">01</span>
          <span className="card-label">DETECT</span>

          <h2>Threat detection</h2>

          <p>
            Identify suspicious numbers using reports, risk signals,
            reputation data and correlated scam activity.
          </p>

          <div className="card-line">
            <span>NUMBER INTELLIGENCE</span>
            <strong>REAL-TIME</strong>
          </div>
        </article>

        <article className="protection-card">
          <span className="card-index">02</span>
          <span className="card-label">CORRELATE</span>

          <h2>Scam campaigns</h2>

          <p>
            Connect multiple reports and phone numbers to reveal larger
            scam campaigns instead of treating every call as isolated.
          </p>

          <div className="card-line">
            <span>CAMPAIGN GRAPH</span>
            <strong>ACTIVE</strong>
          </div>
        </article>

        <article className="protection-card">
          <span className="card-index">03</span>
          <span className="card-label">PROTECT</span>

          <h2>Take action</h2>

          <p>
            Block dangerous numbers, trust legitimate callers and report
            suspicious activity to strengthen the network.
          </p>

          <div className="card-line">
            <span>PROTECTION ACTIONS</span>
            <strong>READY</strong>
          </div>
        </article>
      </section>

      <section className="protection-call-preview">
        <div>
          <span className="card-label">LIVE PROTECTION SIMULATION</span>
          <h2>Incoming call intelligence</h2>
          <p>
            Check a number above to simulate how the CallShield protection
            engine will evaluate an incoming call before you answer.
          </p>

          <div className="call-preview-meta">
            <span>PHASE 1</span>
            <span>THREAT ENGINE</span>
            <span>REAL INTELLIGENCE</span>
          </div>
        </div>

        <div className="incoming-preview">
          <div className="incoming-top">
            <span>INCOMING CALL</span>
            <i />
          </div>

          <div className="incoming-avatar">◈</div>

          <strong>{checkedNumber || '+91 98765 43210'}</strong>

          <span className="incoming-name">
            {result ? result.risk.classification : 'UNKNOWN CALLER'}
          </span>

          <div className="incoming-risk">
            <span>THREAT ASSESSMENT</span>
            <strong>
              {result
                ? `${result.risk.classification} · ${result.risk.score}/100`
                : 'ANALYZE BEFORE ANSWERING'}
            </strong>
          </div>

          {result && (
            <div className="incoming-signal">
              <span>{result.reports} REPORTS</span>
              <span>{result.intelligenceConfidence} CONFIDENCE</span>
            </div>
          )}

          <div className="incoming-actions">
            <button disabled={!result}>BLOCK CALL</button>
            <button disabled={!result}>ALLOW</button>
          </div>

          <small className="incoming-disclaimer">
            Simulation only · Android call protection will use this
            intelligence layer in a future native integration.
          </small>
        </div>
      </section>

      <footer className="protection-footer">
        <div>
          <strong>CALLSHIELD</strong>
          <span>REAL-TIME DIGITAL PROTECTION</span>
        </div>

        <span>PHASE 1 · PROTECTION EXPERIENCE</span>
      </footer>
    </main>
  )
}

export default ProtectionDashboard

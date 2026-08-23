import { useState } from 'react'
import {
  getNumberIntelligence,
  type NumberIntelligence,
} from './api/callshield'

type ProtectionDashboardProps = {
  onOpenIntelligence: (number: string, result: NumberIntelligence) => void
}

function ProtectionDashboard({
  onOpenIntelligence,
}: ProtectionDashboardProps) {
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      onOpenIntelligence(value, intelligence)
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
          <span className="card-label">PROTECTION PREVIEW</span>
          <h2>Incoming call intelligence</h2>
          <p>
            The Android protection layer will use this same intelligence
            engine to evaluate calls in real time.
          </p>
        </div>

        <div className="incoming-preview">
          <div className="incoming-top">
            <span>INCOMING CALL</span>
            <i />
          </div>

          <strong>+91 98765 43210</strong>

          <div className="incoming-risk">
            <span>THREAT ASSESSMENT</span>
            <strong>ANALYZE BEFORE ANSWERING</strong>
          </div>

          <div className="incoming-actions">
            <button disabled>BLOCK</button>
            <button disabled>ALLOW</button>
          </div>
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

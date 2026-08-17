import { useState } from 'react'
import './App.css'
import {
  getNumberIntelligence,
  type NumberIntelligence,
} from './api/callshield'

function App() {
  const [number, setNumber] = useState('')
  const [searchedNumber, setSearchedNumber] = useState('')
  const [result, setResult] = useState<NumberIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchNumber = async () => {
    const value = number.trim().replace(/[^0-9+]/g, '')

    if (!value) return

    setSearchedNumber(value)
    setResult(null)
    setError('')
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

          <h1>Know who's calling.<br />Stay protected.</h1>

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
            <button onClick={searchNumber} disabled={loading}>
              {loading ? 'Checking...' : 'Check Number'}
            </button>
          </div>

          {searchedNumber && (
            <div className="result-card">
              <span>Number checked</span>
              <strong>{searchedNumber}</strong>

              {loading && <p>Checking CallShield intelligence...</p>}

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              {result && (
                <div className="intelligence-result">
                  <p>
                    <strong>Status:</strong> {result.status}
                  </p>

                  <p>
                    <strong>Risk Score:</strong> {result.risk.score}
                  </p>

                  <p>
                    <strong>Classification:</strong>{' '}
                    {result.risk.classification}
                  </p>

                  <p>
                    <strong>Reports:</strong> {result.reports}
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
              Check risk score, classification, reports, campaigns,
              and intelligence confidence.
            </p>
          </article>

          <article id="report">
            <div className="feature-icon">!</div>
            <h3>Report a Number</h3>
            <p>
              Help the community identify suspicious and fraudulent
              phone numbers.
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

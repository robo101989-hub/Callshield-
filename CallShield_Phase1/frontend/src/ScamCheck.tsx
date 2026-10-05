import { useEffect, useRef, useState } from 'react'
import './ScamCheck.css'

type Result = { risk: 'HIGH' | 'CAUTION' | 'UNCLEAR'; summary: string; signals: string[]; actions: string[]; uncertainty: string; checkedAt: string }
const api = (import.meta.env.VITE_API_BASE_URL || '/v1').replace(/\/$/, '')
const labels = { HIGH: 'Strong warning signs', CAUTION: 'Pause and verify', UNCLEAR: 'Not enough evidence to judge' }

export default function ScamCheck() {
  const [text, setText] = useState(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('check') || ''
    return value.slice(0, 6000)
  })
  useEffect(() => {
    if (new URLSearchParams(window.location.hash.slice(1)).has('check'))
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])
  const [language, setLanguage] = useState('English')
  const [image, setImage] = useState('')
  const [consent, setConsent] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const file = useRef<HTMLInputElement>(null)
  const invalidate = () => { setResult(null); setError('') }
  async function chooseImage(selected?: File) {
    invalidate(); setImage('')
    if (!selected) return
    if (!['image/png', 'image/jpeg'].includes(selected.type) || selected.size > 600000) {
      setError('Choose a JPEG or PNG screenshot under 600 KB. Crop out personal details first.'); return
    }
    lock.current = true; setBusy(true)
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(selected)
      })
      setImage(data)
    } catch { setError('Unable to read this image. Please choose another.') }
    finally { lock.current = false; setBusy(false) }
  }
  async function check() {
    if (lock.current) return
    if (!consent || (!text.trim() && !image)) { setError('Add a message or screenshot and agree to send it for analysis.'); return }
    lock.current = true; setBusy(true); invalidate()
    try {
      const response = await fetch(`${api}/checks`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, consent, ...(image ? { image } : {}) }), signal: AbortSignal.timeout(35000) })
      const body = await response.json()
      if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || 'Unable to complete this check.')
      setResult(body)
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'The check timed out. Please try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  function download() {
    if (!result) return
    const report = { title: 'CallShield user-requested check', submittedText: text,
      screenshotIncludedInAnalysis: Boolean(image), screenshotIncludedInExport: false,
      assessment: result, notice: 'AI assessment, not a verified finding or police report. Keep original evidence separately.' }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'CallShield-check.json'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="scam-check" id="check-message" aria-labelledby="check-title">
    <span className="check-tag">MESSAGE & SCREENSHOT CHECK · PILOT</span>
    <h2 id="check-title">Something feels wrong? Check it here.</h2>
    <p>Get help spotting payment pressure, impersonation, romance scams, or blackmail. AI can miss scams and make mistakes.</p>
    <label htmlFor="scam-text">Paste the message or describe what happened</label>
    <textarea id="scam-text" rows={5} maxLength={6000} value={text} disabled={busy}
      placeholder="Example: Someone claiming to be police says I must transfer money immediately…"
      onChange={e => { setText(e.target.value); invalidate() }} />
    <div className="check-inputs">
      <label>Screenshot (optional, JPEG/PNG, up to 600 KB)
        <input ref={file} type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e => void chooseImage(e.target.files?.[0])} />
      </label>
      <label>Explanation language
        <select value={language} disabled={busy} onChange={e => { setLanguage(e.target.value); invalidate() }}>
          <option>English</option><option>Hindi</option><option>Hinglish</option>
        </select>
      </label>
    </div>
    {image && <div><img className="check-preview" src={image} alt="Screenshot selected for analysis" /><button disabled={busy} onClick={() => { setImage(''); if (file.current) file.current.value = ''; invalidate() }}>Remove screenshot</button></div>}
    <p className="check-privacy">Remove passwords, OTPs, account details and intimate images. CallShield does not save your submission to its database. OpenAI processes it and may retain it under its API policies.</p>
    <label className="check-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e => { setConsent(e.target.checked); invalidate() }} /> I agree to send this message / screenshot to OpenAI for this check.</label>
    <div className="check-buttons">
      <button disabled={busy || !consent || (!text.trim() && !image)} onClick={() => void check()}>{busy ? 'Checking…' : 'Check for warning signs'}</button>
      <button disabled={busy} onClick={() => { setText(''); setImage(''); setConsent(false); invalidate(); if (file.current) file.current.value = '' }}>Clear</button>
    </div>
    {error && <p role="alert" className="check-error">{error}</p>}
    {result && <article className={`check-result check-${result.risk.toLowerCase()}`} aria-live="polite">
      <h3>{labels[result.risk]}</h3><p>{result.summary}</p>
      <h4>What this check noticed</h4>
      {result.signals.length ? <ul>{result.signals.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p>No specific warning signs identified. This does not establish safety.</p>}
      <h4>What you can do now</h4><ul>{result.actions.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <p>{result.uncertainty}</p><button onClick={download}>Download this assessment</button>
      <p className="check-privacy">The download contains your submitted text and AI assessment. Store it privately and keep original evidence separately.</p>
    </article>}
    <aside className="check-help"><strong>Need help now?</strong><p>For financial cyber fraud in India, call <a href="tel:1930">1930</a>. Report cybercrime at <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer">cybercrime.gov.in</a>. For blackmail, preserve messages and seek support from someone you trust. You are not to blame.</p></aside>
  </section>
}

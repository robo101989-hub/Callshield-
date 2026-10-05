import { useEffect, useRef, useState } from 'react'
import './ScamCheck.css'
type Example = { id: string; title: string; text: string }
type Result = { risk: 'HIGH' | 'CAUTION' | 'UNCLEAR'; summary: string; signals: string[]; actions: string[]; uncertainty: string }
const api = (import.meta.env.VITE_API_BASE_URL || '/v1').replace(/\/$/, '')
export default function ScamDemo() {
  const [examples, setExamples] = useState<Example[]>([])
  const [scenario, setScenario] = useState('payment')
  const [language, setLanguage] = useState('English')
  const [consent, setConsent] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  useEffect(() => {
    const abort = new AbortController()
    fetch(`${api}/checks/demo`, { signal: abort.signal }).then(async r => {
      if (!r.ok) throw Error('Demo examples are not available yet.')
      const data: unknown = await r.json()
      if (!Array.isArray(data) || !data.every(x => x && typeof x.id === 'string' && typeof x.title === 'string' && typeof x.text === 'string'))
        throw Error('Invalid demo examples')
      setExamples(data)
    }).catch(e => { if (e.name !== 'AbortError') setError('Demo examples are not available yet. Please reload later.') })
    return () => abort.abort()
  }, [])
  async function check() {
    if (lock.current || !consent || !examples.length) return
    lock.current = true; setBusy(true); setResult(null); setError('')
    try {
      const r = await fetch(`${api}/checks/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, language, consent }), signal: AbortSignal.timeout(35000) })
      const body = await r.json()
      if (!r.ok) throw Error(typeof body.message === 'string' ? body.message : 'Unable to complete the demo.')
      setResult(body)
    } catch(e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'The demo timed out. Please try again.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="scam-check" aria-labelledby="demo-title">
    <span className="check-tag">FREE AI DEMO · FICTIONAL EXAMPLES ONLY</span>
    <h2 id="demo-title">Learn to spot the warning signs.</h2>
    <p>Explore how CallShield explains suspicious messages. This demo uses Gemini’s free tier and cannot check your private conversations or images.</p>
    <label>Choose a fictional example<select value={scenario} disabled={busy || !examples.length} onChange={e=>{setScenario(e.target.value);setResult(null);setError('')}}>{examples.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
    <blockquote>{examples.find(x=>x.id===scenario)?.text}</blockquote>
    <label>Explanation language<select value={language} disabled={busy} onChange={e=>{setLanguage(e.target.value);setResult(null);setError('')}}><option>English</option><option>Hindi</option><option>Hinglish</option></select></label>
    <p className="check-privacy">Only the selected fictional example and language are sent to Google. Free-tier submissions may be used to improve Google products and reviewed by humans. No private text or image uploads are available in this mode.</p>
    <label className="check-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)} /> Send this fictional example to Gemini for analysis.</label>
    <button disabled={busy || !consent || !examples.length} onClick={()=>void check()}>{busy ? 'Checking example…' : 'Analyze example'}</button>
    {error && <p className="check-error" role="alert">{error}</p>}
    {result && <article className={`check-result check-${result.risk.toLowerCase()}`} aria-live="polite"><h3>{{HIGH:'Strong warning signs',CAUTION:'Pause and verify',UNCLEAR:'Not enough evidence to judge'}[result.risk]}</h3><p>{result.summary}</p><h4>Warning signs in this example</h4><ul>{result.signals.map((x,i)=><li key={i}>{x}</li>)}</ul><h4>Protective steps</h4><ul>{result.actions.map((x,i)=><li key={i}>{x}</li>)}</ul><p>{result.uncertainty}</p><small>AI demonstration, not a verified finding about a real person.</small></article>}
    <aside className="check-help"><strong>Need help with a real incident?</strong><p>For financial cyber fraud in India, call <a href="tel:1930">1930</a>. Report at <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer">cybercrime.gov.in</a>. Keep original evidence privately. If someone is blackmailing you, seek trusted support—you are not to blame.</p></aside>
  </section>
}

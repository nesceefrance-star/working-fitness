import { useState, useCallback, useMemo } from 'react'
import {
  C, PLACES, PLANNING_DAYS, CHECKLIST_GROUPS, BUDGET_CATEGORIES,
  FIXED_BUDGET, TARGET_BUDGET, TRIP, SOS_CONTACTS, CAR_INFO, CAR_CHECKLIST,
  DOCUMENTS_LIST, MIAMI_WEATHER,
} from './data/miami'

// ── LOCAL STORAGE HOOK ────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(initial)) }
    catch { return initial }
  })
  const save = useCallback(v => {
    const next = typeof v === 'function' ? v(val) : v
    setVal(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  }, [key, val])
  return [val, save]
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
const formatEur = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const formatUsd = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function getDaysUntilTrip() {
  const now = new Date()
  const start = new Date(TRIP.start + 'T00:00:00')
  const end = new Date(TRIP.end + 'T23:59:59')
  if (now > end) return { status: 'done', days: 0, tripDay: null }
  if (now >= start) {
    const dayOfTrip = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1
    return { status: 'ontrip', days: 0, tripDay: dayOfTrip }
  }
  const days = Math.ceil((start - now) / (1000 * 60 * 60 * 24))
  return { status: 'before', days, tripDay: null }
}

function kosherBadge(status, meatDairy) {
  if (status === 'kosher_certified') {
    if (meatDairy === 'meat') return { label: 'CACHER 🥩', bg: '#D97706', color: '#fff' }
    if (meatDairy === 'dairy') return { label: 'CACHER 🧀', bg: '#0E7490', color: '#fff' }
    return { label: 'CACHER', bg: '#166534', color: '#fff' }
  }
  if (status === 'kosher_style') return { label: 'SANS TAMPON', bg: '#D97706', color: '#fff' }
  if (status === 'not_kosher') return { label: 'NON CACHER', bg: '#6B7280', color: '#fff' }
  return { label: 'À VÉRIFIER', bg: '#9CA3AF', color: '#fff' }
}

function priceDots(n) { return '●'.repeat(n || 0) + '○'.repeat(Math.max(0, 4 - (n || 0))) }
function stars(n) { return '★'.repeat(n || 0) + '☆'.repeat(Math.max(0, 5 - (n || 0))) }
function dateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── GLOBAL STYLES ──────────────────────────────────────────────────────────────
function GlobalStyles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html { overflow: hidden; height: 100%; background: ${C.bg}; }
    body { overflow: hidden; height: 100%; background: ${C.bg}; font-family: 'Inter', -apple-system, sans-serif; color: ${C.ink}; -webkit-text-size-adjust: 100%; overscroll-behavior: none; }
    #root { position: fixed; inset: 0; display: flex; flex-direction: column; }
    input, button, textarea, select { font-family: inherit; }
    ::-webkit-scrollbar { width: 2px; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; }
    .scroll-y { overflow-y: auto; -webkit-overflow-scrolling: touch; min-height: 0; flex: 1; }
    .press { transition: opacity .12s; cursor: pointer; }
    .press:active { opacity: .7; }
    button { border: none; cursor: pointer; }
  `}</style>
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Tag({ label, color = C.mutedLight, textColor = C.muted, small }) {
  return (
    <span style={{
      background: color, color: textColor,
      borderRadius: 20, padding: small ? '2px 7px' : '4px 10px',
      fontSize: small ? 10 : 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function Card({ children, onClick, style }) {
  return (
    <div className="press"
      onClick={onClick}
      style={{
        background: C.card, borderRadius: 16, padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`,
        ...style,
      }}>
      {children}
    </div>
  )
}

function ScreenHeader({ title, onBack, right }) {
  return (
    <div style={{
      paddingTop: 'max(env(safe-area-inset-top), 16px)',
      padding: `max(env(safe-area-inset-top), 16px) 16px 12px`,
      background: C.card, borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', gap: 10,
      flexShrink: 0,
    }}>
      {onBack && (
        <button onClick={onBack} style={{ background: C.mutedLight, border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>←</button>
      )}
      <h2 style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.ink }}>{title}</h2>
      {right}
    </div>
  )
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="press" style={{
      background: active ? C.ocean : C.mutedLight,
      color: active ? '#fff' : C.muted,
      border: 'none', borderRadius: 20, padding: '7px 14px',
      fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
    }}>{label}</button>
  )
}

function PlaceCard({ place, onPress, compact }) {
  const kb = place.kosherStatus ? kosherBadge(place.kosherStatus, place.meatDairy) : null
  return (
    <Card onClick={onPress} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{place.name}</span>
            {place.mustBook && <span style={{ fontSize: 11, color: C.coral, fontWeight: 700 }}>📅 RÉS.</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {kb && <span style={{ background: kb.bg, color: kb.color, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>{kb.label}</span>}
            {place.area && <span style={{ fontSize: 12, color: C.muted }}>📍 {place.area}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {place.personalRating && <span style={{ fontSize: 13, color: C.gold }}>{stars(place.personalRating)}</span>}
          {place.priceLevel > 0 && <span style={{ fontSize: 11, color: C.muted, letterSpacing: -1 }}>{priceDots(place.priceLevel)}</span>}
        </div>
      </div>
      {!compact && place.personalNotes && (
        <p style={{ fontSize: 13, color: C.muted, marginTop: 6, fontStyle: 'italic' }}>"{place.personalNotes}"</p>
      )}
      {!compact && place.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
          {place.tags.slice(0, 4).map(t => <Tag key={t} label={t} small />)}
        </div>
      )}
    </Card>
  )
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ current, navigate }) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Accueil' },
    { id: 'planning', icon: '📅', label: 'Planning' },
    { id: 'places', icon: '📍', label: 'Lieux' },
    { id: 'map', icon: '🗺', label: 'Carte' },
    { id: 'budget', icon: '💰', label: 'Budget' },
    { id: 'checklist', icon: '✅', label: 'Checks' },
  ]
  return (
    <div style={{
      background: C.card, borderTop: `1px solid ${C.border}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex', justifyContent: 'space-around',
      flexShrink: 0, zIndex: 20,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => navigate(t.id)} className="press" style={{
          flex: 1, background: 'none', border: 'none', padding: '10px 4px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        }}>
          <span style={{ fontSize: 22 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: current === t.id ? C.ocean : C.muted }}>{t.label}</span>
          {current === t.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.ocean }} />}
        </button>
      ))}
    </div>
  )
}

// ── SCREEN: HOME ─────────────────────────────────────────────────────────────
function HomeScreen({ navigate, expenses, checklistDone }) {
  const trip = getDaysUntilTrip()
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (e.currency === 'EUR' ? e.amount : e.amount / 1.1), 0), [expenses])
  const totalAll = FIXED_BUDGET.total + totalExpenses
  const budgetPct = Math.min(100, (totalAll / TARGET_BUDGET.realistic) * 100)

  const allItems = CHECKLIST_GROUPS.flatMap(g => g.items)
  const doneCount = allItems.filter(i => checklistDone[i.id]).length

  const topPicks = PLACES.filter(p => p.personalRating === 5)

  const quickActions = [
    { icon: '🤔', label: 'Concierge', action: () => navigate('concierge') },
    { icon: '🍽', label: 'Restaurants', action: () => navigate('places', { filter: 'restaurant' }) },
    { icon: '🎯', label: 'Activités', action: () => navigate('places', { filter: 'activity' }) },
    { icon: '🏖', label: 'Plages', action: () => navigate('places', { filter: 'beach' }) },
    { icon: '✡️', label: 'Synagogues', action: () => navigate('places', { filter: 'synagogue' }) },
    { icon: '🛒', label: 'Courses', action: () => navigate('places', { filter: 'supermarket' }) },
    { icon: '🚨', label: 'SOS', action: () => navigate('sos') },
    { icon: '🚗', label: 'Voiture', action: () => navigate('car') },
    { icon: '📄', label: 'Documents', action: () => navigate('documents') },
  ]

  return (
    <div className="scroll-y" style={{ background: C.bg }}>
      {/* HEADER */}
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 20px)',
        padding: `max(env(safe-area-inset-top), 20px) 16px 20px`,
        background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.turquoise} 100%)`,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, opacity: 0.8 }}>MIAMI FAMILY GUIDE</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>4 → 20 août 2026</h1>
            <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>📍 72 Park — North Beach</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '12px 16px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
            {trip.status === 'before' && <>
              <p style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>J-{trip.days}</p>
              <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>avant départ</p>
            </>}
            {trip.status === 'ontrip' && <>
              <p style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>J{trip.tripDay}</p>
              <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>/ 17</p>
            </>}
            {trip.status === 'done' && <>
              <p style={{ fontSize: 28, lineHeight: 1 }}>🌴</p>
              <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>terminé</p>
            </>}
          </div>
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <Card onClick={() => navigate('budget')} style={{ padding: 14 }}>
            <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>BUDGET</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: C.ink, marginTop: 2 }}>{Math.round(totalAll / 1000)}k€</p>
            <p style={{ fontSize: 11, color: C.muted }}>/ {TARGET_BUDGET.realistic / 1000}k€ réaliste</p>
            <div style={{ marginTop: 8, height: 4, background: C.mutedLight, borderRadius: 2 }}>
              <div style={{ height: 4, borderRadius: 2, background: budgetPct > 90 ? C.danger : C.ocean, width: `${budgetPct}%`, transition: 'width .4s' }} />
            </div>
          </Card>
          <Card onClick={() => navigate('checklist')} style={{ padding: 14 }}>
            <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>CHECK-LIST</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: C.ink, marginTop: 2 }}>{doneCount}/{allItems.length}</p>
            <p style={{ fontSize: 11, color: C.muted }}>tâches complètes</p>
            <div style={{ marginTop: 8, height: 4, background: C.mutedLight, borderRadius: 2 }}>
              <div style={{ height: 4, borderRadius: 2, background: C.success, width: `${(doneCount / allItems.length) * 100}%`, transition: 'width .4s' }} />
            </div>
          </Card>
        </div>

        {/* MÉTÉO */}
        <Card style={{ marginBottom: 16, padding: 14, background: 'linear-gradient(135deg, #0C6680 0%, #14B8A6 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, opacity: 0.8 }}>MÉTÉO MIAMI — AOÛT</p>
              <p style={{ fontSize: 28, fontWeight: 900, marginTop: 4, lineHeight: 1 }}>{MIAMI_WEATHER.tempMin}–{MIAMI_WEATHER.tempMax}°C</p>
              <p style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>🌊 Mer {MIAMI_WEATHER.seaTemp}°C</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 12px', textAlign: 'right', backdropFilter: 'blur(8px)' }}>
              <p style={{ fontSize: 11, opacity: 0.9 }}>☀️ UV Extrême (10-11)</p>
              <p style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>⛈ Orages 16h–18h</p>
              <p style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>💧 Humidité 75–85%</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px' }}>
            {MIAMI_WEATHER.tips.slice(0, 3).map((tip, i) => (
              <p key={i} style={{ fontSize: 11, opacity: 0.9, marginBottom: i < 2 ? 3 : 0 }}>{tip}</p>
            ))}
          </div>
        </Card>

        {/* PROGRAMME DU JOUR */}
        {trip.status === 'ontrip' && (() => {
          const today = PLANNING_DAYS[trip.tripDay - 1]
          if (!today) return null
          return (
            <Card onClick={() => navigate('planning')} style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.sandLight}, ${C.turquoiseLight})` }}>
              <p style={{ fontSize: 10, color: C.ocean, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>PROGRAMME D'AUJOURD'HUI ☀️</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{today.themeIcon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{today.title}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{dateLabel(today.date)}</p>
                </div>
              </div>
              {today.items.slice(0, 3).map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item.time && <span style={{ fontSize: 10, color: C.ocean, fontWeight: 700, flexShrink: 0 }}>{item.time}</span>}
                    <span style={{ fontSize: 13, color: C.ink }}>{item.title}</span>
                  </div>
                </div>
              ))}
              {today.items.length > 3 && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>+{today.items.length - 3} autres — Voir le planning →</p>}
            </Card>
          )
        })()}

        {/* BUDGET FIXE */}
        <Card style={{ marginBottom: 16, padding: 14 }}>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>COÛTS FIXES CONFIRMÉS</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: C.sandLight, borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>✈️ VOLS</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 2 }}>7 200 €</p>
            </div>
            <div style={{ flex: 1, background: C.turquoiseLight, borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>🏠 CONDO</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 2 }}>6 500 €</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 8, textAlign: 'center' }}>
            Total fixe : <strong style={{ color: C.ink }}>13 700 €</strong> — Budget variable restant : <strong style={{ color: C.ocean }}>{formatEur(TARGET_BUDGET.realistic - FIXED_BUDGET.total)}</strong>
          </p>
        </Card>

        {/* QUICK ACTIONS */}
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ACCÈS RAPIDES</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={a.action} className="press" style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <span style={{ fontSize: 26 }}>{a.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.ink }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* COUPS DE CŒUR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>COUPS DE CŒUR ⭐</p>
          <button onClick={() => navigate('places')} style={{ background: 'none', border: 'none', fontSize: 12, color: C.ocean, fontWeight: 600 }}>Voir tous →</button>
        </div>
        {topPicks.slice(0, 4).map(p => (
          <PlaceCard key={p.id} place={p} compact onPress={() => navigate('place_detail', { placeId: p.id })} />
        ))}

        {/* PLANNING RAPIDE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 8 }}>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>PLANNING 17 JOURS</p>
          <button onClick={() => navigate('planning')} style={{ background: 'none', border: 'none', fontSize: 12, color: C.ocean, fontWeight: 600 }}>Ouvrir →</button>
        </div>
        <Card onClick={() => navigate('planning')} style={{ background: `linear-gradient(135deg, ${C.sandLight}, ${C.turquoiseLight})` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, color: C.ink }}>4 → 20 août 2026</p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>17 jours · Planning jour par jour</p>
            </div>
            <span style={{ fontSize: 32 }}>🗓</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── SCREEN: PLANNING ──────────────────────────────────────────────────────────
function PlanningScreen({ navigate, planningDone, setPlanningDone }) {
  const [openDay, setOpenDay] = useState(null)
  const trip = getDaysUntilTrip()

  const toggleItem = (itemId) => setPlanningDone(d => ({ ...d, [itemId]: !d[itemId] }))

  const themeColors = {
    voyage: C.ocean, plage: C.turquoise, shopping: C.coral,
    enfants: C.gold, keys: C.palm, everglades: C.palm,
    indoor: C.purple, repos: C.muted,
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScreenHeader title="Planning — 17 jours" />
      <div className="scroll-y" style={{ flex: 1, padding: '12px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {PLANNING_DAYS.map((day, idx) => {
          const isOpen = openDay === day.id
          const doneItems = day.items.filter(i => planningDone[i.id])
          const themeColor = themeColors[day.theme] || C.muted
          const isCurrentDay = trip.status === 'ontrip' && trip.tripDay === idx + 1

          return (
            <div key={day.id} style={{ marginBottom: 8 }}>
              <button onClick={() => setOpenDay(isOpen ? null : day.id)} className="press" style={{
                width: '100%', background: C.card, borderRadius: isOpen ? '16px 16px 0 0' : 16,
                border: `1px solid ${isCurrentDay ? C.ocean : C.border}`,
                borderBottom: isOpen ? 'none' : undefined,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: isCurrentDay ? `0 0 0 2px ${C.ocean}22` : '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ background: themeColor, color: '#fff', borderRadius: 10, padding: '6px 10px', textAlign: 'center', flexShrink: 0, minWidth: 46 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, opacity: 0.9 }}>{day.label.toUpperCase()}</p>
                  <p style={{ fontSize: 18 }}>{day.themeIcon}</p>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  {isCurrentDay && <p style={{ fontSize: 10, color: C.ocean, fontWeight: 700, marginBottom: 2 }}>AUJOURD'HUI</p>}
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{day.title}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{dateLabel(day.date)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{isOpen ? '▲' : '▼'}</span>
                  {doneItems.length > 0 && (
                    <span style={{ fontSize: 10, color: C.success, fontWeight: 700 }}>{doneItems.length}/{day.items.length} ✓</span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div style={{
                  background: C.card, borderRadius: '0 0 16px 16px',
                  border: `1px solid ${C.border}`, borderTop: 'none',
                  padding: '4px 16px 16px',
                }}>
                  {day.notes && (
                    <div style={{ background: C.sandLight, borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: C.inkLight }}>
                      💡 {day.notes}
                    </div>
                  )}
                  {day.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                      <button onClick={() => toggleItem(item.id)} style={{
                        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                        background: planningDone[item.id] ? C.success : C.mutedLight,
                        border: `1px solid ${planningDone[item.id] ? C.success : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: '#fff', marginTop: 1,
                      }}>{planningDone[item.id] ? '✓' : ''}</button>
                      <div style={{ flex: 1 }}>
                        {item.time && <p style={{ fontSize: 10, color: C.ocean, fontWeight: 700, marginBottom: 2 }}>{item.time.toUpperCase()}</p>}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span>{item.icon}</span>
                          <p style={{ fontSize: 14, fontWeight: planningDone[item.id] ? 400 : 600, color: planningDone[item.id] ? C.muted : C.ink, textDecoration: planningDone[item.id] ? 'line-through' : 'none' }}>{item.title}</p>
                        </div>
                        {item.placeId && (
                          <button onClick={() => navigate('place_detail', { placeId: item.placeId })} style={{ background: 'none', border: 'none', fontSize: 11, color: C.ocean, padding: 0, marginTop: 2 }}>Voir la fiche →</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SCREEN: PLACES ────────────────────────────────────────────────────────────
const PLACE_FILTERS = [
  { id: 'all', label: '🗂 Tous' },
  { id: 'restaurant', label: '🍽 Restau.' },
  { id: 'breakfast', label: '☕ Petit-dèj' },
  { id: 'activity', label: '🎯 Activités' },
  { id: 'shopping', label: '🛍 Shopping' },
  { id: 'beach', label: '🏖 Plages' },
  { id: 'beach_club', label: '🏊 Beach Club' },
  { id: 'supermarket', label: '🛒 Courses' },
  { id: 'synagogue', label: '✡️ Synagogues' },
  { id: 'pharmacy', label: '💊 Pharmacies' },
]

const KOSHER_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'kosher_certified', label: '🟢 Cacher certifié' },
  { id: 'kosher_style', label: '🟡 Sans tampon' },
  { id: 'not_kosher', label: '⚪ Non cacher' },
]

function PlacesScreen({ navigate, params = {} }) {
  const [catFilter, setCatFilter] = useState(params.filter || 'all')
  const [kosherFilter, setKosherFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => PLACES.filter(p => {
    if (catFilter !== 'all' && p.category !== catFilter) return false
    if (kosherFilter !== 'all' && p.kosherStatus !== kosherFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.area?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [catFilter, kosherFilter, search])

  const isRestaurant = catFilter === 'all' || catFilter === 'restaurant' || catFilter === 'breakfast'

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
        padding: `max(env(safe-area-inset-top), 12px) 16px 12px`,
        background: C.card, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>📍 Lieux — {filtered.length} résultats</h2>
        <input
          type="text" placeholder="🔍  Rechercher…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: C.mutedLight, border: 'none', borderRadius: 12,
            padding: '10px 14px', fontSize: 14, outline: 'none', marginBottom: 10,
          }} />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {PLACE_FILTERS.map(f => <Pill key={f.id} label={f.label} active={catFilter === f.id} onClick={() => setCatFilter(f.id)} />)}
        </div>
        {isRestaurant && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginTop: 8 }}>
            {KOSHER_FILTERS.map(f => <Pill key={f.id} label={f.label} active={kosherFilter === f.id} onClick={() => setKosherFilter(f.id)} />)}
          </div>
        )}
      </div>

      <div className="scroll-y" style={{ flex: 1, padding: '12px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
            <p style={{ fontSize: 40 }}>🔍</p>
            <p style={{ marginTop: 12, fontWeight: 600 }}>Aucun résultat</p>
          </div>
        )}
        {filtered.map(p => (
          <PlaceCard key={p.id} place={p} onPress={() => navigate('place_detail', { placeId: p.id })} />
        ))}
      </div>
    </div>
  )
}

// ── SCREEN: PLACE DETAIL ──────────────────────────────────────────────────────
function PlaceDetailScreen({ navigate, goBack, screenParams, favorites, setFavorites }) {
  const place = PLACES.find(p => p.id === screenParams.placeId)
  if (!place) return <div style={{ padding: 20 }}><button onClick={goBack}>← Retour</button><p>Lieu introuvable</p></div>

  const isFav = favorites.includes(place.id)
  const toggleFav = () => setFavorites(f => isFav ? f.filter(id => id !== place.id) : [...f, place.id])
  const kb = place.kosherStatus ? kosherBadge(place.kosherStatus, place.meatDairy) : null

  const mapsUrl = place.address && place.address !== 'À vérifier'
    ? `https://maps.google.com/?q=${encodeURIComponent(place.name + ' ' + place.address)}`
    : `https://maps.google.com/?q=${encodeURIComponent(place.name + ' Miami')}`

  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(place.name + ' Miami')}&navigate=yes`

  const infoRows = [
    place.area && { icon: '📍', label: 'Zone', value: place.area },
    place.address && place.address !== 'À vérifier' && { icon: '🏠', label: 'Adresse', value: place.address },
    place.phone && { icon: '📞', label: 'Téléphone', value: place.phone },
    place.distanceFrom72ParkMinutes && { icon: '🚗', label: 'Depuis 72 Park', value: `~${place.distanceFrom72ParkMinutes} min` },
    place.durationRecommended && { icon: '⏱', label: 'Durée', value: place.durationRecommended },
    place.dressCode && { icon: '👔', label: 'Tenue', value: place.dressCode },
    place.estimatedFamilyBudgetUsd && { icon: '👨‍👩‍👧‍👦', label: 'Budget famille', value: `${formatUsd(place.estimatedFamilyBudgetUsd.low)} – ${formatUsd(place.estimatedFamilyBudgetUsd.high)}` },
  ].filter(Boolean)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScreenHeader
        title={place.name}
        onBack={goBack}
        right={
          <button onClick={toggleFav} style={{ background: 'none', border: 'none', fontSize: 22 }}>
            {isFav ? '❤️' : '🤍'}
          </button>
        }
      />
      <div className="scroll-y" style={{ flex: 1, padding: '16px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {/* HEADER CARD */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            {kb && <span style={{ background: kb.bg, color: kb.color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px' }}>{kb.label}</span>}
            {place.mustBook && <Tag label="📅 Réservation requise" color={C.coralLight} textColor={C.coral} />}
            {place.category === 'beach' && <Tag label="🏖 Plage" color={C.turquoiseLight} textColor={C.ocean} />}
            {place.category === 'activity' && <Tag label="🎯 Activité" color={C.goldLight} textColor={C.gold} />}
          </div>
          {place.personalNotes && (
            <p style={{ fontSize: 14, color: C.inkLight, fontStyle: 'italic', marginBottom: 8 }}>"{place.personalNotes}"</p>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {place.personalRating && (
              <div>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>MON AVIS</p>
                <p style={{ fontSize: 16, color: C.gold }}>{stars(place.personalRating)}</p>
              </div>
            )}
            {place.priceLevel > 0 && (
              <div>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>PRIX</p>
                <p style={{ fontSize: 14, color: C.ink, letterSpacing: -1 }}>{priceDots(place.priceLevel)}</p>
              </div>
            )}
            {place.childFriendlyScore && (
              <div>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>ENFANTS</p>
                <p style={{ fontSize: 14, color: C.ink }}>{'👶'.repeat(Math.min(place.childFriendlyScore, 3))}{place.childFriendlyScore >= 4 ? '++' : ''}</p>
              </div>
            )}
          </div>
        </Card>

        {/* QUICK ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { icon: '🗺', label: 'Maps', action: () => window.open(mapsUrl, '_blank') },
            { icon: '🚗', label: 'Waze', action: () => window.open(wazeUrl, '_blank') },
            place.phone && place.phone !== 'À vérifier' && { icon: '📞', label: 'Appeler', action: () => window.open(`tel:${place.phone}`) },
            place.website && place.website !== 'À vérifier' && { icon: '🌐', label: 'Site', action: () => window.open(place.website, '_blank') },
          ].filter(Boolean).map(a => (
            <button key={a.label} onClick={a.action} className="press" style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.ink }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* INFO ROWS */}
        {infoRows.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>INFORMATIONS</p>
            {infoRows.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: i < infoRows.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{row.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{row.label.toUpperCase()}</p>
                  <p style={{ fontSize: 14, color: C.ink, marginTop: 1 }}>{row.value}</p>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* TAGS */}
        {place.tags?.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>TAGS</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {place.tags.map(t => <Tag key={t} label={t} />)}
            </div>
          </Card>
        )}

        {/* AVERTISSEMENT CACHER */}
        {(place.kosherStatus === 'unknown' || place.kosherStatus === 'kosher_style') && (
          <div style={{ background: '#FEF9C3', border: '1px solid #F59E0B', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>⚠️ Statut cacher à vérifier</p>
            <p style={{ fontSize: 12, color: '#78350F' }}>
              {place.kosherStatus === 'kosher_style'
                ? 'Restaurant indiqué "casher sans tampon". Vérifier selon votre niveau d\'observance.'
                : 'Statut cacher non confirmé. À vérifier directement avec le restaurant.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── SCREEN: CONCIERGE ────────────────────────────────────────────────────────
function ConciergeScreen({ navigate, goBack }) {
  const [mode, setMode] = useState(null)

  const modes = [
    {
      id: 'rain', icon: '🌧', label: 'Il pleut dehors', color: C.ocean,
      description: 'Activités indoor & abritées',
      placeIds: ['frost_museum', 'artechouse', 'aventura_mall', 'edition_bowling', 'childrens_museum', 'sawgrass_mills'],
    },
    {
      id: 'tired', icon: '😴', label: 'Enfants fatigués', color: C.turquoise,
      description: 'Proche du condo, calme',
      placeIds: ['surfside_beach', 'publix_surfside', 'bal_harbour', 'four_seasons_surf_club', 'rustiko', 'cine_citta'],
    },
    {
      id: 'evening', icon: '🌅', label: 'Belle soirée en famille', color: C.coral,
      description: 'Les meilleures tables du soir',
      placeIds: ['harbour_grill', 'g7_rooftop', 'asiatiko', 'fuego', 'neya', 'izzys_bbq'],
    },
    {
      id: 'budget', icon: '💸', label: 'Budget serré', color: C.palm,
      description: 'Gratuit ou économique',
      placeIds: ['surfside_beach', 'wynwood', 'lincoln_road', 'jewish_museum', 'zack_baker', 'joe_juice'],
    },
  ]

  const currentMode = modes.find(m => m.id === mode)
  const modePlaces = currentMode
    ? currentMode.placeIds.map(id => PLACES.find(p => p.id === id)).filter(Boolean)
    : []

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScreenHeader title="🤔 Que fait-on ?" onBack={goBack} />
      <div className="scroll-y" style={{ padding: '16px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Quelle est votre situation en ce moment ?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(mode === m.id ? null : m.id)} className="press" style={{
              background: mode === m.id ? m.color : C.card,
              color: mode === m.id ? '#fff' : C.ink,
              border: `2px solid ${mode === m.id ? m.color : C.border}`,
              borderRadius: 16, padding: '16px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{m.label}</span>
              <span style={{ fontSize: 11, opacity: 0.75, textAlign: 'center' }}>{m.description}</span>
            </button>
          ))}
        </div>

        {currentMode && modePlaces.length > 0 && (
          <>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
              {currentMode.icon} SUGGESTIONS — {currentMode.description.toUpperCase()}
            </p>
            {modePlaces.map(p => (
              <PlaceCard key={p.id} place={p} compact onPress={() => navigate('place_detail', { placeId: p.id })} />
            ))}
          </>
        )}

        {!mode && (
          <div style={{ background: C.sandLight, borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>🌴</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Choisissez votre situation</p>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Des suggestions adaptées s'afficheront ici.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MAP DATA ──────────────────────────────────────────────────────────────────
const MAP_ZONES = [
  {
    id: 'surfside', name: 'Surfside / North Beach', icon: '🏠', color: C.ocean,
    subtitle: 'Notre base — 72 Park',
    mapsUrl: 'https://maps.google.com/?q=Surfside+Beach+Miami+FL',
    placeIds: ['surfside_beach', 'four_seasons_surf_club', 'the_shul', 'young_israel_bh', 'cvs_surfside_24h', 'publix_surfside', 'whole_foods_surfside', 'bal_harbour', 'makoto', 'rustiko', 'harbour_grill', 'hadekel'],
  },
  {
    id: 'mid_south_beach', name: 'Mid & South Beach', icon: '🌊', color: C.turquoise,
    subtitle: 'Collins Ave — Art Déco & Lincoln Rd',
    mapsUrl: 'https://maps.google.com/?q=South+Beach+Miami+FL',
    placeIds: ['faena', 'artechouse', 'edition_bowling', 'lincoln_road', 'jewish_museum', 'joe_stone_crab', 'setai', 'w_south_beach', '1_hotel', 'japon_setai', 'mila', 'contessa'],
  },
  {
    id: 'wynwood_midtown', name: 'Wynwood / Midtown', icon: '🎨', color: C.coral,
    subtitle: 'Street art & restaurants branchés',
    mapsUrl: 'https://maps.google.com/?q=Wynwood+Miami+FL',
    placeIds: ['wynwood', 'zack_baker', 'fuego', 'motek', 'uchi', 'kiki', 'hiyakawa'],
  },
  {
    id: 'design_brickell', name: 'Design District / Brickell', icon: '🏙', color: C.purple,
    subtitle: 'Luxe, culture & gastronomie',
    mapsUrl: 'https://maps.google.com/?q=Miami+Design+District+FL',
    placeIds: ['design_district', 'frost_museum', 'childrens_museum', 'carbone', 'cipriani', 'cote_miami', 'komodo', 'mandolin', 'sparrow_italia', 'forte_dei_marmi', 'brickell'],
  },
  {
    id: 'aventura', name: 'Aventura & Hallandale', icon: '🛍', color: C.gold,
    subtitle: 'Shopping, grands restaurants',
    mapsUrl: 'https://maps.google.com/?q=Aventura+Mall+FL',
    placeIds: ['aventura_mall', 'whole_foods_aventura', 'g7_rooftop', 'neya', 'asiatiko', 'malka'],
  },
  {
    id: 'excursions', name: 'Excursions', icon: '🗺', color: C.palm,
    subtitle: 'Keys, Everglades, Zoo — 1h+ de route',
    mapsUrl: 'https://maps.google.com/?q=Everglades+National+Park+FL',
    placeIds: ['everglades', 'key_largo', 'islamorada', 'zoo_miami', 'sawgrass_mills', 'ritz_key_biscayne'],
  },
]

// ── SCREEN: MAP ───────────────────────────────────────────────────────────────
function MapScreen({ navigate }) {
  const [openZone, setOpenZone] = useState(null)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        padding: `max(env(safe-area-inset-top), 16px) 16px 14px`,
        background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>🗺 Carte — Zones Miami</h2>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Explorez les zones, ouvrez dans Google Maps</p>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${C.ocean}, ${C.turquoise})`, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(8px)' }}>
            <p style={{ fontSize: 10, color: '#fff', fontWeight: 700, opacity: 0.8 }}>🏠 NOTRE BASE</p>
            <p style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 2 }}>72 Park · 580 72nd St, Surfside</p>
          </div>
          <a href={TRIP.mapsUrl} target="_blank" rel="noreferrer"
            style={{ background: 'rgba(255,255,255,0.95)', color: C.ocean, borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
            📍 Maps
          </a>
        </div>
      </div>

      <div className="scroll-y" style={{ padding: '12px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {MAP_ZONES.map(zone => {
          const isOpen = openZone === zone.id
          const zonePlaces = zone.placeIds.map(id => PLACES.find(p => p.id === id)).filter(Boolean)

          return (
            <div key={zone.id} style={{ marginBottom: 10 }}>
              <button onClick={() => setOpenZone(isOpen ? null : zone.id)} className="press" style={{
                width: '100%', background: C.card,
                borderRadius: isOpen ? '16px 16px 0 0' : 16,
                border: `2px solid ${isOpen ? zone.color : C.border}`,
                borderBottom: isOpen ? 'none' : undefined,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ background: zone.color + '22', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {zone.icon}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{zone.name}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{zone.subtitle} · {zonePlaces.length} lieux</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <a href={zone.mapsUrl} target="_blank" rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ background: zone.color, color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                    Maps
                  </a>
                  <span style={{ color: C.muted, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{
                  background: C.card, borderRadius: '0 0 16px 16px',
                  border: `2px solid ${zone.color}`, borderTop: 'none',
                  padding: '4px 12px 12px',
                }}>
                  {zonePlaces.map((place, i) => (
                    <div key={place.id} onClick={() => navigate('place_detail', { placeId: place.id })} className="press"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: i < zonePlaces.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{place.name}</p>
                        <p style={{ fontSize: 12, color: C.muted }}>{place.area}</p>
                      </div>
                      {place.mustBook && <span style={{ fontSize: 11, color: C.coral, fontWeight: 700 }}>📅</span>}
                      <a href={place.address && place.address !== 'À vérifier'
                        ? `https://maps.google.com/?q=${encodeURIComponent(place.name + ' ' + place.address)}`
                        : `https://maps.google.com/?q=${encodeURIComponent(place.name + ' Miami')}`}
                        target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ background: C.mutedLight, color: C.ocean, borderRadius: 8, padding: '6px 10px', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                        📍
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SCREEN: BUDGET ────────────────────────────────────────────────────────────
function BudgetScreen({ navigate, expenses, setExpenses }) {
  const [showAdd, setShowAdd] = useState(false)
  const [showTip, setShowTip] = useState(false)

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (e.currency === 'EUR' ? e.amount : e.amount / 1.1), 0), [expenses])
  const totalAll = FIXED_BUDGET.total + totalExpenses

  const byCategory = useMemo(() => {
    const map = {}
    expenses.forEach(e => {
      const eur = e.currency === 'EUR' ? e.amount : e.amount / 1.1
      map[e.category] = (map[e.category] || 0) + eur
    })
    return map
  }, [expenses])

  const deleteExpense = (id) => setExpenses(e => e.filter(x => x.id !== id))

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScreenHeader
        title="💰 Budget"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTip(true)} style={{ background: C.mutedLight, borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: C.ink, border: 'none' }}>💵 Tip</button>
            <button onClick={() => setShowAdd(true)} style={{ background: C.ocean, color: '#fff', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 700, border: 'none' }}>+ Ajouter</button>
          </div>
        }
      />
      <div className="scroll-y" style={{ flex: 1, padding: '16px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {/* SUMMARY */}
        <div style={{ background: `linear-gradient(135deg, ${C.ocean}, ${C.turquoise})`, borderRadius: 20, padding: 20, marginBottom: 16, color: '#fff' }}>
          <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: 1 }}>BUDGET TOTAL ESTIMÉ</p>
          <p style={{ fontSize: 38, fontWeight: 900, marginTop: 4 }}>{formatEur(totalAll)}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>FIXE</p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>{formatEur(FIXED_BUDGET.total)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>DÉPENSÉ</p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>{formatEur(totalExpenses)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>RESTANT</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: totalAll > TARGET_BUDGET.realistic ? '#FCA5A5' : '#A7F3D0' }}>
                {formatEur(Math.max(0, TARGET_BUDGET.realistic - totalAll))}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 6 }}>
            <div style={{
              height: 6, borderRadius: 8, background: totalAll > TARGET_BUDGET.comfortable ? '#F87171' : '#34D399',
              width: `${Math.min(100, (totalAll / TARGET_BUDGET.realistic) * 100)}%`, transition: 'width .4s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, opacity: 0.7 }}>
            <span>0</span>
            <span>Maîtrisé {formatEur(TARGET_BUDGET.low)}</span>
            <span>Réaliste {formatEur(TARGET_BUDGET.realistic)}</span>
          </div>
        </div>

        {/* BY CATEGORY */}
        {Object.keys(byCategory).length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>PAR CATÉGORIE</p>
            {BUDGET_CATEGORIES.filter(c => byCategory[c.id]).map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20, width: 28 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ocean }}>{formatEur(byCategory[cat.id])}</span>
                  </div>
                  <div style={{ marginTop: 4, height: 3, background: C.mutedLight, borderRadius: 2 }}>
                    <div style={{ height: 3, background: C.ocean, borderRadius: 2, width: `${Math.min(100, (byCategory[cat.id] / totalExpenses) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* EXPENSES LIST */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>DÉPENSES ({expenses.length})</p>
        </div>
        {expenses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
            <p style={{ fontSize: 36 }}>💸</p>
            <p style={{ marginTop: 8, fontWeight: 600 }}>Aucune dépense enregistrée</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Ajoutez vos premières dépenses sur place</p>
          </div>
        )}
        {[...expenses].reverse().map(e => {
          const cat = BUDGET_CATEGORIES.find(c => c.id === e.category)
          return (
            <Card key={e.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{cat?.icon || '💸'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{e.title}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{e.date} · {cat?.label}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: C.ocean }}>
                    {e.currency === 'EUR' ? formatEur(e.amount) : formatUsd(e.amount)}
                  </p>
                  {e.currency === 'USD' && (
                    <p style={{ fontSize: 11, color: C.muted }}>≈ {formatEur(e.amount / 1.1)}</p>
                  )}
                </div>
                <button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', fontSize: 18, color: C.muted, padding: '4px 0 4px 8px' }}>🗑</button>
              </div>
            </Card>
          )
        })}
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onSave={e => { setExpenses(ex => [e, ...ex]); setShowAdd(false) }} />}
      {showTip && <TipCalculator onClose={() => setShowTip(false)} />}
    </div>
  )
}

// ── MODAL: ADD EXPENSE ────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', amount: '', currency: 'USD', category: 'restaurant', date: new Date().toISOString().slice(0, 10), notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.title || !form.amount) return
    onSave({ ...form, id: Date.now().toString(), amount: parseFloat(form.amount) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: C.card, borderRadius: '24px 24px 0 0', width: '100%', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>+ Ajouter une dépense</h3>
          <button onClick={onClose} style={{ background: C.mutedLight, border: 'none', borderRadius: 10, width: 34, height: 34, fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LBL}>Description</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Dîner Harbour Grill" style={INP} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LBL}>Montant</label>
              <input type="number" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" style={INP} />
            </div>
            <div>
              <label style={LBL}>Devise</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} style={INP}>
                <option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label style={LBL}>Catégorie</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BUDGET_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => set('category', c.id)} style={{
                  background: form.category === c.id ? C.ocean : C.mutedLight,
                  color: form.category === c.id ? '#fff' : C.ink,
                  border: 'none', borderRadius: 10, padding: '7px 11px', fontSize: 12, fontWeight: 600,
                }}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={LBL}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={INP} />
          </div>
          <button onClick={submit} style={{ background: C.ocean, color: '#fff', border: 'none', borderRadius: 14, padding: 16, fontSize: 16, fontWeight: 700 }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL: TIP CALCULATOR ─────────────────────────────────────────────────────
function TipCalculator({ onClose }) {
  const [bill, setBill] = useState('')
  const rates = [18, 20, 22, 25]
  const base = parseFloat(bill) || 0
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: C.card, borderRadius: '24px 24px 0 0', width: '100%', padding: '24px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>💵 Calculateur de pourboire</h3>
          <button onClick={onClose} style={{ background: C.mutedLight, border: 'none', borderRadius: 10, width: 34, height: 34, fontSize: 16 }}>✕</button>
        </div>
        <div>
          <label style={LBL}>Montant de l'addition (USD)</label>
          <input type="number" inputMode="decimal" value={bill} onChange={e => setBill(e.target.value)} placeholder="0.00" style={INP} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          {rates.map(r => (
            <div key={r} style={{ background: C.sandLight, borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Tip {r}%</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: C.ocean, marginTop: 2 }}>{formatUsd(base * r / 100)}</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Total : {formatUsd(base * (1 + r / 100))}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 14 }}>Pourboire standard Miami : 18-22% · Standard aux USA</p>
      </div>
    </div>
  )
}

// ── SCREEN: CHECKLIST ─────────────────────────────────────────────────────────
function ChecklistScreen({ checklistDone, setChecklistDone }) {
  const [openGroup, setOpenGroup] = useState(null)
  const toggle = (id) => setChecklistDone(d => ({ ...d, [id]: !d[id] }))
  const totalAll = CHECKLIST_GROUPS.flatMap(g => g.items).length
  const doneAll = CHECKLIST_GROUPS.flatMap(g => g.items).filter(i => checklistDone[i.id]).length
  const pct = Math.round((doneAll / totalAll) * 100)

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        padding: `max(env(safe-area-inset-top), 16px) 16px 16px`,
        background: C.card, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>✅ Check-list avant départ</h2>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? C.success : C.ocean }}>{doneAll}/{totalAll}</span>
        </div>
        <div style={{ height: 8, background: C.mutedLight, borderRadius: 4 }}>
          <div style={{ height: 8, background: pct === 100 ? C.success : C.ocean, borderRadius: 4, width: `${pct}%`, transition: 'width .4s' }} />
        </div>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{pct}% complété</p>
      </div>
      <div className="scroll-y" style={{ flex: 1, padding: '12px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {CHECKLIST_GROUPS.map(g => {
          const isOpen = openGroup === g.id
          const groupDone = g.items.filter(i => checklistDone[i.id]).length
          const groupPct = Math.round((groupDone / g.items.length) * 100)
          return (
            <div key={g.id} style={{ marginBottom: 8 }}>
              <button onClick={() => setOpenGroup(isOpen ? null : g.id)} className="press" style={{
                width: '100%', background: C.card, borderRadius: isOpen ? '14px 14px 0 0' : 14,
                border: `1px solid ${C.border}`, borderBottom: isOpen ? 'none' : undefined,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{g.icon}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{g.label}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{groupDone}/{g.items.length} · {groupPct}%</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>{isOpen ? '▲' : '▼'}</span>
                  {groupPct === 100 && <span style={{ fontSize: 14 }}>✅</span>}
                </div>
              </button>
              {isOpen && (
                <div style={{ background: C.card, borderRadius: '0 0 14px 14px', border: `1px solid ${C.border}`, borderTop: 'none', padding: '4px 16px 16px' }}>
                  {g.items.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < g.items.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                      <button onClick={() => toggle(item.id)} style={{
                        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                        background: checklistDone[item.id] ? C.success : '#fff',
                        border: `2px solid ${checklistDone[item.id] ? C.success : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#fff', marginTop: 1,
                      }}>{checklistDone[item.id] ? '✓' : ''}</button>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 14, fontWeight: checklistDone[item.id] ? 400 : 600,
                          color: checklistDone[item.id] ? C.muted : C.ink,
                          textDecoration: checklistDone[item.id] ? 'line-through' : 'none',
                        }}>{item.label}</p>
                        {item.priority === 'high' && !checklistDone[item.id] && (
                          <span style={{ fontSize: 10, color: C.coral, fontWeight: 700 }}>⚡ PRIORITÉ HAUTE</span>
                        )}
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.ocean, display: 'block', marginTop: 2 }}>→ {item.link.replace('https://', '').split('/')[0]}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SCREEN: SOS ───────────────────────────────────────────────────────────────
function SOSScreen({ goBack }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScreenHeader title="🚨 SOS — Urgences" onBack={goBack} />
      <div className="scroll-y" style={{ flex: 1, padding: '16px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <div style={{ background: C.dangerLight, border: '1px solid #FCA5A5', borderRadius: 14, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 30, marginBottom: 4 }}>🚨</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: C.danger }}>Urgences : composez le 911</p>
          <p style={{ fontSize: 13, color: '#7F1D1D', marginTop: 4 }}>Police · Pompiers · SAMU · 24h/24</p>
          <a href="tel:911" style={{ display: 'inline-block', marginTop: 12, background: C.danger, color: '#fff', padding: '12px 32px', borderRadius: 12, fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>
            📞 Appeler le 911
          </a>
        </div>

        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>CONTACTS UTILES</p>
        {SOS_CONTACTS.filter(c => c.id !== 'sos_911').map(c => (
          <Card key={c.id} style={{ marginBottom: 8, padding: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ background: c.color + '22', borderRadius: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {c.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{c.label}</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{c.description}</p>
                <p style={{ fontSize: 13, color: c.color, fontWeight: 600, marginTop: 2 }}>{c.number}</p>
              </div>
              {c.number !== 'À vérifier' && c.number !== 'Voir certificat' && c.number !== 'À renseigner' && (
                <a href={`tel:${c.number.replace(/\s/g, '')}`} style={{ background: c.color, color: '#fff', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                  📞
                </a>
              )}
            </div>
          </Card>
        ))}

        <Card style={{ marginTop: 8, background: C.sandLight }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🏠 72 Park — Adresse complète</p>
          <p style={{ fontSize: 13, color: C.ink }}>580 72nd St, Miami Beach, FL 33141</p>
          <a href="https://maps.google.com/?q=72+Park+580+72nd+St+Miami+Beach+FL+33141" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, background: C.ocean, color: '#fff', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            📍 Ouvrir dans Maps
          </a>
        </Card>
      </div>
    </div>
  )
}

// ── SCREEN: VOITURE ────────────────────────────────────────────────────────────
function CarScreen({ goBack, checklistDone, setChecklistDone }) {
  const toggle = (id) => setChecklistDone(d => ({ ...d, [id]: !d[id] } ))
  const doneCount = CAR_CHECKLIST.filter(i => checklistDone[i.id]).length

  const grouped = CAR_CHECKLIST.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScreenHeader title="🚗 Voiture" onBack={goBack} />
      <div className="scroll-y" style={{ flex: 1, padding: '16px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${C.sandLight}, ${C.goldLight})` }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🚗 Véhicule recommandé</p>
          <p style={{ fontSize: 14, color: C.inkLight, fontWeight: 600 }}>{CAR_INFO.recommendation}</p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{CAR_INFO.note}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>BUDGET LOCATION</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>~{formatEur(CAR_INFO.budgetEur)}</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>ESSENCE + PÉAGES</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>~{formatEur(CAR_INFO.essenceEur)}</p>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>CHECK-LIST VOITURE</p>
          <span style={{ fontSize: 13, fontWeight: 700, color: doneCount === CAR_CHECKLIST.length ? C.success : C.ocean }}>{doneCount}/{CAR_CHECKLIST.length}</span>
        </div>

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8 }}>{cat.toUpperCase()}</p>
            <Card>
              {items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                  <button onClick={() => toggle(item.id)} style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: checklistDone[item.id] ? C.success : '#fff',
                    border: `2px solid ${checklistDone[item.id] ? C.success : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#fff',
                  }}>{checklistDone[item.id] ? '✓' : ''}</button>
                  <p style={{
                    flex: 1, fontSize: 14,
                    fontWeight: checklistDone[item.id] ? 400 : 600,
                    color: checklistDone[item.id] ? C.muted : C.ink,
                    textDecoration: checklistDone[item.id] ? 'line-through' : 'none',
                  }}>{item.label}</p>
                  {item.priority === 'high' && !checklistDone[item.id] && (
                    <span style={{ fontSize: 10, color: C.coral, fontWeight: 700, flexShrink: 0 }}>⚡</span>
                  )}
                </div>
              ))}
            </Card>
          </div>
        ))}

        <Card style={{ background: '#FEF9C3', border: '1px solid #F59E0B', marginTop: 4 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 6 }}>⚠️ Revolut Ultra — Location voiture</p>
          <p style={{ fontSize: 13, color: '#78350F' }}>Franchise limitée à 2 000 €. Couverture max 30 jours consécutifs. Doit avoir souscrit CDW auprès du loueur.</p>
        </Card>
      </div>
    </div>
  )
}

// ── SCREEN: DOCUMENTS ─────────────────────────────────────────────────────────
function DocumentsScreen({ goBack, checklistDone, setChecklistDone }) {
  const toggle = (id) => setChecklistDone(d => ({ ...d, [id]: !d[id] }))

  const grouped = DOCUMENTS_LIST.reduce((acc, doc) => {
    acc[doc.category] = acc[doc.category] || []
    acc[doc.category].push(doc)
    return acc
  }, {})

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScreenHeader title="📄 Documents & Coffre-fort" onBack={goBack} />
      <div className="scroll-y" style={{ flex: 1, padding: '16px 16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <div style={{ background: C.coralLight, border: `1px solid ${C.coral}44`, borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: C.coral }}>🔒 Coffre-fort local</p>
          <p style={{ fontSize: 12, color: C.inkLight, marginTop: 4 }}>Les documents sont stockés localement sur votre appareil. Ne photographiez jamais vos numéros de passeport en clair.</p>
        </div>

        {Object.entries(grouped).map(([cat, docs]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 8 }}>{cat.toUpperCase()}</p>
            <Card>
              {docs.map((doc, i) => (
                <div key={doc.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < docs.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                  <button onClick={() => toggle(doc.id)} style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: checklistDone[doc.id] ? C.success : '#fff',
                    border: `2px solid ${checklistDone[doc.id] ? C.success : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#fff', marginTop: 2,
                  }}>{checklistDone[doc.id] ? '✓' : ''}</button>
                  <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{doc.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: checklistDone[doc.id] ? C.muted : C.ink }}>{doc.label}</p>
                      {doc.sensitive && <Tag label="🔒 Sensible" color={C.dangerLight} textColor={C.danger} small />}
                    </div>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{doc.description}</p>
                    {doc.link && (
                      <a href={doc.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.ocean, marginTop: 4, display: 'block' }}>→ {doc.link.replace('https://', '').split('/')[0]}</a>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SHARED FORM STYLES ─────────────────────────────────────────────────────────
const LBL = { fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }
const INP = { width: '100%', background: C.mutedLight, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none', color: C.ink, display: 'block' }

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('home')
  const [screenParams, setScreenParams] = useState({})
  const [stack, setStack] = useState([])

  const [checklistDone, setChecklistDone] = useLocalStorage('miami_checklist_v1', {})
  const [expenses, setExpenses] = useLocalStorage('miami_expenses_v1', [])
  const [planningDone, setPlanningDone] = useLocalStorage('miami_planning_v1', {})
  const [favorites, setFavorites] = useLocalStorage('miami_favorites_v1', [])

  const navigate = useCallback((s, params = {}) => {
    setStack(prev => [...prev, { screen, params: screenParams }])
    setScreen(s)
    setScreenParams(params)
  }, [screen, screenParams])

  const goBack = useCallback(() => {
    const prev = stack[stack.length - 1]
    if (prev) {
      setStack(s => s.slice(0, -1))
      setScreen(prev.screen)
      setScreenParams(prev.params)
    }
  }, [stack])

  const TAB_SCREENS = ['home', 'planning', 'places', 'map', 'budget', 'checklist']
  const isTab = TAB_SCREENS.includes(screen)

  const shared = { navigate, goBack, screenParams, checklistDone, setChecklistDone, expenses, setExpenses, planningDone, setPlanningDone, favorites, setFavorites }

  return (
    <>
      <GlobalStyles />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.bg }}>
        {screen === 'home'         && <HomeScreen {...shared} />}
        {screen === 'planning'     && <PlanningScreen {...shared} />}
        {screen === 'places'       && <PlacesScreen {...shared} params={screenParams} />}
        {screen === 'budget'       && <BudgetScreen {...shared} />}
        {screen === 'checklist'    && <ChecklistScreen {...shared} />}
        {screen === 'place_detail' && <PlaceDetailScreen {...shared} />}
        {screen === 'concierge'    && <ConciergeScreen {...shared} />}
        {screen === 'map'          && <MapScreen {...shared} />}
        {screen === 'sos'          && <SOSScreen {...shared} />}
        {screen === 'car'          && <CarScreen {...shared} />}
        {screen === 'documents'    && <DocumentsScreen {...shared} />}
      </div>
      {isTab && <BottomNav current={screen} navigate={s => { setStack([]); setScreen(s); setScreenParams({}) }} />}
    </>
  )
}

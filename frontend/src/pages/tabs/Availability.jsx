import { useState, useEffect, useCallback } from 'react'
import {
  getAvailability,
  getAvailabilityOverlap,
  createAvailability,
  deleteAvailability,
} from '../../api.js'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function isoToLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`
}

function periodLabel(p) {
  if (p.days === 1) return `${isoToLabel(p.start)}（1日）`
  return `${isoToLabel(p.start)} 〜 ${isoToLabel(p.end)}（${p.days}日間）`
}

// Generate a range of dates between two ISO strings (inclusive)
function dateRange(startIso, endIso) {
  const dates = []
  const cur = new Date(startIso + 'T00:00:00')
  const end = new Date(endIso + 'T00:00:00')
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// Build a mini calendar for a month
function MonthCalendar({ year, month, selected, onToggle, highlightDates }) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)

  const monthLabel = `${year}年${month + 1}月`

  return (
    <div className="avail-month">
      <div className="avail-month-label">{monthLabel}</div>
      <div className="avail-cal-grid">
        {DAY_NAMES.map((n, i) => (
          <div key={n} className={`avail-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{n}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const dow = (startDow + d - 1) % 7
          const isSel = selected.includes(iso)
          const isHL = highlightDates.includes(iso)
          return (
            <button
              key={iso}
              className={`avail-day${isSel ? ' selected' : ''}${isHL ? ' overlap' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}`}
              onClick={() => onToggle(iso)}
              type="button"
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Availability({ tripId }) {
  const [submissions, setSubmissions] = useState([])
  const [overlap, setOverlap] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedDates, setSelectedDates] = useState([])
  const [calMonths, setCalMonths] = useState(() => {
    const now = new Date()
    return [{ year: now.getFullYear(), month: now.getMonth() },
            { year: now.getFullYear(), month: now.getMonth() + 1 }]
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [subs, ov] = await Promise.all([
      getAvailability(tripId),
      getAvailabilityOverlap(tripId),
    ])
    setSubmissions(subs)
    setOverlap(ov)
  }, [tripId])

  useEffect(() => { load() }, [load])

  function toggleDate(iso) {
    setSelectedDates(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso]
    )
  }

  function shiftMonths(delta) {
    setCalMonths(prev => prev.map(({ year, month }) => {
      let m = month + delta
      let y = year
      if (m > 11) { m -= 12; y++ }
      if (m < 0) { m += 12; y-- }
      return { year: y, month: m }
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || selectedDates.length === 0) return
    setSaving(true)
    try {
      await createAvailability(tripId, {
        name: name.trim(),
        available_dates: selectedDates,
        memo: memo.trim() || null,
      })
      setName('')
      setMemo('')
      setSelectedDates([])
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(subId) {
    if (!confirm('この回答を削除しますか？')) return
    await deleteAvailability(tripId, subId)
    load()
  }

  const overlapDates = overlap?.common_dates ?? []

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>日程調整</h3>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'キャンセル' : '＋ 空き日程を登録'}
        </button>
      </div>

      {showForm && (
        <form className="avail-form card" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>名前</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：自分、友人A"
              required
            />
          </div>
          <div className="form-row">
            <label>メモ</label>
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="任意"
            />
          </div>

          <div className="avail-cal-nav">
            <button type="button" className="btn-secondary" onClick={() => shiftMonths(-1)}>◀</button>
            <span>{calMonths[0].year}年{calMonths[0].month + 1}月 〜 {calMonths[1].year}年{calMonths[1].month + 1}月</span>
            <button type="button" className="btn-secondary" onClick={() => shiftMonths(1)}>▶</button>
          </div>

          <div className="avail-months-row">
            {calMonths.map(({ year, month }) => (
              <MonthCalendar
                key={`${year}-${month}`}
                year={year}
                month={month}
                selected={selectedDates}
                onToggle={toggleDate}
                highlightDates={[]}
              />
            ))}
          </div>

          <div className="avail-selected-count">
            {selectedDates.length > 0
              ? `${selectedDates.length}日選択中`
              : 'カレンダーで空き日をタップしてください'}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>キャンセル</button>
            <button type="submit" className="btn-primary" disabled={saving || !name.trim() || selectedDates.length === 0}>
              {saving ? '保存中...' : '登録'}
            </button>
          </div>
        </form>
      )}

      {/* Overlap result */}
      {overlap && submissions.length >= 2 && (
        <div className="avail-overlap card">
          <h4>🟢 全員の共通空き日程</h4>
          {overlap.periods.length === 0 ? (
            <p className="empty-hint">共通の空き日がありません</p>
          ) : (
            <ul className="avail-periods">
              {overlap.periods.map((p, i) => (
                <li key={i} className={`avail-period ${i === 0 ? 'best' : ''}`}>
                  {i === 0 && <span className="badge-best">最長</span>}
                  {periodLabel(p)}
                </li>
              ))}
            </ul>
          )}
          {overlapDates.length > 0 && (
            <p className="avail-overlap-hint">
              共通日: {overlapDates.map(isoToLabel).join('、')}
            </p>
          )}
        </div>
      )}

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <p className="empty-hint">まだ誰も登録していません。「空き日程を登録」から追加してください。</p>
      ) : (
        <div className="avail-submissions">
          {submissions.map(sub => (
            <div key={sub.id} className="avail-sub card">
              <div className="avail-sub-header">
                <strong>{sub.name}</strong>
                <span>{sub.available_dates.length}日</span>
                <button className="btn-danger-sm" onClick={() => handleDelete(sub.id)}>削除</button>
              </div>
              {sub.memo && <p className="avail-sub-memo">{sub.memo}</p>}
              <div className="avail-sub-dates">
                {sub.available_dates.map(d => (
                  <span
                    key={d}
                    className={`avail-date-chip${overlapDates.includes(d) ? ' overlap' : ''}`}
                  >
                    {isoToLabel(d)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

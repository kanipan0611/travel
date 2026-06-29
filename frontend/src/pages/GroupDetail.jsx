import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGroupSummary, updateGroup, getTrips, updateTrip } from '../api.js'
import BudgetBar from '../components/BudgetBar.jsx'

const STATUS_COLORS = { planning: '#94a3b8', confirmed: '#3b82f6', booked: '#8b5cf6', done: '#16a34a' }
const STATUS_LABELS = { planning: '計画中', confirmed: '確定', booked: '予約済', done: '完了' }
const CAT_COLORS = {
  '交通': '#3b82f6', '宿泊': '#8b5cf6', '食事': '#f59e0b',
  'アクティビティ': '#10b981', 'お土産': '#ec4899', 'その他': '#94a3b8'
}

function formatDate(iso) {
  if (!iso) return '未定'
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth()+1}/${d.getDate()}`
}

export default function GroupDetail() {
  const { id } = useParams()
  const [summary, setSummary] = useState(null)
  const [allTrips, setAllTrips] = useState([])
  const [editBudget, setEditBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [editName, setEditName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    const [s, trips] = await Promise.all([getGroupSummary(id), getTrips()])
    setSummary(s)
    setAllTrips(trips)
    setBudgetInput(s.group.budget_total ?? '')
    setNameInput(s.group.name)
  }

  async function saveBudget() {
    await updateGroup(id, { budget_total: budgetInput ? parseInt(budgetInput) : null })
    setEditBudget(false)
    load()
  }

  async function saveName() {
    await updateGroup(id, { name: nameInput })
    setEditName(false)
    load()
  }

  async function assignTrip(tripId, groupId) {
    await updateTrip(tripId, { group_id: groupId })
    load()
  }

  if (!summary) return <div className="empty-state">読み込み中...</div>

  const { group, trips, total_spent, remaining, category_totals, timeline } = summary
  const unassignedTrips = allTrips.filter(t => !t.group_id || t.group_id === null)

  const datedTrips = timeline.filter(t => t.start_date && t.end_date)
  const minDate = datedTrips.length > 0 ? new Date(datedTrips.map(t => t.start_date).sort()[0] + 'T00:00:00') : null
  const maxDate = datedTrips.length > 0 ? new Date(datedTrips.map(t => t.end_date).sort().reverse()[0] + 'T00:00:00') : null
  const totalDays = minDate && maxDate ? Math.ceil((maxDate - minDate) / 86400000) + 1 : 0

  return (
    <div>
      {/* Header */}
      <div className="group-detail-header">
        <div>
          {editName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={nameInput} onChange={e => setNameInput(e.target.value)} style={{ fontSize: '1.5rem', fontWeight: 700 }} />
              <button className="btn-primary" onClick={saveName}>保存</button>
              <button className="btn-secondary" onClick={() => setEditName(false)}>✕</button>
            </div>
          ) : (
            <h2 onClick={() => setEditName(true)} style={{ cursor: 'pointer' }} title="クリックして編集">
              {group.name} ✏️
            </h2>
          )}
          {group.description && <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>{group.description}</p>}
        </div>
        <Link to="/groups" style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>← 統合ビュー一覧</Link>
      </div>

      {/* Budget overview */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>💰 予算サマリー</h3>
          {!editBudget && (
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '2px 10px' }} onClick={() => setEditBudget(true)}>
              予算を{group.budget_total ? '変更' : '設定'}
            </button>
          )}
        </div>
        {editBudget && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="number" min="0" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} placeholder="予算上限（円）" style={{ flex: 1 }} />
            <button className="btn-primary" onClick={saveBudget}>保存</button>
            <button className="btn-secondary" onClick={() => setEditBudget(false)}>✕</button>
          </div>
        )}
        <div className="budget-summary" style={{ marginBottom: 12 }}>
          <div className="budget-stat">
            <div className="budget-stat-value">¥{total_spent.toLocaleString()}</div>
            <div className="budget-stat-label">全体支出</div>
          </div>
          {group.budget_total && (
            <>
              <div className="budget-stat">
                <div className="budget-stat-value">¥{group.budget_total.toLocaleString()}</div>
                <div className="budget-stat-label">予算上限</div>
              </div>
              <div className="budget-stat">
                <div className="budget-stat-value" style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--success)' }}>
                  ¥{Math.abs(remaining).toLocaleString()}
                </div>
                <div className="budget-stat-label">{remaining < 0 ? '予算オーバー' : '残り'}</div>
              </div>
            </>
          )}
        </div>
        {group.budget_total && <BudgetBar spent={total_spent} total={group.budget_total} />}

        {/* Per-trip breakdown */}
        {trips.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>旅行別支出</div>
            {trips.map(trip => (
              <div key={trip.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[trip.status] || '#94a3b8', flexShrink: 0 }} />
                <Link to={`/trips/${trip.id}`} style={{ flex: 1, fontSize: '0.875rem', color: 'var(--gray-700)' }}>{trip.title}</Link>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{STATUS_LABELS[trip.status]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        {Object.keys(category_totals).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>カテゴリ別（全旅行合計）</div>
            {Object.entries(category_totals).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
              <div key={cat} className="category-row">
                <div className="category-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CAT_COLORS[cat] || '#94a3b8' }} />
                  {cat}
                </div>
                <div className="category-bar-track">
                  <div className="category-bar-fill" style={{ width: `${(amt / Math.max(...Object.values(category_totals))) * 100}%`, background: CAT_COLORS[cat] || '#94a3b8' }} />
                </div>
                <div className="category-amount">¥{amt.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: 12 }}>📅 タイムライン</h3>
        {timeline.length === 0 ? (
          <p className="empty-hint">旅行を追加してください</p>
        ) : (
          <div className="group-timeline">
            {timeline.map((t, i) => {
              const color = Object.values(STATUS_COLORS)[i % Object.values(STATUS_COLORS).length]
              const hasDate = t.start_date && t.end_date
              const tripStart = hasDate ? new Date(t.start_date + 'T00:00:00') : null
              const tripEnd = hasDate ? new Date(t.end_date + 'T00:00:00') : null
              const leftPct = (minDate && tripStart) ? ((tripStart - minDate) / 86400000 / totalDays * 100) : 0
              const widthPct = (tripStart && tripEnd) ? (Math.ceil((tripEnd - tripStart) / 86400000) + 1) / totalDays * 100 : 100

              return (
                <div key={t.trip_id} className="timeline-row">
                  <Link to={`/trips/${t.trip_id}`} className="timeline-trip-label">{t.trip_title}</Link>
                  <div className="timeline-bar-track">
                    <div
                      className="timeline-bar"
                      style={{
                        left: `${leftPct}%`,
                        width: hasDate ? `${widthPct}%` : '100%',
                        background: color,
                      }}
                    >
                      {hasDate && <span className="timeline-bar-label">{formatDate(t.start_date)}〜{formatDate(t.end_date)}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Schedule items grouped by trip */}
        {timeline.some(t => t.schedule_items.length > 0) && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>日程詳細</div>
            {timeline.filter(t => t.schedule_items.length > 0).map(t => (
              <div key={t.trip_id} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, color: 'var(--gray-700)' }}>
                  📍 {t.trip_title}
                </div>
                {t.schedule_items.map((s, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--gray-500)', padding: '2px 0 2px 12px' }}>
                    {s.day_number}日目{s.start_time ? ` ${s.start_time}` : ''} — {s.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign trips */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: 12 }}>旅行の管理</h3>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>このグループの旅行</div>
        {trips.length === 0 ? (
          <p className="empty-hint" style={{ marginBottom: 12 }}>旅行が追加されていません</p>
        ) : (
          trips.map(trip => (
            <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <Link to={`/trips/${trip.id}`} style={{ fontSize: '0.875rem' }}>{trip.title}</Link>
              <button className="btn-danger-sm" onClick={() => assignTrip(trip.id, null)}>除外</button>
            </div>
          ))
        )}

        {unassignedTrips.length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 16, marginBottom: 8 }}>旅行を追加</div>
            {unassignedTrips.map(trip => (
              <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{trip.title}</span>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '2px 10px' }} onClick={() => assignTrip(trip.id, parseInt(id))}>追加</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { getTrips, getExpenses, createTrip } from '../api.js'
import TripCard from '../components/TripCard.jsx'
import '../styles/dashboard.css'

const STATUS_FILTERS = [
  { key: 'all', label: 'すべて' },
  { key: 'planning', label: '計画中' },
  { key: 'confirmed', label: '確定' },
  { key: 'booked', label: '予約済' },
  { key: 'done', label: '完了' },
]

export default function Dashboard() {
  const [trips, setTrips] = useState([])
  const [spentMap, setSpentMap] = useState({})
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', destination: '', status: 'planning', member_count: 2, budget_total: '', start_date: '', end_date: '' })

  useEffect(() => {
    loadTrips()
  }, [])

  async function loadTrips() {
    const data = await getTrips()
    setTrips(data)
    // Load expenses for each trip to show budget bars
    const map = {}
    await Promise.all(data.map(async t => {
      const exps = await getExpenses(t.id)
      map[t.id] = exps.reduce((s, e) => s + e.amount, 0)
    }))
    setSpentMap(map)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const payload = { ...form, member_count: parseInt(form.member_count) || 1 }
    if (payload.budget_total) payload.budget_total = parseInt(payload.budget_total)
    else delete payload.budget_total
    if (!payload.start_date) delete payload.start_date
    if (!payload.end_date) delete payload.end_date
    await createTrip(payload)
    setShowModal(false)
    setForm({ title: '', destination: '', status: 'planning', member_count: 2, budget_total: '', start_date: '', end_date: '' })
    loadTrips()
  }

  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">旅行一覧</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新しい旅行</button>
      </div>

      <div className="filter-tabs">
        {STATUS_FILTERS.map(f => (
          <button key={f.key} className={`filter-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">旅行がまだありません。新しい旅行を追加しましょう！</div>
      ) : (
        <div className="trip-grid">
          {filtered.map(t => (
            <TripCard key={t.id} trip={t} totalSpent={spentMap[t.id] || 0} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新しい旅行を作成</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>タイトル *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例: 京都旅行" />
              </div>
              <div className="form-group">
                <label>目的地 *</label>
                <input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="例: 京都府" />
              </div>
              <div className="row">
                <div className="form-group">
                  <label>ステータス</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="planning">計画中</option>
                    <option value="confirmed">確定</option>
                    <option value="booked">予約済</option>
                    <option value="done">完了</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>人数</label>
                  <input type="number" min="1" value={form.member_count} onChange={e => setForm({ ...form, member_count: e.target.value })} />
                </div>
              </div>
              <div className="row">
                <div className="form-group">
                  <label>出発日</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>帰着日</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>予算 (円)</label>
                <input type="number" value={form.budget_total} onChange={e => setForm({ ...form, budget_total: e.target.value })} placeholder="例: 150000" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>キャンセル</button>
                <button type="submit" className="btn btn-primary">作成</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

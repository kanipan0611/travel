import { useState } from 'react'
import { updateTrip, deleteTrip } from '../../api.js'
import { useNavigate } from 'react-router-dom'

function ShareLinkCard({ trip }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/share/${trip.share_token}`

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>🔗 共有リンク</h2>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          readOnly
          value={shareUrl}
          style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: '0.375rem', fontSize: '0.875rem', background: 'var(--gray-50)' }}
          onFocus={e => e.target.select()}
        />
        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
          {copied ? 'コピーしました！' : 'コピー'}
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
        このリンクを知っている人は旅行を閲覧・編集できます
      </p>
    </div>
  )
}

export default function Overview({ trip, onUpdate }) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: trip.title,
    destination: trip.destination,
    status: trip.status,
    start_date: trip.start_date || '',
    end_date: trip.end_date || '',
    budget_total: trip.budget_total || '',
    member_count: trip.member_count,
  })

  async function handleSave(e) {
    e.preventDefault()
    const payload = { ...form, member_count: parseInt(form.member_count) }
    if (payload.budget_total) payload.budget_total = parseInt(payload.budget_total)
    else payload.budget_total = null
    if (!payload.start_date) payload.start_date = null
    if (!payload.end_date) payload.end_date = null
    await updateTrip(trip.id, payload)
    setEditing(false)
    onUpdate()
  }

  async function handleDelete() {
    if (!confirm('この旅行を削除しますか？')) return
    await deleteTrip(trip.id)
    navigate('/')
  }

  if (!editing) {
    return (
      <div>
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>旅行情報</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>編集</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>削除</button>
          </div>
        </div>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr><td style={{ fontWeight: 600, padding: '0.5rem 0', width: '120px', color: 'var(--gray-500)' }}>タイトル</td><td>{trip.title}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: '0.5rem 0', color: 'var(--gray-500)' }}>目的地</td><td>{trip.destination}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: '0.5rem 0', color: 'var(--gray-500)' }}>ステータス</td><td><span className={`badge badge-${trip.status}`}>{trip.status}</span></td></tr>
            <tr><td style={{ fontWeight: 600, padding: '0.5rem 0', color: 'var(--gray-500)' }}>出発日</td><td>{trip.start_date || '-'}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: '0.5rem 0', color: 'var(--gray-500)' }}>帰着日</td><td>{trip.end_date || '-'}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: '0.5rem 0', color: 'var(--gray-500)' }}>人数</td><td>{trip.member_count}名</td></tr>
            <tr><td style={{ fontWeight: 600, padding: '0.5rem 0', color: 'var(--gray-500)' }}>予算</td><td>{trip.budget_total ? `¥${trip.budget_total.toLocaleString()}` : '-'}</td></tr>
          </tbody>
        </table>
      </div>
      {trip.share_token && <ShareLinkCard trip={trip} />}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>旅行情報を編集</h2>
      <form onSubmit={handleSave}>
        <div className="row">
          <div className="form-group">
            <label>タイトル *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>目的地 *</label>
            <input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
          </div>
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
          <input type="number" value={form.budget_total} onChange={e => setForm({ ...form, budget_total: e.target.value })} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>キャンセル</button>
          <button type="submit" className="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  )
}

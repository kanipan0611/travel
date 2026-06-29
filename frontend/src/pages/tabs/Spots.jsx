import { useState, useEffect } from 'react'
import { getSpots, createSpot, updateSpot, deleteSpot, getSpotLinks, createSpotLink, deleteSpotLink } from '../../api.js'

const DECISIONS = [
  { key: 'all', label: 'すべて' },
  { key: 'go', label: '行く' },
  { key: 'candidate', label: '候補' },
  { key: 'hold', label: '保留' },
]

const CATEGORIES = ['観光', '飲食', '宿', 'その他']
const DECISION_OPTIONS = [
  { value: 'go', label: '行く' },
  { value: 'candidate', label: '候補' },
  { value: 'hold', label: '保留' },
]

const EMPTY_FORM = { name: '', category: '観光', decision: 'candidate', memo: '', estimated_cost: '', lat: '', lng: '' }

export default function Spots({ tripId }) {
  const [spots, setSpots] = useState([])
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editSpot, setEditSpot] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [linksMap, setLinksMap] = useState({})
  const [showLinkForm, setShowLinkForm] = useState({})
  const [linkForm, setLinkForm] = useState({})

  useEffect(() => { loadSpots() }, [tripId])

  async function loadSpots() {
    const data = await getSpots(tripId)
    setSpots(data)
    const map = {}
    await Promise.all(data.map(async s => {
      map[s.id] = await getSpotLinks(tripId, s.id)
    }))
    setLinksMap(map)
  }

  async function handleAddLink(spotId) {
    const f = linkForm[spotId] || { label: '', url: '' }
    if (!f.label.trim() || !f.url.trim()) return
    const link = await createSpotLink(tripId, spotId, { label: f.label.trim(), url: f.url.trim() })
    setLinksMap(m => ({ ...m, [spotId]: [...(m[spotId] || []), link] }))
    setLinkForm(lf => ({ ...lf, [spotId]: { label: '', url: '' } }))
  }

  async function handleDeleteLink(spotId, linkId) {
    await deleteSpotLink(tripId, spotId, linkId)
    setLinksMap(m => ({ ...m, [spotId]: (m[spotId] || []).filter(l => l.id !== linkId) }))
  }

  function openCreate() {
    setEditSpot(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(spot) {
    setEditSpot(spot)
    setForm({
      name: spot.name,
      category: spot.category,
      decision: spot.decision,
      memo: spot.memo || '',
      estimated_cost: spot.estimated_cost || '',
      lat: spot.lat || '',
      lng: spot.lng || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form }
    if (payload.estimated_cost) payload.estimated_cost = parseInt(payload.estimated_cost)
    else delete payload.estimated_cost
    if (payload.lat) payload.lat = parseFloat(payload.lat); else delete payload.lat
    if (payload.lng) payload.lng = parseFloat(payload.lng); else delete payload.lng
    if (!payload.memo) delete payload.memo
    if (editSpot) {
      await updateSpot(tripId, editSpot.id, payload)
    } else {
      await createSpot(tripId, payload)
    }
    setShowModal(false)
    loadSpots()
  }

  async function handleDelete(spot) {
    if (!confirm(`「${spot.name}」を削除しますか？`)) return
    await deleteSpot(tripId, spot.id)
    loadSpots()
  }

  const filtered = filter === 'all' ? spots : spots.filter(s => s.decision === filter)

  return (
    <div>
      <div className="page-header">
        <div className="filter-tabs">
          {DECISIONS.map(d => (
            <button key={d.key} className={`filter-tab ${filter === d.key ? 'active' : ''}`} onClick={() => setFilter(d.key)}>
              {d.label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ 追加</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">訪問先がありません</div>
      ) : (
        <div className="spot-list">
          {filtered.map(s => (
            <div key={s.id} className="spot-item">
              <div>
                <span className={`decision-badge decision-${s.decision}`}>
                  {DECISION_OPTIONS.find(d => d.value === s.decision)?.label || s.decision}
                </span>
              </div>
              <div className="spot-item-name">{s.name}</div>
              <div className="spot-item-category">{s.category}</div>
              {s.estimated_cost && <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>¥{s.estimated_cost.toLocaleString()}</div>}
              <div className="spot-links">
                {(linksMap[s.id] || []).map(link => (
                  <span key={link.id} className="spot-link-chip">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>
                    <button className="spot-link-delete" onClick={() => handleDeleteLink(s.id, link.id)}>×</button>
                  </span>
                ))}
              </div>
              <button className="spot-link-toggle" onClick={() => setShowLinkForm(sf => ({ ...sf, [s.id]: !sf[s.id] }))}>
                {showLinkForm[s.id] ? 'キャンセル' : 'リンクを追加'}
              </button>
              {showLinkForm[s.id] && (
                <div className="spot-link-form">
                  <input
                    placeholder="ラベル（例：公式サイト）"
                    value={(linkForm[s.id] || {}).label || ''}
                    onChange={e => setLinkForm(lf => ({ ...lf, [s.id]: { ...(lf[s.id] || {}), label: e.target.value } }))}
                  />
                  <input
                    placeholder="URL"
                    value={(linkForm[s.id] || {}).url || ''}
                    onChange={e => setLinkForm(lf => ({ ...lf, [s.id]: { ...(lf[s.id] || {}), url: e.target.value } }))}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddLink(s.id)}>追加</button>
                </div>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>編集</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>削除</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editSpot ? '訪問先を編集' : '訪問先を追加'}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>名前 *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="row">
                <div className="form-group">
                  <label>カテゴリ</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>判断</label>
                  <select value={form.decision} onChange={e => setForm({ ...form, decision: e.target.value })}>
                    {DECISION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>予想費用 (円)</label>
                <input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} />
              </div>
              <div className="form-group">
                <label>メモ</label>
                <textarea rows={3} value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>キャンセル</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

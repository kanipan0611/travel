import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getGroups, createGroup, deleteGroup } from '../api.js'

export default function GroupDashboard() {
  const [groups, setGroups] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', budget_total: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setGroups(await getGroups())
  }

  async function handleCreate(e) {
    e.preventDefault()
    await createGroup({
      name: form.name,
      description: form.description || null,
      budget_total: form.budget_total ? parseInt(form.budget_total) : null,
    })
    setForm({ name: '', description: '', budget_total: '' })
    setShowForm(false)
    load()
  }

  async function handleDelete(g) {
    if (!confirm(`「${g.name}」を削除しますか？旅行は削除されません。`)) return
    await deleteGroup(g.id)
    load()
  }

  return (
    <div>
      <div className="section-header">
        <h2>統合ビュー</h2>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'キャンセル' : '＋ グループを作成'}
        </button>
      </div>

      {showForm && (
        <form className="card avail-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>グループ名 *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="例：2025年夏休み" />
          </div>
          <div className="form-row">
            <label>メモ</label>
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="任意" />
          </div>
          <div className="form-row">
            <label>全体予算上限 (円)</label>
            <input type="number" min="0" value={form.budget_total} onChange={e => setForm({...form, budget_total: e.target.value})} placeholder="任意" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>キャンセル</button>
            <button type="submit" className="btn-primary">作成</button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="empty-hint">グループがありません。複数の旅行をまとめて管理するグループを作成してください。</p>
      ) : (
        <div className="group-list">
          {groups.map(g => (
            <div key={g.id} className="card group-card">
              <div className="group-card-header">
                <Link to={`/groups/${g.id}`} className="group-card-title">{g.name}</Link>
                <button className="btn-danger-sm" onClick={() => handleDelete(g)}>削除</button>
              </div>
              {g.description && <p className="group-card-desc">{g.description}</p>}
              {g.budget_total && (
                <p className="group-card-budget">予算上限: ¥{g.budget_total.toLocaleString()}</p>
              )}
              <Link to={`/groups/${g.id}`} className="btn-secondary" style={{ display: 'inline-block', marginTop: 8, fontSize: '0.875rem', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--gray-200)', textDecoration: 'none' }}>
                詳細を見る →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

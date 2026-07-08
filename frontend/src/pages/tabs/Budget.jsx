import { useState, useEffect } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense, getMembers } from '../../api.js'
import BudgetBar from '../../components/BudgetBar.jsx'

const CATEGORIES = ['交通', '宿泊', '食事', 'アクティビティ', 'お土産', 'その他']

function emptyForm(members) {
  return {
    category: ['交通'],
    label: '',
    amount: '',
    estimated_amount: '',
    paid_by: members[0]?.name ?? '',
    scheduled_day: '',
    participants: members.map(m => m.name),
  }
}

export default function Budget({ tripId, trip }) {
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editExp, setEditExp] = useState(null)
  const [form, setForm] = useState(null)
  const [perPerson, setPerPerson] = useState(false)

  useEffect(() => { loadAll() }, [tripId])

  async function loadAll() {
    const [exps, mems] = await Promise.all([getExpenses(tripId), getMembers(tripId)])
    setExpenses(exps)
    setMembers(mems)
  }

  function openCreate() {
    setEditExp(null)
    setForm(emptyForm(members))
    setShowModal(true)
  }

  function openEdit(exp) {
    setEditExp(exp)
    setForm({
      category: Array.isArray(exp.category) ? exp.category : [exp.category],
      label: exp.label,
      amount: exp.amount || '',
      estimated_amount: exp.estimated_amount ?? '',
      paid_by: exp.paid_by || '',
      scheduled_day: exp.scheduled_day || '',
      participants: exp.participants ?? members.map(m => m.name),
    })
    setShowModal(true)
  }

  function toggleParticipant(name) {
    setForm(f => {
      const cur = f.participants ?? []
      return {
        ...f,
        participants: cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name],
      }
    })
  }

  function toggleCategory(cat) {
    setForm(f => {
      const cur = f.category ?? []
      return {
        ...f,
        category: cur.includes(cat) ? cur.filter(c => c !== cat) : [...cur, cat],
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      category: form.category.length > 0 ? form.category : ['その他'],
      estimated_amount: parseInt(form.estimated_amount),
      amount: form.amount ? parseInt(form.amount) : 0,
      paid_by: form.paid_by || null,
      scheduled_day: form.scheduled_day ? parseInt(form.scheduled_day) : null,
      participants: form.participants.length > 0 ? form.participants : null,
    }
    if (editExp) {
      await updateExpense(tripId, editExp.id, payload)
    } else {
      await createExpense(tripId, payload)
    }
    setShowModal(false)
    loadAll()
  }

  async function handleDelete(exp) {
    if (!confirm('削除しますか？')) return
    await deleteExpense(tripId, exp.id)
    loadAll()
  }

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const estimatedTotal = expenses.reduce((s, e) => s + (e.estimated_amount ?? 0), 0)
  const divisor = perPerson ? (trip.member_count || 1) : 1

  // Bar chart: estimated and actual split equally across multiple categories
  const catEstMap = {}
  const catActMap = {}
  for (const exp of expenses) {
    const cats = Array.isArray(exp.category) ? exp.category : [exp.category || 'その他']
    const estPerCat = (exp.estimated_amount ?? 0) / cats.length
    const actPerCat = (exp.amount || 0) / cats.length
    for (const cat of cats) {
      catEstMap[cat] = (catEstMap[cat] || 0) + estPerCat
      catActMap[cat] = (catActMap[cat] || 0) + actPerCat
    }
  }
  const maxCat = Math.max(...Object.values(catEstMap), 1)

  const allNames = members.map(m => m.name)

  return (
    <div>
      <div className="budget-summary">
        <div className="budget-stat">
          <div className="budget-stat-value">¥{Math.floor(estimatedTotal / divisor).toLocaleString()}</div>
          <div className="budget-stat-label">{perPerson ? '一人あたり見積もり' : '見積もり合計'}</div>
        </div>
        <div className="budget-stat">
          <div className="budget-stat-value">¥{Math.floor(total / divisor).toLocaleString()}</div>
          <div className="budget-stat-label">{perPerson ? '一人あたり実績' : '実績合計'}</div>
        </div>
        {trip.budget_total && (
          <div className="budget-stat">
            <div className="budget-stat-value">¥{Math.floor(trip.budget_total / divisor).toLocaleString()}</div>
            <div className="budget-stat-label">{perPerson ? '一人あたり予算' : '総予算'}</div>
          </div>
        )}
        {trip.budget_total && (
          <div className="budget-stat">
            <div className="budget-stat-value" style={{ color: trip.budget_total - estimatedTotal < 0 ? 'var(--danger)' : 'var(--success)' }}>
              ¥{Math.abs(Math.floor((trip.budget_total - estimatedTotal) / divisor)).toLocaleString()}
            </div>
            <div className="budget-stat-label">{trip.budget_total - estimatedTotal < 0 ? '予算オーバー' : '残り'}</div>
          </div>
        )}
      </div>

      {trip.budget_total && (
        <div style={{ marginBottom: '1.5rem' }}>
          <BudgetBar spent={estimatedTotal} total={trip.budget_total} />
        </div>
      )}

      {estimatedTotal > 0 && total > 0 && (
        <div className="budget-compare-row" style={{ marginBottom: '1rem' }}>
          <span className="budget-compare-label">見積もり:</span>
          <span>¥{Math.floor(estimatedTotal / divisor).toLocaleString()}</span>
          <span className="budget-compare-label" style={{ marginLeft: 12 }}>実績:</span>
          <span>¥{Math.floor(total / divisor).toLocaleString()}</span>
          <span className="budget-compare-label" style={{ marginLeft: 12 }}>差額:</span>
          <span className={estimatedTotal - total >= 0 ? 'budget-diff-pos' : 'budget-diff-neg'}>
            {estimatedTotal - total >= 0 ? '+' : ''}¥{Math.floor((estimatedTotal - total) / divisor).toLocaleString()}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem' }}>
          <input type="checkbox" checked={perPerson} onChange={e => setPerPerson(e.target.checked)} style={{ width: 'auto', marginRight: '0.25rem' }} />
          一人あたり表示
        </label>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ 支出を追加</button>
      </div>

      {Object.keys(catEstMap).length > 0 && (
        <div className="category-breakdown">
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>カテゴリ別</div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--primary)', opacity: 0.25, borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span>予算</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--primary)', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }}></span>実績</span>
          </div>
          {CATEGORIES.filter(c => catEstMap[c]).map(cat => (
            <div key={cat} className="category-row">
              <div className="category-label">{cat}</div>
              <div className="category-bar-track" style={{ position: 'relative' }}>
                {/* 予算バー（薄い） */}
                <div className="category-bar-fill" style={{ width: `${(catEstMap[cat] / maxCat) * 100}%`, opacity: 0.25, position: 'absolute', top: 0, left: 0, height: '100%' }} />
                {/* 実績バー（濃い） */}
                {catActMap[cat] > 0 && (
                  <div className="category-bar-fill" style={{ width: `${(catActMap[cat] / maxCat) * 100}%`, position: 'absolute', top: 0, left: 0, height: '100%' }} />
                )}
              </div>
              <div className="category-amount">
                <span>¥{Math.floor(catEstMap[cat] / divisor).toLocaleString()}</span>
                {catActMap[cat] > 0 && (
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginLeft: 4 }}>
                    / ¥{Math.floor(catActMap[cat] / divisor).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="settlement-table-wrap">
        <table>
          <thead>
            <tr>
              <th>カテゴリ</th>
              <th>内容</th>
              <th>支払者</th>
              <th>対象者</th>
              <th style={{ textAlign: 'right' }}>見積もり</th>
              <th style={{ textAlign: 'right' }}>実績</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">支出がありません</td></tr>
            ) : expenses.map(exp => {
              const parts = exp.participants ?? allNames
              const cats = Array.isArray(exp.category) ? exp.category : [exp.category || 'その他']
              return (
                <tr key={exp.id}>
                  <td><span style={{ fontSize: '0.8rem' }}>{cats.join('・')}</span></td>
                  <td>{exp.label}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{exp.paid_by || '-'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                    {parts.length === allNames.length ? '全員' : parts.join('・')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {exp.estimated_amount != null ? `¥${Math.floor(exp.estimated_amount / divisor).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--gray-500)' }}>
                    {exp.amount > 0 ? `¥${Math.floor(exp.amount / divisor).toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(exp)}>編集</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp)}>削除</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && form && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editExp ? '支出を編集' : '支出を追加'}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>カテゴリ（複数選択可）</label>
                <div className="participant-checks">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="participant-check-label">
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={(form.category ?? []).includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
              <div className="row">
                <div className="form-group">
                  <label>内容 *</label>
                  <input required value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
                </div>
              </div>
              <div className="row">
                <div className="form-group">
                  <label>見積もり額（円）*</label>
                  <input required type="number" min="0" value={form.estimated_amount} onChange={e => setForm({ ...form, estimated_amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>実績金額（円）</label>
                  <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="任意" />
                </div>
              </div>
              <div className="row">
                <div className="form-group">
                  <label>支払者</label>
                  {members.length > 0 ? (
                    <select value={form.paid_by} onChange={e => setForm({ ...form, paid_by: e.target.value })}>
                      <option value="">— 未選択 —</option>
                      {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  ) : (
                    <input value={form.paid_by} onChange={e => setForm({ ...form, paid_by: e.target.value })} placeholder="名前" />
                  )}
                </div>
              </div>

              {members.length > 0 && (
                <div className="form-group">
                  <label>割り勘対象者</label>
                  <div className="participant-checks">
                    {members.map(m => (
                      <label key={m.id} className="participant-check-label">
                        <input
                          type="checkbox"
                          style={{ width: 'auto' }}
                          checked={(form.participants ?? []).includes(m.name)}
                          onChange={() => toggleParticipant(m.name)}
                        />
                        {m.name}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                    ※ 全員チェックで全員割り勘
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>日程 (日目)</label>
                <input type="number" min="1" value={form.scheduled_day} onChange={e => setForm({ ...form, scheduled_day: e.target.value })} />
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

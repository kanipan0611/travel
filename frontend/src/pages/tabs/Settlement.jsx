import { useState, useEffect } from 'react'
import { getExpenses, getMembers, createMember, deleteMember } from '../../api.js'

function calcSettlement(members, expenses) {
  if (members.length === 0) return null
  const allNames = members.map(m => m.name)

  // owed[name] = how much this person owes in total
  // paid[name] = how much this person paid in total
  const paid = Object.fromEntries(allNames.map(n => [n, 0]))
  const owed = Object.fromEntries(allNames.map(n => [n, 0]))

  for (const exp of expenses) {
    // Who actually splits this expense
    const parts = (exp.participants && exp.participants.length > 0)
      ? exp.participants.filter(p => allNames.includes(p))
      : allNames

    if (parts.length === 0) continue

    const share = exp.amount / parts.length
    for (const p of parts) {
      owed[p] += share
    }

    if (exp.paid_by && paid[exp.paid_by] !== undefined) {
      paid[exp.paid_by] += exp.amount
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const balances = allNames.map(name => ({
    name,
    paid: paid[name],
    owed: owed[name],
    balance: paid[name] - owed[name],
  }))

  // Minimum transfer
  const creditors = balances.filter(b => b.balance > 0.5).map(b => ({ ...b }))
  const debtors = balances.filter(b => b.balance < -0.5).map(b => ({ ...b }))
  creditors.sort((a, b) => b.balance - a.balance)
  debtors.sort((a, b) => a.balance - b.balance)

  const transfers = []
  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].balance, -debtors[di].balance)
    if (amount > 0.5) {
      transfers.push({ from: debtors[di].name, to: creditors[ci].name, amount: Math.round(amount) })
    }
    creditors[ci].balance -= amount
    debtors[di].balance += amount
    if (Math.abs(creditors[ci].balance) < 0.5) ci++
    if (Math.abs(debtors[di].balance) < 0.5) di++
  }

  return { balances, transfers, total }
}

export default function Settlement({ tripId, trip }) {
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [newMember, setNewMember] = useState('')

  useEffect(() => { loadData() }, [tripId])

  async function loadData() {
    const [exps, mems] = await Promise.all([getExpenses(tripId), getMembers(tripId)])
    setExpenses(exps)
    setMembers(mems)
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!newMember.trim()) return
    await createMember(tripId, { name: newMember.trim() })
    setNewMember('')
    loadData()
  }

  async function handleDeleteMember(m) {
    if (!confirm(`${m.name}を削除しますか？`)) return
    await deleteMember(tripId, m.id)
    loadData()
  }

  const result = calcSettlement(members, expenses)

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', flex: '1', minWidth: '200px' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>メンバー</div>
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input value={newMember} onChange={e => setNewMember(e.target.value)} placeholder="名前を追加..." style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary btn-sm">追加</button>
          </form>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ fontSize: '0.9rem' }}>{m.name}</span>
              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMember(m)}>削除</button>
            </div>
          ))}
          <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '8px' }}>
            ※ 支払者・対象者は「予算」タブの各支出で設定
          </p>
        </div>
      </div>

      {result ? (
        <>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>支払い内訳</div>
          <div className="settlement-table-wrap" style={{ marginBottom: '1.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>メンバー</th>
                  <th style={{ textAlign: 'right' }}>支払額</th>
                  <th style={{ textAlign: 'right' }}>負担額</th>
                  <th style={{ textAlign: 'right' }}>差額</th>
                </tr>
              </thead>
              <tbody>
                {result.balances.map(b => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td style={{ textAlign: 'right' }}>¥{Math.round(b.paid).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>¥{Math.round(b.owed).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: b.balance > 0 ? 'var(--success)' : b.balance < 0 ? 'var(--danger)' : 'var(--gray-500)' }}>
                      {b.balance > 0 ? '+' : ''}{Math.round(b.balance).toLocaleString()}円
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: '0.75rem 1rem', fontWeight: 600, borderTop: '2px solid var(--gray-200)' }}>
                    合計支出: ¥{result.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>精算 (最小振込)</div>
          {result.transfers.length === 0 ? (
            <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: 'var(--radius)', color: '#065f46', fontSize: '0.9rem' }}>
              精算不要です！全員の負担が均等です。
            </div>
          ) : (
            <ul className="transfer-list">
              {result.transfers.map((t, i) => (
                <li key={i} className="transfer-item">
                  <span className="transfer-from">{t.from}</span>
                  <span style={{ color: 'var(--gray-500)' }}>→</span>
                  <span className="transfer-to">{t.to}</span>
                  <span style={{ flex: 1 }} />
                  <span className="transfer-amount">¥{t.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="empty-state">メンバーを追加して精算を確認しましょう</div>
      )}
    </div>
  )
}

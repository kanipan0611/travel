export default function BudgetBar({ spent, total }) {
  if (!total) return null
  const pct = Math.min((spent / total) * 100, 100)
  const color = pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : 'green'
  return (
    <div className="budget-bar-wrap">
      <div className="budget-bar-label">
        <span>支出 ¥{spent.toLocaleString()}</span>
        <span>予算 ¥{total.toLocaleString()}</span>
      </div>
      <div className="budget-bar-track">
        <div className={`budget-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

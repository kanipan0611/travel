import { useState, useEffect } from 'react'
import { getChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem } from '../../api.js'

const TEMPLATES = {
  '日帰り': ['タオル', '財布', 'スマートフォン', '交通系ICカード', '飲み物'],
  '温泉': ['タオル', '着替え', '洗面用具', '財布', 'スマートフォン', '温泉グッズ'],
  '海外': ['パスポート', '航空券', '海外旅行保険証', '外貨', 'クレジットカード', '変換プラグ', 'スマートフォン', '充電器'],
}

export default function Checklist({ tripId }) {
  const [items, setItems] = useState([])
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => { loadItems() }, [tripId])

  async function loadItems() {
    setItems(await getChecklist(tripId))
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    await createChecklistItem(tripId, { label: newLabel.trim(), is_checked: false })
    setNewLabel('')
    loadItems()
  }

  async function toggleCheck(item) {
    await updateChecklistItem(tripId, item.id, { is_checked: !item.is_checked })
    loadItems()
  }

  async function handleDelete(item) {
    await deleteChecklistItem(tripId, item.id)
    loadItems()
  }

  async function applyTemplate(name) {
    const labels = TEMPLATES[name]
    for (const label of labels) {
      if (!items.find(i => i.label === label)) {
        await createChecklistItem(tripId, { label, is_checked: false })
      }
    }
    loadItems()
  }

  const regularItems = items.filter(i => !i.label.startsWith('【'))
  const checkedRegular = regularItems.filter(i => i.is_checked)
  const unchecked = items.filter(i => !i.is_checked)
  const checked = items.filter(i => i.is_checked)

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>テンプレート:</span>
        {Object.keys(TEMPLATES).map(t => (
          <button key={t} className="btn btn-secondary btn-sm" onClick={() => applyTemplate(t)}>{t}</button>
        ))}
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="持ち物を追加..." style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary">追加</button>
      </form>

      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
        {checkedRegular.length} / {regularItems.length} 完了
      </div>

      <div>
        {unchecked.map(item => {
          if (item.label.startsWith('【')) {
            return <div key={item.id} className="checklist-category-header">{item.label}</div>
          }
          return (
            <div key={item.id} className="checklist-item">
              <input type="checkbox" checked={false} onChange={() => toggleCheck(item)} />
              <div className="checklist-label">{item.label}</div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>削除</button>
            </div>
          )
        })}
        {checked.length > 0 && (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: '0.75rem 0 0.5rem', fontWeight: 600 }}>完了済み</div>
            {checked.map(item => {
              if (item.label.startsWith('【')) {
                return <div key={item.id} className="checklist-category-header">{item.label}</div>
              }
              return (
                <div key={item.id} className="checklist-item checked">
                  <input type="checkbox" checked onChange={() => toggleCheck(item)} />
                  <div className="checklist-label">{item.label}</div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>削除</button>
                </div>
              )
            })}
          </>
        )}
        {items.length === 0 && <div className="empty-state">持ち物リストが空です</div>}
      </div>
    </div>
  )
}

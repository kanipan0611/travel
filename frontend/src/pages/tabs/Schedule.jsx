import { useState, useEffect } from 'react'
import { getSchedule, createScheduleItem, updateScheduleItem, deleteScheduleItem, getSpots } from '../../api.js'

export default function Schedule({ tripId, trip }) {
  const [items, setItems] = useState([])
  const [spots, setSpots] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ day_number: 1, start_time: '', end_time: '', title: '', spot_id: '', memo: '' })

  useEffect(() => {
    loadSchedule()
    loadSpots()
  }, [tripId])

  async function loadSchedule() {
    setItems(await getSchedule(tripId))
  }
  async function loadSpots() {
    setSpots(await getSpots(tripId))
  }

  function openCreate(day = 1) {
    setEditItem(null)
    setForm({ day_number: day, start_time: '', end_time: '', title: '', spot_id: '', memo: '' })
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({
      day_number: item.day_number,
      start_time: item.start_time || '',
      end_time: item.end_time || '',
      title: item.title,
      spot_id: item.spot_id || '',
      memo: item.memo || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form, day_number: parseInt(form.day_number) }
    if (!payload.start_time) delete payload.start_time
    if (!payload.end_time) delete payload.end_time
    if (!payload.memo) delete payload.memo
    if (payload.spot_id) payload.spot_id = parseInt(payload.spot_id)
    else delete payload.spot_id
    if (editItem) {
      await updateScheduleItem(tripId, editItem.id, payload)
    } else {
      await createScheduleItem(tripId, payload)
    }
    setShowModal(false)
    loadSchedule()
  }

  async function handleDelete(item) {
    if (!confirm('削除しますか？')) return
    await deleteScheduleItem(tripId, item.id)
    loadSchedule()
  }

  // Group by day
  const days = [...new Set(items.map(i => i.day_number))].sort((a, b) => a - b)

  // Calculate num days from trip
  let numDays = 1
  if (trip.start_date && trip.end_date) {
    const diff = (new Date(trip.end_date) - new Date(trip.start_date)) / 86400000
    numDays = Math.max(1, diff + 1)
  }
  const allDays = Array.from({ length: Math.max(numDays, days.length ? Math.max(...days) : 1) }, (_, i) => i + 1)

  function getDayLabel(dayNum) {
    if (trip.start_date) {
      const d = new Date(trip.start_date)
      d.setDate(d.getDate() + dayNum - 1)
      return `${dayNum}日目 (${d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })})`
    }
    return `${dayNum}日目`
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => openCreate(1)}>+ 予定を追加</button>
      </div>

      {allDays.map(day => {
        const dayItems = items.filter(i => i.day_number === day)
        return (
          <div key={day} className="day-block">
            <div className="day-block-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{getDayLabel(day)}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => openCreate(day)}>+ 追加</button>
            </div>
            {dayItems.length === 0 ? (
              <div style={{ padding: '0.75rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>予定なし</div>
            ) : (
              dayItems.map(item => {
                const spot = spots.find(s => s.id === item.spot_id)
                return (
                  <div key={item.id} className="schedule-item">
                    <div className="schedule-time">
                      {item.start_time || '--:--'}{item.end_time ? ` - ${item.end_time}` : ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="schedule-title">{item.title}</div>
                      {spot && <div className="schedule-memo">📍 {spot.name}</div>}
                      {item.memo && <div className="schedule-memo">{item.memo}</div>}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>編集</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>削除</button>
                  </div>
                )
              })
            )}
          </div>
        )
      })}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? '予定を編集' : '予定を追加'}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="form-group">
                  <label>日数</label>
                  <input type="number" min="1" value={form.day_number} onChange={e => setForm({ ...form, day_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>開始時刻</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>終了時刻</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>タイトル *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>訪問先 (任意)</label>
                <select value={form.spot_id} onChange={e => setForm({ ...form, spot_id: e.target.value })}>
                  <option value="">なし</option>
                  {spots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>メモ</label>
                <textarea rows={2} value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} />
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

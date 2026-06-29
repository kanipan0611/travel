import { useState, useEffect } from 'react'
import { getWishlist, createWishlistItem, updateWishlistItem, deleteWishlistItem, createTrip } from '../api.js'
import { useNavigate } from 'react-router-dom'
import '../styles/tripdetail.css'

const EMPTY_FORM = { name: '', memo: '', area: '' }

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const navigate = useNavigate()

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    setItems(await getWishlist())
  }

  function openCreate() {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ name: item.name, memo: item.memo || '', area: item.area || '' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.memo) delete payload.memo
    if (!payload.area) delete payload.area
    if (editItem) {
      await updateWishlistItem(editItem.id, payload)
    } else {
      await createWishlistItem(payload)
    }
    setShowModal(false)
    loadItems()
  }

  async function handleDelete(item) {
    if (!confirm(`「${item.name}」を削除しますか？`)) return
    await deleteWishlistItem(item.id)
    loadItems()
  }

  async function convertToTrip(item) {
    const trip = await createTrip({
      title: item.name,
      destination: item.area || '未設定',
      status: 'planning',
      member_count: 1,
    })
    navigate(`/trips/${trip.id}`)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ウィッシュリスト</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ 追加</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">行きたい場所を追加しましょう！</div>
      ) : (
        <div className="wishlist-grid">
          {items.map(item => (
            <div key={item.id} className="wishlist-card">
              <div className="wishlist-card-title">{item.name}</div>
              {item.area && <div className="wishlist-card-area">📍 {item.area}</div>}
              {item.memo && <div className="wishlist-card-memo">{item.memo}</div>}
              <div className="wishlist-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>編集</button>
                <button className="btn btn-primary btn-sm" onClick={() => convertToTrip(item)}>旅行に変換</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editItem ? '編集' : '行きたい場所を追加'}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>名前 *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例: 北海道" />
              </div>
              <div className="form-group">
                <label>エリア</label>
                <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="例: 北海道" />
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

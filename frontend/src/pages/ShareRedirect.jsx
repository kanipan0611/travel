import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTripByToken } from '../api.js'

export default function ShareRedirect() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    getTripByToken(token)
      .then(trip => navigate(`/trips/${trip.id}`, { replace: true }))
      .catch(() => setError(true))
  }, [token])

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>リンクが無効です</h2>
      <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>共有リンクが削除されたか、URLが間違っています。</p>
    </div>
  )
  return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>
}

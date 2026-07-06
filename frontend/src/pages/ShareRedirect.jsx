import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTripByToken, getGroupByToken } from '../api.js'

export default function ShareRedirect() {
  const { token, type } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    const fn = type === 'group' ? getGroupByToken : getTripByToken
    const path = type === 'group'
      ? (g) => `/groups/${g.id}`
      : (t) => `/trips/${t.id}`

    fn(token)
      .then(obj => navigate(path(obj), { replace: true }))
      .catch(() => setError(true))
  }, [token, type])

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>リンクが無効です</h2>
      <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>共有リンクが削除されたか、URLが間違っています。</p>
    </div>
  )
  return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>
}

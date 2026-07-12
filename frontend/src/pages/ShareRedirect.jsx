import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTripByToken, getGroupByToken } from '../api.js'

export default function ShareRedirect() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    const isGroup = window.location.pathname.includes('/share/group/')
    const fn = isGroup ? getGroupByToken : getTripByToken
    const path = isGroup
      ? (g) => `/groups/${g.id}`
      : (t) => `/trips/${t.id}`

    // Render無料プランのスリープ復帰待ちのため、失敗してもしばらくリトライする
    let cancelled = false
    async function resolve() {
      for (let i = 0; i < 6; i++) {
        try {
          const obj = await fn(token)
          if (!cancelled) navigate(path(obj), { replace: true })
          return
        } catch (e) {
          // 404（トークン不明）は即エラー表示、それ以外はサーバー起動待ちとみなして再試行
          if (String(e.message).includes('not found') || String(e.message).includes('Not Found')) break
          await new Promise(r => setTimeout(r, 10000))
        }
      }
      if (!cancelled) setError(true)
    }
    resolve()
    return () => { cancelled = true }
  }, [token])

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>リンクが無効です</h2>
      <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>共有リンクが削除されたか、URLが間違っています。</p>
    </div>
  )
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>読み込み中...</p>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
        サーバー起動中の場合、最大1分ほどかかることがあります
      </p>
    </div>
  )
}

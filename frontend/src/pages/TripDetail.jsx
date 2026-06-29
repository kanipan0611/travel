import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip } from '../api.js'
import TabBar from '../components/TabBar.jsx'
import Overview from './tabs/Overview.jsx'
import Spots from './tabs/Spots.jsx'
import Schedule from './tabs/Schedule.jsx'
import Budget from './tabs/Budget.jsx'
import Checklist from './tabs/Checklist.jsx'
import Settlement from './tabs/Settlement.jsx'
import Availability from './tabs/Availability.jsx'
import '../styles/tripdetail.css'

const STATUS_LABELS = {
  planning: '計画中',
  confirmed: '確定',
  booked: '予約済',
  done: '完了',
}

const TABS = [
  { key: 'overview', label: '概要' },
  { key: 'spots', label: '訪問先' },
  { key: 'schedule', label: '日程' },
  { key: 'budget', label: '予算' },
  { key: 'checklist', label: '持ち物' },
  { key: 'settlement', label: '精算' },
  { key: 'availability', label: '日程調整' },
]

export default function TripDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    loadTrip()
  }, [id])

  async function loadTrip() {
    const data = await getTrip(id)
    setTrip(data)
  }

  if (!trip) return <div className="empty-state">読み込み中...</div>

  return (
    <div>
      <div className="trip-detail-header">
        <div>
          <div className="trip-detail-title">{trip.title}</div>
          <div className="trip-detail-meta">
            📍 {trip.destination}
            {trip.start_date && <> &nbsp;·&nbsp; {trip.start_date} 〜 {trip.end_date || '?'}</>}
            &nbsp;·&nbsp; 👥 {trip.member_count}名
          </div>
        </div>
        <span className={`badge badge-${trip.status}`}>{STATUS_LABELS[trip.status] || trip.status}</span>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && <Overview trip={trip} onUpdate={loadTrip} />}
      {tab === 'spots' && <Spots tripId={id} />}
      {tab === 'schedule' && <Schedule tripId={id} trip={trip} />}
      {tab === 'budget' && <Budget tripId={id} trip={trip} />}
      {tab === 'checklist' && <Checklist tripId={id} />}
      {tab === 'settlement' && <Settlement tripId={id} trip={trip} />}
      {tab === 'availability' && <Availability tripId={id} />}
    </div>
  )
}

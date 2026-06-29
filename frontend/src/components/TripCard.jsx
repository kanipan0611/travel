import { Link } from 'react-router-dom'
import BudgetBar from './BudgetBar.jsx'

const STATUS_LABELS = {
  planning: '計画中',
  confirmed: '確定',
  booked: '予約済',
  done: '完了',
}

export default function TripCard({ trip, totalSpent }) {
  return (
    <Link to={`/trips/${trip.id}`} className="trip-card">
      <div className="trip-card-header">
        <div className="trip-card-title">{trip.title}</div>
        <span className={`badge badge-${trip.status}`}>{STATUS_LABELS[trip.status] || trip.status}</span>
      </div>
      <div className="trip-card-dest">📍 {trip.destination}</div>
      {(trip.start_date || trip.end_date) && (
        <div className="trip-card-dates">
          {trip.start_date || '?'} 〜 {trip.end_date || '?'}
        </div>
      )}
      {trip.budget_total && (
        <BudgetBar spent={totalSpent || 0} total={trip.budget_total} />
      )}
      <div className="trip-card-footer">
        <span>👥 {trip.member_count}名</span>
        {trip.budget_total && <span>予算 ¥{trip.budget_total.toLocaleString()}</span>}
      </div>
    </Link>
  )
}

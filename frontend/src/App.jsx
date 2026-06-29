import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import TripDetail from './pages/TripDetail.jsx'
import Wishlist from './pages/Wishlist.jsx'
import ShareRedirect from './pages/ShareRedirect.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <Link to="/" className="nav-brand">旅行プランナー</Link>
        <div className="nav-links">
          <Link to="/">旅行一覧</Link>
          <Link to="/wishlist">ウィッシュリスト</Link>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trips/:id/*" element={<TripDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/share/:token" element={<ShareRedirect />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

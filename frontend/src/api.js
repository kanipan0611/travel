const BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  if (res.status === 204) return null
  return res.json()
}

// Trips
export const getTrips = () => req('GET', '/trips/')
export const getTrip = (id) => req('GET', `/trips/${id}`)
export const createTrip = (data) => req('POST', '/trips/', data)
export const updateTrip = (id, data) => req('PATCH', `/trips/${id}`, data)
export const deleteTrip = (id) => req('DELETE', `/trips/${id}`)

// Spots
export const getSpots = (tripId) => req('GET', `/trips/${tripId}/spots/`)
export const createSpot = (tripId, data) => req('POST', `/trips/${tripId}/spots/`, data)
export const updateSpot = (tripId, spotId, data) => req('PATCH', `/trips/${tripId}/spots/${spotId}`, data)
export const deleteSpot = (tripId, spotId) => req('DELETE', `/trips/${tripId}/spots/${spotId}`)

// Expenses
export const getExpenses = (tripId) => req('GET', `/trips/${tripId}/expenses/`)
export const createExpense = (tripId, data) => req('POST', `/trips/${tripId}/expenses/`, data)
export const updateExpense = (tripId, expId, data) => req('PATCH', `/trips/${tripId}/expenses/${expId}`, data)
export const deleteExpense = (tripId, expId) => req('DELETE', `/trips/${tripId}/expenses/${expId}`)

// Schedule
export const getSchedule = (tripId) => req('GET', `/trips/${tripId}/schedule/`)
export const createScheduleItem = (tripId, data) => req('POST', `/trips/${tripId}/schedule/`, data)
export const updateScheduleItem = (tripId, itemId, data) => req('PATCH', `/trips/${tripId}/schedule/${itemId}`, data)
export const deleteScheduleItem = (tripId, itemId) => req('DELETE', `/trips/${tripId}/schedule/${itemId}`)

// Checklist
export const getChecklist = (tripId) => req('GET', `/trips/${tripId}/checklist/`)
export const createChecklistItem = (tripId, data) => req('POST', `/trips/${tripId}/checklist/`, data)
export const updateChecklistItem = (tripId, itemId, data) => req('PATCH', `/trips/${tripId}/checklist/${itemId}`, data)
export const deleteChecklistItem = (tripId, itemId) => req('DELETE', `/trips/${tripId}/checklist/${itemId}`)

// Members
export const getMembers = (tripId) => req('GET', `/trips/${tripId}/members/`)
export const createMember = (tripId, data) => req('POST', `/trips/${tripId}/members/`, data)
export const updateMember = (tripId, memberId, data) => req('PATCH', `/trips/${tripId}/members/${memberId}`, data)
export const deleteMember = (tripId, memberId) => req('DELETE', `/trips/${tripId}/members/${memberId}`)

// Availability
export const getAvailability = (tripId) => req('GET', `/trips/${tripId}/availability/`)
export const getAvailabilityOverlap = (tripId) => req('GET', `/trips/${tripId}/availability/overlap`)
export const createAvailability = (tripId, data) => req('POST', `/trips/${tripId}/availability/`, data)
export const updateAvailability = (tripId, subId, data) => req('PATCH', `/trips/${tripId}/availability/${subId}`, data)
export const deleteAvailability = (tripId, subId) => req('DELETE', `/trips/${tripId}/availability/${subId}`)

// Wishlist
export const getWishlist = () => req('GET', '/wishlist/')
export const createWishlistItem = (data) => req('POST', '/wishlist/', data)
export const updateWishlistItem = (id, data) => req('PATCH', `/wishlist/${id}`, data)
export const deleteWishlistItem = (id) => req('DELETE', `/wishlist/${id}`)

// Share
export const getTripByToken = (token) => req('GET', `/share/${token}/trip`)

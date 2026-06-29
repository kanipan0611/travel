# 旅行プランナー (Travel Planner)

A full-stack travel management web app built with FastAPI + React.

## Tech Stack

- **Backend**: Python + FastAPI + SQLite + SQLAlchemy ORM
- **Frontend**: React + Vite + React Router

## Features

- **Dashboard**: View all trips with status filter, budget progress bars
- **Trip Overview**: Edit trip details, change status
- **Spots**: Manage visit spots by decision (go/candidate/hold)
- **Schedule**: Day-by-day timeline, assign spots to time slots
- **Budget**: Category breakdown, per-person toggle, remaining budget
- **Checklist**: Packing list with templates (日帰り/温泉/海外)
- **Settlement**: Member payments with minimum-transfer algorithm
- **Wishlist**: Stock travel ideas, convert to trip

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py         # load sample data (optional)
uvicorn app.main:app --reload
```

API runs at http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

## Data Models

- **Trip**: title, destination, status, dates, budget, member_count
- **Spot**: name, category (観光/飲食/宿/その他), decision (go/candidate/hold)
- **Expense**: category, label, amount, paid_by
- **ScheduleItem**: day_number, start_time, end_time, title, spot
- **ChecklistItem**: label, is_checked
- **Member**: name (for settlement)
- **Wishlist**: name, area, memo

## Settlement Algorithm

Implements minimum-transfer settlement:
1. Calculate each member's net balance (paid - fair share)
2. Split into creditors and debtors
3. Greedily match largest creditor with largest debtor

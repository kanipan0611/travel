import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app import models

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if already seeded
existing = db.query(models.Trip).filter(models.Trip.title == "京都旅行").first()
if existing:
    print("Already seeded, skipping.")
    db.close()
    sys.exit(0)

# Create trip
trip = models.Trip(
    title="京都旅行",
    destination="京都府",
    status="planning",
    start_date="2026-09-15",
    end_date="2026-09-17",
    budget_total=150000,
    member_count=2,
)
db.add(trip)
db.flush()

# Spots
spots = [
    models.Spot(trip_id=trip.id, name="金閣寺", category="観光", decision="go"),
    models.Spot(trip_id=trip.id, name="嵐山", category="観光", decision="candidate"),
    models.Spot(trip_id=trip.id, name="錦市場", category="飲食", decision="candidate"),
]
db.add_all(spots)

# Expenses
expenses = [
    models.Expense(trip_id=trip.id, category="交通", label="新幹線代", amount=25000, paid_by="自分"),
    models.Expense(trip_id=trip.id, category="宿泊", label="ホテル代", amount=60000, paid_by="友人A"),
]
db.add_all(expenses)

# Members
members = [
    models.Member(trip_id=trip.id, name="自分"),
    models.Member(trip_id=trip.id, name="友人A"),
]
db.add_all(members)

# Checklist
checklist = [
    models.ChecklistItem(trip_id=trip.id, label="パスポート", is_checked=False),
    models.ChecklistItem(trip_id=trip.id, label="財布", is_checked=True),
    models.ChecklistItem(trip_id=trip.id, label="カメラ", is_checked=False),
]
db.add_all(checklist)

db.commit()
db.close()
print("Seed data created successfully!")

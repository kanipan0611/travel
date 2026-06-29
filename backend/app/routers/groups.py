from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/groups", tags=["groups"])

CATEGORIES = ['交通', '宿泊', '食事', 'アクティビティ', 'お土産', 'その他']

@router.get("/", response_model=List[schemas.TripGroupResponse])
def list_groups(db: Session = Depends(get_db)):
    return db.query(models.TripGroup).order_by(models.TripGroup.created_at.desc()).all()

@router.post("/", response_model=schemas.TripGroupResponse)
def create_group(body: schemas.TripGroupCreate, db: Session = Depends(get_db)):
    g = models.TripGroup(**body.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return g

@router.get("/{group_id}", response_model=schemas.TripGroupResponse)
def get_group(group_id: int, db: Session = Depends(get_db)):
    g = db.query(models.TripGroup).filter_by(id=group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Not found")
    return g

@router.patch("/{group_id}", response_model=schemas.TripGroupResponse)
def update_group(group_id: int, body: schemas.TripGroupUpdate, db: Session = Depends(get_db)):
    g = db.query(models.TripGroup).filter_by(id=group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return g

@router.delete("/{group_id}", status_code=204)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    g = db.query(models.TripGroup).filter_by(id=group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Not found")
    for trip in g.trips:
        trip.group_id = None
    db.delete(g)
    db.commit()

@router.get("/{group_id}/summary", response_model=schemas.TripGroupSummary)
def get_group_summary(group_id: int, db: Session = Depends(get_db)):
    g = db.query(models.TripGroup).filter_by(id=group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Not found")

    trips = db.query(models.Trip).filter_by(group_id=group_id).all()

    category_totals = {c: 0 for c in CATEGORIES}
    total_spent = 0
    estimated_total = 0
    for trip in trips:
        for exp in db.query(models.Expense).filter_by(trip_id=trip.id).all():
            total_spent += exp.amount
            if exp.estimated_amount is not None:
                estimated_total += exp.estimated_amount
            cat = exp.category if exp.category in category_totals else 'その他'
            category_totals[cat] += exp.amount

    category_totals = {k: v for k, v in category_totals.items() if v > 0}

    timeline = []
    for trip in sorted(trips, key=lambda t: (t.start_date or '9999')):
        items = db.query(models.ScheduleItem).filter_by(trip_id=trip.id).order_by(
            models.ScheduleItem.day_number, models.ScheduleItem.start_time
        ).all()
        timeline.append({
            "trip_id": trip.id,
            "trip_title": trip.title,
            "start_date": trip.start_date,
            "end_date": trip.end_date,
            "status": trip.status,
            "schedule_items": [
                {"day_number": s.day_number, "start_time": s.start_time, "title": s.title}
                for s in items
            ]
        })

    remaining = (g.budget_total - total_spent) if g.budget_total is not None else None

    return schemas.TripGroupSummary(
        group=g,
        trips=trips,
        total_spent=total_spent,
        estimated_total=estimated_total,
        remaining=remaining,
        category_totals=category_totals,
        timeline=timeline,
    )

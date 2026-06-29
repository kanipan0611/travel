from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/schedule", tags=["schedule"])


@router.get("/", response_model=List[schemas.ScheduleItemResponse])
def list_schedule(trip_id: int, db: Session = Depends(get_db)):
    return db.query(models.ScheduleItem).filter(
        models.ScheduleItem.trip_id == trip_id
    ).order_by(models.ScheduleItem.day_number, models.ScheduleItem.start_time).all()


@router.post("/", response_model=schemas.ScheduleItemResponse)
def create_schedule_item(trip_id: int, item: schemas.ScheduleItemBase, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db_item = models.ScheduleItem(**item.model_dump(), trip_id=trip_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/{item_id}", response_model=schemas.ScheduleItemResponse)
def update_schedule_item(trip_id: int, item_id: int, item_update: schemas.ScheduleItemUpdate, db: Session = Depends(get_db)):
    item = db.query(models.ScheduleItem).filter(
        models.ScheduleItem.id == item_id, models.ScheduleItem.trip_id == trip_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_schedule_item(trip_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ScheduleItem).filter(
        models.ScheduleItem.id == item_id, models.ScheduleItem.trip_id == trip_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

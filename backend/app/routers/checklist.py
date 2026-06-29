from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/checklist", tags=["checklist"])


@router.get("/", response_model=List[schemas.ChecklistItemResponse])
def list_checklist(trip_id: int, db: Session = Depends(get_db)):
    return db.query(models.ChecklistItem).filter(models.ChecklistItem.trip_id == trip_id).all()


@router.post("/", response_model=schemas.ChecklistItemResponse)
def create_checklist_item(trip_id: int, item: schemas.ChecklistItemBase, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db_item = models.ChecklistItem(**item.model_dump(), trip_id=trip_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/{item_id}", response_model=schemas.ChecklistItemResponse)
def update_checklist_item(trip_id: int, item_id: int, item_update: schemas.ChecklistItemUpdate, db: Session = Depends(get_db)):
    item = db.query(models.ChecklistItem).filter(
        models.ChecklistItem.id == item_id, models.ChecklistItem.trip_id == trip_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_checklist_item(trip_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ChecklistItem).filter(
        models.ChecklistItem.id == item_id, models.ChecklistItem.trip_id == trip_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

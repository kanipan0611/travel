from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/spots", tags=["spots"])


@router.get("/", response_model=List[schemas.SpotResponse])
def list_spots(trip_id: int, db: Session = Depends(get_db)):
    return db.query(models.Spot).filter(models.Spot.trip_id == trip_id).all()


@router.post("/", response_model=schemas.SpotResponse)
def create_spot(trip_id: int, spot: schemas.SpotBase, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db_spot = models.Spot(**spot.model_dump(), trip_id=trip_id)
    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)
    return db_spot


@router.patch("/{spot_id}", response_model=schemas.SpotResponse)
def update_spot(trip_id: int, spot_id: int, spot_update: schemas.SpotUpdate, db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id, models.Spot.trip_id == trip_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    update_data = spot_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(spot, key, value)
    db.commit()
    db.refresh(spot)
    return spot


@router.delete("/{spot_id}")
def delete_spot(trip_id: int, spot_id: int, db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id, models.Spot.trip_id == trip_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    db.delete(spot)
    db.commit()
    return {"ok": True}

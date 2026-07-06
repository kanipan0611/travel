from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/share", tags=["share"])

def get_trip_by_token(token: str, db: Session):
    trip = db.query(models.Trip).filter(models.Trip.share_token == token).first()
    if not trip:
        raise HTTPException(status_code=404, detail="共有リンクが無効です")
    return trip

@router.get("/{token}/trip", response_model=schemas.TripResponse)
def get_shared_trip(token: str, db: Session = Depends(get_db)):
    return get_trip_by_token(token, db)

@router.get("/group/{token}/group", response_model=schemas.TripGroupResponse)
def get_shared_group(token: str, db: Session = Depends(get_db)):
    group = db.query(models.TripGroup).filter(models.TripGroup.share_token == token).first()
    if not group:
        raise HTTPException(status_code=404, detail="共有リンクが無効です")
    return group

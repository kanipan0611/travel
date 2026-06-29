from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/", response_model=List[schemas.TripResponse])
def list_trips(db: Session = Depends(get_db)):
    return db.query(models.Trip).order_by(models.Trip.created_at.desc()).all()


DEFAULT_CHECKLIST = [
    "【貴重品】", "財布", "現金", "クレジットカード", "身分証", "スマホ", "家の鍵",
    "【電子機器】", "スマホ充電器", "モバイルバッテリー", "充電ケーブル",
    "【洗面・衛生】", "歯ブラシ・歯磨き粉", "洗面用具", "スキンケア用品",
    "【衣類】", "着替え（日数分）", "下着", "靴下", "部屋着", "羽織り",
    "【健康・薬】", "常備薬", "絆創膏", "マスク",
    "【予約・チケット】", "予約確認書", "チケット類",
    "【その他】", "サブバッグ", "ジップ袋", "ウェットティッシュ",
]

@router.post("/", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db)):
    db_trip = models.Trip(**trip.model_dump())
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    for label in DEFAULT_CHECKLIST:
        db.add(models.ChecklistItem(trip_id=db_trip.id, label=label, is_checked=False))
    db.commit()
    return db_trip


@router.get("/{trip_id}", response_model=schemas.TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.patch("/{trip_id}", response_model=schemas.TripResponse)
def update_trip(trip_id: int, trip_update: schemas.TripUpdate, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    update_data = trip_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(trip, key, value)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"ok": True}

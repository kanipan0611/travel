from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/members", tags=["members"])


@router.get("/", response_model=List[schemas.MemberResponse])
def list_members(trip_id: int, db: Session = Depends(get_db)):
    return db.query(models.Member).filter(models.Member.trip_id == trip_id).all()


@router.post("/", response_model=schemas.MemberResponse)
def create_member(trip_id: int, member: schemas.MemberBase, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db_member = models.Member(**member.model_dump(), trip_id=trip_id)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


@router.patch("/{member_id}", response_model=schemas.MemberResponse)
def update_member(trip_id: int, member_id: int, member_update: schemas.MemberUpdate, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(
        models.Member.id == member_id, models.Member.trip_id == trip_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    update_data = member_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}")
def delete_member(trip_id: int, member_id: int, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(
        models.Member.id == member_id, models.Member.trip_id == trip_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"ok": True}

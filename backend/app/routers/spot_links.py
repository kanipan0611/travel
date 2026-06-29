from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/spots/{spot_id}/links", tags=["spot_links"])

@router.get("/", response_model=List[schemas.SpotLinkResponse])
def list_links(trip_id: int, spot_id: int, db: Session = Depends(get_db)):
    return db.query(models.SpotLink).filter_by(spot_id=spot_id).all()

@router.post("/", response_model=schemas.SpotLinkResponse)
def create_link(trip_id: int, spot_id: int, body: schemas.SpotLinkCreate, db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter_by(id=spot_id, trip_id=trip_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    link = models.SpotLink(spot_id=spot_id, **body.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.patch("/{link_id}", response_model=schemas.SpotLinkResponse)
def update_link(trip_id: int, spot_id: int, link_id: int, body: schemas.SpotLinkUpdate, db: Session = Depends(get_db)):
    link = db.query(models.SpotLink).filter_by(id=link_id, spot_id=spot_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(link, k, v)
    db.commit()
    db.refresh(link)
    return link

@router.delete("/{link_id}", status_code=204)
def delete_link(trip_id: int, spot_id: int, link_id: int, db: Session = Depends(get_db)):
    link = db.query(models.SpotLink).filter_by(id=link_id, spot_id=spot_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(link)
    db.commit()

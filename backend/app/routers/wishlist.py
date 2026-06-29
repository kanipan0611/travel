from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("/", response_model=List[schemas.WishlistResponse])
def list_wishlist(db: Session = Depends(get_db)):
    return db.query(models.Wishlist).all()


@router.post("/", response_model=schemas.WishlistResponse)
def create_wishlist_item(item: schemas.WishlistCreate, db: Session = Depends(get_db)):
    db_item = models.Wishlist(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/{item_id}", response_model=schemas.WishlistResponse)
def update_wishlist_item(item_id: int, item_update: schemas.WishlistUpdate, db: Session = Depends(get_db)):
    item = db.query(models.Wishlist).filter(models.Wishlist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_wishlist_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Wishlist).filter(models.Wishlist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

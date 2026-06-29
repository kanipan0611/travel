from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/expenses", tags=["expenses"])


@router.get("/", response_model=List[schemas.ExpenseResponse])
def list_expenses(trip_id: int, db: Session = Depends(get_db)):
    return db.query(models.Expense).filter(models.Expense.trip_id == trip_id).all()


@router.post("/", response_model=schemas.ExpenseResponse)
def create_expense(trip_id: int, expense: schemas.ExpenseBase, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db_expense = models.Expense(**expense.model_dump(), trip_id=trip_id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.patch("/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(trip_id: int, expense_id: int, expense_update: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.trip_id == trip_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(trip_id: int, expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.trip_id == trip_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"ok": True}

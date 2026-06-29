import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/expenses", tags=["expenses"])


def _serialize(exp) -> schemas.ExpenseResponse:
    participants = None
    if exp.participants:
        try:
            participants = json.loads(exp.participants)
        except Exception:
            participants = None
    return schemas.ExpenseResponse(
        id=exp.id,
        trip_id=exp.trip_id,
        category=exp.category,
        label=exp.label,
        amount=exp.amount,
        estimated_amount=exp.estimated_amount,
        paid_by=exp.paid_by,
        scheduled_day=exp.scheduled_day,
        participants=participants,
    )


@router.get("/", response_model=List[schemas.ExpenseResponse])
def list_expenses(trip_id: int, db: Session = Depends(get_db)):
    return [_serialize(e) for e in db.query(models.Expense).filter(models.Expense.trip_id == trip_id).all()]


@router.post("/", response_model=schemas.ExpenseResponse)
def create_expense(trip_id: int, expense: schemas.ExpenseBase, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    data = expense.model_dump()
    participants = data.pop("participants", None)
    db_expense = models.Expense(**data, trip_id=trip_id,
                                participants=json.dumps(participants) if participants is not None else None)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return _serialize(db_expense)


@router.patch("/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(trip_id: int, expense_id: int, expense_update: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.trip_id == trip_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    update_data = expense_update.model_dump(exclude_unset=True)
    if "participants" in update_data:
        p = update_data.pop("participants")
        expense.participants = json.dumps(p) if p is not None else None
    for key, value in update_data.items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return _serialize(expense)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(trip_id: int, expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.trip_id == trip_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()

import json
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/trips/{trip_id}/availability", tags=["availability"])


def _parse_dates(submission) -> list[date]:
    raw = submission.available_dates or "[]"
    return [date.fromisoformat(d) for d in json.loads(raw)]


def _serialize(submission):
    raw = submission.available_dates or "[]"
    dates = json.loads(raw)
    return schemas.AvailabilitySubmissionResponse(
        id=submission.id,
        trip_id=submission.trip_id,
        name=submission.name,
        available_dates=dates,
        memo=submission.memo,
        created_at=submission.created_at,
    )


def _compute_overlap(submissions) -> schemas.OverlapResult:
    if not submissions:
        return schemas.OverlapResult(common_dates=[], periods=[], submissions=[])

    sets = [set(_parse_dates(s)) for s in submissions]
    common = sets[0]
    for s in sets[1:]:
        common &= s

    sorted_dates = sorted(common)

    # Group into consecutive periods
    periods = []
    if sorted_dates:
        start = sorted_dates[0]
        prev = sorted_dates[0]
        for d in sorted_dates[1:]:
            if d - prev == timedelta(days=1):
                prev = d
            else:
                periods.append({"start": start.isoformat(), "end": prev.isoformat(), "days": (prev - start).days + 1})
                start = d
                prev = d
        periods.append({"start": start.isoformat(), "end": prev.isoformat(), "days": (prev - start).days + 1})

    return schemas.OverlapResult(
        common_dates=[d.isoformat() for d in sorted_dates],
        periods=sorted(periods, key=lambda p: -p["days"]),
        submissions=[_serialize(s) for s in submissions],
    )


@router.get("/", response_model=list[schemas.AvailabilitySubmissionResponse])
def list_submissions(trip_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.AvailabilitySubmission).filter_by(trip_id=trip_id).all()
    return [_serialize(r) for r in rows]


@router.post("/", response_model=schemas.AvailabilitySubmissionResponse)
def create_submission(trip_id: int, body: schemas.AvailabilitySubmissionCreate, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter_by(id=trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    row = models.AvailabilitySubmission(
        trip_id=trip_id,
        name=body.name,
        available_dates=json.dumps(sorted(body.available_dates)),
        memo=body.memo,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize(row)


@router.patch("/{sub_id}", response_model=schemas.AvailabilitySubmissionResponse)
def update_submission(trip_id: int, sub_id: int, body: schemas.AvailabilitySubmissionUpdate, db: Session = Depends(get_db)):
    row = db.query(models.AvailabilitySubmission).filter_by(id=sub_id, trip_id=trip_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    if body.name is not None:
        row.name = body.name
    if body.available_dates is not None:
        row.available_dates = json.dumps(sorted(body.available_dates))
    if body.memo is not None:
        row.memo = body.memo
    db.commit()
    db.refresh(row)
    return _serialize(row)


@router.delete("/{sub_id}", status_code=204)
def delete_submission(trip_id: int, sub_id: int, db: Session = Depends(get_db)):
    row = db.query(models.AvailabilitySubmission).filter_by(id=sub_id, trip_id=trip_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()


@router.get("/overlap", response_model=schemas.OverlapResult)
def get_overlap(trip_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.AvailabilitySubmission).filter_by(trip_id=trip_id).all()
    return _compute_overlap(rows)

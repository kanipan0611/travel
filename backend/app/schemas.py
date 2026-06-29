from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Trip
class TripBase(BaseModel):
    title: str
    destination: str
    status: str = "planning"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget_total: Optional[int] = None
    member_count: int = 1

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget_total: Optional[int] = None
    member_count: Optional[int] = None

class TripResponse(TripBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Spot
class SpotBase(BaseModel):
    name: str
    category: str = "観光"
    decision: str = "candidate"
    lat: Optional[float] = None
    lng: Optional[float] = None
    memo: Optional[str] = None
    estimated_cost: Optional[int] = None

class SpotCreate(SpotBase):
    trip_id: int

class SpotUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    decision: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    memo: Optional[str] = None
    estimated_cost: Optional[int] = None

class SpotResponse(SpotBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


# Expense
class ExpenseBase(BaseModel):
    category: str = "その他"
    label: str
    amount: int
    paid_by: Optional[str] = None
    scheduled_day: Optional[int] = None
    participants: Optional[List[str]] = None  # null = all members

class ExpenseCreate(ExpenseBase):
    trip_id: int

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    label: Optional[str] = None
    amount: Optional[int] = None
    paid_by: Optional[str] = None
    scheduled_day: Optional[int] = None
    participants: Optional[List[str]] = None

class ExpenseResponse(ExpenseBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


# ScheduleItem
class ScheduleItemBase(BaseModel):
    day_number: int
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    title: str
    spot_id: Optional[int] = None
    memo: Optional[str] = None

class ScheduleItemCreate(ScheduleItemBase):
    trip_id: int

class ScheduleItemUpdate(BaseModel):
    day_number: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    title: Optional[str] = None
    spot_id: Optional[int] = None
    memo: Optional[str] = None

class ScheduleItemResponse(ScheduleItemBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


# ChecklistItem
class ChecklistItemBase(BaseModel):
    label: str
    is_checked: bool = False

class ChecklistItemCreate(ChecklistItemBase):
    trip_id: int

class ChecklistItemUpdate(BaseModel):
    label: Optional[str] = None
    is_checked: Optional[bool] = None

class ChecklistItemResponse(ChecklistItemBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


# Member
class MemberBase(BaseModel):
    name: str

class MemberCreate(MemberBase):
    trip_id: int

class MemberUpdate(BaseModel):
    name: Optional[str] = None

class MemberResponse(MemberBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


# AvailabilitySubmission
class AvailabilitySubmissionCreate(BaseModel):
    name: str
    available_dates: List[str]  # ["YYYY-MM-DD", ...]
    memo: Optional[str] = None

class AvailabilitySubmissionUpdate(BaseModel):
    name: Optional[str] = None
    available_dates: Optional[List[str]] = None
    memo: Optional[str] = None

class AvailabilitySubmissionResponse(BaseModel):
    id: int
    trip_id: int
    name: str
    available_dates: List[str]
    memo: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OverlapResult(BaseModel):
    common_dates: List[str]
    periods: List[dict]  # [{start, end, days}]
    submissions: List[AvailabilitySubmissionResponse]


# Wishlist
class WishlistBase(BaseModel):
    name: str
    memo: Optional[str] = None
    area: Optional[str] = None

class WishlistCreate(WishlistBase):
    pass

class WishlistUpdate(BaseModel):
    name: Optional[str] = None
    memo: Optional[str] = None
    area: Optional[str] = None

class WishlistResponse(WishlistBase):
    id: int

    class Config:
        from_attributes = True

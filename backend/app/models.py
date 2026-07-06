import uuid
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TripGroup(Base):
    __tablename__ = "trip_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    budget_total = Column(Integer, nullable=True)
    share_token = Column(String, unique=True, index=True, default=lambda: uuid.uuid4().hex)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    trips = relationship("Trip", back_populates="group")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    share_token = Column(String, unique=True, index=True, default=lambda: uuid.uuid4().hex)
    destination = Column(String, nullable=False)
    status = Column(String, default="planning")  # planning/confirmed/booked/done
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    budget_total = Column(Integer, nullable=True)
    member_count = Column(Integer, default=1)
    group_id = Column(Integer, ForeignKey("trip_groups.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    group = relationship("TripGroup", back_populates="trips")
    spots = relationship("Spot", back_populates="trip", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    schedule_items = relationship("ScheduleItem", back_populates="trip", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="trip", cascade="all, delete-orphan")
    members = relationship("Member", back_populates="trip", cascade="all, delete-orphan")
    availability_submissions = relationship("AvailabilitySubmission", back_populates="trip", cascade="all, delete-orphan")


class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, default="観光")  # 観光/飲食/宿/その他
    decision = Column(String, default="candidate")  # candidate/go/hold
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    memo = Column(Text, nullable=True)
    estimated_cost = Column(Integer, nullable=True)

    trip = relationship("Trip", back_populates="spots")
    schedule_items = relationship("ScheduleItem", back_populates="spot")
    links = relationship("SpotLink", back_populates="spot", cascade="all, delete-orphan")


class SpotLink(Base):
    __tablename__ = "spot_links"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    label = Column(String, nullable=False)
    url = Column(String, nullable=False)

    spot = relationship("Spot", back_populates="links")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    category = Column(String, default="その他")  # 交通/宿泊/食事/アクティビティ/お土産/その他
    label = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    estimated_amount = Column(Integer, nullable=True)  # 見積もり額
    paid_by = Column(String, nullable=True)
    scheduled_day = Column(Integer, nullable=True)
    # JSON array of member names who share this expense. null = all members.
    participants = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="expenses")


class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    title = Column(String, nullable=False)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=True)
    memo = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="schedule_items")
    spot = relationship("Spot", back_populates="schedule_items")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    label = Column(String, nullable=False)
    is_checked = Column(Boolean, default=False)

    trip = relationship("Trip", back_populates="checklist_items")


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    name = Column(String, nullable=False)

    trip = relationship("Trip", back_populates="members")


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    memo = Column(Text, nullable=True)
    area = Column(String, nullable=True)


class AvailabilitySubmission(Base):
    __tablename__ = "availability_submissions"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    name = Column(String, nullable=False)
    # JSON array of "YYYY-MM-DD" strings stored as text
    available_dates = Column(Text, nullable=False, default="[]")
    memo = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="availability_submissions")

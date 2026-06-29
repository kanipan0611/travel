from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import trips, spots, expenses, schedule, checklist, members, wishlist, availability, share

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Travel Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trips.router)
app.include_router(spots.router)
app.include_router(expenses.router)
app.include_router(schedule.router)
app.include_router(checklist.router)
app.include_router(members.router)
app.include_router(wishlist.router)
app.include_router(availability.router)
app.include_router(share.router)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import trips, spots, expenses, schedule, checklist, members, wishlist

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Travel Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
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

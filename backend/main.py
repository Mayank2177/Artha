# FastAPI app initialization - registers all routers
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config, validate_config

from routes import money_health, fire_planner, tax_wizard, mf_xray, couples_planner

app = FastAPI(
    title="Artha AI Money Mentor",
    description="AI-powered personal finance backend for the ET x AI Hackathon 2025",
    version="1.0.0",
)
validate_config()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React + Vite dev server — update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(money_health.router, prefix="/api", tags=["Money Health Score"])
app.include_router(fire_planner.router, prefix="/api", tags=["FIRE Path Planner"])
app.include_router(tax_wizard.router,   prefix="/api", tags=["Tax Wizard"])
app.include_router(mf_xray.router,      prefix="/api", tags=["MF Portfolio X-Ray"])
app.include_router(couples_planner.router, prefix="/api", tags=["Couples Planner"])

@app.get("/")
def health_check():
    return {"status": "Artha backend is live"}
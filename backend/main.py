from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import money_health, fire_planner, tax_wizard, mf_xray, couples_planner, auth, dashboard
from config import config, validate_config

app = FastAPI(
    title=config.API_TITLE,
    version=config.API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

validate_config()

app.include_router(money_health.router,     prefix="/api", tags=["Money Health Score"])
app.include_router(fire_planner.router,     prefix="/api", tags=["FIRE Path Planner"])
app.include_router(tax_wizard.router,       prefix="/api", tags=["Tax Wizard"])
app.include_router(mf_xray.router,          prefix="/api", tags=["MF Portfolio X-Ray"])
app.include_router(couples_planner.router,  prefix="/api", tags=["Couples Planner"])
app.include_router(auth.router,             prefix="/api", tags=["Authentication"])
app.include_router(dashboard.router,        prefix="/api", tags=["Dashboard"])

@app.get("/")
def health_check():
    return {"status": "Artha backend is live"}
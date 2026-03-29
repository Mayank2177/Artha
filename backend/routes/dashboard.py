from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.db_models import User, MoneyHealthResult, FirePlan, TaxPlan, Portfolio

router = APIRouter()

@router.get("/dashboard/{email}")
def get_dashboard_data(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    dashboard = {
        "stats": {
            "money_health_score": None,
            "net_worth": 0.0,
            "monthly_savings": 0.0,
            "investments": 0.0,
            "xirr": 0.0
        },
        "insights": []
    }
    
    # Get latest Money Health Score
    health = db.query(MoneyHealthResult).filter(
        MoneyHealthResult.user_id == user.id
    ).order_by(desc(MoneyHealthResult.created_at)).first()
    
    if health:
        dashboard["stats"]["money_health_score"] = health.score
        
        # Add basic insight based on score
        if health.score < 50:
            dashboard["insights"].append({
                "dot": "#EF4444", 
                "title": "Action Needed", 
                "sub": f"Your money health score is {health.score}/100. Start by building a 3-month emergency fund."
            })
        elif health.score > 75:
            dashboard["insights"].append({
                "dot": "#10B981", 
                "title": "On Track", 
                "sub": f"Excellent score of {health.score}/100! Focus on long-term tax optimization next."
            })
        else:
            dashboard["insights"].append({
                "dot": "#F59E0B", 
                "title": "Building Momentum", 
                "sub": f"A steady score of {health.score}/100. Let's aim to optimize your SIPs and track expenses."
            })
            
    # Get latest FIRE Plan for savings target
    fire_plan = db.query(FirePlan).filter(
        FirePlan.user_id == user.id
    ).order_by(desc(FirePlan.created_at)).first()
    
    if fire_plan:
        dashboard["stats"]["monthly_savings"] = fire_plan.monthly_sip_needed
        dashboard["insights"].append({
            "dot": "#F59E0B", 
            "title": "FIRE Goal", 
            "sub": f"SIP of ₹{int(fire_plan.monthly_sip_needed):,}/mo needed to retire by age {fire_plan.target_age}."
        })
        
    # Get latest Portfolio for investments and XIRR
    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == user.id
    ).order_by(desc(Portfolio.created_at)).first()
    
    if portfolio:
        dashboard["stats"]["investments"] = portfolio.total_value
        dashboard["stats"]["net_worth"] = portfolio.total_value  # Simplification for now
        dashboard["stats"]["xirr"] = portfolio.xirr
        
        dashboard["insights"].append({
            "dot": "#10B981" if portfolio.xirr >= 12 else "#F59E0B",
            "title": "Portfolio Performance",
            "sub": f"Your {portfolio.fund_count} funds are generating an XIRR of {portfolio.xirr}%. Keep it up!"
        })
        
    # Get latest Tax Plan
    tax_plan = db.query(TaxPlan).filter(
        TaxPlan.user_id == user.id
    ).order_by(desc(TaxPlan.created_at)).first()
    
    if tax_plan and tax_plan.tax_saved > 0:
        dashboard["insights"].append({
            "dot": "#8B5CF6", 
            "title": "Tax Optimization", 
            "sub": f"You can save ₹{int(tax_plan.tax_saved):,} by switching tax regimes."
        })
        
    # Fallback insights if the user hasn't done much yet
    if len(dashboard["insights"]) == 0:
        dashboard["insights"] = [
            {"dot": "#10B981", "title": "Welcome to Artha", "sub": "Take the Money Health Score quiz to get your baseline."},
            {"dot": "#8B5CF6", "title": "Discover your FIRE number", "sub": "Use the FIRE Planner to see when you can retire."}
        ]
        
    return dashboard

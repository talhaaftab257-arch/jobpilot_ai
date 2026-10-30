"""Billing and Subscription SaaS API routes (Plans, Subscriptions, Invoices, Quotas)."""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import SubscriptionPlan, UserSubscription, Invoice, Organization, DailyQuota
from backend.app.schemas.crm_erp import (
    SubscriptionPlanSchema,
    UserSubscriptionSchema,
    UpgradeSubscriptionSchema,
    InvoiceSchema
)

router = APIRouter(prefix="/billing", tags=["Billing & Subscriptions"])


# Standard SaaS Tier Plans
DEFAULT_PLANS = [
    {
        "id": "starter",
        "name": "Starter Plan",
        "description": "Essential AI job hunting and recruiter discovery for individual professionals.",
        "price_monthly": 29.00,
        "price_yearly": 290.00,
        "max_applications_per_day": 30,
        "max_team_seats": 1,
        "max_scrapes_per_day": 50,
        "features": [
            "30 Automated AI Job Applications / day",
            "8 Global Job Scraping Feeds (NaukriGulf, Rozee, LinkedIn, Indeed)",
            "4 Regional CV Safety Gates",
            "Gmail OAuth 2.0 Direct Outbound",
            "Basic Candidate Pipeline CRM"
        ]
    },
    {
        "id": "pro",
        "name": "Pro Recruiter & Talent ERP",
        "description": "For serious job seekers, independent headhunters, and executive recruiters.",
        "price_monthly": 79.00,
        "price_yearly": 790.00,
        "max_applications_per_day": 100,
        "max_team_seats": 3,
        "max_scrapes_per_day": 200,
        "features": [
            "100 Automated AI Outreach Emails / day",
            "Real-time Playwright Stealth Scrapers",
            "Full Recruitment CRM (Leads, Deals, Kanban)",
            "Priority AI Email Personalization Engine",
            "Export Leads & Jobs to Microsoft Excel / CSV",
            "3 Team Seats included"
        ]
    },
    {
        "id": "agency",
        "name": "Agency & Enterprise ERP",
        "description": "Full-scale corporate talent acquisition ERP for staffing agencies and teams.",
        "price_monthly": 199.00,
        "price_yearly": 1990.00,
        "max_applications_per_day": 500,
        "max_team_seats": 10,
        "max_scrapes_per_day": 1000,
        "features": [
            "Unlimited Discovery & 500 Applications / day",
            "Multi-Tenant Workspaces & Role-Based Access",
            "Complete Deal & Candidate Placement Pipeline",
            "Custom Drip Outreach & SMTP / Gmail Integration",
            "Dedicated Account Manager & SLA",
            "Up to 10 Team Seats & Audit Logs"
        ]
    }
]


@router.get("/plans", response_model=List[SubscriptionPlanSchema])
def list_plans(db: Session = Depends(get_db)):
    """List available SaaS subscription tiers."""
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    if not plans:
        # Seed default plans if not in DB
        for p in DEFAULT_PLANS:
            new_p = SubscriptionPlan(
                id=p["id"],
                name=p["name"],
                description=p["description"],
                price_monthly=p["price_monthly"],
                price_yearly=p["price_yearly"],
                max_applications_per_day=p["max_applications_per_day"],
                max_team_seats=p["max_team_seats"],
                max_scrapes_per_day=p["max_scrapes_per_day"],
                features=p["features"],
                is_active=True
            )
            db.add(new_p)
        db.commit()
        plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()

    return plans


@router.get("/current", response_model=dict)
def get_current_subscription(db: Session = Depends(get_db)):
    """Get active workspace subscription details and resource usage."""
    # Find or initialize default Pro subscription for Talha Aftab
    sub = db.query(UserSubscription).first()
    if not sub:
        sub = UserSubscription(
            organization_id=UUID("00000000-0000-0000-0000-000000000001"),
            plan_id="pro",
            status="active",
            billing_cycle="monthly",
            current_period_start=datetime.utcnow() - timedelta(days=10),
            current_period_end=datetime.utcnow() + timedelta(days=20),
            stripe_customer_id="cus_talha_aftab",
            stripe_subscription_id="sub_jobpilot_pro"
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    plan_name = plan.name if plan else "Pro Recruiter & Talent ERP"
    price = float(plan.price_monthly) if plan else 79.00
    daily_quota = plan.max_applications_per_day if plan else 100

    return {
        "subscription_id": str(sub.id),
        "plan_id": sub.plan_id,
        "plan_name": plan_name,
        "status": sub.status,
        "billing_cycle": sub.billing_cycle,
        "amount": price,
        "currency": "USD",
        "current_period_end": sub.current_period_end.isoformat(),
        "cancel_at_period_end": sub.cancel_at_period_end,
        "usage": {
            "daily_applications_limit": daily_quota,
            "daily_applications_used": 14,
            "team_seats_limit": plan.max_team_seats if plan else 3,
            "team_seats_used": 1,
            "monthly_scrapes_limit": plan.max_scrapes_per_day * 30 if plan else 6000,
            "monthly_scrapes_used": 1420
        }
    }


@router.post("/upgrade", response_model=dict)
def upgrade_subscription(payload: UpgradeSubscriptionSchema, db: Session = Depends(get_db)):
    """Upgrade or switch SaaS subscription tier (Stripe checkout simulation)."""
    valid_plan_ids = [p["id"] for p in DEFAULT_PLANS]
    if payload.plan_id not in valid_plan_ids:
        raise HTTPException(status_code=400, detail="Invalid plan selected")

    sub = db.query(UserSubscription).first()
    if not sub:
        sub = UserSubscription(
            organization_id=UUID("00000000-0000-0000-0000-000000000001"),
            plan_id=payload.plan_id,
            status="active",
            billing_cycle=payload.billing_cycle,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=365 if payload.billing_cycle == "yearly" else 30)
        )
        db.add(sub)
    else:
        sub.plan_id = payload.plan_id
        sub.billing_cycle = payload.billing_cycle
        sub.current_period_start = datetime.utcnow()
        sub.current_period_end = datetime.utcnow() + timedelta(days=365 if payload.billing_cycle == "yearly" else 30)
        sub.status = "active"

    # Generate an invoice record
    plan_obj = next((p for p in DEFAULT_PLANS if p["id"] == payload.plan_id), DEFAULT_PLANS[1])
    price = plan_obj["price_yearly"] if payload.billing_cycle == "yearly" else plan_obj["price_monthly"]

    inv = Invoice(
        organization_id=sub.organization_id,
        invoice_number=f"INV-2026-{datetime.utcnow().strftime('%m%d%H%M')}",
        amount=price,
        currency="USD",
        status="paid",
        plan_name=plan_obj["name"],
        billing_period=f"{datetime.utcnow().strftime('%b %d')} - {sub.current_period_end.strftime('%b %d, %Y')}"
    )
    db.add(inv)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully activated {plan_obj['name']} ({payload.billing_cycle})",
        "plan_id": payload.plan_id,
        "next_billing_date": sub.current_period_end.isoformat(),
        "amount_billed": price,
        "invoice_number": inv.invoice_number
    }


@router.get("/invoices", response_model=List[InvoiceSchema])
def list_invoices(db: Session = Depends(get_db)):
    """Retrieve billing invoice history for accounting and tax receipts."""
    invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).all()
    if not invoices:
        # Seed initial sample invoice
        seed_inv = Invoice(
            organization_id=UUID("00000000-0000-0000-0000-000000000001"),
            invoice_number="INV-2026-1001",
            amount=79.00,
            currency="USD",
            status="paid",
            plan_name="Pro Recruiter & Talent ERP",
            billing_period="Oct 10, 2026 - Nov 10, 2026"
        )
        db.add(seed_inv)
        db.commit()
        invoices = [seed_inv]

    return invoices

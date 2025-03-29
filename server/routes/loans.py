from sqlalchemy.orm import joinedload
from sqlalchemy import func
from flask import Blueprint, jsonify, request
from db import SessionLocal
from models import Loan
from http import HTTPStatus


loan_routes = Blueprint("loans", __name__, url_prefix="/loans")

@loan_routes.route("/", methods=["GET"])
def get_loans():
    session = SessionLocal()

    # would add pagination if the data was more extensive.
    loans = session.query(Loan).options(joinedload(Loan.pool)).limit(100).all()

    # For a data intensive project, I would use a sqlalchemy compatible serialzier or use raw sql to avoid iteration
    # For this project this is acceptable.
    result = [loan.to_dict() for loan in loans]
    session.close()
    return jsonify(result), HTTPStatus.OK

@loan_routes.route("/", methods=["PUT"])
def update_loans():
    session = SessionLocal()
    data = request.get_json()
    updated = []

    try:
        for loan_data in data:
            loan = session.query(Loan).filter(Loan.id == loan_data["id"]).first()
            if not loan:
                continue

            loan.current_principal = loan_data.get("current_principal", loan.current_principal)
            loan.property_value = loan_data.get("property_value", loan.property_value)
            loan.payment = loan_data.get("payment", loan.payment)
            loan.interest_rate = loan_data.get("interest_rate", loan.interest_rate)

            if "interest_rate" in loan_data:
                parsed_rate = parse_interest_rate(loan_data["interest_rate"])
                if parsed_rate is not None:
                    loan.interest_rate = parsed_rate

            updated.append(loan.id)

        session.commit()
        return jsonify({"updated_ids": updated}), HTTPStatus.OK
    except Exception as e:
        session.rollback()
        print(e)
        return jsonify({"error": "Failed to update loans"}), HTTPStatus.INTERNAL_SERVER_ERROR
    finally:
        session.close()

@loan_routes.route("/summary", methods=["GET"])
def get_portfolio_summary():
    session = SessionLocal()
    try:
        result = session.query(
            func.avg(Loan.interest_rate).label("avg_interest_rate"),
            func.avg(Loan.payment).label("avg_payment"),
            func.avg(Loan.original_principal).label("avg_original_principal"),
            func.sum(Loan.original_principal).label("total_original_principal"),
            func.avg(Loan.current_principal).label("avg_current_principal"),
            func.sum(Loan.current_principal).label("total_current_principal"),
            func.avg(Loan.property_value).label("avg_property_value"),
            func.sum(Loan.property_value).label("total_property_value"),
        ).one()

        summary = {
            "avg_interest_rate": float(result.avg_interest_rate or 0),
            "avg_payment": float(result.avg_payment or 0),
            "avg_original_principal": float(result.avg_original_principal or 0),
            "total_original_principal": float(result.total_original_principal or 0),
            "avg_current_principal": float(result.avg_current_principal or 0),
            "total_current_principal": float(result.total_current_principal or 0),
            "avg_property_value": float(result.avg_property_value or 0),
            "total_property_value": float(result.total_property_value or 0),
        }

        return jsonify(summary)
    except Exception as e:
        print("Error generating portfolio summary:", e)
        return jsonify({"error": "Failed to generate portfolio summary"}), 500
    finally:
        session.close()

def parse_interest_rate(raw_value):
    try:
        if isinstance(raw_value, str):
            return float(raw_value.replace("%", "").strip())
        return float(raw_value)
    except (ValueError, TypeError) as e:
        print(f"Failed to parse interest rate: {raw_value} → {e}")
        return None  # or raise depending on your needs
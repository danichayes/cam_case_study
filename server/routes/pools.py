"""Routes for pool data."""
from flask import Blueprint, jsonify
from db import SessionLocal
from models import Pool, Loan
from http import HTTPStatus
from sqlalchemy import func

pool_routes = Blueprint("pools", __name__, url_prefix="/pools")


# Not actually using this route
@pool_routes.route("/", methods=["GET"])
def get_pools():
    session = SessionLocal()

    # would add pagination if the data was more extensive.
    pools = session.query(Pool).limit(100).all()
    
    # For a data intensive project, I would use a sqlalchemy compatible serialzier or use raw sql to avoid iteration
    # For this project this is acceptable.
    result = [pool.to_dict() for pool in pools]
    session.close()
    return jsonify(result), HTTPStatus.OK

@pool_routes.route("/summary", methods=["GET"])
def get_pool_summary():
    session = SessionLocal()
    try:
        summary = (
            session.query(
                Pool.pool_name.label("pool_name"),
                func.sum(Loan.property_value).label("total_property_value"),
                func.avg(Loan.property_value).label("avg_property_value"),
                func.sum(Loan.current_principal).label("total_current_principal"),
                func.avg(Loan.current_principal).label("avg_current_principal"),
                func.sum(Loan.original_principal).label("total_original_principal"),
                func.avg(Loan.original_principal).label("avg_original_principal"),
                func.avg(Loan.interest_rate).label("avg_interest_rate"),
                func.avg(Loan.payment).label("avg_payment"),
            )
            .join(Loan, Loan.pool_id == Pool.id)
            .group_by(Pool.pool_name)
            .all()
        )

        result = [
            {
                "pool_name": row.pool_name,
                "total_property_value": float(row.total_property_value or 0),
                "avg_property_value": float(row.avg_property_value or 0),
                "total_current_principal": float(row.total_current_principal or 0),
                "avg_current_principal": float(row.avg_current_principal or 0),
                "total_original_principal": float(row.total_original_principal or 0),
                "avg_original_principal": float(row.avg_original_principal or 0),
                "avg_interest_rate": float(row.avg_interest_rate or 0),
                "avg_payment": float(row.avg_payment or 0),
            }
            for row in summary
        ]

        return jsonify(result), HTTPStatus.OK
    except Exception as e:
        print("Error generating pool summary:", e)
        return jsonify({"error": "Failed to generate summary"}), HTTPStatus.INTERNAL_SERVER_ERROR
    finally:
        session.close()


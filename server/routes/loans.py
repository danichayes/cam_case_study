from sqlalchemy.orm import joinedload
from flask import Blueprint, jsonify
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

from flask import Blueprint, jsonify
from db import SessionLocal
from models import Pool
from http import HTTPStatus

pool_routes = Blueprint("pools", __name__, url_prefix="/pools")

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
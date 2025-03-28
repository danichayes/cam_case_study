from flask import Flask
from routes import loan_routes, pool_routes


app = Flask(__name__)

app.register_blueprint(pool_routes)
app.register_blueprint(loan_routes)